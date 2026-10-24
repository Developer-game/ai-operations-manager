import sqlite3
import json
import os
from typing import List, Optional, Dict, Any

DB_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
DB_PATH = os.path.join(DB_DIR, "campus_autopilot.db")

def get_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        date_str TEXT,
        venue TEXT,
        expected_audience INTEGER,
        budget TEXT,
        phase TEXT DEFAULT 'planning',
        created_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS volunteers (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        skills TEXT,
        status TEXT DEFAULT 'available',
        max_capacity INTEGER DEFAULT 5,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        role_needed TEXT NOT NULL,
        assignee_id TEXT,
        assignee_name TEXT,
        phase TEXT NOT NULL,
        deadline_relative TEXT NOT NULL,
        dependencies TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        asset_required TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        title TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        drive_url TEXT,
        status TEXT DEFAULT 'missing',
        expected_by TEXT NOT NULL,
        owner_role TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        approval_type TEXT NOT NULL,
        title TEXT NOT NULL,
        details TEXT NOT NULL,
        proposed_action TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS whatsapp_drafts (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        recipient_role TEXT,
        context TEXT NOT NULL,
        message_body TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        created_at TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        log_message TEXT NOT NULL,
        created_at TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
    """)

    conn.commit()
    conn.close()

# Database Helper Functions
def db_save_event(event_dict: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO events (id, title, description, category, date_str, venue, expected_audience, budget, phase, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event_dict["id"], event_dict["title"], event_dict.get("description", ""), event_dict.get("category", "workshop"),
        event_dict["date_str"], event_dict.get("venue", ""), event_dict.get("expected_audience", 50),
        event_dict.get("budget", ""), event_dict.get("phase", "planning"), event_dict["created_at"]
    ))
    conn.commit()
    conn.close()

def db_get_event(event_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    row = c.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def db_list_events() -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM events ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def db_update_event_phase(event_id: str, phase: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE events SET phase = ? WHERE id = ?", (phase, event_id))
    conn.commit()
    conn.close()

# Volunteers
def db_save_volunteer(v: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    skills_json = json.dumps(v.get("skills", []))
    c.execute("""
        INSERT OR REPLACE INTO volunteers (id, event_id, name, role, phone, email, skills, status, max_capacity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        v["id"], v["event_id"], v["name"], v["role"], v["phone"],
        v.get("email"), skills_json, v.get("status", "available"), v.get("max_capacity", 5)
    ))
    conn.commit()
    conn.close()

def db_get_volunteers(event_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM volunteers WHERE event_id = ?", (event_id,)).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["skills"] = json.loads(d.get("skills") or "[]")
        result.append(d)
    return result

def db_update_volunteer_status(volunteer_id: str, status: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE volunteers SET status = ? WHERE id = ?", (status, volunteer_id))
    conn.commit()
    conn.close()

# Tasks
def db_save_task(t: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    deps_json = json.dumps(t.get("dependencies", []))
    c.execute("""
        INSERT OR REPLACE INTO tasks (id, event_id, title, description, role_needed, assignee_id, assignee_name, phase, deadline_relative, dependencies, status, priority, asset_required)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        t["id"], t["event_id"], t["title"], t.get("description", ""), t["role_needed"],
        t.get("assignee_id"), t.get("assignee_name"), t["phase"], t["deadline_relative"],
        deps_json, t.get("status", "pending"), t.get("priority", "medium"), t.get("asset_required")
    ))
    conn.commit()
    conn.close()

def db_get_tasks(event_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM tasks WHERE event_id = ? ORDER BY id ASC", (event_id,)).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["dependencies"] = json.loads(d.get("dependencies") or "[]")
        result.append(d)
    return result

def db_update_task(task_id: str, updates: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    fields = []
    values = []
    for k, v in updates.items():
        if k == "dependencies":
            v = json.dumps(v)
        fields.append(f"{k} = ?")
        values.append(v)
    values.append(task_id)
    query = f"UPDATE tasks SET {', '.join(fields)} WHERE id = ?"
    c.execute(query, tuple(values))
    conn.commit()
    conn.close()

# Assets
def db_save_asset(a: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO assets (id, event_id, title, asset_type, drive_url, status, expected_by, owner_role, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        a["id"], a["event_id"], a["title"], a["asset_type"], a.get("drive_url"),
        a.get("status", "missing"), a["expected_by"], a["owner_role"], a.get("notes")
    ))
    conn.commit()
    conn.close()

def db_get_assets(event_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM assets WHERE event_id = ?", (event_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def db_update_asset(asset_id: str, updates: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    fields = [f"{k} = ?" for k in updates.keys()]
    values = list(updates.values())
    values.append(asset_id)
    c.execute(f"UPDATE assets SET {', '.join(fields)} WHERE id = ?", tuple(values))
    conn.commit()
    conn.close()

# Approvals
def db_save_approval(app: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    action_json = json.dumps(app.get("proposed_action", {}))
    c.execute("""
        INSERT OR REPLACE INTO approvals (id, event_id, approval_type, title, details, proposed_action, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        app["id"], app["event_id"], app["approval_type"], app["title"],
        app["details"], action_json, app.get("status", "pending"), app["created_at"]
    ))
    conn.commit()
    conn.close()

def db_get_approvals(event_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM approvals WHERE event_id = ? ORDER BY created_at DESC", (event_id,)).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["proposed_action"] = json.loads(d.get("proposed_action") or "{}")
        result.append(d)
    return result

def db_update_approval(approval_id: str, status: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE approvals SET status = ? WHERE id = ?", (status, approval_id))
    conn.commit()
    conn.close()

# WhatsApp Drafts
def db_save_whatsapp_draft(draft: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO whatsapp_drafts (id, event_id, recipient_name, phone, recipient_role, context, message_body, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        draft["id"], draft["event_id"], draft["recipient_name"], draft["phone"],
        draft.get("recipient_role"), draft["context"], draft["message_body"],
        draft.get("status", "draft"), draft["created_at"]
    ))
    conn.commit()
    conn.close()

def db_get_whatsapp_drafts(event_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM whatsapp_drafts WHERE event_id = ? ORDER BY created_at DESC", (event_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def db_update_whatsapp_status(draft_id: str, status: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE whatsapp_drafts SET status = ? WHERE id = ?", (status, draft_id))
    conn.commit()
    conn.close()

# Audit Logs
def db_add_audit_log(event_id: str, message: str):
    from datetime import datetime
    conn = get_connection()
    c = conn.cursor()
    now_str = datetime.now().strftime("%H:%M:%S")
    c.execute("INSERT INTO audit_logs (event_id, log_message, created_at) VALUES (?, ?, ?)", (event_id, message, now_str))
    conn.commit()
    conn.close()

def db_get_audit_logs(event_id: str, limit: int = 50) -> List[str]:
    conn = get_connection()
    c = conn.cursor()
    rows = c.execute("SELECT log_message, created_at FROM audit_logs WHERE event_id = ? ORDER BY id DESC LIMIT ?", (event_id, limit)).fetchall()
    conn.close()
    return [f"[{r['created_at']}] {r['log_message']}" for r in rows]
