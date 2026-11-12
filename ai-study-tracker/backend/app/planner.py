"""Algoritmo de distribuição do estudo (função pura, sem banco).

O plano tem só dois tipos de item: AULA (APRENDER) e REVISÃO (REVISAR).
Prática, exercícios e projetos próprios você registra como sessões manuais.

Regras
- Descanso semanal e feriados não recebem nada.
- Aulas são agendadas na ordem do catálogo; uma aula não é quebrada (exceto aulas > 50 min
  que não cabem no dia).
- Aula sem duração ("-": quiz, teste, guia) ocupa 0 min e acompanha a aula anterior.
- Revisões D+1/D+7/D+30 são geradas a partir dos minutos de aula de cada dia, são pequenas
  e agrupadas em uma única sessão diária. Quando acabam as aulas, as revisões das últimas aulas
  continuam nas datas certas (D+1, D+7, D+30): o plano tem "fim das aulas" e "fim das revisões".
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional

KIND_ORDER = {"review": 0, "video": 1}


@dataclass
class Unit:
    key: str
    kind: str  # video
    ref: str
    title: str
    minutes: float
    content_id: str
    phase: str
    detail: dict = field(default_factory=dict)
    splittable: bool = False


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
    end_date: Optional[date]       # última revisão (fim do plano)
    totals: dict
    lessons_end: Optional[date] = None  # última aula


def round5(x: float) -> float:
    return float(max(0, int(5 * round(x / 5))))


def review_minutes(video_min: float, interval: int, cfg: dict) -> float:
    """Revisões são curtas: os itens que vencem no mesmo dia viram UMA sessão."""
    pct = cfg["pct"][str(interval)]
    return float(min(cfg["max"][str(interval)], max(cfg["min"], round(video_min * pct))))


def day_capacity(d: date, settings: dict) -> float:
    if d.weekday() == int(settings["rest_weekday"]):
        return 0.0
    mult = float(settings["holidays"].get(d.isoformat(), 1))
    return float(settings["capacity"].get(str(d.weekday()), 0)) * mult


def build_plan(*, start: date, units: list[Unit], reviews: list[Review], settings: dict,
               done_today_min: float = 0.0, today: Optional[date] = None, max_days: int = 600) -> PlanResult:
    rcfg = settings["review"]
    queue = deque(Unit(**{**u.__dict__}) for u in units)
    reviews = sorted((Review(**{**r.__dict__}) for r in reviews), key=lambda r: (r.due, r.interval))

    days: list[DayPlan] = []
    d = start
    totals = {"video": 0.0, "review": 0.0}

    for _ in range(max_days):
        work_left = bool(queue)
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

        # 1) REVISAR — só o que já venceu; o espaçamento D+1/D+7/D+30 é respeitado mesmo no fim do plano
        due = [r for r in reviews if r.due <= d]
        budget = float(rcfg["daily_cap"])
        taken: list[Review] = []
        rmin = 0.0
        for r in due:
            if rmin + r.minutes <= budget or not taken:
                taken.append(r)
                rmin += r.minutes
        if taken:
            for r in taken:
                reviews.remove(r)
            items.append(PlanItem(
                "review", None, "Revisão espaçada",
                rmin, None, "REVISAR",
                {"reviews": [{"key": r.key, "learned_on": r.learned_on.isoformat(), "interval": r.interval,
                              "due": r.due.isoformat(), "minutes": r.minutes, "real": r.real} for r in taken]},
            ))
            used += rmin

        # 2) APRENDER — aulas em ordem; aulas sem duração acompanham a anterior
        video_today = 0.0
        while queue and (queue[0].minutes <= 0 or cap - used >= 10):
            u = queue[0]
            room = cap - used
            full = True
            if u.minutes <= 0:
                chunk = 0.0
            elif u.minutes <= room + 10 or video_today == 0:
                chunk = u.minutes
            elif u.splittable and u.minutes > 50 and room >= 20:
                chunk, full = round5(room), False
            else:
                break
            items.append(PlanItem("video", u.ref, u.title, chunk, u.content_id, "APRENDER",
                                  {**u.detail, "partial": not full or u.detail.get("partial", False)}))
            used += chunk
            video_today += chunk
            if full:
                queue.popleft()
            else:
                u.minutes -= chunk
                break

        # 3) agenda as revisões futuras deste dia de aprendizado
        if video_today > 0:
            existing = {r.key: r for r in reviews}
            for iv in rcfg["intervals"]:
                key = f"{d.isoformat()}:D{iv}"
                if key in existing:  # revisão real do mesmo dia: soma, sem duplicar
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
