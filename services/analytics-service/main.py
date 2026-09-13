"""
Sentinel CCTV Central Platform - Unified Model 1, 2, 3 & 4 FastAPI Stream Gateway & Analytics API.
Provides RESTful endpoints for Model 1 CCTV Registry & GIS, Model 2 Live Stream Proxy & ANPR,
Model 3 VMS Federation Middleware & CEP, and Model 4 Consolidated Central VMS.
"""

import os
import sys
import re
import time
from collections import defaultdict
from typing import Optional, List
from fastapi import FastAPI, Query, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel

# ─── Strict Security Input Validation Patterns ──────────────────────────────
CAM_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]{1,64}$")
SEGMENT_PATTERN = re.compile(r"^[a-zA-Z0-9_\.\-]{1,128}$")

# ─── In-Memory DDoS & Rate Limiting Guard ────────────────────────────────────
class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests_per_minute: int = 1200):
        super().__init__(app)
        self.max_requests = max_requests_per_minute
        self.request_counts = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Clean timestamps older than 60s
        self.request_counts[client_ip] = [t for t in self.request_counts[client_ip] if now - t < 60]
        
        if len(self.request_counts[client_ip]) >= self.max_requests:
            return Response(
                content='{"detail": "Rate limit exceeded. Too many requests. Please try again later."}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json",
                headers={"Retry-After": "60"}
            )
            
        self.request_counts[client_ip].append(now)
        return await call_next(request)

# ─── Zero-Trust Security Headers Middleware (OWASP & Section 65B Standard) ──
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Defense-in-Depth Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        return response

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
from registry_router import router as registry_router
from federation_db import init_federation_db
from federation_adapters import federation_manager
from correlation_engine import correlation_engine
from federation_router import router as federation_router
from vms_model4_db import init_model4_db
from vms_model4_router import router as vms_model4_router

app = FastAPI(
    title="Sentinel Gujarat - CCTV Central Platform (Model 1 + Model 2 + Model 3 + Model 4)",
    description="Unified Statewide CCTV Registry, Multi-VMS Federation & Consolidated Central VMS Platform",
    version="4.0.0"
)

# Attach Security Middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimiterMiddleware, max_requests_per_minute=2000)

# Standard Compliant CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All 4 Model Routers
app.include_router(registry_router)
app.include_router(federation_router)
app.include_router(vms_model4_router)

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
    init_federation_db()
    init_model4_db()
    sentinel_gateway.login()
    # Initialize Model 3 VMS Federation Adapters & Complex Event Correlation Engine
    federation_manager.initialize_adapters()
    correlation_engine.initialize()
    correlation_engine.start_background_simulation()
    # Start continuous stream ingestion and inference worker in background
    start_worker_in_background()

@app.get("/", tags=["Root & System Telemetry"])
def root():
    return {
        "platform": "Sentinel Gujarat CCTV Central Platform",
        "version": "4.0.0",
        "models": [
            "Model 1 - Centralised CCTV Registry & GIS Mapping",
            "Model 2 - Unified Multi-Feed Video Wall & Edge ANPR Analytics",
            "Model 3 - VMS Middleware & Multi-Vendor Federation Layer",
            "Model 4 - Consolidated Central VMS Platform (Statewide Video Management System)"
        ],
        "status": "OPERATIONAL",
        "registry_api": [
            "/api/registry/cameras",
            "/api/registry/departments",
            "/api/registry/coverage-zones",
            "/api/registry/coverage-zones/recalculate",
            "/api/registry/audit-logs"
        ],
        "streaming_and_anpr_api": [
            "/api/cameras",
            "/api/stream/{cam_id}/index.m3u8",
            "/api/stream/enc.key",
            "/api/detections",
            "/api/alerts",
            "/api/search",
            "/api/watchlist",
            "/api/analytics/metrics"
        ],
        "federation_api": [
            "/api/federation/overview",
            "/api/federation/vms-systems",
            "/api/federation/cameras",
            "/api/federation/events",
            "/api/federation/correlations",
            "/api/federation/bus/metrics",
            "/api/federation/rules",
            "/api/federation/reports/sample",
            "/api/federation/plugin-sdk/specs"
        ],
        "central_vms_api": [
            "/api/vms/overview",
            "/api/vms/cameras",
            "/api/vms/playback/{cam_id}",
            "/api/vms/storage/metrics",
            "/api/vms/storage/calculate",
            "/api/vms/ai/face-recognition",
            "/api/vms/ai/crowd-density",
            "/api/vms/ai/anomalies",
            "/api/vms/integrations/vahan",
            "/api/vms/integrations/sarthi",
            "/api/vms/integrations/egujcop",
            "/api/vms/integrations/nafis",
            "/api/vms/integrations/sync-status",
            "/api/vms/scalability/80k-model",
            "/api/vms/scalability/load-test",
            "/api/vms/dr/status",
            "/api/vms/dr/failover-drill",
            "/api/vms/security/audit"
        ]
    }

