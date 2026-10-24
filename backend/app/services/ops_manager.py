from datetime import datetime, timezone
from typing import List
from app.models.schemas import Incident, SeverityLevel, IncidentStatus, OpsAgent, AgentStatus, SystemMetric, Runbook, RunbookStep

class OpsManagerService:
    def __init__(self):
        self._incidents: List[Incident] = [
            Incident(
                id="INC-1042",
                title="Elevated Latency on Payment Gateway API",
                service="payment-service",
                severity=SeverityLevel.HIGH,
                status=IncidentStatus.INVESTIGATING,
                detected_at=datetime.now(timezone.utc),
                root_cause="Connection pool exhaustion in Postgres read-replica",
                suggested_action="Scale DB read replicas & purge idle connection pools",
                ai_confidence=0.94
            ),
            Incident(
                id="INC-1043",
                title="Memory Spike in Inference Worker Cluster",
                service="ai-inference-engine",
                severity=SeverityLevel.CRITICAL,
                status=IncidentStatus.REMEDIATING,
                detected_at=datetime.now(timezone.utc),
                root_cause="KV Cache leak during long-context batch generation",
                suggested_action="Perform graceful worker pod rollout and recycle worker nodes",
                ai_confidence=0.98
            ),
            Incident(
                id="INC-1044",
                title="SSL Certificate Expiry Warning (< 7 Days)",
                service="edge-cdn",
                severity=SeverityLevel.MEDIUM,
                status=IncidentStatus.OPEN,
                detected_at=datetime.now(timezone.utc),
                root_cause="Automated Let's Encrypt cron renewal failed challenge",
                suggested_action="Trigger manual DNS-01 challenge renewal via Certbot",
                ai_confidence=0.99
            )
        ]
        
        self._agents: List[OpsAgent] = [
            OpsAgent(
                id="AGT-01",
                name="Triage-Sentinel",
                role="Log & Telemetry Anomaly Investigator",
                status=AgentStatus.ACTIVE,
                current_task="Analyzing log traces for payment-service",
                actions_count=1420,
                accuracy_rate=0.97
            ),
            OpsAgent(
                id="AGT-02",
                name="Remediation-Bot",
                role="Autonomous Runbook & Cloud Orchestrator",
                status=AgentStatus.ACTIVE,
                current_task="Rolling restart on inference-worker-pod-4",
                actions_count=874,
                accuracy_rate=0.99
            ),
            OpsAgent(
                id="AGT-03",
                name="Capacity-Planner",
                role="Predictive Resource Autoscaling",
                status=AgentStatus.IDLE,
                current_task=None,
                actions_count=320,
                accuracy_rate=0.96
            )
        ]

        self._metrics: List[SystemMetric] = [
            SystemMetric(name="Overall System Health", value=98.4, unit="%", status="healthy", change_pct=+0.6),
            SystemMetric(name="Active Incidents", value=3, unit="items", status="warning", change_pct=-25.0),
            SystemMetric(name="Mean Time to Resolution (MTTR)", value=4.2, unit="min", status="healthy", change_pct=-18.4),
            SystemMetric(name="Autonomous Action Rate", value=89.1, unit="%", status="healthy", change_pct=+5.2)
        ]

    def get_incidents(self) -> List[Incident]:
        return self._incidents

    def get_agents(self) -> List[OpsAgent]:
        return self._agents

    def get_metrics(self) -> List[SystemMetric]:
        return self._metrics

    def trigger_triage(self, incident_id: str) -> Incident:
        for incident in self._incidents:
            if incident.id == incident_id:
                incident.status = IncidentStatus.INVESTIGATING
                return incident
        raise ValueError(f"Incident {incident_id} not found")

    def trigger_remediation(self, incident_id: str) -> Incident:
        for incident in self._incidents:
            if incident.id == incident_id:
                incident.status = IncidentStatus.RESOLVED
                return incident
        raise ValueError(f"Incident {incident_id} not found")

ops_service = OpsManagerService()
