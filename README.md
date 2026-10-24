# Rally: University Club and Society Operations Platform

> A mature enterprise B2B SaaS operations management platform for university clubs and student societies, engineered with an information-dense interface inspired by Linear and Asana, multi-channel social dispatch, centralized member and team orchestration, and autonomous AI agents.

---

## Overview

Student societies and university clubs often struggle with chaotic spreadsheets, scattered WhatsApp groups, fragmented social media schedules, and manual meeting coordination. 

**Rally** replaces this chaos with a unified, high-density operations command center. Designed with an orange, dark orange, and deep black palette across light and dark themes, Rally delivers rapid workflows for student leaders, event organizers, and society members.

---

## Key Features

### 1. Linear and Asana Inspired Enterprise UI
- **Persistent Left Navigation**: Quick workspace switching, instant search (`Ctrl + K`), notification badges, role switcher, and AI launcher.
- **Information-Dense Data Views**: Searchable data tables, practical filter chips, compact typography, subtle borders, and restrained shadows optimized for daily productivity.
- **Curated Theme System**: Tailored light and dark themes using vivid orange (`#EA580C`, `#F97316`), deep dark orange (`#C2410C`), and obsidian surfaces (`#090A0C`, `#121417`).

### 2. Centralized Members, Teams, and Task Management
- **Single-Pane Roster Management**: Search, filter, inspect, and manage society members from a central table.
- **Direct Task & Role Assignment**: Slide-out drawer allows organizers to assign tasks, set deadlines, and configure roles in seconds.
- **Squad & Team Creation**: Create teams (e.g. Hardware Engineering, Software Squad, Marketing) and assign members or designated team leads.
- **Spreadsheet Importer**: Parse and stage `.xlsx`, `.xls`, and `.csv` files with automatic column detection, duplicate checking, and batch invitation dispatch.

### 3. Unified Social & Comms Hub (`/social`)
- **WhatsApp Broadcast Channel**:
  - Connect society broadcast channels with real-time opt-in tracking.
  - Template selectors for urgent notifications, broadcast invites, and polite member check-ins.
  - Live realistic WhatsApp mobile preview before broadcast dispatch.
- **Instagram Studio**:
  - Image staging, aspect ratio controls, and AI-powered caption generation with hashtag curation.
  - Interactive Instagram post card preview.
- **LinkedIn Executive Publishing**:
  - Headline editor, audience targeting (Alumni, Industry Partners, University Body), and article drafting.
  - Authentic LinkedIn corporate feed card preview.
- **Unified Transmission History**: Audit log tracking all past broadcasts, social postings, and scheduled announcements.

### 4. Focused Rally AI Assistant
- **Zero Thought Noise**: Stripped of internal chain-of-thought, reasoning steps, and meta-commentary.
- **Action-Oriented Execution**: Delivers immediate answers, task breakdowns, schedule recommendations, and role-aware advice.

### 5. Event Scheduling & Interactive Availability
- **When2meet-Style Grid**: Member availability heatmap across multiple 30-minute time slots to pinpoint the optimal meeting times.
- **Phase Progression**: Track events across Planning, Promotions, Event Day, and Post-Production.

### 6. Campus Society Autopilot & Multi-Agent Backend
- Autonomous agents powered by Google Gemma and Gemini for task decomposition, volunteer dropout recovery, asset verification in Google Drive, and retrospective reporting.
- Human-in-the-loop (HITL) approval gates for sensitive actions.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Rally Web Platform                            │
│           Next.js 16.4 (Turbopack) + React 19 + Vanilla CSS            │
│  ├── AppShell (Persistent Navigation, Persona Switcher, AI Drawer)     │
│  ├── Centralized Members, Squads, and Task Drawer (`/members`)        │
│  ├── Multi-Channel Social Hub (WhatsApp, Instagram, LinkedIn)          │
│  └── Availability Heatmap & Event Operations (`/events`)               │
└──────────────────────────────────▲─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                    Autonomous Multi-Agent Engine                       │
│  ├── Coordinator Agent (Event task decomposition)                      │
│  ├── Meeting Time Agent (Optimal slot computation)                     │
│  ├── WhatsApp Broadcast Agent (Opt-in verification & template engine)  │
│  ├── Media Asset Agent (Drive deliverable verification)                │
│  └── Role-Aware AI Assistant (Direct zero-chatter responses)           │
└──────────────────────────────────▲─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                      Persistence & Data Store                          │
│  ├── Client-Side Reactive Store with LocalStorage Fallback             │
│  └── FastAPI + SQLite Autopilot Backend (Optional Standalone Service)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
.
├── Hack1/                           # Primary Rally Web Platform (Next.js 16)
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/           # Operational dashboard
│   │   │   ├── members/             # Centralized member, team, and task management
│   │   │   ├── social/              # Multi-channel social & broadcast hub
│   │   │   ├── events/              # Event management & availability heatmap
│   │   │   ├── tasks/               # Kanban and list task views
│   │   │   ├── roles/               # Granular RBAC permissions
│   │   │   └── api/ai/              # Direct-response Rally AI API endpoint
│   │   ├── components/
│   │   │   ├── AppShell.tsx         # Linear/Asana inspired persistent shell
│   │   │   ├── ChatDrawer.tsx       # Zero-thought AI chat drawer
│   │   │   ├── Navbar.tsx           # Rally branded navigation
│   │   │   └── ThemeSwitcher.tsx    # Orange/Black Light & Dark mode toggle
│   │   ├── lib/
│   │   │   ├── store.ts             # Reactive application store & demo data
│   │   │   └── agents/              # Multi-agent coordination utilities
│   │   └── styles/
│   │       └── globals.css          # Orange/Black design system tokens & utilities
│   └── package.json
│
├── backend/                         # FastAPI Autonomous Operations Backend
│   ├── app/
│   │   ├── api/routes/              # Autopilot & simulation endpoints
│   │   ├── services/                # Gemma service & operations manager
│   │   └── db/                      # SQLite database layer
│   └── main.py
│
├── frontend/                        # Alternative React + Vite Simulation Console
│   └── src/
└── README.md
```

---

## Quick Start

### 1. Launching Rally Web Platform (Recommended)

```bash
cd Hack1
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Instant Demo Logins**:
  - Click **Login as Organiser** for full administrative privileges across members, teams, events, and broadcasts.
  - Click **Login as Member** to inspect the member experience with assigned tasks and personal availability.
  - Unlimited testing logins are enabled without key expiration restrictions.

### 2. Launching the Autopilot Backend (Optional)

```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

API documentation available at `http://localhost:8000/docs`.

---

## Design System & Palette

| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Orange** | `#EA580C` | `#F97316` | Key CTAs, active sidebar pills, focus rings |
| **Dark Orange** | `#C2410C` | `#EA580C` | Button hover states, bold accents |
| **Obsidian / Black** | `#121417` | `#090A0C` | Dark theme surface background & high contrast elements |
| **Border Neutral** | `#E2E8F0` | `#22272E` | Subtle enterprise dividing borders |
| **Card / Surface** | `#FFFFFF` | `#16191E` | Information-dense container cards |

---

## License

MIT License.
