"""
Complex Event Processing (CEP) & Cross-System Event Correlation Engine for Model 3.
Evaluates multi-department spatial-temporal event patterns across disparate VMS platforms,
constructs interactive correlation graphs, and raises unified incident alerts.
"""

import asyncio
import json
import logging
import random
import threading
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from metadata_bus import metadata_bus
from federation_db import (
    get_all_correlation_rules,
    insert_correlated_incident,
    get_all_correlated_incidents
)

logger = logging.getLogger("correlation_engine")

class EventCorrelationEngine:
    """
    Stateful CEP Engine monitoring sliding multi-VMS event windows
    and triggering automated cross-jurisdiction incident correlations.
    """
    def __init__(self):
        self.sliding_window: List[Dict[str, Any]] = []
        self.max_window_size = 150
        self.rules_cache: List[Dict[str, Any]] = []
        self.running = False
        self._thread: Optional[threading.Thread] = None

    def initialize(self):
        """Registers listener on the metadata bus and loads active rules."""
        self.rules_cache = get_all_correlation_rules()
        metadata_bus.subscribe("vms.events.all", self.on_event_received)
        logger.info(f"Event Correlation Engine initialized with {len(self.rules_cache)} active CEP rules")

    def on_event_received(self, event: Dict[str, Any]):
        """Processes an incoming normalized event from any connected VMS platform."""
        self.sliding_window.insert(0, event)
        if len(self.sliding_window) > self.max_window_size:
            self.sliding_window.pop()

        self.evaluate_sliding_window(event)

    def evaluate_sliding_window(self, new_event: Dict[str, Any]):
        """Runs rule evaluation against the current multi-VMS event buffer."""
        event_type = new_event.get("eventType")

        for rule in self.rules_cache:
            if not rule.get("isActive", True):
                continue

            if rule["primaryTriggerType"] == event_type:
                match = self._check_rule_match(rule, new_event)
                if match:
                    logger.info(f"⚡ [CEP MATCH] Triggered {rule['ruleCode']}: {rule['name']}")

    def _check_rule_match(self, rule: Dict[str, Any], trigger_event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Checks temporal, spatial, and cross-VMS constraints for a specific rule."""
        rule_code = rule["ruleCode"]
        time_window_sec = rule["maxTimeWindowSeconds"]
        trigger_time = datetime.fromisoformat(trigger_event["timestamp"].replace("Z", "+00:00"))

        # Look for matching secondary events within the time window from DIFFERENT VMS platforms
        candidate_events = []
        for ev in self.sliding_window:
            if ev["eventId"] == trigger_event["eventId"]:
                continue

            ev_time = datetime.fromisoformat(ev["timestamp"].replace("Z", "+00:00"))
            time_diff = abs((trigger_time - ev_time).total_seconds())

            if time_diff <= time_window_sec:
                # RULE-01 / RULE-04: Match by plate number across disparate VMS
                if rule_code in ("RULE-01", "RULE-04"):
                    trig_plate = trigger_event.get("payload", {}).get("plateNumber")
                    ev_plate = ev.get("payload", {}).get("plateNumber")
                    if trig_plate and ev_plate and trig_plate == ev_plate and ev["sourceVmsId"] != trigger_event["sourceVmsId"]:
                        candidate_events.append(ev)

                # RULE-02: Fire/Hazard near congestion
                elif rule_code == "RULE-02":
                    if ev["eventType"] in rule.get("secondaryTriggerTypes", []) and ev["district"] == trigger_event["district"]:
                        candidate_events.append(ev)

                # RULE-03: Perimeter breach followed by vehicle movement
                elif rule_code == "RULE-03":
                    if ev["eventType"] in rule.get("secondaryTriggerTypes", []) and ev["sourceVmsId"] != trigger_event["sourceVmsId"]:
                        candidate_events.append(ev)

        if candidate_events:
            return self._build_and_persist_incident(rule, trigger_event, candidate_events[0])
        return None

    def _build_and_persist_incident(
        self,
        rule: Dict[str, Any],
        ev1: Dict[str, Any],
        ev2: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Constructs a rich Correlated Incident with graph nodes, edges, and SOP recommendations."""
        incident_code = f"CORR-2026-{random.randint(100, 999)}"
        involved_vms_ids = list(set([ev1["sourceVmsId"], ev2["sourceVmsId"]]))
        involved_vendors = list(set([ev1["sourceVmsVendor"], ev2["sourceVmsVendor"]]))
        involved_cameras = list(set([ev1["cameraId"], ev2["cameraId"]]))

        target_plate = ev1.get("payload", {}).get("plateNumber") or ev2.get("payload", {}).get("plateNumber") or "CORRIDOR-TARGET"

        # Construct Graph Data for visualizer
        nodes = [
            {"id": "node-t1", "type": "EVENT", "label": f"{ev1['eventType']} ({ev1['cameraName']})", "vmsVendor": ev1["sourceVmsVendor"], "department": ev1["departmentName"], "timestamp": ev1["timestamp"]},
            {"id": "node-c1", "type": "CAMERA", "label": f"Cam {ev1['cameraId']} - {ev1['location']}", "vmsVendor": ev1["sourceVmsVendor"], "department": ev1["departmentName"]},
            {"id": "node-tgt", "type": "TARGET", "label": f"Target: {target_plate}", "details": {"plate": target_plate, "severity": rule["severity"]}},
            {"id": "node-c2", "type": "CAMERA", "label": f"Cam {ev2['cameraId']} - {ev2['location']}", "vmsVendor": ev2["sourceVmsVendor"], "department": ev2["departmentName"]},
            {"id": "node-t2", "type": "EVENT", "label": f"{ev2['eventType']} ({ev2['cameraName']})", "vmsVendor": ev2["sourceVmsVendor"], "department": ev2["departmentName"], "timestamp": ev2["timestamp"]}
        ]

        edges = [
            {"id": "edge-1", "source": "node-c1", "target": "node-t1", "label": "Source Sensor", "relationType": "SPATIAL_PROXIMITY", "confidence": 0.95, "timeDeltaSeconds": 0},
            {"id": "edge-2", "source": "node-t1", "target": "node-tgt", "label": "Triggered Flag", "relationType": "IDENTITY_MATCH", "confidence": round(ev1.get("confidence", 0.92), 2), "timeDeltaSeconds": 0},
            {"id": "edge-3", "source": "node-tgt", "target": "node-t2", "label": "Sequential Path", "relationType": "TEMPORAL_SEQUENCE", "confidence": 0.94, "timeDeltaSeconds": 360},
            {"id": "edge-4", "source": "node-c2", "target": "node-t2", "label": "Downstream Intercept", "relationType": "SPATIAL_PROXIMITY", "confidence": 0.96, "timeDeltaSeconds": 0}
        ]

        incident_data = {
            "incidentCode": incident_code,
            "ruleId": rule["id"],
            "ruleCode": rule["ruleCode"],
            "ruleName": rule["name"],
            "title": f"Correlated Alert: {target_plate} across {ev1['sourceVmsVendor']} & {ev2['sourceVmsVendor']}",
            "description": f"Multi-system correlation detected: {ev1['eventType']} in {ev1['departmentName']} ({ev1['sourceVmsName']}) followed by {ev2['eventType']} in {ev2['departmentName']} ({ev2['sourceVmsName']}).",
            "severity": rule["severity"],
            "status": "OPEN",
            "leadDepartment": ev1["departmentName"],
            "involvedVmsIds": involved_vms_ids,
            "involvedVendors": involved_vendors,
            "involvedCameras": involved_cameras,
            "triggerEvents": [ev1, ev2],
            "correlationScore": round(random.uniform(0.91, 0.98), 2),
            "timeWindowSeconds": rule["maxTimeWindowSeconds"],
            "firstEventTimestamp": min(ev1["timestamp"], ev2["timestamp"]),
            "lastEventTimestamp": max(ev1["timestamp"], ev2["timestamp"]),
            "estimatedEtaMinutes": round(random.uniform(4.0, 9.5), 1),
            "recommendedAction": f"Alert {ev1['departmentName']} and dispatch quick response unit to {ev2['location']} checkpoint.",
            "dispatchedUnits": [f"PCR-{random.randint(10, 99)} ({ev1['district']})", f"Interceptor-{random.randint(1, 9)} ({ev2['district']})"],
            "graphData": {"nodes": nodes, "edges": edges},
            "createdAt": datetime.utcnow().isoformat()
        }

        try:
            insert_correlated_incident(incident_data)
            # Broadcast to alert topic
            metadata_bus.publish("vms.correlations.alerts", {
                "eventId": f"alert-{incident_code}",
                "sourceVmsId": "cep-federation-engine",
                "sourceVmsName": "Statewide CEP Correlation Engine",
                "sourceVmsVendor": "ONVIF_GENERIC",
                "departmentName": "Central Operations Hub",
                "district": ev1["district"],
                "cameraId": ev1["cameraId"],
                "cameraName": ev1["cameraName"],
                "location": ev1["location"],
                "eventType": "CROSS_JURISDICTION_BOLO",
                "severity": rule["severity"],
                "confidence": incident_data["correlationScore"],
                "ptsMs": 0.0,
                "timestamp": incident_data["createdAt"],
                "payload": {"incidentCode": incident_code, "ruleCode": rule["ruleCode"]}
            })
        except Exception as e:
            logger.error(f"Failed to persist correlated incident: {e}")

        return incident_data

    def start_background_simulation(self):
        """Starts a background loop that generates periodic cross-VMS test events."""
        if self.running:
            return
        self.running = True

        def loop():
            logger.info("Started background multi-VMS event emitter and CEP monitor")
            test_plates = ["GJ01AB1234", "GJ05CD5678", "GJ27K9901", "GJ18CX4521", "MH02AB1234", "RJ14GH8822"]
            sample_locations = [
                ("cam01", "01 Chiman bhai Bridge", "Chimanbhai Bridge, Ahmedabad", "Ahmedabad", "vms-traffic-hikcentral", "HIKVISION_HIKCENTRAL", "Traffic Police Department"),
                ("cam03", "03 O.N.G.C. Office", "ONGC Office Circle, Ahmedabad", "Ahmedabad", "vms-police-genetec", "GENETEC_SECURITY_CENTER", "Gujarat State Police HQ"),
                ("cam12", "12 Tri Mandir Adalaj Tollnaka", "Tri Mandir Toll Plaza, Adalaj", "Gandhinagar", "vms-highways-dahua", "DAHUA_DSS", "State Highway Authority"),
                ("cam30", "30 Gandhidham Rambaugh p2", "Rambaugh P2, Gandhidham Port", "Kutch", "vms-port-milestone", "MILESTONE_XPROTECT", "Gujarat Maritime & Port Authority"),
                ("cam36", "36 Bilimora City Core", "Bilimora City Core, Navsari", "Navsari", "vms-municipal-hanwha", "HANWHA_WAVE", "Municipal Corporation & Urban Dev"),
            ]

            while self.running:
                try:
                    time.sleep(12)  # Emit an event every 12 seconds
                    cam_meta = random.choice(sample_locations)
                    plate = random.choice(test_plates)
                    event_types = ["ANPR_SIGHTING", "VEHICLE_SPEEDING", "PERIMETER_INTRUSION", "CROWD_SURGE", "WRONG_WAY_ENTRY"]
                    evt_type = random.choice(event_types)

                    speed = round(random.uniform(45.0, 98.5), 1)
                    now_iso = datetime.utcnow().isoformat()

                    event_envelope = {
                        "eventId": f"evt-live-{uuid.uuid4().hex[:8]}",
                        "sourceVmsId": cam_meta[4],
                        "sourceVmsName": f"{cam_meta[5]} Gateway",
                        "sourceVmsVendor": cam_meta[5],
                        "departmentName": cam_meta[6],
                        "district": cam_meta[3],
                        "cameraId": cam_meta[0],
                        "cameraName": cam_meta[1],
                        "location": cam_meta[2],
                        "eventType": evt_type,
                        "severity": "CRITICAL" if plate in ("GJ01AB1234", "GJ05CD5678") else "HIGH" if evt_type == "VEHICLE_SPEEDING" else "MEDIUM",
                        "confidence": round(random.uniform(0.88, 0.98), 2),
                        "ptsMs": round(time.time() * 1000 % 1000000, 1),
                        "timestamp": now_iso,
                        "payload": {
                            "plateNumber": plate,
                            "speedKmh": speed,
                            "speedLimit": 60,
                            "vehicleType": "CAR",
                            "watchlistHit": plate in ("GJ01AB1234", "GJ05CD5678", "GJ27K9901")
                        }
                    }

                    metadata_bus.publish("vms.events.all", event_envelope)
                except Exception as e:
                    logger.error(f"Error in CEP background emitter: {e}")
                    time.sleep(5)

        self._thread = threading.Thread(target=loop, daemon=True)
        self._thread.start()


correlation_engine = EventCorrelationEngine()
