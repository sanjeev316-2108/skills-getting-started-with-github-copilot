import copy
import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

# Ensure each test gets a clean copy of the original activities
ORIGINAL = copy.deepcopy(activities)

@pytest.fixture(autouse=True)
def reset_activities():
    # restore to original before test
    activities.clear()
    activities.update(copy.deepcopy(ORIGINAL))
    yield
    # restore after test as well
    activities.clear()
    activities.update(copy.deepcopy(ORIGINAL))


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    email = "test.user@example.com"
    # signup
    r = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert r.status_code == 200
    assert "Signed up" in r.json().get("message", "")

    # verify present
    r2 = client.get("/activities")
    assert email in r2.json()["Chess Club"]["participants"]

    # unregister
    r3 = client.delete(f"/activities/Chess%20Club/participants?email={email}")
    assert r3.status_code == 200
    assert "Unregistered" in r3.json().get("message", "")

    # verify removed
    r4 = client.get("/activities")
    assert email not in r4.json()["Chess Club"]["participants"]


def test_signup_duplicate():
    email = "dup.user@example.com"
    r1 = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert r1.status_code == 200

    r2 = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert r2.status_code == 400
    assert "already signed up" in r2.json().get("detail", "")


def test_unregister_nonexistent_participant():
    r = client.delete("/activities/Chess%20Club/participants?email=noone@example.com")
    assert r.status_code == 404
    assert "Participant not found" in r.json().get("detail", "")


def test_unregister_nonexistent_activity():
    r = client.delete("/activities/DoesNotExist/participants?email=test@example.com")
    assert r.status_code == 404
    assert "Activity not found" in r.json().get("detail", "")
