"""
Sentinel CCTV Central Platform - Unified Model 2 FastAPI Stream Gateway & Analytics API.
Provides RESTful endpoints for camera catalog, live authenticated HLS stream proxy,
live ANPR detection streams, watchlist incident management, and statewide vehicle trajectory reconstruction.
"""

import os
import sys
from typing import Optional, List
from fastapi import FastAPI, Query, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    init_db,
    get_recent_detections,
    search_plate_history,
    get_recent_alerts,
    get_watchlist_records,
    add_watchlist_entry,
    resolve_alert_by_id,
    get_analytics_metrics
)
from sentinel_client import sentinel_gateway
from worker import start_worker_in_background

app = FastAPI(
    title="Sentinel Gujarat - CCTV Central Platform (Model 2)",
    description="Unified Video Management, Edge ANPR Analytics & Watchlist Alert System",
    version="2.0.0"
)

# Enable CORS for all frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WatchlistCreateRequest(BaseModel):
    plate_number: str
    reason: str
    severity: str = "HIGH"
    owner_name: Optional[str] = ""
    vehicle_model: Optional[str] = ""
    source: Optional[str] = "Manual Entry"

class AlertResolveRequest(BaseModel):
    resolved_by: str
    action_notes: str

@app.on_event("startup")
def on_startup():
    init_db()
    sentinel_gateway.login()
    # Start the continuous stream ingestion and inference worker in background
    start_worker_in_background()

@app.get("/")
def root():
    return {
        "platform": "Sentinel Gujarat CCTV Central Platform",
        "model": "Model 2 - Unified Viewer & Edge ANPR Analytics",
        "status": "OPERATIONAL",
        "endpoints": [
            "/api/cameras",
            "/api/stream/{cam_id}/index.m3u8",
            "/api/detections",
            "/api/alerts",
            "/api/search",
            "/api/watchlist",
            "/api/analytics/metrics",
            "/api/health"
        ]
    }

@app.get("/api/cameras")
def get_cameras(request: Request):
    """
    Returns the real-time sanitized catalogue of all 30 statewide cameras
    along with authenticated HLS stream proxy URLs.
    """
    host = f"{request.url.scheme}://{request.url.netloc}"
    cameras = sentinel_gateway.fetch_camera_catalogue(backend_host=host)
    return cameras

# ─── Authenticated Stream Relay & Proxy Endpoints ─────────────────────────
@app.get("/api/stream/{cam_id}/index.m3u8")
def stream_playlist(cam_id: str, request: Request):
    """
    Proxies and rewrites the HLS playlist with authenticated credentials,
    resolving the AES-128 encryption key and video segments through the proxy.
    """
    host = f"{request.url.scheme}://{request.url.netloc}"
    playlist = sentinel_gateway.get_stream_playlist(cam_id=cam_id, host_url=host)
    if not playlist:
        raise HTTPException(status_code=502, detail=f"Unable to fetch stream playlist for {cam_id}")
    return Response(
        content=playlist,
        media_type="application/vnd.apple.mpegurl",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache, no-store, must-revalidate"
        }
    )

@app.get("/api/stream/enc.key")
def stream_encryption_key():
    """Proxies the AES-128 HLS stream decryption key from Sentinel."""
    key = sentinel_gateway.get_encryption_key()
    if not key:
        raise HTTPException(status_code=502, detail="Unable to retrieve decryption key")
    return Response(
        content=key,
        media_type="application/octet-stream",
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.get("/api/stream/{cam_id}/{segment_name}")
def stream_segment(cam_id: str, segment_name: str):
    """Proxies a binary MPEG-TS video segment with authenticated session."""
    if segment_name == "enc.key":
        return stream_encryption_key()
    segment_bytes = sentinel_gateway.get_stream_segment(cam_id=cam_id, segment_name=segment_name)
    if not segment_bytes:
        raise HTTPException(status_code=502, detail=f"Unable to fetch segment {segment_name} for {cam_id}")
    return Response(
        content=segment_bytes,
        media_type="video/mp2t",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600"
        }
    )

# ─── Detection & Analytics Endpoints ─────────────────────────────────────
@app.get("/api/detections")
def fetch_detections(
    limit: int = Query(default=30, ge=1, le=100),
    camera_id: Optional[str] = None,
    watchlist_only: bool = False
):
    """
    Returns live timestamped optical recognition sightings extracted
    via local edge inference with monotonic PTS timing.
    """
    detections = get_recent_detections(limit=limit, camera_id=camera_id, watchlist_only=watchlist_only)
    return detections

@app.get("/api/alerts")
def fetch_alerts(
    limit: int = Query(default=25, ge=1, le=100),
    unresolved_only: bool = False
):
    """
    Returns automated law enforcement alerts triggered against
    active watchlist records (eGujCop, NAFIS, CCTNS).
    """
    alerts = get_recent_alerts(limit=limit, unresolved_only=unresolved_only)
    return alerts

@app.get("/api/search")
def search_vehicle(plate: str = Query(..., description="Vehicle registration plate number")):
    """
    Reconstructs sequential movement history and checkpoint checkpoints
    for a specific vehicle ordered by monotonic Presentation Timestamps (PTS).
    """
    if not plate or not plate.strip():
        raise HTTPException(status_code=400, detail="Plate query parameter cannot be empty")

    history = search_plate_history(plate.strip())
    clean_plate = plate.replace("-", "").replace(" ", "").upper()

    return {
        "plate": clean_plate,
        "total_sightings": len(history),
        "history": history
    }

@app.get("/api/watchlist")
def fetch_watchlist(active_only: bool = True):
    """
    Returns the active database of flagged law enforcement vehicles.
    """
    records = get_watchlist_records(active_only=active_only)
    return records

@app.post("/api/watchlist")
def create_watchlist_entry(payload: WatchlistCreateRequest):
    """
    Registers a new vehicle of interest on the statewide watchlist.
    """
    success = add_watchlist_entry(
        plate_number=payload.plate_number,
        reason=payload.reason,
        severity=payload.severity,
        owner_name=payload.owner_name or "",
        vehicle_model=payload.vehicle_model or "",
        source=payload.source or "Manual Entry"
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add watchlist record (plate may already exist)")
    return {"status": "SUCCESS", "message": f"Plate {payload.plate_number.upper()} registered to watchlist"}

@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, payload: AlertResolveRequest):
    """
    Marks an alert as resolved by an authorized officer with compliance action notes.
    """
    success = resolve_alert_by_id(
        alert_id=alert_id,
        resolved_by=payload.resolved_by,
        action_notes=payload.action_notes
    )
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found or already resolved")
    return {"status": "SUCCESS", "alert_id": alert_id, "resolved": True}

@app.get("/api/analytics/metrics")
def fetch_analytics_metrics():
    """
    Returns aggregated KPIs: total detections, alert counts, unique vehicles, and model confidence.
    """
    metrics = get_analytics_metrics()
    return metrics

@app.get("/api/health")
def get_health(request: Request):
    """
    Returns service health, camera connectivity status, and edge inference telemetry.
    """
    host = f"{request.url.scheme}://{request.url.netloc}"
    cameras = sentinel_gateway.fetch_camera_catalogue(backend_host=host)
    return {
        "status": "HEALTHY",
        "camera_count": len(cameras),
        "gateway_connected": True,
        "inference_engine": "YOLOv8n + OpenCV (PTS-driven)",
        "rtsp_transport": "TCP",
        "reconnect_policy": "Exponential Backoff (2s -> 30s)",
        "stream_proxy": "Active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
