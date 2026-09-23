"""
Automated Verification Test Suite for FastAPI Backend
"""
from fastapi.testclient import TestClient
from app.main import app
from app.security.crypto import crypto_service

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "UP"

def test_crypto_roundtrip():
    secret_key = "AIzaSyTestApiKeyForGemini12345"
    encrypted = crypto_service.encrypt(secret_key)
    assert encrypted != secret_key
    assert len(encrypted) > 20

    decrypted = crypto_service.decrypt(encrypted)
    assert decrypted == secret_key

    masked = crypto_service.mask_key(secret_key)
    assert masked.endswith("2345")
    assert "••••" in masked

def test_auth_registration_and_login():
    test_email = "testuser_py@jobfinder.ai"
    test_password = "SecretPassword123"

    # Register
    res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": test_password,
        "fullName": "Python Test User"
    })
    # Either 200 (created) or 400 (already registered if re-run)
    assert res.status_code in [200, 400]

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "token" in data
    assert data["email"] == test_email
    assert data["fullName"] == "Python Test User"

    token = data["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /api/auth/me
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email

    # Verify /api/resume/profile
    profile_res = client.get("/api/resume/profile", headers=headers)
    assert profile_res.status_code == 200

    # Verify /api/job-sources
    sources_res = client.get("/api/job-sources", headers=headers)
    assert sources_res.status_code == 200
    assert len(sources_res.json()) >= 4

    # Verify /api/jobs/search
    search_res = client.post("/api/jobs/search", json={
        "titles": ["Python Developer"],
        "minMatchPercentage": 40.0
    }, headers=headers)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert "jobs" in search_data
    assert search_data["totalRawFound"] > 0
    assert len(search_data["jobs"]) > 0

    print("\n[SUCCESS] All FastAPI Backend Verification Tests Passed Successfully!")

if __name__ == "__main__":
    test_health()
    test_crypto_roundtrip()
    test_auth_registration_and_login()
