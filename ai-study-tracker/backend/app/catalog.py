"""Catálogo da formação: validação, importação, IDs únicos e análise de duplicidades."""
from __future__ import annotations

import json
import math
import re
import sqlite3
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from . import db
from .domain import COMPETENCY_IDS, NATURES

ID_RE = re.compile(r"^[A-Z][A-Z0-9]*-[A-Z0-9]+$")


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
    duration: Any = None
    verify: bool = False

    @field_validator("duration")
    @classmethod
    def _dur(cls, v):
        parse_duration(v)
        return v


class ModuleIn(BaseModel):
    id: Optional[str] = None
    title: str = Field(min_length=1)
    verify: bool = False
    lessons: list[LessonIn] = Field(min_length=1)


class ContentIn(BaseModel):
    title: str = Field(min_length=1)
    instructor: Optional[str] = None
    duration: Any = None
    lesson_count: Optional[int] = Field(default=None, ge=1)
    nature: str = "ferramenta"
    practice_ratio: float = Field(default=0.5, ge=0, le=3)
    intro: bool = False
    reserve: bool = False
    verify: bool = False
    overlap_note: Optional[str] = None
    competencies: list[str] = []
    modules: list[ModuleIn] = []

    @field_validator("nature")
    @classmethod
    def _nature(cls, v):
        if v not in NATURES:
            raise ValueError(f"natureza inválida: {v} (use {', '.join(NATURES)})")
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
            raise ValueError(f"'{self.title}': informe duration ou modules com aulas")
        return self


class SlotIn(BaseModel):
    position: int = Field(ge=1)
    content: Optional[str] = None
    placeholder: bool = False

    @model_validator(mode="after")
    def _one(self):
        if not self.placeholder and not self.content:
            raise ValueError("slot precisa de 'content' ou 'placeholder: true'")
        return self


class TrackIn(BaseModel):
    id: str = Field(min_length=1)
    order: int = Field(ge=1)
    title: str = Field(min_length=1)
    theme: Optional[str] = None
    verify: bool = False
    slots: list[SlotIn] = Field(min_length=1)


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
        for t in self.tracks:
            pos = [s.position for s in t.slots]
            if len(pos) != len(set(pos)):
                raise ValueError(f"{t.id}: posições repetidas")
            for s in t.slots:
                if s.content and s.content not in self.contents:
                    raise ValueError(f"{t.id}: conteúdo {s.content} não definido em 'contents'")
        seq = self.meta.get("study_sequence") or []
        unknown = [c for c in seq if c not in self.contents]
        if unknown:
            raise ValueError(f"study_sequence com IDs desconhecidos: {unknown}")
        return self


def study_sequence(cat: CatalogIn) -> list[str]:
    seq = list(dict.fromkeys(cat.meta.get("study_sequence") or []))
    for t in sorted(cat.tracks, key=lambda t: t.order):
        for s in sorted(t.slots, key=lambda s: s.position):
            if s.content and s.content not in seq:
                seq.append(s.content)
    seq += [c for c in cat.contents if c not in seq]
    return seq


