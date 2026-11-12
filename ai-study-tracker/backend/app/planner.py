"""Algoritmo de distribuição do estudo (função pura, sem banco).

Ciclo por dia de estudo:
  REVISAR (revisões espaçadas que vencem)  → APRENDER (vídeo)
  → ENTENDER/CONSTRUIR (prática do bloco)  → CONSOLIDAR (AI Agent Lab)

Regras principais
- Descanso semanal e feriados não recebem nada.
- Aulas não são quebradas (só blocos > 50 min podem ser divididos).
- Cada módulo/bloco é seguido da sua prática (proporção definida pela natureza do curso).
- Estágios do AI Agent Lab são liberados quando o curso-gatilho termina e
  ocupam principalmente o dia de projeto (sábado). Se o backlog de projeto
  passar de um limite, entram blocos curtos durante a semana.
- Revisões D+1/D+7/D+30 são geradas a partir dos minutos de vídeo de cada dia,
  são pequenas (5–15 min) e limitadas por dia. Quando todo o trabalho acabou,
  as revisões restantes são antecipadas e formam a consolidação final.
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional

KIND_ORDER = {"review": 0, "video": 1, "practice": 1, "project": 2}  # ordenação estável: vídeo→prática preservado


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
    unlock_after: Optional[str]  # content_id; None = após todo o conteúdo
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
    end_date: Optional[date]
    totals: dict


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


def build_plan(*, start: date, units: list[Unit], stages: list[Stage], reviews: list[Review],
               settings: dict, done_today_min: float = 0.0, today: Optional[date] = None,
               max_days: int = 500) -> PlanResult:
    rcfg = settings["review"]
    queue = deque(Unit(**{**u.__dict__}) for u in units)
    stages = [Stage(**{**s.__dict__}) for s in stages]
    reviews = sorted((Review(**{**r.__dict__}) for r in reviews), key=lambda r: (r.due, r.interval))

    remaining_by_content: dict[str, int] = {}
    for u in queue:
        remaining_by_content[u.content_id] = remaining_by_content.get(u.content_id, 0) + 1
    for s in stages:
        if s.unlock_after is not None and remaining_by_content.get(s.unlock_after, 0) == 0:
            s.unlocked = True

    def unlock_for(content_id: str) -> None:
        for s in stages:
            if s.unlock_after == content_id:
                s.unlocked = True

    def backlog() -> list[Stage]:
        return [s for s in stages if s.unlocked and s.minutes > 0.5]

    def take_project(items: list[PlanItem], budget: float) -> float:
        used = 0.0
        for s in backlog():
            if budget - used < 15:
                break
            chunk = min(s.minutes, budget - used)
            if chunk < s.minutes:
                chunk = max(15.0, round5(chunk - 2))
                chunk = min(chunk, budget - used, s.minutes)
            s.minutes -= chunk
            used += chunk
            items.append(PlanItem("project", s.ref, s.title, chunk, None, "CONSOLIDAR", {"stage_id": s.ref}))
        return used

    days: list[DayPlan] = []
    d = start
    totals = {"video": 0.0, "practice": 0.0, "project": 0.0, "review": 0.0}
    project_wd = int(settings["project_weekday"])
    threshold = float(settings["weekday_project_threshold"])
    block = float(settings["weekday_project_block"])

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

        # 1) REVISAR
        if work_left:
            due = [r for r in reviews if r.due <= d]
            budget = float(rcfg["daily_cap"])
        else:  # consolidação final: antecipa tudo o que sobrou
            due = list(reviews)
            budget = cap
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
                "review", None,
                "Revisão final integrada" if not work_left else "Revisão espaçada",
                rmin, None, "REVISAR",
                {"reviews": [{"key": r.key, "learned_on": r.learned_on.isoformat(), "interval": r.interval,
                              "due": r.due.isoformat(), "minutes": r.minutes, "real": r.real} for r in taken]},
            ))
            used += rmin

        # 2) CONSOLIDAR (dia de projeto / backlog alto)
        bl = backlog()
        if bl:
            total_bl = sum(s.minutes for s in bl)
            if d.weekday() == project_wd:
                budget = (cap - used) if not queue else max(60.0, (cap - used) * 0.7)
                used += take_project(items, budget)
            elif queue and total_bl >= threshold:
                used += take_project(items, min(block, cap - used))

        # 3) APRENDER + CONSTRUIR
        video_today = 0.0
        while queue and cap - used >= 10:
            u = queue[0]
            room = cap - used
            full = False
            if u.kind == "video":
                if u.minutes <= room + 10 or used == 0:
                    chunk, full = u.minutes, True
                elif u.splittable and u.minutes > 50 and room >= 20:
                    chunk = round5(room)
                else:
                    break
            else:
                if u.minutes <= room + 5:
                    chunk, full = u.minutes, True
                elif room >= 15:
                    chunk = round5(room) if round5(room) <= room else round5(room) - 5
                else:
                    break
            if chunk <= 0:
                break
            items.append(PlanItem(u.kind, u.ref, u.title, chunk, u.content_id, u.phase,
                                  {**u.detail, "partial": not full or u.detail.get("partial", False)}))
            used += chunk
            if u.kind == "video":
                video_today += chunk
            if full:
                queue.popleft()
                remaining_by_content[u.content_id] -= 1
                if remaining_by_content[u.content_id] == 0:
                    unlock_for(u.content_id)
            else:
                u.minutes -= chunk
                break

        if not queue:
            for s in stages:  # estágios finais (ou com gatilho inexistente) liberados
                s.unlocked = True
            if cap - used >= 15:
                used += take_project(items, cap - used)

        # 4) agenda revisões futuras deste dia de aprendizado
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
    return PlanResult(days, end, totals)
