from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import Incident, OpsAgent, SystemMetric
from app.services.ops_manager import ops_service

router = APIRouter(prefix="/api", tags=["Operations"])

@router.get("/metrics", response_model=List[SystemMetric])
def list_metrics():
    return ops_service.get_metrics()

@router.get("/incidents", response_model=List[Incident])
def list_incidents():
    return ops_service.get_incidents()

@router.get("/agents", response_model=List[OpsAgent])
def list_agents():
    return ops_service.get_agents()

@router.post("/incidents/{incident_id}/triage", response_model=Incident)
def trigger_incident_triage(incident_id: str):
    try:
        return ops_service.trigger_triage(incident_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/incidents/{incident_id}/remediate", response_model=Incident)
def trigger_incident_remediation(incident_id: str):
    try:
        return ops_service.trigger_remediation(incident_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
