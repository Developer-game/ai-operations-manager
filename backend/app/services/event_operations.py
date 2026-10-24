import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.db.database import (
    init_db,
    db_save_event,
    db_get_event,
    db_list_events,
    db_update_event_phase,
    db_save_volunteer,
    db_get_volunteers,
    db_update_volunteer_status,
    db_save_task,
    db_get_tasks,
    db_update_task,
    db_save_asset,
    db_get_assets,
    db_update_asset,
    db_save_approval,
    db_get_approvals,
    db_update_approval,
    db_save_whatsapp_draft,
    db_get_whatsapp_drafts,
    db_update_whatsapp_status,
    db_add_audit_log,
    db_get_audit_logs,
)
from app.services.gemma_service import gemma_service

class EventOperationsManager:
    def __init__(self):
        init_db()
        self._ensure_initial_event()

    def _ensure_initial_event(self):
        events = db_list_events()
        if not events:
            # Seed the default authentic "Hands-on Arduino & IoT Workshop" event
            event_id = "EVT-ARDUINO-101"
            initial_event = {
                "id": event_id,
                "title": "Hands-on Arduino & IoT Workshop",
                "description": "Comprehensive practical workshop teaching 50 university students circuit design, sensor interfacing, and IoT cloud automation.",
                "category": "workshop",
                "date_str": "Saturday, Nov 15, 2026",
                "venue": "Campus Innovation Lab 304",
                "expected_audience": 50,
                "budget": "$350 (Arduino Kits + Refreshments)",
                "phase": "planning",
                "created_at": datetime.now().isoformat()
            }
            db_save_event(initial_event)

            # 5 Real Society Volunteer Roles
            initial_volunteers = [
                {
                    "id": "VOL-01",
                    "event_id": event_id,
                    "name": "Hamza Tariq",
                    "role": "Event Lead & Technical Host",
                    "phone": "+923001234567",
                    "email": "hamza.tariq@campus.edu",
                    "skills": ["Leadership", "Curriculum", "Arduino C++", "Public Speaking"],
                    "status": "available",
                    "max_capacity": 5
                },
                {
                    "id": "VOL-02",
                    "event_id": event_id,
                    "name": "Ayesha Khan",
                    "role": "Design & Creative Lead",
                    "phone": "+923019876543",
                    "email": "ayesha.k@campus.edu",
                    "skills": ["Figma", "Photoshop", "Social Media Graphics", "Brand Identity"],
                    "status": "available",
                    "max_capacity": 4
                },
                {
                    "id": "VOL-03",
                    "event_id": event_id,
                    "name": "Bilal Ahmed",
                    "role": "Media & Videography Lead",
                    "phone": "+923024567890",
                    "email": "bilal.media@campus.edu",
                    "skills": ["Cinematography", "Premiere Pro", "Gimbal Operation", "Audio Mixing"],
                    "status": "available",
                    "max_capacity": 4
                },
                {
                    "id": "VOL-04",
                    "event_id": event_id,
                    "name": "Zain Malik",
                    "role": "Logistics & Hardware Manager",
                    "phone": "+923035678901",
                    "email": "zain.logistics@campus.edu",
                    "skills": ["Hardware Inventory", "Soldering", "Lab Prep", "Vendor Sourcing"],
                    "status": "available",
                    "max_capacity": 5
                },
                {
                    "id": "VOL-05",
                    "event_id": event_id,
                    "name": "Fatima Noor",
                    "role": "Social Media & PR Manager",
                    "phone": "+923046789012",
                    "email": "fatima.pr@campus.edu",
                    "skills": ["WhatsApp Marketing", "Copywriting", "Student Relations", "Survey Design"],
                    "status": "available",
                    "max_capacity": 4
                }
            ]

            for v in initial_volunteers:
                db_save_volunteer(v)

            # Generate task graph using Gemma
            breakdown = gemma_service.generate_task_breakdown(initial_event, initial_volunteers)
            for t in breakdown.get("tasks", []):
                t["event_id"] = event_id
                db_save_task(t)

            for a in breakdown.get("required_assets", []):
                a["event_id"] = event_id
                db_save_asset(a)

            db_add_audit_log(event_id, "System initialized: Hands-on Arduino & IoT Workshop scaffolded with Gemma Multi-Agent Engine.")

    def create_custom_event(self, event_data: Dict[str, Any], volunteers_data: List[Dict[str, Any]]) -> str:
        event_id = f"EVT-{uuid.uuid4().hex[:6].upper()}"
        event_dict = {
            "id": event_id,
            "title": event_data.get("title", "New Society Event"),
            "description": event_data.get("description", ""),
            "category": event_data.get("category", "workshop"),
            "date_str": event_data.get("date_str", "Upcoming Date"),
            "venue": event_data.get("venue", "University Hall"),
            "expected_audience": int(event_data.get("expected_audience", 50)),
            "budget": event_data.get("budget", "$200"),
            "phase": "planning",
            "created_at": datetime.now().isoformat()
        }
        db_save_event(event_dict)

        saved_volunteers = []
        for i, v in enumerate(volunteers_data):
            vol_id = f"VOL-{uuid.uuid4().hex[:4].upper()}"
            vol_item = {
                "id": vol_id,
                "event_id": event_id,
                "name": v.get("name", f"Volunteer {i+1}"),
                "role": v.get("role", "General Coordinator"),
                "phone": v.get("phone", "+1234567890"),
                "email": v.get("email"),
                "skills": v.get("skills", []),
                "status": "available",
                "max_capacity": 5
            }
            db_save_volunteer(vol_item)
            saved_volunteers.append(vol_item)

        # Run Gemma Task Decomposition Agent
        breakdown = gemma_service.generate_task_breakdown(event_dict, saved_volunteers)
        for t in breakdown.get("tasks", []):
            t["event_id"] = event_id
            db_save_task(t)

        for a in breakdown.get("required_assets", []):
            a["event_id"] = event_id
            db_save_asset(a)

        db_add_audit_log(event_id, f"Gemma Coordinator Agent synthesized {len(breakdown.get('tasks', []))} operational tasks.")
        return event_id

    def get_event_state(self, event_id: str) -> Optional[Dict[str, Any]]:
        event = db_get_event(event_id)
        if not event:
            return None

        volunteers = db_get_volunteers(event_id)
        tasks = db_get_tasks(event_id)
        assets = db_get_assets(event_id)
        approvals = db_get_approvals(event_id)
        drafts = db_get_whatsapp_drafts(event_id)
        audit_logs = db_get_audit_logs(event_id, limit=30)

        # Calculate assigned count for each volunteer
        vol_task_counts = {}
        for t in tasks:
            assignee = t.get("assignee_id")
            if assignee:
                vol_task_counts[assignee] = vol_task_counts.get(assignee, 0) + 1

        for v in volunteers:
            v["assigned_tasks_count"] = vol_task_counts.get(v["id"], 0)

        unassigned_tasks = [t for t in tasks if not t.get("assignee_id")]
        bottlenecks = [t for t in tasks if t.get("status") == "blocked"]

        return {
            "event": event,
            "volunteers": volunteers,
            "tasks": tasks,
            "assets": assets,
            "approvals": approvals,
            "whatsapp_drafts": drafts,
            "audit_logs": audit_logs,
            "unassigned_tasks_count": len(unassigned_tasks),
            "bottlenecks_count": len(bottlenecks)
        }

    def set_event_phase(self, event_id: str, new_phase: str):
        db_update_event_phase(event_id, new_phase)
        db_add_audit_log(event_id, f"Timeline advanced to phase: '{new_phase.upper()}'. Autonomous agents re-evaluating dependencies.")

    def update_task_status(self, event_id: str, task_id: str, status: str, assignee_id: Optional[str] = None):
        updates = {"status": status}
        if assignee_id:
            volunteers = db_get_volunteers(event_id)
            v = next((x for x in volunteers if x["id"] == assignee_id), None)
            if v:
                updates["assignee_id"] = v["id"]
                updates["assignee_name"] = v["name"]
        db_update_task(task_id, updates)
        db_add_audit_log(event_id, f"Task '{task_id}' updated to status: {status.upper()}.")

    # Volunteer Dropout Scenario
    def handle_dropout_simulation(self, event_id: str, volunteer_id: str, reason: str = "Unavailable"):
        event = db_get_event(event_id)
        volunteers = db_get_volunteers(event_id)
        dropped_v = next((v for v in volunteers if v["id"] == volunteer_id), None)
        if not dropped_v:
            raise ValueError(f"Volunteer {volunteer_id} not found")

        # Mark volunteer unavailable
        db_update_volunteer_status(volunteer_id, "unavailable")

        # Find affected tasks
        all_tasks = db_get_tasks(event_id)
        affected_tasks = [t for t in all_tasks if t.get("assignee_id") == volunteer_id and t.get("status") != "completed"]
        remaining_volunteers = [v for v in volunteers if v["id"] != volunteer_id and v.get("status") == "available"]

        # Call Gemma Scheduler & Resource Agent
        realloc_result = gemma_service.reallocate_tasks_on_dropout(event, dropped_v, remaining_volunteers, affected_tasks)

        # Create approval card
        app_id = f"APP-{uuid.uuid4().hex[:5].upper()}"
        approval_item = {
            "id": app_id,
            "event_id": event_id,
            "approval_type": "reallocation",
            "title": realloc_result.get("proposed_approval_title", f"Emergency Reassignment: {dropped_v['name']} unavailable"),
            "details": realloc_result.get("approval_details", "Gemma Scheduler detected orphan tasks and proposed replacement assignments."),
            "proposed_action": {"reallocations": realloc_result.get("reallocations", [])},
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        db_save_approval(approval_item)

        # Create WhatsApp draft
        wa_data = realloc_result.get("whatsapp_draft", {})
        if wa_data:
            draft_id = f"WHA-{uuid.uuid4().hex[:5].upper()}"
            db_save_whatsapp_draft({
                "id": draft_id,
                "event_id": event_id,
                "recipient_name": wa_data.get("recipient_name", "Team Member"),
                "phone": wa_data.get("phone", "+1234567890"),
                "recipient_role": "Assignee",
                "context": "dropout_alert",
                "message_body": wa_data.get("message", "Schedule update"),
                "status": "draft",
                "created_at": datetime.now().isoformat()
            })

        db_add_audit_log(event_id, f"⚠️ Volunteer Dropout: {dropped_v['name']} unavailable. Gemma generated reallocations awaiting approval ({app_id}).")
        return {"approval": approval_item, "reallocations": realloc_result}

    # Missing Recap Video Scenario
    def handle_missing_video_simulation(self, event_id: str):
        # 1. Advance phase to post_production
        db_update_event_phase(event_id, "post_production")

        # 2. Set recap video asset status to missing
        assets = db_get_assets(event_id)
        recap_asset = next((a for a in assets if "recap" in a.get("title", "").lower() or a.get("asset_type") == "recap_video"), None)
        if recap_asset:
            db_update_asset(recap_asset["id"], {"status": "missing", "drive_url": None})

        # 3. Call Gemma Asset Tracker Agent
        event = db_get_event(event_id)
        tasks = db_get_tasks(event_id)
        assets = db_get_assets(event_id)
        audit_result = gemma_service.audit_media_assets(event, tasks, assets)

        # 4. Create WhatsApp draft for Media Lead
        volunteers = db_get_volunteers(event_id)
        media_lead = next((v for v in volunteers if "media" in v.get("role", "").lower() or "video" in v.get("role", "").lower()), None)
        media_name = media_lead["name"] if media_lead else "Media Team"
        media_phone = media_lead["phone"] if media_lead else "+923000000000"

        wa_data = audit_result.get("whatsapp_draft", {})
        draft_id = f"WHA-{uuid.uuid4().hex[:5].upper()}"
        draft_item = {
            "id": draft_id,
            "event_id": event_id,
            "recipient_name": media_name,
            "phone": media_phone,
            "recipient_role": "Media & Videography",
            "context": "missing_asset_warning",
            "message_body": wa_data.get("message", "Please upload recap video"),
            "status": "draft",
            "created_at": datetime.now().isoformat()
        }
        db_save_whatsapp_draft(draft_item)

        # 5. Create Approval for WhatsApp broadcast
        app_id = f"APP-{uuid.uuid4().hex[:5].upper()}"
        approval_item = {
            "id": app_id,
            "event_id": event_id,
            "approval_type": "whatsapp_send",
            "title": f"Dispatch Missing Asset Alert to {media_name}",
            "details": f"Workshop concluded but Recap Video is missing from Google Drive. Dispatch reminder WhatsApp message?",
            "proposed_action": {"draft_id": draft_id, "phone": media_phone},
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        db_save_approval(approval_item)

        db_add_audit_log(event_id, f"📹 Missing Asset Alert: 60s Recap Video missing. Gemma Comms Agent queued reminder to {media_name}.")
        return {"audit": audit_result, "approval": approval_item}

    def process_approval(self, event_id: str, approval_id: str, action: str):
        approvals = db_get_approvals(event_id)
        app = next((a for a in approvals if a["id"] == approval_id), None)
        if not app:
            raise ValueError(f"Approval {approval_id} not found")

        db_update_approval(approval_id, action)

        if action == "approved":
            # Apply the proposed action
            app_type = app.get("approval_type")
            proposed = app.get("proposed_action", {})
            
            if app_type == "reallocation":
                for r in proposed.get("reallocations", []):
                    db_update_task(r["task_id"], {
                        "assignee_id": r["new_assignee_id"],
                        "assignee_name": r["new_assignee_name"],
                        "status": "in_progress"
                    })
                db_add_audit_log(event_id, f"✅ Approval Granted: Reallocated {len(proposed.get('reallocations', []))} tasks.")

            elif app_type == "whatsapp_send":
                draft_id = proposed.get("draft_id")
                if draft_id:
                    db_update_whatsapp_status(draft_id, "approved")
                db_add_audit_log(event_id, f"✅ Approval Granted: WhatsApp dispatch authorized for alert ({approval_id}).")
        else:
            db_add_audit_log(event_id, f"❌ Approval Rejected: Action {approval_id} declined by Event Lead.")

    def generate_retrospective(self, event_id: str) -> str:
        event = db_get_event(event_id)
        tasks = db_get_tasks(event_id)
        volunteers = db_get_volunteers(event_id)
        assets = db_get_assets(event_id)
        report = gemma_service.generate_retrospective_report(event, tasks, volunteers, assets)
        db_add_audit_log(event_id, "📊 Gemma Retrospective Agent compiled Post-Event Report.")
        return report

event_ops_manager = EventOperationsManager()
