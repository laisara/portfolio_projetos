from datetime import date

from backend.app.planner import Review, Unit, build_plan, day_capacity
from backend.app.settings import DEFAULTS

START = date(2026, 11, 13)  # sexta


def units(n=20, minutes=40):
    return [Unit(f"V:{i}", "video", f"L{i}", f"Aula {i}", minutes, f"C-{i // 5:03d}", "APRENDER", splittable=minutes > 50) for i in range(n)]


def plan(us, **kw):
    return build_plan(start=START, units=us, reviews=kw.pop("reviews", []), settings=DEFAULTS, **kw)


def test_only_lessons_and_reviews_in_plan():
    res = plan(units(60))
    kinds = {i.kind for d in res.days for i in d.items}
    assert kinds == {"video", "review"}
    assert set(res.totals) == {"video", "review"}


def test_rest_days_and_holidays_are_empty():
    res = plan(units(120))
    for d in res.days:
        if d.date.weekday() == 6 or d.date.isoformat() in ("2026-12-25", "2027-01-01"):
            assert d.items == [], d.date


def test_every_lesson_scheduled_once_in_order():
    us = units(40)
    res = plan(us)
    order = [i.ref for d in res.days for i in d.items if i.kind == "video"]
    assert order == [u.ref for u in us]
    assert abs(res.totals["video"] - sum(u.minutes for u in us)) < 0.01


def test_daily_capacity_respected_with_small_tolerance():
    res = plan(units(120, 35))
    for d in res.days:
        assert d.total <= day_capacity(d.date, DEFAULTS) + 12, (d.date, d.total)


def test_zero_duration_items_follow_previous_lesson_and_cost_nothing():
    us = [Unit("V:a", "video", "a", "Aula", 50, "C", "APRENDER"), Unit("V:q", "video", "q", "Quiz", 0, "C", "APRENDER"),
          Unit("V:b", "video", "b", "Aula 2", 50, "C", "APRENDER")]
    res = plan(us)
    day1 = [i.ref for i in res.days[0].items if i.kind == "video"]
    assert day1[:2] == ["a", "q"]
    assert res.totals["video"] == 100
    assert not any(i.minutes < 0 for d in res.days for i in d.items)


def test_quizzes_never_block_a_full_day():
    us = [Unit(f"V:{i}", "video", f"L{i}", "x", 100 if i % 2 == 0 else 0, "C", "APRENDER") for i in range(8)]
    res = plan(us)
    placed = [i.ref for d in res.days for i in d.items if i.kind == "video"]
    assert placed == [u.ref for u in us]


def test_long_lesson_can_be_split_when_it_does_not_fit():
    us = [Unit("V:a", "video", "a", "Longa", 100, "C", "APRENDER"), Unit("V:b", "video", "b", "Muito longa", 57, "C", "APRENDER", splittable=True)]
    res = plan(us)
    parts = [i for d in res.days for i in d.items if i.ref == "b"]
    assert abs(sum(i.minutes for i in parts) - 57) < 0.01


def test_reviews_d1_d7_d30_are_short_and_follow_learning():
    res = plan(units(100))
    learned = {d.date for d in res.days if any(i.kind == "video" for i in d.items)}
    seen = set()
    for d in res.days:
        for it in d.items:
            if it.kind == "review":
                assert it.minutes <= 30
                for r in it.detail["reviews"]:
                    assert date.fromisoformat(r["learned_on"]) in learned
                    seen.add(r["interval"])
    assert seen == {1, 7, 30}
    assert res.totals["review"] / sum(res.totals.values()) < 0.2


def test_last_reviews_keep_their_spacing_after_lessons_end():
    res = plan(units(10))
    assert res.lessons_end < res.end_date
    last_review_day = res.days[-1]
    assert all(i.kind == "review" for i in last_review_day.items)
    for d in res.days:
        for it in d.items:
            if it.kind == "review":
                assert it.minutes <= 30 and it.title == "Revisão espaçada"
                for r in it.detail["reviews"]:
                    assert date.fromisoformat(r["due"]) <= d.date     # nunca antecipada
    assert (res.end_date - res.lessons_end).days >= 30                # D+30 da última aula


def test_done_today_reduces_today_only():
    a = plan(units(10), today=START)
    b = plan(units(10), today=START, done_today_min=90)
    assert b.days[0].total < a.days[0].total
    assert all(d.date >= START for d in b.days)


def test_less_remaining_work_ends_earlier():
    full = plan(units(60))
    ahead = plan(units(60)[15:])
    assert ahead.end_date < full.end_date


def test_overdue_real_review_is_scheduled_first():
    r = Review("2026-11-10:D1", date(2026, 11, 10), 1, date(2026, 11, 11), 8, real=True)
    res = plan(units(3), reviews=[r])
    first = res.days[0].items[0]
    assert first.kind == "review" and first.detail["reviews"][0]["key"] == r.key
