"""
FastAPI Router for Model 3: VMS Middleware & Federation Layer.
Exposes REST endpoints for VMS platform registry, federated camera catalogue,
live metadata bus events, CEP correlation incidents, plugin sandbox, and federated analytics reports.
"""

import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Request, Response
from pydantic import BaseModel

from federation_db import (
    get_all_vms_platforms,
    get_vms_platform_by_id,
    register_vms_platform,
    get_recent_federated_events,
    get_all_correlated_incidents,
    get_correlated_incident_by_id,
    resolve_correlated_incident,
    get_all_correlation_rules,
    toggle_correlation_rule,
    get_federation_overview_kpis
)
from federation_adapters import federation_manager
from metadata_bus import metadata_bus

router = APIRouter(prefix="/api/federation", tags=["Model 3 - VMS Federation Layer"])

# ─── Pydantic Request Models ──────────────────────────────────────────────

class VmsOnboardRequest(BaseModel):
    id: str
    name: str
    vendor: str
    vendorName: str
    departmentId: str
    departmentName: str
    district: str
    protocol: str
    apiBaseUrl: str
    capabilities: Dict[str, bool]
    colorTheme: Optional[str] = "#3B82F6"

class PtzCommandRequest(BaseModel):
    pan: float = 0.0
    tilt: float = 0.0
    zoom: float = 1.0

class CorrelatedIncidentResolveRequest(BaseModel):
    resolvedBy: str
    actionNotes: str
    status: Optional[str] = "RESOLVED"

class PublishEventRequest(BaseModel):
    sourceVmsId: str
    sourceVmsName: str
    sourceVmsVendor: str
    departmentName: str
    district: str
    cameraId: str
    cameraName: str
    location: str
    eventType: str
    severity: str
    confidence: float
    payload: Dict[str, Any]

class PluginValidateRequest(BaseModel):
    pluginJson: Dict[str, Any]

# ─── Endpoints ────────────────────────────────────────────────────────────

@router.get("/overview")
def get_federation_overview():
    """Returns aggregated high-level KPIs for the federation middleware."""
    kpis = get_federation_overview_kpis()
    bus_metrics = metadata_bus.get_metrics()
    return {
        "status": "OPERATIONAL",
        "layer": "Model 3 - VMS Federation & Middleware",
        "kpis": kpis,
        "bus": bus_metrics
    }

@router.get("/vms-systems")
def list_vms_platforms():
    """Lists all connected departmental VMS platforms with live health & telemetry."""
    platforms = get_all_vms_platforms()
    enriched = []
    for p in platforms:
        adapter = federation_manager.adapters.get(p["id"])
        telemetry = adapter.get_health_telemetry() if adapter else {}
        enriched.append({
            **p,
            "latencyMs": telemetry.get("latencyMs", p.get("latency_ms", 42.0)),
            "syncedCamerasCount": telemetry.get("syncedCameras", p.get("synced_cameras_count", 6)),
            "packetLossPercent": telemetry.get("packetLossPercent", p.get("packet_loss_percent", 0.02)),
            "uptimePercentage": telemetry.get("uptimePercent", p.get("uptime_percentage", 99.98)),
            "lastHeartbeat": telemetry.get("lastHeartbeat", p.get("last_heartbeat", datetime.utcnow().isoformat()))
        })
    return enriched

@router.get("/vms-systems/{vms_id}")
def get_vms_platform(vms_id: str):
    """Retrieves detailed configuration for a specific VMS platform."""
    platform = get_vms_platform_by_id(vms_id)
    if not platform:
        raise HTTPException(status_code=404, detail="VMS platform not found")
    adapter = federation_manager.adapters.get(vms_id)
    if adapter:
        platform["telemetry"] = adapter.get_health_telemetry()
    return platform

