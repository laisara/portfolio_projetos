"""Catálogo da formação: validação, importação, IDs únicos e auditoria de carga.

Regras:
- A duração de um curso é a SOMA das durações das suas aulas (duração oficial).
- Aula sem duração no player = "-" (conta 0 min). Quizzes/testes têm kind "quiz".
- Módulo sem título vira "Módulo N".
- O mesmo curso em várias trilhas é cadastrado UMA vez; o progresso é compartilhado.
"""
from __future__ import annotations

import json
import re
import sqlite3
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from . import db
from .domain import COMPETENCY_IDS

ID_RE = re.compile(r"^[A-Z][A-Z0-9]*-[A-Z0-9]+$")
KINDS = ("video", "quiz", "test", "guide", "other", "placeholder")


def parse_duration(value: Any) -> Optional[float]:
    """'1:32:00' | '32:10' | 92 (min) | None → minutos (float)."""
    if value is None or value == "" or value == "-":
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
    n: Optional[int] = None            # número da aula no curso, como no player
    title: str = Field(min_length=1)
    duration: Any = None               # None / "-" = sem duração
    kind: str = "video"

    @field_validator("duration")
    @classmethod
    def _dur(cls, v):
        parse_duration(v)
        return v

    @field_validator("kind")
    @classmethod
    def _kind(cls, v):
        if v not in KINDS:
            raise ValueError(f"kind inválido: {v}")
        return v


