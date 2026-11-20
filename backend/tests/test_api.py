import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("FLOVA_DB", str(tmp_path / "test.db"))
    from app.main import app

    with TestClient(app) as c:
        yield c


def make_rider(client, **kw):
    body = {"name": "Ravi", "essentials_per_week": 3000, **kw}
    r = client.post("/riders", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_health(client):
    assert client.get("/health").json() == {"ok": True}


def test_payout_flow_and_plan(client):
    rider = make_rider(client)
    for amount in [5000, 5200, 4800, 5100]:
        plan = client.post(f"/riders/{rider['id']}/payouts", json={"amount": amount}).json()
    assert plan["current"]["salary"] >= 3000
    assert plan["current"]["buffer"] > 0
    assert len(plan["history"]) == 4
    assert plan["outlook"]["ready"] is True

    lean = client.post(f"/riders/{rider['id']}/payouts", json={"amount": 300}).json()
    assert lean["current"]["status"] == "lean"
    assert lean["current"]["salary"] >= 3000


def test_undo_replays_plan(client):
    rider = make_rider(client)
    client.post(f"/riders/{rider['id']}/payouts", json={"amount": 5000})
    before = client.get(f"/riders/{rider['id']}/plan").json()
    client.post(f"/riders/{rider['id']}/payouts", json={"amount": 99999})
    after_undo = client.delete(f"/riders/{rider['id']}/payouts/last").json()
    assert after_undo["current"] == before["current"]


def test_undo_with_nothing(client):
    rider = make_rider(client)
    assert client.delete(f"/riders/{rider['id']}/payouts/last").status_code == 409


def test_validation(client):
    assert client.post("/riders", json={"name": "", "essentials_per_week": 3000}).status_code == 422
    assert client.post("/riders", json={"name": "A", "essentials_per_week": 0}).status_code == 422
    rider = make_rider(client)
    assert client.post(f"/riders/{rider['id']}/payouts", json={"amount": 9_999_999}).status_code == 422
    assert client.get("/riders/999/plan").status_code == 404


def test_duplicate_phone(client):
    make_rider(client, phone="9876543210")
    r = client.post("/riders", json={"name": "B", "essentials_per_week": 2000, "phone": "9876543210"})
    assert r.status_code == 409


def test_sms_channel(client):
    make_rider(client, phone="9876543210")
    sms = lambda t: client.post("/sms", json={"phone": "9876543210", "text": t}).json()["reply"]
    assert "Salary this week" in sms("PAY 5,200")
    assert "Salary this week" in sms("status")
    assert "PAY" in sms("hello")
    assert "No payouts yet" in sms("undo")  # removes the only payout
    assert "Nothing to undo" in sms("undo")
    assert len(sms("PAY 4800")) <= 160
    unknown = client.post("/sms", json={"phone": "9000000000", "text": "PAY 100"}).json()["reply"]
    assert "not registered" in unknown


def test_demo_rider_and_simulate(client):
    rider = client.post("/riders/demo?profile=part_time&weeks=10").json()
    assert rider["weeks_logged"] == 10
    plan = client.get(f"/riders/{rider['id']}/plan").json()
    assert len(plan["history"]) == 10
    sim = client.get("/simulate/full_time").json()
    assert len(sim["weeks"]) == 52
    assert client.get("/simulate/nope").status_code == 404


def test_low_income_flagged(client):
    rider = make_rider(client, essentials_per_week=5000)
    for _ in range(5):
        plan = client.post(f"/riders/{rider['id']}/payouts", json={"amount": 3000}).json()
    assert plan["can_help"] is False


def test_backtest(client):
    rows = client.get("/backtest?years=5").json()
    assert {r["profile"] for r in rows} == {"full_time", "part_time", "new_rider"}
