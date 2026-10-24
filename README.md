# 🤖 AI Operations Manager (AIOps)

An intelligent, autonomous operational management platform designed to monitor, triage, and orchestrate systems, cloud infrastructure, and AI agent workloads in real-time.

---

## 🌟 Key Features

- **Autonomous Incident Triage**: AI-driven root cause analysis (RCA) and automated anomaly detection.
- **Agentic Workflow Execution**: Self-healing runbooks and automated remediation tasks powered by LLM agents.
- **Real-Time Telemetry & Health Monitoring**: Continuous tracking of latency, throughput, error rates, and system resources.
- **Human-in-the-Loop Governance**: Approval gates for critical infrastructure interventions and remediation steps.
- **Command & Control Dashboard**: Sleek, high-performance UI for ops engineers with dark-mode analytics, agent status, and active incident streams.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Web Dashboard (UI)                   │
│         Next.js / React + Tailwind CSS / Glassmorphism  │
└───────────────────────────▲────────────────────────────┘
                            │ REST / WebSocket
┌───────────────────────────▼────────────────────────────┐
│              FastAPI Agentic Backend (Python)          │
│   ├── Agent Orchestrator & Task Planner                │
│   ├── Anomaly Detection & Incident Triage Engine       │
│   └── Automated Remediation Runbook Executor           │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│           Infrastructure & Service Telemetry           │
│   (APIs, Logs, Metrics, Cloud Services, Model APIs)    │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── backend/                  # Python FastAPI agentic backend
│   ├── app/
│   │   ├── api/routes/       # API endpoints (incidents, agents, metrics, runbooks)
│   │   ├── core/             # Configuration & LLM engine setup
│   │   ├── models/           # Data models & schemas (Pydantic)
│   │   └── services/         # Incident detection & operational agents
│   ├── main.py               # Application entry point
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Frontend dashboard application
│   ├── src/                  # Components, pages, and state management
│   └── package.json          # Node.js dependencies
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Dashboard will be accessible at `http://localhost:3000`.

---

## 📜 License
MIT License.