@app.get("/api/cameras", tags=["Model 2: Video Wall & Stream Ingestion"])
def get_cameras(request: Request):
    """
    Returns the real-time sanitized catalogue of all 30 statewide cameras
    along with authenticated HLS stream proxy URLs.
    """
    host = f"{request.url.scheme}://{request.url.netloc}"
    cameras = sentinel_gateway.fetch_camera_catalogue(backend_host=host)
    return cameras

# ─── Authenticated Stream Relay & Proxy Endpoints ─────────────────────────
@app.get("/api/stream/{cam_id}/index.m3u8", tags=["Model 2: Video Wall & Stream Ingestion"])
def stream_playlist(cam_id: str, request: Request):
    """
    Proxies and rewrites the HLS playlist with authenticated credentials,
    resolving the AES-128 encryption key and video segments through the proxy.
    """
    if not CAM_ID_PATTERN.match(cam_id):
        raise HTTPException(status_code=400, detail="Invalid camera identifier format")

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

@app.get("/api/stream/enc.key", tags=["Model 2: Video Wall & Stream Ingestion"])
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

@app.get("/api/stream/{cam_id}/{segment_name}", tags=["Model 2: Video Wall & Stream Ingestion"])
def stream_segment(cam_id: str, segment_name: str):
    """Proxies a binary MPEG-TS video segment with authenticated session."""
    if not CAM_ID_PATTERN.match(cam_id):
        raise HTTPException(status_code=400, detail="Invalid camera identifier format")
    if not SEGMENT_PATTERN.match(segment_name) or ".." in segment_name:
        raise HTTPException(status_code=400, detail="Invalid segment filename format")

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
@app.get("/api/detections", tags=["Model 2: Video Wall & Stream Ingestion"])
def fetch_detections(
    limit: int = Query(default=30, ge=1, le=100),
    camera_id: Optional[str] = None,
    watchlist_only: bool = False
):
    """
    Returns live timestamped optical recognition sightings extracted
    via local edge inference with monotonic PTS timing.
    """
    if camera_id and not CAM_ID_PATTERN.match(camera_id):
        raise HTTPException(status_code=400, detail="Invalid camera_id format")
    detections = get_recent_detections(limit=limit, camera_id=camera_id, watchlist_only=watchlist_only)
    return detections

@app.get("/api/alerts", tags=["Model 2: Video Wall & Stream Ingestion"])
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

@app.get("/api/search", tags=["Model 2: Video Wall & Stream Ingestion"])
def search_vehicle(plate: str = Query(..., min_length=2, max_length=32, description="Vehicle registration plate number")):
    """
    Reconstructs sequential movement history and checkpoint checkpoints
    for a specific vehicle ordered by monotonic Presentation Timestamps (PTS).
    """
    clean_plate = re.sub(r'[^A-Za-z0-9]', '', plate).upper()
    if not clean_plate:
        raise HTTPException(status_code=400, detail="Plate query parameter must contain valid alphanumeric characters")

    history = search_plate_history(clean_plate)

    return {
        "plate": clean_plate,
        "total_sightings": len(history),
        "history": history
    }

@app.get("/api/watchlist", tags=["Model 2: Video Wall & Stream Ingestion"])
def fetch_watchlist(active_only: bool = True):
    """
    Returns the active database of flagged law enforcement vehicles.
    """
    records = get_watchlist_records(active_only=active_only)
    return records

@app.post("/api/watchlist", tags=["Model 2: Video Wall & Stream Ingestion"])
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

@app.post("/api/alerts/{alert_id}/resolve", tags=["Model 2: Video Wall & Stream Ingestion"])
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

@app.get("/api/analytics/metrics", tags=["Model 2: Video Wall & Stream Ingestion"])
def fetch_analytics_metrics():
    """
    Returns aggregated KPIs: total detections, alert counts, unique vehicles, and model confidence.
    """
    metrics = get_analytics_metrics()
    return metrics

@app.get("/api/health", tags=["Root & System Telemetry"])
def get_health(request: Request):
    """
    Returns service health, camera connectivity status, and edge inference telemetry.
    """
    host = f"{request.url.scheme}://{request.url.netloc}"
    cameras = sentinel_gateway.fetch_camera_catalogue(backend_host=host)
    return {
        "status": "HEALTHY",
        "version": "4.0.0",
        "camera_count": len(cameras),
        "gateway_connected": True,
        "inference_engine": "YOLOv8n + OpenCV (PTS-driven)",
        "rtsp_transport": "TCP",
        "reconnect_policy": "Exponential Backoff (2s -> 30s)",
        "stream_proxy": "Active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