def import_catalog(conn: sqlite3.Connection, data: dict, segment_minutes: int = 40) -> dict:
    """Substitui o catálogo. O progresso (lesson_progress) é preservado por ID de aula."""
    cat = CatalogIn.model_validate(data)
    conn.execute("DELETE FROM track_slots")
    conn.execute("DELETE FROM lessons")
    conn.execute("DELETE FROM modules")
    conn.execute("DELETE FROM contents")
    conn.execute("DELETE FROM tracks")

    seq_counter = 0
    for study_ord, cid in enumerate(study_sequence(cat)):
        c = cat.contents[cid]
        lessons_known = bool(c.modules)
        modules: list[tuple[str, str, bool, list[tuple[str, str, float, bool, bool]]]] = []
        if lessons_known:
            for mi, m in enumerate(c.modules, start=1):
                mid = m.id or f"{cid}.M{mi}"
                les = []
                for li, l in enumerate(m.lessons, start=1):
                    dur = parse_duration(l.duration)
                    les.append((l.id or f"{mid}.L{li:02d}", l.title, dur if dur is not None else 0.0, l.verify or dur is None, False))
                modules.append((mid, m.title, m.verify, les))
            total = sum(l[2] for m in modules for l in m[3])
        else:
            # Aulas ainda não mapeadas: divide a duração real do curso em blocos de estudo
            total = parse_duration(c.duration) or 0.0
            n = max(1, round(total / segment_minutes))
            base = total / n
            for i in range(1, n + 1):
                mtitle = f"Parte {i} de {n}" if n > 1 else ""
                ltitle = f"{c.title} — parte {i}/{n}" if n > 1 else c.title
                modules.append((f"{cid}.P{i}", mtitle, True, [(f"{cid}.P{i}", ltitle, round(base, 2), True, True)]))
        conn.execute(
            """INSERT INTO contents(id, title, instructor, nature, practice_ratio, duration_min, lesson_count,
               lessons_known, intro, reserve, verify, study_ord, competencies, overlap_note)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (cid, c.title, c.instructor, c.nature, c.practice_ratio, total,
             c.lesson_count or (sum(len(m[3]) for m in modules) if lessons_known else None),
             int(lessons_known), int(c.intro), int(c.reserve), int(c.verify),
             study_ord, json.dumps(c.competencies), c.overlap_note),
        )
        for mo, (mid, mtitle, mverify, les) in enumerate(modules, start=1):
            conn.execute("INSERT INTO modules(id, content_id, ord, title, verify) VALUES (?,?,?,?,?)",
                         (mid, cid, mo, mtitle, int(mverify)))
            for lo, (lid, ltitle, dur, lverify, segment) in enumerate(les, start=1):
                seq_counter += 1
                conn.execute(
                    "INSERT INTO lessons(id, module_id, content_id, ord, seq, title, duration_min, verify, segment) VALUES (?,?,?,?,?,?,?,?,?)",
                    (lid, mid, cid, lo, seq_counter, ltitle, dur, int(lverify), int(segment)),
                )
    for t in cat.tracks:
        conn.execute("INSERT INTO tracks(id, ord, title, theme, verify) VALUES (?,?,?,?,?)",
                     (t.id, t.order, t.title, t.theme, int(t.verify)))
        for s in t.slots:
            conn.execute("INSERT INTO track_slots(track_id, position, content_id, placeholder) VALUES (?,?,?,?)",
                         (t.id, s.position, s.content, int(s.placeholder)))
    db.set_meta(conn, "catalog_meta", json.dumps(cat.meta, ensure_ascii=False))
    return analysis(conn)


def catalog_meta(conn: sqlite3.Connection) -> dict:
    return db.loads(db.get_meta(conn, "catalog_meta"), {}) or {}


def analysis(conn: sqlite3.Connection) -> dict:
    """Carga bruta × carga única, duplicidades e pendências [VERIFICAR]."""
    meta = catalog_meta(conn)
    contents = {c["id"]: c for c in db.rows(conn, "SELECT * FROM contents")}
    slots = db.rows(conn, "SELECT s.*, t.title AS track_title, t.ord AS track_ord FROM track_slots s JOIN tracks t ON t.id = s.track_id ORDER BY t.ord, s.position")
    filled = [s for s in slots if s["content_id"]]
    gross = sum(contents[s["content_id"]]["duration_min"] for s in filled)
    unique = sum(c["duration_min"] for c in contents.values())
    by_content: dict[str, list[str]] = {}
    for s in filled:
        by_content.setdefault(s["content_id"], []).append(s["track_id"])
    duplicates = [
        {"content_id": cid, "title": contents[cid]["title"], "tracks": tids,
         "duration_min": contents[cid]["duration_min"],
         "saved_min": contents[cid]["duration_min"] * (len(tids) - 1)}
        for cid, tids in by_content.items() if len(tids) > 1
    ]
    visible = [c for c in contents.values() if not c["reserve"]]
    declared = parse_duration(meta.get("declared_video"))
    lessons = db.row(conn, "SELECT COUNT(*) AS n, SUM(segment) AS seg, SUM(verify) AS ver FROM lessons") or {}
    return {
        "name": meta.get("name"),
        "status": meta.get("status", "final"),
        "note": meta.get("note"),
        "tracks": db.row(conn, "SELECT COUNT(*) AS n FROM tracks")["n"],
        "declared_tracks": meta.get("declared_tracks"),
        "courses_unique": len(visible),
        "course_appearances": len([s for s in filled if not contents[s["content_id"]]["reserve"]]),
        "placeholders": len([s for s in slots if s["placeholder"]]),
        "reserve_min": sum(c["duration_min"] for c in contents.values() if c["reserve"]),
        "lessons": lessons.get("n") or 0,
        "lessons_mapped": (lessons.get("n") or 0) - (lessons.get("seg") or 0),
        "study_blocks": lessons.get("seg") or 0,
        "verify_items": (lessons.get("ver") or 0),
        "gross_min": gross,
        "unique_min": unique,
        "visible_gross_min": sum(contents[s["content_id"]]["duration_min"] for s in filled if not contents[s["content_id"]]["reserve"]),
        "visible_unique_min": sum(c["duration_min"] for c in visible),
        "declared_min": declared,
        "duplicates": duplicates,
        "intro_courses": [{"content_id": c["id"], "title": c["title"]} for c in visible if c["intro"]],
        "overlaps": [{"content_id": c["id"], "title": c["title"], "note": c["overlap_note"]} for c in visible if c["overlap_note"]],
    }


def ensure_catalog(conn: sqlite3.Connection, path, segment_minutes: int) -> None:
    if db.row(conn, "SELECT COUNT(*) AS n FROM contents")["n"] == 0:
        data = json.loads(path.read_text(encoding="utf-8"))
        import_catalog(conn, data, segment_minutes)
