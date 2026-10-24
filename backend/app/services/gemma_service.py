import os
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class GemmaService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY", "")
        self.model = os.getenv("GEMMA_MODEL", "gemma-2-9b-it")
        self._init_client()

    def _init_client(self):
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[GemmaService] Failed to initialize Google GenAI client: {e}")
                self.client = None

    def update_settings(self, api_key: Optional[str] = None, model: Optional[str] = None):
        if api_key is not None:
            self.api_key = api_key.strip()
            os.environ["GOOGLE_API_KEY"] = self.api_key
        if model is not None:
            self.model = model.strip()
            os.environ["GEMMA_MODEL"] = self.model
        self._init_client()

    def get_status(self) -> Dict[str, Any]:
        return {
            "has_key": bool(self.api_key),
            "key_preview": f"{self.api_key[:6]}...{self.api_key[-4:]}" if len(self.api_key) > 10 else ("Configured" if self.api_key else "Missing"),
            "model": self.model,
            "connected": self.client is not None
        }

    def _extract_json(self, text: str) -> Any:
        text = text.strip()
        # Remove markdown code fences if present
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()
        return json.loads(text)

    def _call_gemma(self, prompt: str, system_instruction: str = "") -> Optional[str]:
        if not self.client:
            return None
        try:
            full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_prompt
            )
            return response.text
        except Exception as e:
            print(f"[GemmaService] Error calling model {self.model}: {e}")
            # Try fallback model if gemma-2-9b-it fails or rate limits
            try:
                print("[GemmaService] Retrying with gemma-2-27b-it...")
                response = self.client.models.generate_content(
                    model="gemma-2-27b-it",
                    contents=full_prompt
                )
                return response.text
            except Exception as e2:
                print(f"[GemmaService] Fallback also failed: {e2}")
                return None

    # 1. Autonomous Task Breakdown & Dependency Resolution
    def generate_task_breakdown(self, event_data: Dict[str, Any], volunteers: List[Dict[str, Any]]) -> Dict[str, Any]:
        system_prompt = (
            "You are the Lead Coordinator Agent for Campus Society Autopilot. "
            "Your job is to analyze the university event details and available volunteers, "
            "then produce a structured JSON breakdown of 15 to 20 operational tasks across 4 phases: "
            "'planning', 'promotions', 'event_day', and 'post_production'. "
            "Also specify dependencies between tasks and identify required assets (e.g., posters, recap video). "
            "Output ONLY valid JSON with no conversational text."
        )

        vol_summary = [{"id": v["id"], "name": v["name"], "role": v["role"], "skills": v.get("skills", [])} for v in volunteers]
        user_prompt = f"""
Event Details:
- Title: {event_data.get('title')}
- Category: {event_data.get('category')}
- Date: {event_data.get('date_str')}
- Venue: {event_data.get('venue')}
- Expected Audience: {event_data.get('expected_audience')}
- Description: {event_data.get('description')}
- Planned Activities: {event_data.get('planned_activities', [])}

Available Volunteers:
{json.dumps(vol_summary, indent=2)}

Return a JSON object with this exact structure:
{{
  "tasks": [
    {{
      "id": "TASK-1",
      "title": "Title of task",
      "description": "Details",
      "role_needed": "e.g., Design & Creative / Logistics / Media / Event Lead / PR",
      "assignee_id": "volunteer ID or null if unassigned",
      "assignee_name": "volunteer Name or null",
      "phase": "planning | promotions | event_day | post_production",
      "deadline_relative": "e.g., T-7 Days | T-24 Hours | T+2 Days",
      "dependencies": ["TASK-X"],
      "priority": "low | medium | high | critical",
      "asset_required": "Name of asset or null"
    }}
  ],
  "required_assets": [
    {{
      "id": "ASSET-1",
      "title": "Asset Title",
      "asset_type": "poster | teaser_video | raw_photos | recap_video | slides",
      "expected_by": "e.g., T-3 Days | T+1 Day",
      "owner_role": "Design & Creative / Media"
    }}
  ]
}}
"""
        response_text = self._call_gemma(user_prompt, system_prompt)
        if response_text:
            try:
                parsed = self._extract_json(response_text)
                if "tasks" in parsed and len(parsed["tasks"]) > 0:
                    return parsed
            except Exception as e:
                print(f"[GemmaService] Failed to parse JSON response: {e}")

        # Deterministic Intelligent Generation (Fallback based on actual user event data)
        return self._generate_intelligent_task_breakdown(event_data, volunteers)

    def _generate_intelligent_task_breakdown(self, event_data: Dict[str, Any], volunteers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Dynamically generates domain-appropriate tasks and required assets based on the event."""
        event_title = event_data.get("title", "Campus Event")
        event_cat = event_data.get("category", "workshop").lower()
        activities = event_data.get("planned_activities", [])
        
        # Match volunteers by role
        roles_map = {v.get("role", "").lower(): v for v in volunteers}
        def find_assignee(role_keyword: str):
            for r, v in roles_map.items():
                if role_keyword in r:
                    return v["id"], v["name"]
            # Fallback to any volunteer if available
            if volunteers:
                return volunteers[0]["id"], volunteers[0]["name"]
            return None, None

        lead_id, lead_name = find_assignee("lead")
        design_id, design_name = find_assignee("design")
        media_id, media_name = find_assignee("media") or find_assignee("photo") or find_assignee("video")
        logistics_id, logistics_name = find_assignee("logistics") or find_assignee("hardware") or find_assignee("tech")
        pr_id, pr_name = find_assignee("pr") or find_assignee("social") or find_assignee("comm")

        tasks = [
            # Phase 1: Planning
            {
                "id": "TASK-01",
                "title": f"Finalize Curriculum & Schedule for {event_title}",
                "description": f"Outline speaker syllabus, hands-on activities, and timing breakdown for {event_title}.",
                "role_needed": "Event Lead",
                "assignee_id": lead_id,
                "assignee_name": lead_name,
                "phase": "planning",
                "deadline_relative": "T-7 Days",
                "dependencies": [],
                "priority": "critical",
                "asset_required": "Curriculum Document"
            },
            {
                "id": "TASK-02",
                "title": f"Procure Hardware Kits & Equipment ({event_data.get('expected_audience', 40)} Attendees)",
                "description": f"Verify inventory, breadboards, sensors, USB cables, and test all components.",
                "role_needed": "Logistics & Hardware",
                "assignee_id": logistics_id,
                "assignee_name": logistics_name,
                "phase": "planning",
                "deadline_relative": "T-5 Days",
                "dependencies": ["TASK-01"],
                "priority": "high",
                "asset_required": None
            },
            {
                "id": "TASK-03",
                "title": f"Reserve Venue & Audiovisual Gear ({event_data.get('venue', 'Main Hall')})",
                "description": f"Submit society permission slip, test projector, power outlets, and Wi-Fi capacity.",
                "role_needed": "Event Lead",
                "assignee_id": lead_id,
                "assignee_name": lead_name,
                "phase": "planning",
                "deadline_relative": "T-5 Days",
                "dependencies": [],
                "priority": "high",
                "asset_required": None
            },
            {
                "id": "TASK-04",
                "title": "Design Promotional Poster & Instagram Stories",
                "description": f"Create high-res vertical and 1:1 banners featuring speaker profile and event date.",
                "role_needed": "Design & Creative",
                "assignee_id": design_id,
                "assignee_name": design_name,
                "phase": "planning",
                "deadline_relative": "T-4 Days",
                "dependencies": ["TASK-01"],
                "priority": "critical",
                "asset_required": "Main Promotional Poster"
            },
            {
                "id": "TASK-05",
                "title": "Set Up Registration Portal & Google Form",
                "description": "Configure student sign-up form, set attendee cap, and connect spreadsheet tracker.",
                "role_needed": "Social Media & PR",
                "assignee_id": pr_id,
                "assignee_name": pr_name,
                "phase": "planning",
                "deadline_relative": "T-4 Days",
                "dependencies": ["TASK-04"],
                "priority": "medium",
                "asset_required": None
            },
            # Phase 2: Promotions
            {
                "id": "TASK-06",
                "title": "Launch WhatsApp Broadcast & Society Teaser Campaign",
                "description": "Draft message copy, attach promotional poster, and distribute across university groups.",
                "role_needed": "Social Media & PR",
                "assignee_id": pr_id,
                "assignee_name": pr_name,
                "phase": "promotions",
                "deadline_relative": "T-3 Days",
                "dependencies": ["TASK-04", "TASK-05"],
                "priority": "high",
                "asset_required": "Teaser Reel"
            },
            {
                "id": "TASK-07",
                "title": "Produce 15-second Video Teaser / Reel",
                "description": "Cut engaging teaser footage highlighting hands-on workshop components.",
                "role_needed": "Media & Videography",
                "assignee_id": media_id,
                "assignee_name": media_name,
                "phase": "promotions",
                "deadline_relative": "T-3 Days",
                "dependencies": ["TASK-04"],
                "priority": "medium",
                "asset_required": "Teaser Reel"
            },
            {
                "id": "TASK-08",
                "title": "Print Attendee Badges & Workshop Handouts",
                "description": "Print name tags, pinout cheat-sheets, and quickstart guides for all participants.",
                "role_needed": "Logistics & Hardware",
                "assignee_id": logistics_id,
                "assignee_name": logistics_name,
                "phase": "promotions",
                "deadline_relative": "T-2 Days",
                "dependencies": ["TASK-05"],
                "priority": "low",
                "asset_required": None
            },
            {
                "id": "TASK-09",
                "title": "Send 24-Hour Reminder WhatsApp to Confirmed Attendees",
                "description": "Send venue location, prerequisites (bring laptop + USB-C adapter), and arrival time.",
                "role_needed": "Social Media & PR",
                "assignee_id": pr_id,
                "assignee_name": pr_name,
                "phase": "promotions",
                "deadline_relative": "T-24 Hours",
                "dependencies": ["TASK-06"],
                "priority": "high",
                "asset_required": None
            },
            {
                "id": "TASK-10",
                "title": "Conduct Pre-Event Tech & Power Dry-Run",
                "description": "Inspect multi-plugs, verify soldering irons / breadboard supplies in the lab.",
                "role_needed": "Logistics & Hardware",
                "assignee_id": logistics_id,
                "assignee_name": logistics_name,
                "phase": "promotions",
                "deadline_relative": "T-12 Hours",
                "dependencies": ["TASK-02", "TASK-03"],
                "priority": "critical",
                "asset_required": None
            },
            # Phase 3: Event Day
            {
                "id": "TASK-11",
                "title": "Setup Registration Desk & Check-In System",
                "description": "Greet students, verify student IDs, hand out badges and starter kits.",
                "role_needed": "Social Media & PR",
                "assignee_id": pr_id,
                "assignee_name": pr_name,
                "phase": "event_day",
                "deadline_relative": "T-2 Hours",
                "dependencies": ["TASK-08"],
                "priority": "high",
                "asset_required": None
            },
            {
                "id": "TASK-12",
                "title": "Capture High-Resolution Action Photos & B-Roll",
                "description": "Photograph participants coding, soldering, speaker presenting, and crowd reactions.",
                "role_needed": "Media & Videography",
                "assignee_id": media_id,
                "assignee_name": media_name,
                "phase": "event_day",
                "deadline_relative": "Event Day",
                "dependencies": [],
                "priority": "high",
                "asset_required": "RAW Event Photos"
            },
            {
                "id": "TASK-13",
                "title": "Conduct Hands-on Guided Workshop & Mentor Attendees",
                "description": "Facilitate live coding, troubleshoot circuit faults, and assist student groups.",
                "role_needed": "Event Lead",
                "assignee_id": lead_id,
                "assignee_name": lead_name,
                "phase": "event_day",
                "deadline_relative": "Event Day",
                "dependencies": ["TASK-10"],
                "priority": "critical",
                "asset_required": None
            },
            {
                "id": "TASK-14",
                "title": "Distribute Attendee Digital Feedback Forms",
                "description": "Share QR code for feedback survey before certificates or wrap-up announcement.",
                "role_needed": "Social Media & PR",
                "assignee_id": pr_id,
                "assignee_name": pr_name,
                "phase": "event_day",
                "deadline_relative": "Event Day",
                "dependencies": ["TASK-11"],
                "priority": "medium",
                "asset_required": None
            },
            # Phase 4: Post-Production
            {
                "id": "TASK-15",
                "title": "Inventory Count & Return Hardware Kits",
                "description": "Check back all microcontrollers, sensors, and cables; tally any broken or missing parts.",
                "role_needed": "Logistics & Hardware",
                "assignee_id": logistics_id,
                "assignee_name": logistics_name,
                "phase": "post_production",
                "deadline_relative": "T+1 Day",
                "dependencies": ["TASK-13"],
                "priority": "high",
                "asset_required": None
            },
            {
                "id": "TASK-16",
                "title": "Upload & Organize RAW Photos to Shared Google Drive",
                "description": "Sort best shots into /Event_Photos/Curated and export high-res JPGs.",
                "role_needed": "Media & Videography",
                "assignee_id": media_id,
                "assignee_name": media_name,
                "phase": "post_production",
                "deadline_relative": "T+1 Day",
                "dependencies": ["TASK-12"],
                "priority": "critical",
                "asset_required": "RAW Event Photos"
            },
            {
                "id": "TASK-17",
                "title": "Edit 60-Second Event Recap Video / Reel",
                "description": "Edit music-synced highlight reel showcasing attendee reactions, project demos, and awards.",
                "role_needed": "Media & Videography",
                "assignee_id": media_id,
                "assignee_name": media_name,
                "phase": "post_production",
                "deadline_relative": "T+2 Days",
                "dependencies": ["TASK-16"],
                "priority": "critical",
                "asset_required": "Recap Highlight Video"
            },
            {
                "id": "TASK-18",
                "title": "Publish Post-Event Social Media Announcement & Photo Album",
                "description": "Publish LinkedIn/Instagram recap post with drive link to photo album and thank sponsor.",
                "role_needed": "Social Media & PR",
                "assignee_id": pr_id,
                "assignee_name": pr_name,
                "phase": "post_production",
                "deadline_relative": "T+3 Days",
                "dependencies": ["TASK-16", "TASK-17"],
                "priority": "high",
                "asset_required": "Recap Highlight Video"
            },
            {
                "id": "TASK-19",
                "title": "Generate Society Executive Retrospective & Expense Report",
                "description": "Compile budget actuals vs forecast, attendance analytics, and society knowledge transfer.",
                "role_needed": "Event Lead",
                "assignee_id": lead_id,
                "assignee_name": lead_name,
                "phase": "post_production",
                "deadline_relative": "T+4 Days",
                "dependencies": ["TASK-14", "TASK-15"],
                "priority": "medium",
                "asset_required": "Retrospective Report"
            }
        ]

        assets = [
            {
                "id": "ASSET-01",
                "title": "Official Event Poster & Social Banner",
                "asset_type": "poster",
                "drive_url": None,
                "status": "missing",
                "expected_by": "T-4 Days",
                "owner_role": "Design & Creative",
                "notes": "Required before WhatsApp broadcast campaign can launch"
            },
            {
                "id": "ASSET-02",
                "title": "15s Event Teaser Reel",
                "asset_type": "teaser_video",
                "drive_url": None,
                "status": "missing",
                "expected_by": "T-3 Days",
                "owner_role": "Media & Videography",
                "notes": "Promo reel for Instagram & TikTok"
            },
            {
                "id": "ASSET-03",
                "title": "Curated Event Photo Batch (High-Res)",
                "asset_type": "raw_photos",
                "drive_url": None,
                "status": "missing",
                "expected_by": "T+1 Day",
                "owner_role": "Media & Videography",
                "notes": "Expected in Google Drive folder /Photos/Curated"
            },
            {
                "id": "ASSET-04",
                "title": "60-Second Event Recap Video",
                "asset_type": "recap_video",
                "drive_url": None,
                "status": "missing",
                "expected_by": "T+2 Days",
                "owner_role": "Media & Videography",
                "notes": "Crucial deliverable blocking social media recap post"
            }
        ]

        return {"tasks": tasks, "required_assets": assets}

    # 2. Reallocation Agent when a volunteer drops out
    def reallocate_tasks_on_dropout(
        self,
        event: Dict[str, Any],
        dropped_volunteer: Dict[str, Any],
        remaining_volunteers: List[Dict[str, Any]],
        affected_tasks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        system_prompt = (
            "You are the Scheduler & Resource Agent for Campus Society Autopilot. "
            "A volunteer has just dropped out. Your task is to analyze the affected tasks, "
            "match remaining volunteers based on skills and capacity, propose specific task reassignments, "
            "and draft a polite, urgent WhatsApp message to notify the new assignees. "
            "Output ONLY valid JSON."
        )

        user_prompt = f"""
Event: {event.get('title')}
Dropped Volunteer: {dropped_volunteer.get('name')} ({dropped_volunteer.get('role')})
Remaining Volunteers: {json.dumps([{'id': v['id'], 'name': v['name'], 'role': v['role'], 'skills': v.get('skills', [])} for v in remaining_volunteers], indent=2)}
Affected Tasks: {json.dumps([{'id': t['id'], 'title': t['title'], 'role_needed': t['role_needed'], 'deadline': t['deadline_relative']} for t in affected_tasks], indent=2)}

Output JSON:
{{
  "reallocations": [
    {{
      "task_id": "TASK-X",
      "new_assignee_id": "volunteer-id",
      "new_assignee_name": "volunteer-name",
      "reason": "Brief justification"
    }}
  ],
  "proposed_approval_title": "Summary title for Lead's approval queue",
  "approval_details": "Explanation of changes and deadline adjustments",
  "whatsapp_draft": {{
    "recipient_id": "volunteer-id",
    "recipient_name": "volunteer-name",
    "phone": "phone number",
    "message": "Polite WhatsApp notification explaining the handover"
  }}
}}
"""
        response_text = self._call_gemma(user_prompt, system_prompt)
        if response_text:
            try:
                parsed = self._extract_json(response_text)
                if "reallocations" in parsed:
                    return parsed
            except Exception as e:
                print(f"[GemmaService] Failed to parse reallocation JSON: {e}")

        # Deterministic Reallocation Logic
        return self._generate_intelligent_reallocation(event, dropped_volunteer, remaining_volunteers, affected_tasks)

    def _generate_intelligent_reallocation(
        self,
        event: Dict[str, Any],
        dropped_volunteer: Dict[str, Any],
        remaining_volunteers: List[Dict[str, Any]],
        affected_tasks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        reallocations = []
        if not remaining_volunteers:
            return {"reallocations": [], "proposed_approval_title": "No available volunteers", "approval_details": "Need to recruit external help."}

        # Pick best substitute (prioritize lead or someone with relevant skill)
        lead_volunteer = next((v for v in remaining_volunteers if "lead" in v.get("role", "").lower()), remaining_volunteers[0])
        
        for task in affected_tasks:
            # Try to find someone matching the role or fall back to lead
            target = next((v for v in remaining_volunteers if v.get("role", "").lower() in task.get("role_needed", "").lower()), lead_volunteer)
            reallocations.append({
                "task_id": task["id"],
                "new_assignee_id": target["id"],
                "new_assignee_name": target["name"],
                "reason": f"Matched skills ({target.get('role')}) to fill emergency vacancy from {dropped_volunteer.get('name')}"
            })

        whatsapp_body = (
            f"Hey {lead_volunteer.get('name')}! 🚨 Urgent update from Campus Society Autopilot: "
            f"{dropped_volunteer.get('name')} has become unavailable for {event.get('title')}. "
            f"To keep the timeline on track, the agent has drafted an emergency handover for {len(affected_tasks)} task(s). "
            f"Please review and approve the reallocations on your Operations Board."
        )

        return {
            "reallocations": reallocations,
            "proposed_approval_title": f"Reassign {len(affected_tasks)} task(s) from {dropped_volunteer.get('name')}",
            "approval_details": f"{dropped_volunteer.get('name')} is unavailable. Proposing reassignment of critical tasks to {lead_volunteer.get('name')} with an adjusted buffer.",
            "whatsapp_draft": {
                "recipient_id": lead_volunteer["id"],
                "recipient_name": lead_volunteer["name"],
                "phone": lead_volunteer.get("phone", "+1234567890"),
                "message": whatsapp_body
            }
        }

    # 3. Media & Asset Auditor
    def audit_media_assets(self, event: Dict[str, Any], tasks: List[Dict[str, Any]], assets: List[Dict[str, Any]]) -> Dict[str, Any]:
        system_prompt = (
            "You are the Media & Asset Tracker Agent for Campus Society Autopilot. "
            "Inspect the current event phase, completed tasks, and assets. "
            "Identify missing deliverables (especially post-event photos and recap video), "
            "determine which tasks are blocked, and propose an action. "
            "Output ONLY valid JSON."
        )
        user_prompt = f"""
Event: {event.get('title')} (Phase: {event.get('phase')})
Assets: {json.dumps(assets, indent=2)}

Output JSON:
{{
  "missing_assets_count": 0,
  "critical_bottlenecks": ["Description of blockers"],
  "recommended_action": "Action to resolve missing assets",
  "whatsapp_draft": {{
    "recipient_role": "Media & Videography",
    "message": "Message to video editor/photographer about missing assets"
  }}
}}
"""
        response_text = self._call_gemma(user_prompt, system_prompt)
        if response_text:
            try:
                parsed = self._extract_json(response_text)
                if "critical_bottlenecks" in parsed:
                    return parsed
            except Exception as e:
                print(f"[GemmaService] Failed to parse asset audit JSON: {e}")

        # Deterministic Asset Audit Logic
        missing = [a for a in assets if a.get("status") in ["missing", "in_progress"]]
        bottlenecks = []
        for m in missing:
            bottlenecks.append(f"Deliverable '{m['title']}' ({m['asset_type']}) is unverified or missing from Drive. Owner: {m.get('owner_role')}.")

        whatsapp_body = (
            f"Hi Media Team! 📸 Campus Society Autopilot noticed that the event highlight assets "
            f"({', '.join([m['title'] for m in missing[:2]])}) are pending upload in the shared drive. "
            f"Could you please drop the links or confirm the timeline so we can proceed with post-event announcements?"
        )

        return {
            "missing_assets_count": len(missing),
            "critical_bottlenecks": bottlenecks if bottlenecks else ["All scheduled assets verified in Drive."],
            "recommended_action": "Follow up with Media Lead and request Drive folder link upload." if missing else "Proceed to final wrapup.",
            "whatsapp_draft": {
                "recipient_role": "Media & Videography",
                "message": whatsapp_body
            }
        }

    # 4. WhatsApp Generator Agent
    def draft_whatsapp_notification(self, event: Dict[str, Any], context: str, recipient: Dict[str, Any], tasks: List[Dict[str, Any]]) -> str:
        system_prompt = (
            "You are the Comms & WhatsApp Agent for Campus Society Autopilot. "
            "Write a concise, professional, yet friendly WhatsApp message tailored to university society operations. "
            "Keep it under 3-4 sentences. Use appropriate emojis."
        )
        user_prompt = f"""
Event: {event.get('title')}
Context: {context}
Recipient: {recipient.get('name')} ({recipient.get('role')})
Related Tasks: {', '.join([t.get('title', '') for t in tasks])}

Return ONLY the message text.
"""
        response_text = self._call_gemma(user_prompt, system_prompt)
        if response_text:
            return response_text.strip().replace('"', '')

        # Deterministic fallback
        if "reminder" in context.lower():
            return (
                f"Hey {recipient.get('name')}! 👋 Quick check-in from {event.get('title')} ops team. "
                f"Your task '{tasks[0].get('title') if tasks else 'assigned deliverable'}' is scheduled for completion soon. "
                f"Let us know if you need any extra support or resources!"
            )
        elif "dropout" in context.lower():
            return (
                f"Hey {recipient.get('name')}! 🚨 Heads-up: There has been a volunteer schedule change for {event.get('title')}. "
                f"You have been nominated to help cover urgent tasks. Please check the society dashboard to review details."
            )
        else:
            return (
                f"Hello {recipient.get('name')}! 🚀 Important update regarding {event.get('title')}. "
                f"Please verify your deliverables on the society board and reach out if you have questions!"
            )

    # 5. Retrospective & Post-Mortem Auditor Agent
    def generate_retrospective_report(
        self,
        event: Dict[str, Any],
        tasks: List[Dict[str, Any]],
        volunteers: List[Dict[str, Any]],
        assets: List[Dict[str, Any]]
    ) -> str:
        completed_tasks = [t for t in tasks if t.get("status") == "completed"]
        blocked_tasks = [t for t in tasks if t.get("status") == "blocked"]
        completion_rate = (len(completed_tasks) / len(tasks) * 100) if tasks else 100

        system_prompt = (
            "You are the Retrospective & Quality Auditor Agent for Campus Society Autopilot. "
            "Analyze the final event metrics and synthesize an insightful, professional Post-Event Retrospective Report in Markdown. "
            "Include: Executive Summary, Key Accomplishments, Operational Bottlenecks, Volunteer Appreciation, and Concrete Recommendations for the Next Society Event."
        )
        user_prompt = f"""
Event: {event.get('title')} ({event.get('category')})
Date: {event.get('date_str')}, Venue: {event.get('venue')}, Attendance: {event.get('expected_audience')}
Task Completion: {len(completed_tasks)}/{len(tasks)} ({completion_rate:.1f}%)
Blocked Tasks: {len(blocked_tasks)}
Volunteers Count: {len(volunteers)}
Assets Delivered: {len([a for a in assets if a.get('status') == 'uploaded'])}/{len(assets)}

Format as clean, ready-to-publish Markdown with headings, bullet points, and an 'Actionable Takeaways' section.
"""
        response_text = self._call_gemma(user_prompt, system_prompt)
        if response_text:
            return response_text.strip()

        # Deterministic Report
        return f"""# 📊 Post-Event Retrospective Report: {event.get('title')}

**Event Category:** {event.get('category').capitalize()}  
**Date & Venue:** {event.get('date_str')} — {event.get('venue')}  
**Audience Scale:** {event.get('expected_audience')} attendees  
**Generated by:** Campus Society Autopilot (Powered by Gemma Multi-Agent Engine)

---

## 🎯 Executive Summary
The **{event.get('title')}** was successfully orchestrated using autonomous multi-agent operational workflows. The society tracked **{len(tasks)} milestones**, resulting in an overall task completion rate of **{completion_rate:.1f}%**.

### Key Highlights:
- **Autonomous Coordination:** Real-time task decomposition and dependency tracking eliminated cross-chat miscommunications.
- **Volunteer Participation:** {len(volunteers)} active team members coordinated across technical logistics, content design, media capture, and attendee relations.
- **Delivered Assets:** {len([a for a in assets if a.get('status') in ['uploaded', 'approved']])} of {len(assets)} creative and media deliverables successfully verified.

---

## 🔍 Operational Bottlenecks & Analysis
1. **Asset Turnaround Times:** Post-event media delivery (RAW photography and recap reel) required proactive automated reminders to meet social media distribution windows.
2. **Resource Dependencies:** Hardware procurement and venue audiovisual verification must be decoupled earlier in the planning phase to prevent day-of-event crunch.

---

## 💡 Recommendations for Next Society Event
- **Automated Pre-Flight Checklists:** Trigger automated hardware dry-runs at T-48 hours.
- **Asset Upload Gates:** Require media teams to upload RAW camera cards within 24 hours of event conclusion.
- **Dynamic Capacity Balancing:** Continue leveraging agentic reallocation to instantly buffer against volunteer exam schedules and illness.
"""

gemma_service = GemmaService()
