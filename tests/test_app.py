from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities_contains_some_activity():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # At least one of the seeded activities should be present
    assert "Soccer Team" in data


def test_signup_and_remove_participant_flow():
    activity_name = "Soccer Team"
    test_email = "pytest_user@example.com"

    # Ensure the test email is not present initially
    resp = client.get("/activities")
    assert resp.status_code == 200
    assert test_email not in resp.json()[activity_name]["participants"]

    # Sign up the test email
    signup_resp = client.post(f"/activities/{activity_name}/signup?email={test_email}")
    assert signup_resp.status_code == 200
    assert "Signed up" in signup_resp.json().get("message", "")

    # Verify it appears in participants
    resp_after = client.get("/activities")
    assert test_email in resp_after.json()[activity_name]["participants"]

    # Remove the participant
    delete_resp = client.delete(f"/activities/{activity_name}/participants?email={test_email}")
    assert delete_resp.status_code == 200
    assert "Removed" in delete_resp.json().get("message", "")

    # Verify it no longer appears
    final = client.get("/activities")
    assert test_email not in final.json()[activity_name]["participants"]
