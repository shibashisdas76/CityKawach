"""
Integration & Functional Test Suite for Sentinel Model 2 Analytics API.
"""

from fastapi.testclient import TestClient
from main import app
import database

client = TestClient(app)

def test_api_endpoints():
    print("\n=======================================================")
    print("  RUNNING SENTINEL MODEL 2 ANALYTICS SUITE VERIFICATION")
    print("=======================================================")

    # 1. Test Health
    resp = client.get("/api/health")
    assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
    print(f"[✓] GET /api/health: OK (Status: {resp.json()['status']}, Inference: {resp.json()['inference_engine']})")

    # 2. Test Cameras Catalogue
    resp = client.get("/api/cameras")
    assert resp.status_code == 200, f"Cameras endpoint failed: {resp.status_code}"
    cameras = resp.json()
    assert len(cameras) >= 30, f"Expected 30 cameras, got {len(cameras)}"
    print(f"[✓] GET /api/cameras: OK ({len(cameras)} live cameras indexed with RTSP/HLS endpoints)")

    # 3. Seed test detection
    database.record_detection(
        camera_id="cam01",
        camera_name="01 Chiman bhai Bridge",
        location="Chimanbhai Bridge, Ahmedabad",
        plate_number="GJ01AB1234",
        vehicle_type="CAR",
        vehicle_color="White",
        confidence=0.96,
        pts_ms=10200.0,
        speed_kmh=52.0,
        direction="NE"
    )
    print("[✓] database.record_detection: OK (Inserted test detection with PTS timing)")

    # 4. Test Detections
    resp = client.get("/api/detections?limit=10")
    assert resp.status_code == 200
    detections = resp.json()
    assert len(detections) > 0
    print(f"[✓] GET /api/detections: OK (Retrieved {len(detections)} detection logs)")

    # 5. Test Alerts
    resp = client.get("/api/alerts")
    assert resp.status_code == 200
    alerts = resp.json()
    print(f"[✓] GET /api/alerts: OK (Retrieved {len(alerts)} watchlist incident records)")

    # 6. Test Vehicle Search
    resp = client.get("/api/search?plate=GJ01AB1234")
    assert resp.status_code == 200
    search_res = resp.json()
    assert search_res["total_sightings"] > 0
    print(f"[✓] GET /api/search?plate=GJ01AB1234: OK ({search_res['total_sightings']} checkpoints reconstructed)")

    # 7. Test Watchlist Registration
    import time
    test_plate = f"GJ01ZZ{int(time.time()) % 10000:04d}"
    resp = client.post("/api/watchlist", json={
        "plate_number": test_plate,
        "reason": "Test Alert Intercept Flag",
        "severity": "CRITICAL",
        "owner_name": "Test Subject",
        "vehicle_model": "Black SUV",
        "source": "eGujCop Test"
    })
    assert resp.status_code == 200
    print(f"[✓] POST /api/watchlist: OK (Registered {test_plate} to watchlist)")

    # 8. Test Analytics Metrics
    resp = client.get("/api/analytics/metrics")
    assert resp.status_code == 200
    metrics = resp.json()
    print(f"[✓] GET /api/analytics/metrics: OK (Detections: {metrics['total_detections']}, Alerts: {metrics['total_alerts']}, Confidence: {metrics['avg_confidence']}%)")

    print("\n=======================================================")
    print("  ALL MODEL 2 BACKEND & AI API TESTS PASSED 100%!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_api_endpoints()