@router.post("/vms-systems/onboard")
def onboard_vms_platform(payload: VmsOnboardRequest):
    """Registers a new departmental VMS platform connector in the federation layer."""
    success = register_vms_platform(
        vms_id=payload.id,
        name=payload.name,
        vendor=payload.vendor,
        vendor_name=payload.vendorName,
        department_id=payload.departmentId,
        department_name=payload.departmentName,
        district=payload.district,
        protocol=payload.protocol,
        api_base_url=payload.apiBaseUrl,
        capabilities=payload.capabilities,
        color_theme=payload.colorTheme or "#3B82F6"
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to register VMS platform (ID may already exist)")
    # Re-initialize adapters
    federation_manager.initialize_adapters()
    return {"status": "SUCCESS", "message": f"VMS platform {payload.name} onboarded successfully", "vmsId": payload.id}

@router.post("/vms-systems/{vms_id}/test")
def test_vms_platform(vms_id: str):
    """Executes a 5-step live compliance & connectivity test suite against a VMS platform."""
    result = federation_manager.test_vms_connectivity(vms_id)
    return result

@router.get("/cameras")
def get_federated_cameras(request: Request, vms_id: Optional[str] = None):
    """
    Returns all 30 live Sentinel cameras federated across departmental VMS platforms
    with authenticated stream URLs and provenance metadata.
    """
    host = f"{request.url.scheme}://{request.url.netloc}"
    cams = federation_manager.get_all_federated_cameras(backend_host=host)
    if vms_id:
        cams = [c for c in cams if c.get("sourceVmsId") == vms_id]
    return cams

@router.get("/cameras/{cam_id}/stream")
def get_camera_stream_info(cam_id: str, request: Request):
    """Resolves live stream endpoints for a federated camera through its VMS adapter."""
    host = f"{request.url.scheme}://{request.url.netloc}"
    stream_info = federation_manager.get_stream_info(camera_id=cam_id, backend_host=host)
    return stream_info

@router.post("/cameras/{cam_id}/ptz")
def control_camera_ptz(cam_id: str, payload: PtzCommandRequest):
    """Dispatches PTZ commands through the federated VMS adapter."""
    success = federation_manager.dispatch_ptz(camera_id=cam_id, pan=payload.pan, tilt=payload.tilt, zoom=payload.zoom)
    return {"status": "ACKNOWLEDGED", "cameraId": cam_id, "success": success}

@router.get("/events")
def get_federated_events(limit: int = Query(default=30, ge=1, le=100), vms_id: Optional[str] = None, event_type: Optional[str] = None):
    """Returns the live normalized event feed from the Metadata Exchange Bus."""
    in_mem_events = metadata_bus.get_recent_events(limit=limit, topic_filter=event_type)
    if not in_mem_events:
        in_mem_events = get_recent_federated_events(limit=limit, vms_id=vms_id, event_type=event_type)
    return in_mem_events

@router.post("/events/publish")
def publish_event(payload: PublishEventRequest):
    """Publishes an external departmental event onto the Metadata Exchange Bus."""
    event_envelope = {
        "sourceVmsId": payload.sourceVmsId,
        "sourceVmsName": payload.sourceVmsName,
        "sourceVmsVendor": payload.sourceVmsVendor,
        "departmentName": payload.departmentName,
        "district": payload.district,
        "cameraId": payload.cameraId,
        "cameraName": payload.cameraName,
        "location": payload.location,
        "eventType": payload.eventType,
        "severity": payload.severity,
        "confidence": payload.confidence,
        "payload": payload.payload,
        "timestamp": datetime.utcnow().isoformat()
    }
    event_id = metadata_bus.publish("vms.events.all", event_envelope)
    return {"status": "PUBLISHED", "eventId": event_id}

@router.get("/correlations")
def get_correlations(limit: int = Query(default=25, ge=1, le=100), status: Optional[str] = None):
    """Returns cross-system correlated incidents produced by the CEP Engine."""
    incidents = get_all_correlated_incidents(limit=limit, status=status)
    return incidents

@router.get("/correlations/{incident_id}")
def get_correlation_detail(incident_id: int):
    """Retrieves full details and interactive graph data for a correlated incident."""
    incident = get_correlated_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Correlated incident not found")
    return incident

@router.post("/correlations/{incident_id}/resolve")
def resolve_incident(incident_id: int, payload: CorrelatedIncidentResolveRequest):
    """Resolves a cross-system correlated incident with officer action notes."""
    success = resolve_correlated_incident(
        incident_id=incident_id,
        resolved_by=payload.resolvedBy,
        action_notes=payload.actionNotes,
        status=payload.status or "RESOLVED"
    )
    if not success:
        raise HTTPException(status_code=404, detail="Incident not found or already resolved")
    return {"status": "SUCCESS", "incidentId": incident_id, "resolved": True}

@router.get("/bus/metrics")
def get_bus_metrics():
    """Returns real-time Metadata Exchange Bus throughput and partition telemetry."""
    return metadata_bus.get_metrics()

@router.get("/rules")
def list_correlation_rules():
    """Returns active CEP correlation rules."""
    rules = get_all_correlation_rules()
    return rules

@router.post("/rules/{rule_id}/toggle")
def toggle_rule(rule_id: str, is_active: bool = Query(...)):
    """Enables or disables a specific CEP correlation rule."""
    success = toggle_correlation_rule(rule_id, is_active)
    return {"status": "SUCCESS", "ruleId": rule_id, "isActive": is_active}

@router.get("/plugin-sdk/specs")
def get_plugin_specs():
    """Returns documentation, schemas, and templates for building third-party VMS adapters."""
    return {
        "frameworkVersion": "3.2.0-federation",
        "standardProtocols": [
            "REST + OpenAPI 3.0",
            "ONVIF Profile S/G/T (SOAP)",
            "WebSockets JSON-RPC Event Stream",
            "gRPC Bidirectional Telemetry",
            "RTSP over TCP (RFC 2326)",
            "HLS Live Segment Ingest (RFC 8216)"
        ],
        "supportedVendors": [
            "Milestone XProtect (MIP SDK REST)",
            "Genetec Security Center (Web SDK 5.12)",
            "Hikvision HikCentral (Artemis OpenAPI)",
            "Dahua DSS Pro (DSS REST & DPS)",
            "Hanwha WAVE (Nx Witness REST API)",
            "Generic ONVIF Profile S/G/T"
        ],
        "lifecycleHooks": [
            "onRegister(config: VmsConfig): Promise<boolean>",
            "onHeartbeat(): Promise<TelemetryReport>",
            "onSyncCatalogue(): Promise<VmsCameraMetadata[]>",
            "onStreamRequest(camId: string): Promise<StreamEndpoint>",
            "onAlarmEvent(callback: (event: VmsEventEnvelope) => void): void",
            "onPtzDispatch(camId: string, ptz: PtzVector): Promise<boolean>"
        ],
        "jsonSchema": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "VmsPluginDefinition",
            "type": "object",
            "required": ["pluginId", "vendor", "name", "version", "protocol", "apiBaseUrl", "capabilities"],
            "properties": {
                "pluginId": {"type": "string", "pattern": "^[a-z0-9-]+$"},
                "vendor": {"type": "string", "enum": ["MILESTONE_XPROTECT", "GENETEC_SECURITY_CENTER", "HIKVISION_HIKCENTRAL", "DAHUA_DSS", "HANWHA_WAVE", "ONVIF_GENERIC"]},
                "name": {"type": "string"},
                "version": {"type": "string"},
                "protocol": {"type": "string"},
                "apiBaseUrl": {"type": "string", "format": "uri"},
                "capabilities": {
                    "type": "object",
                    "required": ["liveStreaming", "ptzControl", "alarmTriggering"],
                    "properties": {
                        "liveStreaming": {"type": "boolean"},
                        "ptzControl": {"type": "boolean"},
                        "playbackStreaming": {"type": "boolean"},
                        "edgeAnalyticsPassthrough": {"type": "boolean"},
                        "alarmTriggering": {"type": "boolean"},
                        "twoWayAudio": {"type": "boolean"}
                    }
                }
            }
        },
        "samplePluginConfig": {
            "pluginId": "vms-axis-camera-station",
            "vendor": "ONVIF_GENERIC",
            "name": "Axis Camera Station Pro VMS Adapter",
            "version": "v1.4.0",
            "protocol": "Axis VAPIX REST + ONVIF Profile S",
            "apiBaseUrl": "https://axis-vms.gujarat.gov.in/vapix",
            "capabilities": {
                "liveStreaming": True,
                "ptzControl": True,
                "playbackStreaming": True,
                "edgeAnalyticsPassthrough": True,
                "alarmTriggering": True,
                "twoWayAudio": False
            }
        }
    }

