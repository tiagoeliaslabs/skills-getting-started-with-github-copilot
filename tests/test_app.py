import copy

import pytest
from fastapi.testclient import TestClient
from src import app as app_module

client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities database before each test."""
    original_activities = copy.deepcopy(app_module.activities)
    app_module.activities.clear()
    app_module.activities.update(original_activities)
    yield


def test_root_redirects_to_static_index():
    response = client.get("/", follow_redirects=False)

    assert response.status_code in (307, 308)
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_known_activity():
    response = client.get("/activities")

    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert data["Chess Club"]["max_participants"] == 12


def test_signup_for_existing_activity():
    activity_name = "Chess Club"
    email = "test.student@mergington.edu"

    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
    assert email in app_module.activities[activity_name]["participants"]


def test_signup_fails_for_duplicate_student():
    activity_name = "Chess Club"
    duplicate_email = "michael@mergington.edu"

    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": duplicate_email},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"


def test_unregister_for_activity():
    activity_name = "Gym Class"
    email = "john@mergington.edu"

    response = client.delete(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email} from {activity_name}"}
    assert email not in app_module.activities[activity_name]["participants"]


def test_unregister_fails_when_student_not_signed_up():
    activity_name = "Gym Class"
    email = "not.registered@mergington.edu"

    response = client.delete(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 400
    assert response.json()["detail"] == "Student not signed up for this activity"


def test_signup_for_unknown_activity_returns_404():
    response = client.post(
        "/activities/UnknownActivity/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
