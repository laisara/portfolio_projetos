"""Algoritmo de distribuição do estudo (função pura, sem banco).

Modelo: AULA (vídeo) → PRÁTICA → PROJETO → REVISÃO.
- Aulas seguem a ordem do catálogo. Aula sem duração ("-") ocupa 0 min e acompanha a anterior.
- A PRÁTICA de cada curso (estimada) vem logo depois da última aula dele.
- PROJETOS (lista simples) são liberados quando o curso-gatilho termina e ocupam principalmente o
  dia de projeto (sábado); se o acúmulo for grande, entram blocos curtos durante a semana.
- REVISÕES D+1/D+7/D+30 são curtas e agrupadas em uma única sessão diária.
- Descanso semanal e feriados não recebem nada. O plano é recalculado a partir de hoje,
  então um dia perdido simplesmente desloca o futuro.
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional

KIND_ORDER = {"review": 0, "video": 1, "practice": 1, "project": 2}


@dataclass
class Unit:
    key: str
    kind: str  # video | practice
    ref: str
    title: str
    minutes: float
    content_id: str
    phase: str
    detail: dict = field(default_factory=dict)
    splittable: bool = False


@dataclass
class Stage:
    ref: str
    title: str
    minutes: float
    unlock_after: Optional[str]  # content_id; None = depois de todo o conteúdo
    unlocked: bool = False


@dataclass
class Review:
    key: str
    learned_on: date
    interval: int
    due: date
    minutes: float
    real: bool = False


@dataclass
class PlanItem:
    kind: str
    ref: Optional[str]
    title: str
    minutes: float
    content_id: Optional[str]
    phase: str
    detail: dict = field(default_factory=dict)


@dataclass
class DayPlan:
    date: date
    capacity: float
    rest: bool
    items: list[PlanItem] = field(default_factory=list)

    @property
    def total(self) -> float:
        return sum(i.minutes for i in self.items)


@dataclass
class PlanResult:
    days: list[DayPlan]
    end_date: Optional[date]       # última atividade (normalmente a última revisão D+30)
    totals: dict
    lessons_end: Optional[date] = None  # última aula


def round5(x: float) -> float:
    return float(max(0, int(5 * round(x / 5))))


def review_minutes(video_min: float, interval: int, cfg: dict) -> float:
    pct = cfg["pct"][str(interval)]
    return float(min(cfg["max"][str(interval)], max(cfg["min"], round(video_min * pct))))


def day_capacity(d: date, settings: dict) -> float:
    if d.weekday() == int(settings["rest_weekday"]):
        return 0.0
    mult = float(settings["holidays"].get(d.isoformat(), 1))
    return float(settings["capacity"].get(str(d.weekday()), 0)) * mult


def build_plan(*, start: date, units: list[Unit], reviews: list[Review], settings: dict, stages: Optional[list[Stage]] = None,
               done_today_min: float = 0.0, today: Optional[date] = None, max_days: int = 600) -> PlanResult:
    rcfg = settings["review"]
    queue = deque(Unit(**{**u.__dict__}) for u in units)
    stages = [Stage(**{**s.__dict__}) for s in (stages or [])]
    reviews = sorted((Review(**{**r.__dict__}) for r in reviews), key=lambda r: (r.due, r.interval))
    project_wd = int(settings.get("project_weekday", 5))

    remaining: dict[str, int] = {}
    for u in queue:
        remaining[u.content_id] = remaining.get(u.content_id, 0) + 1
    for s in stages:
        if s.unlock_after is not None and remaining.get(s.unlock_after, 0) == 0:
            s.unlocked = True

    def take_project(items: list[PlanItem], budget: float) -> float:
        used = 0.0
        for s in [s for s in stages if s.unlocked and s.minutes > 0.5]:
            if budget - used < 15:
                break
            chunk = min(s.minutes, budget - used)
            if chunk < s.minutes:
                chunk = min(max(15.0, round5(chunk - 2)), budget - used, s.minutes)
            s.minutes -= chunk
            used += chunk
            items.append(PlanItem("project", s.ref, s.title, chunk, None, "PROJETO", {"project_id": s.ref}))
        return used

    days: list[DayPlan] = []
    d = start
    totals = {"video": 0.0, "practice": 0.0, "project": 0.0, "review": 0.0}

    for _ in range(max_days):
        work_left = bool(queue) or any(s.minutes > 0.5 for s in stages)
        if not work_left and not reviews:
            break
        base_cap = day_capacity(d, settings)
        cap = base_cap - (done_today_min if today and d == today else 0)
        day = DayPlan(d, base_cap, rest=base_cap == 0)
        if cap < 10:
            days.append(day)
            d += timedelta(days=1)
            continue
        items: list[PlanItem] = []
        used = 0.0

        # 1) REVISAR — só o que já venceu (o espaçamento é respeitado até o fim do plano)
        due = [r for r in reviews if r.due <= d]
        taken: list[Review] = []
        rmin = 0.0
        for r in due:
            if rmin + r.minutes <= float(rcfg["daily_cap"]) or not taken:
                taken.append(r)
                rmin += r.minutes
        if taken:
            for r in taken:
                reviews.remove(r)
            items.append(PlanItem(
                "review", None, "Revisão espaçada", rmin, None, "REVISAR",
                {"reviews": [{"key": r.key, "learned_on": r.learned_on.isoformat(), "interval": r.interval,
                              "due": r.due.isoformat(), "minutes": r.minutes, "real": r.real} for r in taken]}))
            used += rmin

        # 2) PROJETO no dia de projeto (ou bloco curto na semana se o acúmulo for grande)
        backlog = sum(s.minutes for s in stages if s.unlocked and s.minutes > 0.5)
        if backlog:
            if d.weekday() == project_wd:
                used += take_project(items, (cap - used) if not queue else max(60.0, (cap - used) * 0.7))
            elif queue and backlog >= float(settings.get("weekday_project_threshold", 240)):
                used += take_project(items, min(float(settings.get("weekday_project_block", 45)), cap - used))

        # 3) AULA e PRÁTICA, na ordem do catálogo
        video_today = 0.0
        while queue and (queue[0].minutes <= 0 or cap - used >= 10):
            u = queue[0]
            room = cap - used
            full = True
            if u.kind == "video":
                if u.minutes <= 0:
                    chunk = 0.0
                elif u.minutes <= room + 10 or video_today == 0:
                    chunk = u.minutes
                elif u.splittable and u.minutes > 50 and room >= 20:
                    chunk, full = round5(room), False
                else:
                    break
            else:  # prática: cabe em pedaços
                if u.minutes <= room + 5:
                    chunk = u.minutes
                elif room >= 15:
                    chunk, full = (round5(room) if round5(room) <= room else round5(room) - 5), False
                else:
                    break
            if chunk <= 0 and u.minutes > 0:
                break
            items.append(PlanItem(u.kind, u.ref, u.title, chunk, u.content_id, u.phase,
                                  {**u.detail, "partial": not full or u.detail.get("partial", False)}))
            used += chunk
            if u.kind == "video":
                video_today += chunk
            if full:
                queue.popleft()
                remaining[u.content_id] -= 1
                if remaining[u.content_id] == 0:
                    for s in stages:
                        if s.unlock_after == u.content_id:
                            s.unlocked = True
            else:
                u.minutes -= chunk
                break

        if not queue:   # fim do conteúdo: libera os projetos "finais" e usa o resto do dia
            for s in stages:
                s.unlocked = True
            if cap - used >= 15:
                used += take_project(items, cap - used)

        # 4) agenda as revisões futuras deste dia de aprendizado
        if video_today > 0:
            existing = {r.key: r for r in reviews}
            for iv in rcfg["intervals"]:
                key = f"{d.isoformat()}:D{iv}"
                if key in existing:
                    r = existing[key]
                    r.minutes = min(float(rcfg["max"][str(iv)]), r.minutes + review_minutes(video_today, iv, rcfg) / 2)
                else:
                    reviews.append(Review(key, d, iv, d + timedelta(days=iv), review_minutes(video_today, iv, rcfg)))
            reviews.sort(key=lambda r: (r.due, r.interval))

        items.sort(key=lambda i: KIND_ORDER[i.kind])
        for it in items:
            totals[it.kind] += it.minutes
        day.items = items
        days.append(day)
        d += timedelta(days=1)

    while days and not days[-1].items:
        days.pop()
    end = days[-1].date if days else None
    last_lesson = max((dd.date for dd in days if any(i.kind == "video" for i in dd.items)), default=None)
    return PlanResult(days, end, totals, last_lesson)
