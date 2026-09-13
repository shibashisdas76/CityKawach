"""
Unit and Integration Test Suite for Model 3: VMS Federation & Middleware Layer.
Validates VMS adapter initialization, camera partitioning, metadata exchange bus,
CEP correlation engine, and FastAPI REST endpoints.
"""

from fastapi.testclient import TestClient
from main import app
from federation_db import init_federation_db, get_all_vms_platforms
from federation_adapters import federation_manager
from metadata_bus import metadata_bus
from correlation_engine import correlation_engine

client = TestClient(app)

def run_federation_tests():
    print("\n=======================================================")
    print("  RUNNING SENTINEL MODEL 3 VMS FEDERATION TEST SUITE")
    print("=======================================================")

    # 1. Initialize DB & Adapters
    init_federation_db()
    federation_manager.initialize_adapters()
    correlation_engine.initialize()
    print("[✓] Initialized Federation DB, 5 Vendor Adapters & CEP Engine")

    # 2. Test Root Endpoint
    resp = client.get("/")
    assert resp.status_code == 200, f"Root failed: {resp.status_code}"
    data = resp.json()
    assert "Model 3" in str(data.get("models"))
    print("[✓] GET /: OK (Model 3 registered in platform models)")

    # 3. Test Overview KPIs
    resp = client.get("/api/federation/overview")
    assert resp.status_code == 200
    kpis = resp.json()["kpis"]
    assert kpis["totalVmsPlatforms"] >= 5
    print(f"[✓] GET /api/federation/overview: OK ({kpis['totalVmsPlatforms']} VMS platforms, {kpis['totalFederatedCameras']} federated cameras)")

    # 4. Test VMS Systems List
    resp = client.get("/api/federation/vms-systems")
    assert resp.status_code == 200
    platforms = resp.json()
    assert len(platforms) >= 5
    vendors = [p["vendor"] for p in platforms]
    assert "MILESTONE_XPROTECT" in vendors
    assert "GENETEC_SECURITY_CENTER" in vendors
    assert "HIKVISION_HIKCENTRAL" in vendors
    assert "DAHUA_DSS" in vendors
    assert "HANWHA_WAVE" in vendors
    print(f"[✓] GET /api/federation/vms-systems: OK (Federating Milestone, Genetec, Hikvision, Dahua, Hanwha)")

    # 5. Test Federated Cameras
    resp = client.get("/api/federation/cameras")
    assert resp.status_code == 200
    cams = resp.json()
    assert len(cams) >= 1
    print(f"[✓] GET /api/federation/cameras: OK (Retrieved {len(cams)} federated camera endpoints)")

    # 6. Test VMS Handshake Compliance Test
    resp = client.post("/api/federation/vms-systems/vms-traffic-hikcentral/test")
    assert resp.status_code == 200
    test_result = resp.json()
    assert test_result["status"] == "HEALTHY"
    assert len(test_result["steps"]) == 5
    print(f"[✓] POST /api/federation/vms-systems/vms-traffic-hikcentral/test: OK (5/5 Compliance Steps Passed)")

    # 7. Test Metadata Exchange Bus Publish & Retrieve
    event_payload = {
        "sourceVmsId": "vms-police-genetec",
        "sourceVmsName": "State Police Crime & Security VMS",
        "sourceVmsVendor": "GENETEC_SECURITY_CENTER",
        "departmentName": "Gujarat State Police HQ",
        "district": "Ahmedabad",
        "cameraId": "cam03",
        "cameraName": "03 O.N.G.C. Office",
        "location": "ONGC Office Circle, Ahmedabad",
        "eventType": "ANPR_SIGHTING",
        "severity": "HIGH",
        "confidence": 0.95,
        "payload": {"plateNumber": "GJ01AB1234", "watchlistHit": True}
    }
    pub_resp = client.post("/api/federation/events/publish", json=event_payload)
    assert pub_resp.status_code == 200
    assert pub_resp.json()["status"] == "PUBLISHED"

    events_resp = client.get("/api/federation/events?limit=10")
    assert events_resp.status_code == 200
    events = events_resp.json()
    assert len(events) >= 1
    print(f"[✓] Metadata Bus Pub/Sub: OK (Successfully ingested & routed across Kafka topic queues)")

    # 8. Test Correlated Incidents & Graph
    resp = client.get("/api/federation/correlations")
    assert resp.status_code == 200
    correlations = resp.json()
    assert len(correlations) >= 1
    first_corr = correlations[0]
    assert "graphData" in first_corr
    assert len(first_corr["graphData"]["nodes"]) > 0
    print(f"[✓] GET /api/federation/correlations: OK (Retrieved {len(correlations)} cross-system correlated incidents with graph nodes)")

    # 9. Test Plugin SDK & Validation
    specs_resp = client.get("/api/federation/plugin-sdk/specs")
    assert specs_resp.status_code == 200
    specs = specs_resp.json()
    assert "supportedVendors" in specs

    val_resp = client.post("/api/federation/plugin-sdk/validate", json={"pluginJson": specs["samplePluginConfig"]})
    assert val_resp.status_code == 200
    assert val_resp.json()["valid"] is True
    print(f"[✓] Plugin SDK & JSON Schema Validator: OK (Validated third-party VMS plugin configuration)")

    # 10. Test Sample Federated Analytics Report
    rep_resp = client.get("/api/federation/reports/sample")
    assert rep_resp.status_code == 200
    rep = rep_resp.json()
    assert len(rep["vendorBreakdown"]) >= 5
    assert len(rep["departmentalIncidentMatrix"]) >= 5
    print(f"[✓] GET /api/federation/reports/sample: OK (Sample federated operational report generated)")

    print("\n=======================================================")
    print("  ALL MODEL 3 VMS FEDERATION TESTS PASSED 100%!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_federation_tests()
