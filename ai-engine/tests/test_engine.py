import pytest

from udaan_engine import (
    PROFILES,
    SelfSalary,
    backtest_profile,
    can_smoothing_help,
    generate_year,
    lean_outlook,
    run_baseline,
    run_rule,
    run_udaan,
    sustainable_estimate,
)


def test_generate_year_is_reproducible():
    p = PROFILES["full_time"]
    assert [w.income for w in generate_year(p, 7)] == [w.income for w in generate_year(p, 7)]
    assert [w.income for w in generate_year(p, 7)] != [w.income for w in generate_year(p, 8)]


def test_estimate_ignores_one_big_week():
    steady = [5000.0] * 7
    assert sustainable_estimate(steady + [20000.0]) == pytest.approx(5000.0)


def test_estimate_with_little_history_is_cautious():
    assert sustainable_estimate([4000.0]) == pytest.approx(3400.0)
    assert sustainable_estimate([]) == 0.0


def test_buffer_never_negative_and_money_is_conserved():
    incomes = [w.income for w in generate_year(PROFILES["part_time"], 3)]
    plans = run_rule(incomes, essentials=2000)
    for p in plans:
        assert p.buffer >= -1e-6
        assert p.salary >= 0
    assert sum(p.salary for p in plans) + plans[-1].buffer == pytest.approx(sum(incomes))


def test_lean_week_is_covered_by_buffer():
    rule = SelfSalary(essentials=3000)
    for _ in range(6):
        rule.step(5000)
    lean = rule.step(500)  # e.g. illness week
    assert lean.salary >= 3000
    assert lean.status == "lean"
    assert lean.saved < 0


def test_shortfall_when_buffer_empty():
    plan = SelfSalary(essentials=3000).step(1000)
    assert plan.status == "shortfall"
    assert plan.salary == pytest.approx(1000)


def test_salary_moves_slowly():
    rule = SelfSalary(essentials=1000)
    for _ in range(4):
        rule.step(4000)
    before = rule.salary
    after = rule.step(12000).salary
    assert after <= before * 1.15 + 1e-6


def test_negative_income_week_handled():
    rule = SelfSalary(essentials=2000, start_buffer=10000)
    plan = rule.step(-1800)  # bike repair cost more than the week's pay
    assert plan.salary >= 2000
    assert plan.buffer < 10000


def test_rejects_bad_essentials():
    with pytest.raises(ValueError):
        SelfSalary(essentials=0)


def test_low_income_is_not_called_a_timing_problem():
    ok, msg = can_smoothing_help([3000.0] * 52, essentials=3500)
    assert not ok
    assert "low-income" in msg


def test_udaan_borrows_fewer_weeks_when_income_is_enough():
    incomes = [w.income for w in generate_year(PROFILES["full_time"], 1)]
    base = run_baseline(incomes, 4600)
    ours = run_udaan(incomes, 4600)
    assert ours.weeks_borrowing < base.weeks_borrowing


def test_backtest_shape():
    r = backtest_profile(PROFILES["full_time"], seeds=range(5))
    assert r["years_simulated"] == 5
    assert set(r["baseline"]) == set(r["udaan"])
    assert r["change"]["weeks_borrowing"] < 0


def test_outlook_needs_history():
    assert lean_outlook([4000, 4200], 3000, 0, next_week=2)["ready"] is False


def test_outlook_warns_in_slow_season_with_empty_buffer():
    # Weeks 44-51 (Nov-Dec, busy) then forecast Jan (slow), essentials close to income.
    history = [4400.0] * 8
    out = lean_outlook(history, essentials=4300, buffer=0, next_week=52, horizon=4)
    assert out["ready"]
    assert out["overall"] == "warning"
    assert all(w["low"] <= w["expected"] <= w["high"] for w in out["weeks"])


def test_reasons_match_what_happened():
    rule = SelfSalary(essentials=3000)
    for _ in range(6):
        good = rule.step(5000)
    assert "goes to the buffer" in good.reasons[0]
    lean = rule.step(500)
    assert lean.reasons[0].startswith("Lean week")
    assert not any("extra is saved" in r for r in lean.reasons)
