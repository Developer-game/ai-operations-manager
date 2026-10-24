from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
from app.models.autopilot import (
    CreateEventRequest,
    UpdatePhaseRequest,
    DropoutRequest,
    ApprovalActionRequest,
    SettingsUpdateRequest,
)
from app.db.database import (
    db_list_events,
    db_update_asset,
    db_save_asset
)
from app.services.event_operations import event_ops_manager
from app.services.gemma_service import gemma_service

router = APIRouter(prefix="/api", tags=["Campus Society Autopilot"])

@router.get("/events")
def list_events():
    return db_list_events()

@router.post("/events")
def create_event(req: CreateEventRequest):
    try:
        event_dict = req.model_dump()
        volunteers_data = [v.model_dump() for v in req.volunteers]
        event_id = event_ops_manager.create_custom_event(event_dict, volunteers_data)
        state = event_ops_manager.get_event_state(event_id)
        return {"event_id": event_id, "state": state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events/{event_id}")
def get_event(event_id: str):
    state = event_ops_manager.get_event_state(event_id)
    if not state:
        raise HTTPException(status_code=404, detail="Event not found")
    return state

@router.post("/events/{event_id}/phase")
def update_phase(event_id: str, req: UpdatePhaseRequest):
    try:
        event_ops_manager.set_event_phase(event_id, req.phase.value)
        return event_ops_manager.get_event_state(event_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/events/{event_id}/tasks/{task_id}")
def update_task(event_id: str, task_id: str, payload: Dict[str, Any] = Body(...)):
    status = payload.get("status")
    assignee_id = payload.get("assignee_id")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    try:
        event_ops_manager.update_task_status(event_id, task_id, status, assignee_id)
        return event_ops_manager.get_event_state(event_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/{event_id}/assets/{asset_id}")
def update_asset(event_id: str, asset_id: str, payload: Dict[str, Any] = Body(...)):
    try:
        db_update_asset(asset_id, payload)
        return event_ops_manager.get_event_state(event_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/{event_id}/approvals/{approval_id}")
def process_approval(event_id: str, approval_id: str, req: ApprovalActionRequest):
    try:
        event_ops_manager.process_approval(event_id, approval_id, req.status.value)
        return event_ops_manager.get_event_state(event_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Simulation Triggers (Hackathon Pitch Controls)
@router.post("/events/{event_id}/simulation/dropout")
def simulate_volunteer_dropout(event_id: str, req: DropoutRequest):
    try:
        result = event_ops_manager.handle_dropout_simulation(event_id, req.volunteer_id, req.reason)
        return {
            "result": result,
            "state": event_ops_manager.get_event_state(event_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/{event_id}/simulation/missing-video")
def simulate_missing_video(event_id: str):
    try:
        result = event_ops_manager.handle_missing_video_simulation(event_id)
        return {
            "result": result,
            "state": event_ops_manager.get_event_state(event_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events/{event_id}/report")
def get_retrospective_report(event_id: str):
    try:
        report_markdown = event_ops_manager.generate_retrospective(event_id)
        return {"report": report_markdown}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Model & Settings Configuration
@router.get("/settings")
def get_settings():
    return gemma_service.get_status()

@router.post("/settings")
def update_settings(req: SettingsUpdateRequest):
    gemma_service.update_settings(api_key=req.api_key, model=req.gemma_model)
    return gemma_service.get_status()