class ModuleIn(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None        # None → "Módulo N"
    lessons: list[LessonIn] = Field(min_length=1)


class ContentIn(BaseModel):
    title: str = Field(min_length=1)
    type: str = "curso"
    card_min: Optional[float] = None   # duração mostrada no card (só conferência)
    competencies: list[str] = []
    note: Optional[str] = None
    optional: bool = False             # eletivo: fora do progresso, das trilhas e do cronograma
    elective_of: Optional[str] = None
    modules: list[ModuleIn] = Field(min_length=1)

    @field_validator("type")
    @classmethod
    def _type(cls, v):
        if v not in ("curso", "projeto"):
            raise ValueError("type deve ser 'curso' ou 'projeto'")
        return v

    @field_validator("competencies")
    @classmethod
    def _comp(cls, v):
        bad = [c for c in v if c not in COMPETENCY_IDS]
        if bad:
            raise ValueError(f"competências desconhecidas: {bad}")
        return v


class TrackIn(BaseModel):
    id: str = Field(min_length=1)
    order: int = Field(ge=1)
    title: str = Field(min_length=1)
    group: str = ""
    header_min: Optional[float] = None  # duração do cabeçalho da trilha no site (só conferência)
    courses: list[str] = Field(min_length=1)


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
        used = set()
        for t in self.tracks:
            if len(t.courses) != len(set(t.courses)):
                raise ValueError(f"{t.id}: curso repetido dentro da mesma trilha")
            for cid in t.courses:
                if cid not in self.contents:
                    raise ValueError(f"{t.id}: curso {cid} não está em 'contents'")
                used.add(cid)
        orphan = {c for c in set(self.contents) - used if not self.contents[c].optional}
        if orphan:
            raise ValueError(f"cursos sem trilha: {sorted(orphan)}")
        return self


def study_sequence(cat: CatalogIn) -> list[str]:
    """Ordem da plataforma: trilhas na ordem, cursos na ordem da trilha; repetido só na 1ª aparição."""
    seq: list[str] = []
    for t in sorted(cat.tracks, key=lambda t: t.order):
        for cid in t.courses:
            if cid not in seq:
                seq.append(cid)
    return seq + [c for c, v in cat.contents.items() if v.optional and c not in seq]


def import_catalog(conn: sqlite3.Connection, data: dict) -> dict:
    """Substitui o catálogo. O progresso (lesson_progress) é preservado por ID de aula."""
    cat = CatalogIn.model_validate(data)
    for t in ("appearances", "lessons", "modules", "contents", "tracks"):
        conn.execute(f"DELETE FROM {t}")
    seq = 0
    for study_ord, cid in enumerate(study_sequence(cat)):
        c = cat.contents[cid]
        durations = [parse_duration(l.duration) or 0.0 for m in c.modules for l in m.lessons]
        total, count = sum(durations), len(durations)
        conn.execute(
            "INSERT INTO contents(id, title, type, study_ord, competencies, card_min, duration_min, lesson_count, note, optional, elective_of) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (cid, c.title, c.type, study_ord, json.dumps(c.competencies), c.card_min, total, count, c.note, int(c.optional), c.elective_of))
        for mi, m in enumerate(c.modules, start=1):
            mid = m.id or f"{cid}.M{mi}"
            conn.execute("INSERT INTO modules(id, content_id, ord, title) VALUES (?,?,?,?)",
                         (mid, cid, mi, m.title or f"Módulo {mi}"))
            for li, l in enumerate(m.lessons, start=1):
                d = parse_duration(l.duration)
                seq += 1
                n = l.n or seq
                conn.execute(
                    "INSERT INTO lessons(id, module_id, content_id, ord, num, seq, title, duration_min, has_duration, kind) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (l.id or f"{cid}.L{n:02d}", mid, cid, li, n, seq, l.title, d or 0.0, int(d is not None), l.kind))
    for t in cat.tracks:
        conn.execute("INSERT INTO tracks(id, ord, title, group_name, header_min) VALUES (?,?,?,?,?)",
                     (t.id, t.order, t.title, t.group, t.header_min))
        for pos, cid in enumerate(t.courses, start=1):
            conn.execute("INSERT INTO appearances(content_id, track_id, position) VALUES (?,?,?)", (cid, t.id, pos))
    conn.execute("DELETE FROM lesson_progress WHERE lesson_id NOT IN (SELECT id FROM lessons)")
    db.set_meta(conn, "catalog_meta", json.dumps(cat.meta, ensure_ascii=False))
    return analysis(conn)


def catalog_meta(conn: sqlite3.Connection) -> dict:
    return db.loads(db.get_meta(conn, "catalog_meta"), {}) or {}


def analysis(conn: sqlite3.Connection) -> dict:
    """Carga bruta × duplicada × única × declarada (auditoria)."""
    meta = catalog_meta(conn)
    all_contents = {c["id"]: c for c in db.rows(conn, "SELECT * FROM contents")}
    contents = {k: v for k, v in all_contents.items() if not v["optional"]}   # opcionais ficam fora dos totais
    apps = db.rows(conn, "SELECT * FROM appearances ORDER BY track_id, position")
    gross = sum(contents[a["content_id"]]["duration_min"] for a in apps)
    unique = sum(c["duration_min"] for c in contents.values())
    by_content: dict[str, list[dict]] = {}
    for a in apps:
        by_content.setdefault(a["content_id"], []).append(a)
    duplicates = [
        {"content_id": cid, "title": contents[cid]["title"], "appearances": len(al), "tracks": [a["track_id"] for a in al],
         "duration_min": contents[cid]["duration_min"], "duplicate_min": contents[cid]["duration_min"] * (len(al) - 1)}
        for cid, al in by_content.items() if len(al) > 1
    ]
    declared = parse_duration(meta.get("declared_video"))
    lessons = db.row(conn, """SELECT COUNT(*) AS n, SUM(CASE WHEN has_duration=0 THEN 1 ELSE 0 END) AS nodur,
                              SUM(CASE WHEN kind='placeholder' THEN 1 ELSE 0 END) AS ph FROM lessons
                              WHERE content_id IN (SELECT id FROM contents WHERE optional=0)""") or {}
    optional = [{"id": c["id"], "title": c["title"], "duration_min": c["duration_min"], "lessons": c["lesson_count"],
                 "elective_of": c["elective_of"]} for c in all_contents.values() if c["optional"]]
    tracks = db.rows(conn, "SELECT * FROM tracks ORDER BY ord")
    return {
        "name": meta.get("name"), "version": meta.get("catalog_version", 0),
        "declared_min": declared, "gross_min": gross, "duplicate_min": sum(d["duplicate_min"] for d in duplicates),
        "unique_min": unique, "diff_vs_declared_min": None if declared is None else unique - declared,
        "tracks": len(tracks), "courses": len(contents), "appearances": len(apps),
        "lessons": lessons.get("n") or 0, "lessons_without_duration": lessons.get("nodur") or 0,
        "placeholders": lessons.get("ph") or 0,
        "projects": len([c for c in contents.values() if c["type"] == "projeto"]),
        "project_min": sum(c["duration_min"] for c in contents.values() if c["type"] == "projeto"),
        "duplicates": duplicates, "excluded": meta.get("excluded", []), "optional": optional, "duration_rule": meta.get("duration_rule"),
        "tracks_check": [{"id": t["id"], "title": t["title"], "header_min": t["header_min"],
                          "sum_min": sum(contents[a["content_id"]]["duration_min"] for a in apps if a["track_id"] == t["id"])}
                         for t in tracks],
    }


def ensure_catalog(conn: sqlite3.Connection, path) -> None:
    """Importa o catálogo do arquivo quando o banco está vazio ou a versão do arquivo é mais nova."""
    data = json.loads(path.read_text(encoding="utf-8"))
    n = db.row(conn, "SELECT COUNT(*) AS n FROM contents")["n"]
    stored = (catalog_meta(conn) or {}).get("catalog_version", 0)
    if n == 0 or (data.get("meta", {}).get("catalog_version", 1) > stored and not db.get_meta(conn, "catalog_customized")):
        import_catalog(conn, data)
