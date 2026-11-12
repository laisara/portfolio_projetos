"""Catálogo da formação: validação, importação, IDs únicos e auditoria de carga.

Regras:
- Só entra no catálogo o que está nos prints. Nada de reserva de horas nem aulas sintéticas.
- Curso sem lista de aulas = UMA unidade de curso com a duração real (aulas: NÃO IDENTIFICADO).
- Trilha desconhecida = `track: null` (A VERIFICAR). Nomes de trilha desconhecidos = null.
- O conteúdo que falta para completar a carga declarada é só um NÚMERO de auditoria; não é agendado.
"""
from __future__ import annotations

import json
import re
import sqlite3
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from . import db
from .domain import COMPETENCY_IDS, NATURES

ID_RE = re.compile(r"^[A-Z][A-Z0-9]*-[A-Z0-9]+$")
STATUS = ("CONFIRMADO", "INFERIDO", "A VERIFICAR")


def parse_duration(value: Any) -> Optional[float]:
    """'1:32:00' | '32:10' | 92 (min) | None → minutos (float)."""
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        if value < 0:
            raise ValueError("duração negativa")
        return float(value)
    parts = str(value).strip().split(":")
    if not all(p.isdigit() for p in parts) or not 2 <= len(parts) <= 3:
        raise ValueError(f"duração inválida: {value!r} (use h:mm:ss, mm:ss ou minutos)")
    nums = [int(p) for p in parts]
    if len(nums) == 2:
        nums = [0, *nums]
    h, m, s = nums
    return h * 60 + m + s / 60


class LessonIn(BaseModel):
    id: Optional[str] = None
    title: str = Field(min_length=1)
    duration: Any  # obrigatório: aula sem duração real não entra no catálogo

    @field_validator("duration")
    @classmethod
    def _dur(cls, v):
        if parse_duration(v) is None:
            raise ValueError("aula sem duração: use [VERIFICAR] fora do catálogo, não invente")
        return v


class ModuleIn(BaseModel):
    id: Optional[str] = None
    title: str = Field(min_length=1)
    lessons: list[LessonIn] = Field(min_length=1)


class AppearanceIn(BaseModel):
    track: Optional[str] = None          # None = trilha A VERIFICAR
    position: int = Field(ge=1)          # número do card no print
    inferred_group: Optional[str] = None  # agrupamento inferido (INFERIDO)


class ContentIn(BaseModel):
    title: str = Field(min_length=1)
    instructor: Optional[str] = None
    duration: Any = None
    lesson_count: Optional[int] = Field(default=None, ge=1)
    nature: str = "ferramenta"
    practice_ratio: float = Field(default=0.5, ge=0, le=3)
    intro: bool = False
    overlap_note: Optional[str] = None
    competencies: list[str] = []
    appearances: list[AppearanceIn] = []
    confidence: dict[str, str] = {}
    modules: list[ModuleIn] = []

    @field_validator("nature")
    @classmethod
    def _nature(cls, v):
        if v not in NATURES or v == "reserva":
            raise ValueError(f"natureza inválida: {v}")
        return v

    @field_validator("competencies")
    @classmethod
    def _comp(cls, v):
        bad = [c for c in v if c not in COMPETENCY_IDS]
        if bad:
            raise ValueError(f"competências desconhecidas: {bad}")
        return v

    @model_validator(mode="after")
    def _has_duration(self):
        if parse_duration(self.duration) is None and not self.modules:
            raise ValueError(f"'{self.title}': informe a duração real ou módulos com aulas")
        return self


class TrackIn(BaseModel):
    id: str = Field(min_length=1)
    order: int = Field(ge=1)
    title: str = Field(min_length=1)
    name: Optional[str] = None
    confirmed: bool = False