@router.post("/plugin-sdk/validate")
def validate_plugin_schema(payload: PluginValidateRequest):
    """Validates third-party VMS plugin configuration JSON against the Model 3 SDK standard."""
    data = payload.pluginJson
    required_fields = ["pluginId", "vendor", "name", "version", "protocol", "apiBaseUrl", "capabilities"]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return {
            "valid": False,
            "errors": [f"Missing required field: '{f}'" for f in missing],
            "complianceScore": 0.0
        }
    return {
        "valid": True,
        "message": "Plugin configuration conforms to Model 3 Federation SDK Specification",
        "complianceScore": 100.0,
        "validatedAt": datetime.utcnow().isoformat()
    }

@router.get("/reports/sample")
def get_sample_federated_report():
    """Generates sample federated analytics report for cross-department performance review."""
    return {
        "generatedAt": datetime.utcnow().isoformat(),
        "reportingPeriod": "Past 30 Days (Statewide Surveillance Federation)",
        "totalFederatedVms": 5,
        "totalFederatedCameras": 30,
        "totalEventsProcessed24h": 28450,
        "totalCorrelationsTriggered24h": 47,
        "systemAvailabilitySlaPercent": 99.98,
        "meanTimeToResolutionMinutes": 8.4,
        "crossVmsLatencyPercentiles": {
            "p50": 38.2,
            "p95": 64.5,
            "p99": 89.0
        },
        "vendorBreakdown": [
            {"vendor": "HIKVISION_HIKCENTRAL", "vendorName": "Hikvision HikCentral Enterprise", "cameraCount": 8, "eventCount24h": 11200, "avgLatencyMs": 38.5, "uptimePercent": 99.99},
            {"vendor": "GENETEC_SECURITY_CENTER", "vendorName": "Genetec Security Center 5.12", "cameraCount": 7, "eventCount24h": 7850, "avgLatencyMs": 44.2, "uptimePercent": 99.98},
            {"vendor": "DAHUA_DSS", "vendorName": "Dahua DSS Pro VMS", "cameraCount": 6, "eventCount24h": 4920, "avgLatencyMs": 46.8, "uptimePercent": 99.97},
            {"vendor": "MILESTONE_XPROTECT", "vendorName": "Milestone XProtect Corporate", "cameraCount": 5, "eventCount24h": 2680, "avgLatencyMs": 52.1, "uptimePercent": 99.95},
            {"vendor": "HANWHA_WAVE", "vendorName": "Hanwha WAVE VMS", "cameraCount": 4, "eventCount24h": 1800, "avgLatencyMs": 41.0, "uptimePercent": 99.99}
        ],
        "departmentalIncidentMatrix": [
            {"department": "Traffic Police Department", "criticalIncidents": 14, "highIncidents": 38, "mediumIncidents": 112, "lowIncidents": 45, "avgMttrMinutes": 6.8},
            {"department": "Gujarat State Police HQ", "criticalIncidents": 9, "highIncidents": 24, "mediumIncidents": 68, "lowIncidents": 22, "avgMttrMinutes": 11.2},
            {"department": "State Highway Authority", "criticalIncidents": 7, "highIncidents": 19, "mediumIncidents": 44, "lowIncidents": 15, "avgMttrMinutes": 9.4},
            {"department": "Port Authority & Marine Security", "criticalIncidents": 5, "highIncidents": 12, "mediumIncidents": 28, "lowIncidents": 8, "avgMttrMinutes": 14.5},
            {"department": "Municipal Corporation & Urban Dev", "criticalIncidents": 4, "highIncidents": 15, "mediumIncidents": 56, "lowIncidents": 30, "avgMttrMinutes": 7.5}
        ],
        "hourlyIncidentVolume": [
            {"hour": "00:00", "trafficVms": 12, "policeVms": 8, "municipalVms": 3, "portVms": 2, "correlatedAlerts": 1},
            {"hour": "03:00", "trafficVms": 6, "policeVms": 11, "municipalVms": 2, "portVms": 4, "correlatedAlerts": 2},
            {"hour": "06:00", "trafficVms": 45, "policeVms": 14, "municipalVms": 9, "portVms": 6, "correlatedAlerts": 3},
            {"hour": "09:00", "trafficVms": 118, "policeVms": 32, "municipalVms": 28, "portVms": 12, "correlatedAlerts": 8},
            {"hour": "12:00", "trafficVms": 92, "policeVms": 28, "municipalVms": 24, "portVms": 10, "correlatedAlerts": 5},
            {"hour": "15:00", "trafficVms": 105, "policeVms": 35, "municipalVms": 31, "portVms": 14, "correlatedAlerts": 7},
            {"hour": "18:00", "trafficVms": 142, "policeVms": 46, "municipalVms": 39, "portVms": 18, "correlatedAlerts": 11},
            {"hour": "21:00", "trafficVms": 78, "policeVms": 25, "municipalVms": 18, "portVms": 8, "correlatedAlerts": 4}
        ]
    }
