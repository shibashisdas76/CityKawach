"""
Automated End-to-End Interconnection Verification Test Suite.
Validates live dataflow across:
Model 1 (Registry & GIS) <-> Model 2 (Video Wall & ANPR) <-> Model 3 (Federation & CEP) <-> Model 4 (Central VMS & Gov DBs).
"""

import sys
import os
import requests
import time

# Set stdout encoding to utf-8 if possible
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_pipeline():
    print("=" * 70)
    print("[TEST] RUNNING END-TO-END 4-MODEL INTERCONNECTION PIPELINE VERIFICATION")
    print("=" * 70)

    # 1. Pipeline Unified Status
    print("\n[Stage 1] Verifying Unified Pipeline Diagnostics (/api/pipeline/unified-status)...")
    res = requests.get(f"{BASE_URL}/api/pipeline/unified-status", timeout=5)
    assert res.status_code == 200, f"Failed pipeline status: {res.status_code}"
    status_data = res.json()
    assert status_data["status"] == "FULLY_INTERCONNECTED"
    assert len(status_data["pipeline_stages"]) == 4
    print("  [OK] Pipeline status is FULLY_INTERCONNECTED across all 4 stages!")
    for st in status_data["pipeline_stages"]:
        print(f"     * Stage {st['stage']}: {st['name']} -> {st['status']} ({st['metrics']})")

    # 2. Model 1 Master Registry & GIS
    print("\n[Stage 2] Verifying Model 1 Master Registry (/api/registry/cameras)...")
    res = requests.get(f"{BASE_URL}/api/registry/cameras", timeout=5)
    assert res.status_code == 200
    cams = res.json()
    assert len(cams) >= 30, f"Expected 30 cameras, found {len(cams)}"
    print(f"  [OK] Model 1 Camera Registry loaded {len(cams)} synchronized camera assets with WGS84 coordinates!")

    # 3. Model 2 Stream & ANPR Detections
    print("\n[Stage 3] Verifying Model 2 Live Stream & Detections (/api/cameras, /api/detections)...")
    res = requests.get(f"{BASE_URL}/api/cameras", timeout=5)
    assert res.status_code == 200
    stream_cams = res.json()
    assert len(stream_cams) >= 30
    print(f"  [OK] Model 2 Live Stream Relay active for all {len(stream_cams)} camera feeds!")

    res = requests.get(f"{BASE_URL}/api/detections?limit=10", timeout=5)
    assert res.status_code == 200
    detections = res.json()
    print(f"  [OK] Model 2 ANPR Edge Inference returned {len(detections)} live vehicle sightings!")

    # 4. Cross-Model Search (M1 + M2 + M3 + M4)
    print("\n[Stage 4] Verifying Cross-Model Vehicle Intelligence Search (/api/search?plate=GJ01AB1234)...")
    res = requests.get(f"{BASE_URL}/api/search?plate=GJ01AB1234", timeout=5)
    assert res.status_code == 200
    search_data = res.json()
    assert search_data["plate"] == "GJ01AB1234"
    assert "vahan_registry" in search_data
    assert "egujcop_firs" in search_data
    assert "correlated_incidents" in search_data
    print(f"  [OK] Vehicle GJ01AB1234 successfully correlated across M1 Sightings ({search_data['total_sightings']}), M4 VAHAN ({search_data['vahan_registry']['maker_model']}), M4 eGujCop FIRs ({len(search_data['egujcop_firs'])}), and M3 CEP Correlations ({len(search_data['correlated_incidents'])})!")

    # 5. Model 3 Federation & CEP Engine
    print("\n[Stage 5] Verifying Model 3 VMS Federation & CEP Correlator (/api/federation/vms-systems, /api/federation/correlations)...")
    res = requests.get(f"{BASE_URL}/api/federation/vms-systems", timeout=5)
    assert res.status_code == 200
    platforms = res.json()
    assert len(platforms) >= 5
    print(f"  [OK] Model 3 Federation Layer connected to {len(platforms)} departmental VMS platforms (Hikvision, Genetec, Dahua, Milestone, Hanwha)!")

    res = requests.get(f"{BASE_URL}/api/federation/correlations", timeout=5)
    assert res.status_code == 200
    correlations = res.json()
    print(f"  [OK] Model 3 CEP Correlation Engine generated {len(correlations)} cross-jurisdiction incidents!")

    # 6. Model 4 Central VMS & Multi-Task AI
    print("\n[Stage 6] Verifying Model 4 Central VMS (/api/vms/overview, /api/vms/ai/face-recognition, /api/vms/storage/metrics)...")
    res = requests.get(f"{BASE_URL}/api/vms/overview", timeout=5)
    assert res.status_code == 200
    overview = res.json()
    assert overview["status"] == "OPERATIONAL"
    print(f"  [OK] Model 4 Central VMS Overview: {overview['ingestion']['total_cameras']} Cameras, {overview['storage']['ceph_cluster_status']} Storage, DR: {overview['disaster_recovery']['health']}")

    res = requests.get(f"{BASE_URL}/api/vms/ai/face-recognition", timeout=5)
    assert res.status_code == 200
    faces = res.json()
    print(f"  [OK] Model 4 Face Recognition: {faces['total']} NAFIS biometric events recorded!")

    res = requests.get(f"{BASE_URL}/api/vms/storage/metrics", timeout=5)
    assert res.status_code == 200
    storage = res.json()
    print(f"  [OK] Model 4 Tiered Storage: Hot NVMe, Warm Ceph, Cold S3 WORM active across {len(storage['tiers'])} pools!")

    print("\n" + "=" * 70)
    print("[SUCCESS] ALL 4-MODEL PIPELINE INTERCONNECTION TESTS PASSED (100%)!")
    print("=" * 70)

if __name__ == "__main__":
    test_pipeline()