class CatalogIn(BaseModel):
    meta: dict = {}
    tracks: list[TrackIn] = Field(min_length=1)
    contents: dict[str, ContentIn] = Field(min_length=1)

    @model_validator(mode="after")
    def _refs(self):
        for cid in self.contents:
            if not ID_RE.match(cid):
                raise ValueError(f"ID de conteúdo inválido: {cid} (formato AREA-001)")
        ids = [t.id for t in self.tracks]
        if len(ids) != len(set(ids)):
            raise ValueError("IDs de trilha duplicados")
        for cid, c in self.contents.items():
            for a in c.appearances:
                if a.track is not None and a.track not in ids:
                    raise ValueError(f"{cid}: trilha {a.track} não existe")
        seq = self.meta.get("study_sequence") or []
        unknown = [c for c in seq if c not in self.contents]
        if unknown:
            raise ValueError(f"study_sequence com IDs desconhecidos: {unknown}")
        return self


def study_sequence(cat: CatalogIn) -> list[str]:
    seq = list(dict.fromkeys(cat.meta.get("study_sequence") or []))
    return seq + [c for c in cat.contents if c not in seq]


def import_catalog(conn: sqlite3.Connection, data: dict) -> dict:
    """Substitui o catálogo. O progresso (lesson_progress) é preservado por ID de aula."""
    cat = CatalogIn.model_validate(data)
    for t in ("appearances", "lessons", "modules", "contents", "tracks"):
        conn.execute(f"DELETE FROM {t}")
    seq_counter = 0
    for study_ord, cid in enumerate(study_sequence(cat)):
        c = cat.contents[cid]
        lessons_known = bool(c.modules)
        if lessons_known:
            modules = []
            for mi, m in enumerate(c.modules, start=1):
                mid = m.id or f"{cid}.M{mi}"
                modules.append((mid, m.title, [(l.id or f"{mid}.L{li:02d}", l.title, parse_duration(l.duration), False)
                                               for li, l in enumerate(m.lessons, start=1)]))
            total = sum(l[2] for m in modules for l in m[2])
        else:
            # Uma única unidade = o curso inteiro, com a duração REAL do print.
            total = parse_duration(c.duration) or 0.0
            modules = [(f"{cid}.M0", "", [(f"{cid}.COURSE", c.title, total, True)])]
        conn.execute(
            """INSERT INTO contents(id, title, instructor, nature, practice_ratio, duration_min, lesson_count,
               lessons_known, intro, verify, confidence, study_ord, competencies, overlap_note, nature_default_ratio)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (cid, c.title, c.instructor, c.nature, c.practice_ratio, total,
             c.lesson_count or (sum(len(m[2]) for m in modules) if lessons_known else None),
             int(lessons_known), int(c.intro), int(not all(a.track for a in c.appearances) or not c.appearances),
             json.dumps(c.confidence, ensure_ascii=False), study_ord, json.dumps(c.competencies),
             c.overlap_note, c.practice_ratio))
        for mo, (mid, mtitle, les) in enumerate(modules, start=1):
            conn.execute("INSERT INTO modules(id, content_id, ord, title, verify) VALUES (?,?,?,?,0)", (mid, cid, mo, mtitle))
            for lo, (lid, ltitle, dur, course_level) in enumerate(les, start=1):
                seq_counter += 1
                conn.execute("INSERT INTO lessons(id, module_id, content_id, ord, seq, title, duration_min, verify, segment) VALUES (?,?,?,?,?,?,?,?,?)",
                             (lid, mid, cid, lo, seq_counter, ltitle, dur, 0, int(course_level)))
        for a in c.appearances:
            conn.execute("INSERT INTO appearances(content_id, track_id, position, inferred_group) VALUES (?,?,?,?)",
                         (cid, a.track, a.position, a.inferred_group))
    for t in cat.tracks:
        conn.execute("INSERT INTO tracks(id, ord, title, name, confirmed) VALUES (?,?,?,?,?)",
                     (t.id, t.order, t.title, t.name, int(t.confirmed)))
    # progresso órfão (aulas que não existem mais) é descartado; o resto é preservado
    conn.execute("DELETE FROM lesson_progress WHERE lesson_id NOT IN (SELECT id FROM lessons)")
    db.set_meta(conn, "catalog_meta", json.dumps(cat.meta, ensure_ascii=False))
    return analysis(conn)


def catalog_meta(conn: sqlite3.Connection) -> dict:
    return db.loads(db.get_meta(conn, "catalog_meta"), {}) or {}


def analysis(conn: sqlite3.Connection) -> dict:
    """Carga declarada × identificada × duplicada × não identificada (auditoria)."""
    meta = catalog_meta(conn)
    contents = {c["id"]: c for c in db.rows(conn, "SELECT * FROM contents")}
    apps = db.rows(conn, "SELECT * FROM appearances ORDER BY content_id, position")
    gross = sum(contents[a["content_id"]]["duration_min"] for a in apps)
    unique = sum(c["duration_min"] for c in contents.values())
    by_content: dict[str, list[dict]] = {}
    for a in apps:
        by_content.setdefault(a["content_id"], []).append(a)
    duplicates = [
        {"content_id": cid, "title": contents[cid]["title"], "appearances": len(al),
         "tracks": [a["track_id"] or "A VERIFICAR" for a in al], "positions": [a["position"] for a in al],
         "duration_min": contents[cid]["duration_min"], "duplicate_min": contents[cid]["duration_min"] * (len(al) - 1)}
        for cid, al in by_content.items() if len(al) > 1
    ]
    declared = parse_duration(meta.get("declared_video"))
    dup_min = sum(d["duplicate_min"] for d in duplicates)
    lessons = db.row(conn, "SELECT COUNT(*) AS n, SUM(segment) AS course_level FROM lessons") or {}
    tracks = db.rows(conn, "SELECT * FROM tracks ORDER BY ord")
    confirmed_tracks = [t for t in tracks if t["confirmed"]]
    return {
        "name": meta.get("name"), "note": meta.get("note"), "version": meta.get("catalog_version", 1),
        "declared_min": declared,
        "identified_gross_min": gross,
        "duplicate_min": dup_min,
        "identified_unique_min": unique,
        # a carga declarada pode somar cada aparição (bruta) ou só o conteúdo único: mostramos as duas leituras
        "unidentified_min": None if declared is None else max(0.0, declared - gross),
        "unidentified_if_unique_min": None if declared is None else max(0.0, declared - unique),
        "identified_pct": None if not declared else unique / declared,
        "tracks_total": len(tracks), "declared_tracks": meta.get("declared_tracks"),
        "tracks_confirmed": len(confirmed_tracks),
        "courses": len(contents), "appearances": len(apps),
        "courses_without_confirmed_track": len([c for c in contents if not any(a["track_id"] for a in by_content.get(c, []))]),
        "lessons_identified": (lessons.get("n") or 0) - (lessons.get("course_level") or 0),
        "course_level_units": lessons.get("course_level") or 0,
        "duplicates": duplicates,
        "intro_courses": [{"content_id": c["id"], "title": c["title"]} for c in contents.values() if c["intro"]],
        "overlaps": [{"content_id": c["id"], "title": c["title"], "note": c["overlap_note"]} for c in contents.values() if c["overlap_note"]],
    }


def ensure_catalog(conn: sqlite3.Connection, path) -> None:
    """Importa o catálogo do arquivo quando o banco está vazio ou a versão do arquivo é mais nova."""
    data = json.loads(path.read_text(encoding="utf-8"))
    n = db.row(conn, "SELECT COUNT(*) AS n FROM contents")["n"]
    stored = (catalog_meta(conn) or {}).get("catalog_version", 0)
    if n == 0 or (data.get("meta", {}).get("catalog_version", 1) > stored and not db.get_meta(conn, "catalog_customized")):
        import_catalog(conn, data)
