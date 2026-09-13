"""
Model 1: Centralized CCTV Registry & GIS Mapping Platform Router.
Exposes RESTful endpoints for camera onboarding (manual + bulk), metadata updates,
spatial queries, department catalog, VDI coverage gap calculations, and security audit logs.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Body, status
from pydantic import BaseModel, Field

from database import (
    get_registry_cameras,
    get_registry_camera_by_id,
    create_registry_camera,
    update_registry_camera,
    delete_registry_camera,
    get_registry_departments,
    get_coverage_zones,
    recalculate_coverage_zones,
    get_audit_logs,
    record_audit_log
)

router = APIRouter(prefix="/api/registry", tags=["Model 1: Centralized CCTV Registry & GIS Platform"])

# ─── Pydantic Schema Models ──────────────────────────────────────────────────
class CameraCreateSchema(BaseModel):
    camera_id: str = Field(..., description="Unique government camera ID, e.g. GJ-AHM-POL-001")
    camera_name: str = Field(..., description="Human-readable camera location name")
    department_id: str = Field(..., description="UUID of the owning department node")
    department_name: Optional[str] = "Gujarat Police Surveillance"
    camera_type: str = Field("FIXED", description="FIXED, PTZ, ANPR, DOME, THERMAL")
    latitude: float = Field(..., description="WGS84 Latitude coordinate")
    longitude: float = Field(..., description="WGS84 Longitude coordinate")
    location_description: Optional[str] = ""
    ward: Optional[str] = ""
    zone: Optional[str] = ""
    district: str = Field(..., description="Gujarat District")
    status: str = Field("ACTIVE", description="ACTIVE, INACTIVE, MAINTENANCE, DECOMMISSIONED")
    ip_address: Optional[str] = "10.120.40.1"
    mac_address: Optional[str] = "00:1A:2B:3C:4D:5E"
    rtsp_url: Optional[str] = ""
    resolution: Optional[str] = "1080p"
    fps: Optional[int] = 25
    storage_retention_days: Optional[int] = 30
    installation_date: Optional[str] = None
    last_maintenance_date: Optional[str] = None

class CameraUpdateSchema(BaseModel):
    camera_name: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    camera_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_description: Optional[str] = None
    ward: Optional[str] = None
    zone: Optional[str] = None
    district: Optional[str] = None
    status: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    rtsp_url: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[int] = None
    storage_retention_days: Optional[int] = None
    last_maintenance_date: Optional[str] = None

class BulkCameraImportSchema(BaseModel):
    cameras: List[CameraCreateSchema]

# ─── Endpoints ───────────────────────────────────────────────────────────────
@router.get("/cameras", summary="List Onboarded CCTV Cameras")
def list_cameras(
    district: Optional[str] = Query(None, description="Filter by Gujarat District"),
    department_id: Optional[str] = Query(None, description="Filter by Department ID"),
    status: Optional[str] = Query(None, description="Filter by Status (ACTIVE, INACTIVE, MAINTENANCE)"),
    search: Optional[str] = Query(None, description="Text search by name, code, or location")
):
    """
    Returns filtered camera metadata assets across Gujarat for GIS mapping,
    gap analysis, and statewide inventory management.
    """
    return get_registry_cameras(district=district, department_id=department_id, status=status, search=search)

@router.get("/cameras/{camera_id}", summary="Get Camera Metadata by ID")
def get_camera(camera_id: str):
    """Fetches detailed technical telemetry and location metadata for a single camera asset."""
    cam = get_registry_camera_by_id(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail=f"Camera with identifier '{camera_id}' not found")
    return cam

@router.post("/cameras", status_code=status.HTTP_201_CREATED, summary="Onboard Single Camera Asset")
def create_camera(payload: CameraCreateSchema):
    """
    Registers a new CCTV camera asset into the State Central Registry with
    geospatial coordinates (WGS84) and technical specifications.
    """
    existing = get_registry_camera_by_id(payload.camera_id)
    if existing:
        raise HTTPException(status_code=409, detail=f"Camera with ID '{payload.camera_id}' already registered")

    cam = create_registry_camera(payload.dict())
    return cam

@router.post("/cameras/bulk", status_code=status.HTTP_201_CREATED, summary="Bulk Onboard Cameras (CSV/JSON)")
def bulk_create_cameras(payload: BulkCameraImportSchema):
    """
    Bulk onboards up to 5,000 CCTV cameras with automated spatial validation
    and audit logging.
    """
    created = []
    skipped = []
    for item in payload.cameras:
        existing = get_registry_camera_by_id(item.camera_id)
        if existing:
            skipped.append(item.camera_id)
            continue
        c = create_registry_camera(item.dict())
        created.append(c)

    record_audit_log(
        actor_id="user_admin",
        actor_name="State Officer",
        actor_role="STATE_ADMIN",
        action="BULK_IMPORT_CAMERAS",
        target_entity="registry_cameras",
        target_id=f"batch_{len(created)}",
        metadata_diff={"imported_count": len(created), "skipped_count": len(skipped)}
    )

    return {
        "status": "SUCCESS",
        "imported_count": len(created),
        "skipped_count": len(skipped),
        "cameras": created
    }

@router.put("/cameras/{camera_id}", summary="Update Camera Asset Metadata")
def update_camera(camera_id: str, payload: CameraUpdateSchema):
    """Updates operational status, maintenance date, or streaming configuration."""
    existing = get_registry_camera_by_id(camera_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found")

    updated = update_registry_camera(camera_id, payload.dict(exclude_unset=True))
    return updated

@router.delete("/cameras/{camera_id}", summary="Decommission Camera Asset")
def delete_camera(camera_id: str):
    """Removes a camera asset from the active registry and logs an immutable audit event."""
    success = delete_registry_camera(camera_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found or already deleted")
    return {"status": "SUCCESS", "message": f"Camera '{camera_id}' successfully decommissioned"}

@router.get("/departments", summary="List Department Surveillance Nodes")
def list_departments():
    """Returns the list of participating government and municipal departments."""
    return get_registry_departments()

@router.get("/coverage-zones", summary="Fetch VDI Spatial Coverage Zones")
def list_coverage_zones():
    """
    Returns spatial wards and calculated Vulnerability Deficit Index (VDI) metrics
    to identify surveillance blind spots and infrastructure deficit tiers.
    """
    return get_coverage_zones()

@router.post("/coverage-zones/recalculate", summary="Recalculate VDI Spatial Gaps")
def recalculate_gaps():
    """Recalculates VDI values dynamically based on current live camera distribution."""
    return recalculate_coverage_zones()

@router.get("/audit-logs", summary="Fetch Security & Onboarding Audit Trail")
def list_audit_logs(limit: int = Query(50, ge=1, le=200)):
    """Returns tamper-evident audit logs of all registration and configuration actions."""
    return get_audit_logs(limit=limit)
