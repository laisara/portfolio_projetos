from datetime import date, timedelta

from backend.app.planner import Review, Stage, Unit, build_plan, day_capacity
from backend.app.settings import DEFAULTS

START = date(2026, 11, 13)  # sexta


def units(n=20, minutes=40, practice=15):
    out = []
    for i in range(n):
        cid = f"C-{i // 5:03d}"
        out.append(Unit(f"V:{i}", "video", f"L{i}", f"Aula {i}", minutes, cid, "APRENDER"))
        out.append(Unit(f"P:{i}", "practice", f"M{i}", f"Prática {i}", practice, cid, "CONSTRUIR", splittable=True))
    return out


def test_rest_days_and_holidays_are_empty():
    res = build_plan(start=START, units=units(60), stages=[], reviews=[], settings=DEFAULTS)
    for d in res.days:
        if d.date.weekday() == 6 or d.date.isoformat() in ("2026-12-25", "2027-01-01"):
            assert d.items == [], d.date


def test_every_unit_scheduled_exactly_once_and_in_order():
    us = units(30)
    res = build_plan(start=START, units=us, stages=[], reviews=[], settings=DEFAULTS)
    total = {}
    order = []
    for d in res.days:
        for it in d.items:
            if it.kind in ("video", "practice"):
                total[it.ref] = total.get(it.ref, 0) + it.minutes
                if not order or order[-1] != it.ref:
                    order.append(it.ref)
    for u in us:
        assert abs(total[u.ref] - u.minutes) < 0.01
    assert order == [u.ref for u in us]


def test_daily_capacity_respected_with_small_tolerance():
    res = build_plan(start=START, units=units(60), stages=[Stage("LAB-1", "Lab", 300, "C-000")], reviews=[], settings=DEFAULTS)
    for d in res.days:
        cap = day_capacity(d.date, DEFAULTS)
        assert d.total <= cap + 15, (d.date, d.total, cap)


def test_practice_follows_its_video_same_day():
    res = build_plan(start=START, units=units(4), stages=[], reviews=[], settings=DEFAULTS)
    first = res.days[0].items
    kinds = [i.kind for i in first if i.kind != "review"]
    assert kinds[:2] == ["video", "practice"]


def test_reviews_generated_d1_d7_d30_and_after_learning():
    res = build_plan(start=START, units=units(40), stages=[], reviews=[], settings=DEFAULTS)
    learned = {d.date for d in res.days if any(i.kind == "video" for i in d.items)}
    seen = set()
    for d in res.days:
        for it in d.items:
            if it.kind == "review":
                for r in it.detail["reviews"]:
                    lo = date.fromisoformat(r["learned_on"])
                    assert lo in learned and lo < d.date or it.title == "Revisão final integrada"
                    seen.add(r["interval"])
    assert seen == {1, 7, 30}


def test_reviews_are_small():
    res = build_plan(start=START, units=units(60), stages=[], reviews=[], settings=DEFAULTS)
    share = res.totals["review"] / sum(res.totals.values())
    assert share < 0.15
    for d in res.days:
        for it in d.items:
            if it.kind == "review" and it.title == "Revisão espaçada":
                assert it.minutes <= DEFAULTS["review"]["daily_cap"] + DEFAULTS["review"]["max"]["30"]


def test_project_unlocked_only_after_trigger_and_prefers_saturday():
    us = units(30)
    res = build_plan(start=START, units=us, stages=[Stage("LAB-1", "Lab 1", 240, "C-002")], reviews=[], settings=DEFAULTS)
    last_trigger = max(d.date for d in res.days for i in d.items if i.content_id == "C-002" and i.kind == "video")
    proj_days = [d for d in res.days for i in d.items if i.kind == "project"]
    assert proj_days and all(d.date >= last_trigger for d in proj_days)
    assert proj_days[0].date.weekday() == 5 or sum(i.minutes for d in proj_days for i in d.items if i.kind == "project") >= 240


def test_final_stage_after_all_content():
    us = units(10)
    res = build_plan(start=START, units=us, stages=[Stage("LAB-9", "Final", 300, None)], reviews=[], settings=DEFAULTS)
    last_content = max(d.date for d in res.days for i in d.items if i.kind in ("video", "practice"))
    first_final = min(d.date for d in res.days for i in d.items if i.kind == "project")
    assert first_final >= last_content
    assert res.end_date >= first_final


def test_done_today_reduces_today_and_shifts_nothing_into_past():
    us = units(10)
    a = build_plan(start=START, units=us, stages=[], reviews=[], settings=DEFAULTS, today=START)
    b = build_plan(start=START, units=us, stages=[], reviews=[], settings=DEFAULTS, today=START, done_today_min=90)
    assert b.days[0].total < a.days[0].total
    assert all(d.date >= START for d in b.days)


def test_less_remaining_work_ends_earlier():
    us = units(40)
    full = build_plan(start=START, units=us, stages=[], reviews=[], settings=DEFAULTS)
    ahead = build_plan(start=START, units=us[10:], stages=[], reviews=[], settings=DEFAULTS)
    assert ahead.end_date < full.end_date


def test_overdue_real_review_is_scheduled_first():
    r = Review("2026-11-10:D1", date(2026, 11, 10), 1, date(2026, 11, 11), 8, real=True)
    res = build_plan(start=START, units=units(3), stages=[], reviews=[r], settings=DEFAULTS)
    first = res.days[0].items[0]
    assert first.kind == "review" and first.detail["reviews"][0]["key"] == r.key
