import React, { useState, useEffect } from 'react';
import {
  Bot,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  FolderGit2,
  MessageSquare,
  FileText,
  Play,
  RefreshCw,
  Plus,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Layers,
  Sparkles,
  Settings,
  Send,
  AlertCircle,
  Video,
  Image,
  FileCode,
  Sliders,
  Check,
  X,
  MapPin,
  DollarSign,
  ArrowUpRight,
  ClipboardCheck,
  Radio,
  Workflow
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const EVENT_PHASES = [
  { id: 'planning', label: '1. Planning', desc: 'Milestones & Budget' },
  { id: 'promotions', label: '2. Promotions', desc: 'Posters & Registration' },
  { id: 'event_day', label: '3. Event Day', desc: 'Live Execution' },
  { id: 'post_production', label: '4. Post-Production', desc: 'Recap & Photos' },
  { id: 'wrapup', label: '5. Wrap-Up', desc: 'Retrospective & Audit' }
];

export default function App() {
  const [events, setEvents] = useState([]);
  const [currentEventId, setCurrentEventId] = useState('EVT-ARDUINO-101');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({ has_key: false, model: 'gemma-2-9b-it', key_preview: '' });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelSelect, setModelSelect] = useState('gemma-2-9b-it');

  // Retrospective Report Cache
  const [retrospectiveReport, setRetrospectiveReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Filter for tasks tab
  const [taskPhaseFilter, setTaskPhaseFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (currentEventId) {
      loadEventState(currentEventId);
    }
  }, [currentEventId]);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/events`);
      const data = await res.json();
      setEvents(data);
      if (data.length > 0 && !data.find(e => e.id === currentEventId)) {
        setCurrentEventId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      setSettings(data);
      setModelSelect(data.model || 'gemma-2-9b-it');
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const loadEventState = async (eventId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to load event state:', err);
      showToast('Could not connect to backend server. Make sure port 8000 is active.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Phase transition
  const handlePhaseChange = async (newPhase) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/${currentEventId}/phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: newPhase })
      });
      const data = await res.json();
      setState(data);
      showToast(`Timeline advanced to ${newPhase.toUpperCase()}`, 'success');
    } catch (err) {
      showToast('Failed to update phase', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Task Status Update
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/events/${currentEventId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      setState(data);
      showToast(`Task updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update task', 'error');
    }
  };

  // Approval Action (Approve / Reject)
  const handleApprovalAction = async (approvalId, status) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/${currentEventId}/approvals/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      setState(data);
      showToast(`Approval ${status === 'approved' ? 'AUTHORIZED & Applied' : 'Declined'}`, status === 'approved' ? 'success' : 'info');
    } catch (err) {
      showToast('Failed to process approval', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Simulation 1: Volunteer Dropout
  const handleSimulateDropout = async () => {
    if (!state || !state.volunteers) return;
    const designer = state.volunteers.find(v => v.role.toLowerCase().includes('design') || v.id === 'VOL-02') || state.volunteers[1] || state.volunteers[0];
    if (!designer) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/${currentEventId}/simulation/dropout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteer_id: designer.id, reason: 'Sudden high fever & midterm exam' })
      });
      const data = await res.json();
      setState(data.state);
      setActiveTab('approvals');
      showToast(`⚠️ Dropout Injected: ${designer.name} marked unavailable! Gemma proposed reassignments in Approvals queue.`, 'warning');
    } catch (err) {
      showToast('Simulation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Simulation 2: Missing Video
  const handleSimulateMissingVideo = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/${currentEventId}/simulation/missing-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setState(data.state);
      setActiveTab('assets');
      showToast('📹 Missing Asset Simulation: Workshop concluded, Recap Reel missing! Alert queued.', 'warning');
    } catch (err) {
      showToast('Simulation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate Retrospective Report
  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events/${currentEventId}/report`);
      const data = await res.json();
      setRetrospectiveReport(data.report);
      showToast('Retrospective compiled by Gemma Auditor Agent!', 'success');
    } catch (err) {
      showToast('Failed to generate report', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  // Save Settings Modal
  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKeyInput || undefined, gemma_model: modelSelect })
      });
      const data = await res.json();
      setSettings(data);
      setShowSettingsModal(false);
      showToast('Gemma settings updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  if (loading && !state) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <RefreshCw size={36} color="var(--color-cyan)" className="animate-spin" />
        <h2 style={{ fontSize: 18, color: 'var(--text-muted)' }}>Connecting to Campus Society Autopilot & Gemma Engine...</h2>
      </div>
    );
  }

  const { event, volunteers, tasks, assets, approvals, whatsapp_drafts, audit_logs } = state || {
    event: {},
    volunteers: [],
    tasks: [],
    assets: [],
    approvals: [],
    whatsapp_drafts: [],
    audit_logs: []
  };

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const completionPct = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const missingAssets = assets.filter(a => a.status === 'missing');
  const filteredTasks = taskPhaseFilter === 'all' ? tasks : tasks.filter(t => t.phase === taskPhaseFilter);

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: 10,
          background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : (notification.type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(99, 102, 241, 0.95)'),
          color: '#ffffff',
          fontWeight: 600,
          boxShadow: '0 10px 35px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'fadeIn 0.2s ease'
        }}>
          <AlertCircle size={18} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 22,
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            width: 48,
            height: 48,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.45)'
          }}>
            <Bot size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                Campus Society Autopilot
              </h1>
              <span className="badge-atomic" style={{
                background: 'rgba(99, 102, 241, 0.18)',
                color: 'var(--color-cyan)',
                border: '1px solid rgba(99, 102, 241, 0.35)'
              }} role="status" aria-atomic="true">
                <Sparkles size={11} /> Gemma Multi-Agent
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Autonomous Operations Manager for University Events, Workshops & Hackathons
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Gemma Status Pill */}
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              background: settings.has_key ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${settings.has_key ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
              color: settings.has_key ? 'var(--color-emerald)' : 'var(--color-accent)',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)'
            }}
          >
            <Radio size={13} className="animate-pulse" />
            <span>LLM: {settings.model} {settings.has_key ? '● Connected' : '○ Free / Key Setup'}</span>
            <Settings size={13} style={{ marginLeft: 4, opacity: 0.7 }} />
          </button>

          <button 
            className="btn-secondary" 
            onClick={() => setShowNewEventModal(true)}
            style={{ fontSize: 13 }}
          >
            <Plus size={15} />
            Intake New Event
          </button>
        </div>
      </header>

      {/* Hero Bento Card: Event Parameters & Phase Progression */}
      <div className="bento-card" style={{ padding: '20px 26px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{
                textTransform: 'uppercase',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-indigo)',
                letterSpacing: '0.06em',
                background: 'rgba(99, 102, 241, 0.15)',
                padding: '2px 8px',
                borderRadius: 4
              }}>
                {event.category || 'Workshop'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} /> {event.date_str}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} /> {event.venue}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={13} /> {event.expected_audience} Attendees
              </span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <DollarSign size={13} /> {event.budget}
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 6px 0' }}>{event.title}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 800 }}>
              {event.description}
            </p>
          </div>

          {/* Phase Selector Pills with description cues */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.35)', padding: 6, borderRadius: 'var(--radius-md)' }}>
            {EVENT_PHASES.map((ph) => {
              const isActive = event.phase === ph.id;
              return (
                <button
                  key={ph.id}
                  onClick={() => handlePhaseChange(ph.id)}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: isActive ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: isActive ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <span>{ph.label}</span>
                  <span style={{ fontSize: 10, opacity: isActive ? 0.9 : 0.6, fontWeight: 400 }}>{ph.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Pitch Simulation Controller Bar */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.16), rgba(6, 182, 212, 0.12))',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 22px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'var(--color-indigo)',
            color: '#ffffff',
            borderRadius: 6,
            padding: '3px 9px',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.05em'
          }}>
            HACKATHON LIVE DEMO
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 500 }}>
            Trigger real-time operational bottlenecks to demonstrate Gemma autonomous recovery:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleSimulateDropout}
            disabled={actionLoading}
            className="btn-danger"
          >
            <AlertTriangle size={14} />
            Simulate: Designer Dropout
          </button>

          <button
            onClick={handleSimulateMissingVideo}
            disabled={actionLoading}
            className="btn-danger"
          >
            <Video size={14} />
            Simulate: Missing Recap Video
          </button>

          <button
            onClick={() => loadEventState(currentEventId)}
            className="btn-secondary"
          >
            <RefreshCw size={13} />
            Sync State
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 24,
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: 'Operations Radar', icon: Activity, badge: state?.bottlenecks_count },
          { id: 'tasks', label: 'Task Graph & Kanban', icon: Layers, badge: tasks.length },
          { id: 'volunteers', label: 'Volunteers & Capacity', icon: Users, badge: volunteers.length },
          { id: 'assets', label: 'Media & Drive Vault', icon: FolderGit2, badge: missingAssets.length > 0 ? `${missingAssets.length} Missing` : null, badgeColor: 'crimson' },
          { id: 'approvals', label: 'Lead Approvals & WhatsApp', icon: MessageSquare, badge: pendingApprovals.length > 0 ? pendingApprovals.length : null, badgeColor: 'amber' },
          { id: 'retrospective', label: 'Retrospective Report', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 20px',
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--color-cyan)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--color-cyan)' : '2px solid transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: tab.badgeColor === 'crimson' ? 'rgba(239, 68, 68, 0.25)' : (tab.badgeColor === 'amber' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.2)'),
                  color: tab.badgeColor === 'crimson' ? 'var(--color-crimson)' : (tab.badgeColor === 'amber' ? 'var(--color-accent)' : 'var(--color-indigo)'),
                  fontWeight: 700
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OPERATIONS RADAR & OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {/* Quick Stats Bento Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginBottom: 24 }}>
            <div className="bento-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
                <span>Milestone Completion</span>
                <CheckCircle2 size={16} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 10 }}>{completionPct}%</div>
              <div style={{ width: '100%', height: 7, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ width: `${completionPct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)' }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
                {completedTasks.length} of {tasks.length} tasks completed
              </div>
            </div>

            <div className="bento-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
                <span>Active Bottlenecks</span>
                <ShieldAlert size={16} color={state.bottlenecks_count > 0 ? "var(--color-crimson)" : "var(--color-emerald)"} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: state.bottlenecks_count > 0 ? "var(--color-crimson)" : "var(--text-main)", marginBottom: 6 }}>
                {state.bottlenecks_count}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {state.bottlenecks_count > 0 ? 'Tasks currently blocked by dependencies' : 'All dependency paths clear'}
              </p>
            </div>

            <div className="bento-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
                <span>Missing Media Assets</span>
                <Video size={16} color={missingAssets.length > 0 ? "var(--color-accent)" : "var(--color-emerald)"} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: missingAssets.length > 0 ? "var(--color-accent)" : "var(--text-main)", marginBottom: 6 }}>
                {missingAssets.length}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {missingAssets.length > 0 ? `${missingAssets.map(a => a.title).slice(0, 1).join('')}... pending upload` : 'All drive assets accounted for'}
              </p>
            </div>

            <div className="bento-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
                <span>Lead Approval Gates</span>
                <MessageSquare size={16} color={pendingApprovals.length > 0 ? "var(--color-indigo)" : "var(--color-emerald)"} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-indigo)', marginBottom: 6 }}>
                {pendingApprovals.length}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {pendingApprovals.length > 0 ? 'Actions awaiting coordinator review' : 'No pending human-in-the-loop gates'}
              </p>
            </div>
          </div>

          {/* Two-column layout: Agent Swarm & Audit Stream */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Active Autonomous Agent Swarm */}
            <div className="bento-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <Bot size={22} color="var(--color-cyan)" />
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>Autonomous Multi-Agent Swarm (Gemma)</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: '1. Coordinator Agent', desc: 'Decomposes workshop milestones and maps task dependency paths.', status: 'Active', color: 'emerald' },
                  { name: '2. Scheduler & Resource Agent', desc: 'Monitors volunteer capacity; reallocates orphans on volunteer dropout.', status: 'Monitoring', color: 'cyan' },
                  { name: '3. Media & Drive Tracker', desc: 'Verifies existence of posters, RAW photos, and post-event recap video.', status: missingAssets.length > 0 ? 'Alerting' : 'Idle', color: missingAssets.length > 0 ? 'accent' : 'emerald' },
                  { name: '4. Comms & WhatsApp Agent', desc: 'Drafts tailored WhatsApp notifications ready for 1-click dispatch.', status: pendingApprovals.length > 0 ? 'Queue Ready' : 'Standby', color: 'indigo' },
                  { name: '5. Retrospective Auditor', desc: 'Analyzes completion rates, bottlenecks, and generates post-event insights.', status: 'Ready on Demand', color: 'secondary' }
                ].map((ag, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{ag.name}</span>
                      <span style={{ fontSize: 11, color: `var(--color-${ag.color})`, fontWeight: 700 }} role="status" aria-atomic="true">
                        ● {ag.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{ag.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Operations Stream */}
            <div className="bento-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Activity size={22} color="var(--color-indigo)" />
                  <h3 style={{ fontSize: 17, fontWeight: 700 }}>Live Operations Audit Stream</h3>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  SQLite Persistent Logs
                </span>
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 10,
                padding: 16,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: '#34d399',
                maxHeight: 360,
                overflowY: 'auto',
                lineHeight: 1.7
              }}>
                {audit_logs.length > 0 ? (
                  audit_logs.map((log, idx) => (
                    <div key={idx} style={{ marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 4 }}>
                      {log}
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-dim)' }}>No audit events logged yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS & KANBAN GRAPH */}
      {activeTab === 'tasks' && (
        <div className="bento-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Operational Milestones & Task Graph</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {tasks.length} tasks dynamically decomposed and mapped to volunteer skillsets by Gemma
              </p>
            </div>

            {/* Filter by Phase */}
            <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 8 }}>
              {['all', 'planning', 'promotions', 'event_day', 'post_production'].map((ph) => (
                <button
                  key={ph}
                  onClick={() => setTaskPhaseFilter(ph)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    background: taskPhaseFilter === ph ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                    color: taskPhaseFilter === ph ? 'var(--color-cyan)' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {ph.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredTasks.map((t) => {
              const isBlocked = t.status === 'blocked';
              const isCompleted = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: isBlocked ? '1px solid var(--color-crimson)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{t.id}</span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: t.priority === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)',
                          color: t.priority === 'critical' ? 'var(--color-crimson)' : 'var(--color-indigo)',
                          textTransform: 'uppercase'
                        }}>
                          {t.priority}
                        </span>
                      </div>
                      <span className="badge-atomic" style={{
                        background: isCompleted ? 'rgba(16,185,129,0.18)' : (isBlocked ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)'),
                        color: isCompleted ? 'var(--color-emerald)' : (isBlocked ? 'var(--color-crimson)' : 'var(--color-accent)'),
                        textTransform: 'capitalize'
                      }} role="status" aria-atomic="true">
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{t.title}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{t.description}</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11, marginBottom: 14 }}>
                      <div style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {t.deadline_relative}
                      </div>
                      <div style={{ color: 'var(--color-indigo)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={12} /> {t.assignee_name || <span style={{ color: 'var(--color-crimson)', fontWeight: 700 }}>Unassigned!</span>}
                      </div>
                      {t.asset_required && (
                        <div style={{ color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Video size={12} /> {t.asset_required}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Phase: {t.phase}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {t.status !== 'completed' ? (
                        <button
                          onClick={() => handleTaskStatusChange(t.id, 'completed')}
                          className="btn-success"
                        >
                          <Check size={12} /> Mark Done
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTaskStatusChange(t.id, 'in_progress')}
                          className="btn-secondary"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: VOLUNTEERS & CAPACITY MATRIX */}
      {activeTab === 'volunteers' && (
        <div className="bento-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>University Society Volunteer Roster</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Real student volunteers, contacts, skillset matching, and capacity workload meters
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {volunteers.map((v) => {
              const isUnavailable = v.status === 'unavailable';
              const assignedTasks = tasks.filter(t => t.assignee_id === v.id);
              return (
                <div
                  key={v.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: isUnavailable ? '1px solid rgba(239,68,68,0.45)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: isUnavailable ? 'rgba(239,68,68,0.25)' : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                          color: isUnavailable ? 'var(--color-crimson)' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 15
                        }}>
                          {v.name.charAt(0)}
                        </div>
                        <div>
                          <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{v.name}</h4>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.role}</span>
                        </div>
                      </div>

                      <span className="badge-atomic" style={{
                        background: isUnavailable ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.18)',
                        color: isUnavailable ? 'var(--color-crimson)' : 'var(--color-emerald)',
                        textTransform: 'capitalize'
                      }} role="status" aria-atomic="true">
                        {v.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                      <div>Phone: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{v.phone}</span></div>
                      <div>Email: <span style={{ color: 'var(--text-dim)' }}>{v.email}</span></div>
                    </div>

                    {/* Workload Meter */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                        <span>Assigned Tasks</span>
                        <span>{assignedTasks.length} / {v.max_capacity} capacity</span>
                      </div>
                      <div style={{ width: '100%', height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 9999, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min((assignedTasks.length / v.max_capacity) * 100, 100)}%`,
                          height: '100%',
                          background: assignedTasks.length >= v.max_capacity ? 'var(--color-accent)' : 'var(--color-cyan)'
                        }} />
                      </div>
                    </div>

                    {/* Skills chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                      {v.skills && v.skills.map((s, idx) => (
                        <span key={idx} style={{
                          fontSize: 10,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-dim)'
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Trigger Dropout / Reassign button */}
                  <div>
                    {!isUnavailable ? (
                      <button
                        onClick={() => {
                          fetch(`${API_BASE}/events/${currentEventId}/simulation/dropout`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ volunteer_id: v.id, reason: 'Reported emergency unavailability' })
                          }).then(res => res.json()).then(data => {
                            setState(data.state);
                            setActiveTab('approvals');
                            showToast(`Simulated dropout for ${v.name}. Gemma prepared reassignments!`, 'warning');
                          });
                        }}
                        className="btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', fontSize: 12, color: 'var(--color-crimson)' }}
                      >
                        <AlertTriangle size={13} />
                        Simulate Dropout & Reassign
                      </button>
                    ) : (
                      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-crimson)', padding: '6px' }}>
                        Unavailable (Tasks reassigned via Approval Queue)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MEDIA & GOOGLE DRIVE VAULT */}
      {activeTab === 'assets' && (
        <div className="bento-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Media Deliverables & Google Drive Vault</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Verification tracker for event posters, RAW camera footage, teaser reels, and recap highlight videos
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
            {assets.map((asset) => {
              const isMissing = asset.status === 'missing';
              return (
                <div
                  key={asset.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: isMissing ? '1px solid rgba(239,68,68,0.45)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {asset.asset_type === 'recap_video' || asset.asset_type === 'teaser_video' ? (
                          <Video size={18} color="var(--color-cyan)" />
                        ) : (
                          <Image size={18} color="var(--color-indigo)" />
                        )}
                        <span style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-dim)' }}>
                          {asset.asset_type.replace('_', ' ')}
                        </span>
                      </div>

                      <span className="badge-atomic" style={{
                        background: isMissing ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.18)',
                        color: isMissing ? 'var(--color-crimson)' : 'var(--color-emerald)',
                        textTransform: 'uppercase'
                      }} role="status" aria-atomic="true">
                        {asset.status}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{asset.title}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{asset.notes || 'No extra notes'}</p>

                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14 }}>
                      <div>Expected By: <strong style={{ color: 'var(--text-main)' }}>{asset.expected_by}</strong></div>
                      <div>Responsible Role: <strong style={{ color: 'var(--color-indigo)' }}>{asset.owner_role}</strong></div>
                      <div>Drive URL: {asset.drive_url ? (
                        <a href={asset.drive_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-cyan)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          Open Drive Link <ArrowUpRight size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-crimson)' }}>Unlinked / Missing</span>
                      )}</div>
                    </div>
                  </div>

                  {/* Status Toggle & Link updater */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {isMissing ? (
                      <button
                        onClick={async () => {
                          const url = prompt('Enter Google Drive or Cloud Link:', 'https://drive.google.com/drive/folders/arduino-workshop-2026');
                          if (url) {
                            await fetch(`${API_BASE}/events/${currentEventId}/assets/${asset.id}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'uploaded', drive_url: url })
                            });
                            loadEventState(currentEventId);
                            showToast(`Uploaded Drive link for ${asset.title}!`, 'success');
                          }
                        }}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
                      >
                        <ExternalLink size={14} />
                        Link Google Drive File
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await fetch(`${API_BASE}/events/${currentEventId}/assets/${asset.id}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'missing', drive_url: null })
                          });
                          loadEventState(currentEventId);
                          showToast(`Marked ${asset.title} as missing`, 'info');
                        }}
                        className="btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
                      >
                        Mark Missing
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: LEAD APPROVALS & WHATSAPP DISPATCH */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
          {/* Left Column: Human-In-The-Loop Approval Gates */}
          <div className="bento-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={22} color="var(--color-indigo)" />
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>Human-in-the-Loop Approval Queue</h3>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {pendingApprovals.length} Action(s) Require Authorization
              </span>
            </div>

            {approvals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {approvals.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 18
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: app.approval_type === 'reallocation' ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.25)',
                          color: app.approval_type === 'reallocation' ? 'var(--color-accent)' : 'var(--color-indigo)',
                          textTransform: 'uppercase'
                        }}>
                          {app.approval_type}
                        </span>
                        <h4 style={{ fontSize: 15, fontWeight: 600, marginTop: 6, margin: '6px 0 0 0' }}>{app.title}</h4>
                      </div>

                      <span className="badge-atomic" style={{
                        background: app.status === 'approved' ? 'rgba(16,185,129,0.18)' : (app.status === 'rejected' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)'),
                        color: app.status === 'approved' ? 'var(--color-emerald)' : (app.status === 'rejected' ? 'var(--color-crimson)' : 'var(--color-accent)'),
                        textTransform: 'capitalize'
                      }} role="status" aria-atomic="true">
                        {app.status}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>{app.details}</p>

                    {/* Action buttons if pending */}
                    {app.status === 'pending' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={() => handleApprovalAction(app.id, 'rejected')}
                          className="btn-danger"
                        >
                          <X size={14} /> Decline
                        </button>
                        <button
                          onClick={() => handleApprovalAction(app.id, 'approved')}
                          className="btn-primary"
                        >
                          <Check size={14} /> Authorize & Apply
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                <ClipboardCheck size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>No actions currently require lead authorization.</p>
              </div>
            )}
          </div>

          {/* Right Column: WhatsApp Dispatcher */}
          <div className="bento-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <MessageSquare size={22} color="var(--color-emerald)" />
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>WhatsApp Message Dispatcher</h3>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Contextual messages drafted by Gemma Comms Agent with direct 1-click WhatsApp launch
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {whatsapp_drafts.map((draft) => {
                const encodedMsg = encodeURIComponent(draft.message_body);
                const cleanPhone = draft.phone ? draft.phone.replace(/[^0-9]/g, '') : '';
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
                return (
                  <div
                    key={draft.id}
                    style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 18
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{draft.recipient_name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>({draft.phone})</span>
                      </div>
                      <span className="badge-atomic" style={{
                        background: 'rgba(16,185,129,0.18)',
                        color: 'var(--color-emerald)',
                        textTransform: 'uppercase'
                      }} role="status" aria-atomic="true">
                        {draft.context.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      borderLeft: '3px solid var(--color-emerald)',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 13,
                      color: 'var(--text-main)',
                      lineHeight: 1.6,
                      marginBottom: 14
                    }}>
                      "{draft.message_body}"
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-success"
                        style={{ textDecoration: 'none' }}
                      >
                        <Send size={14} />
                        Launch WhatsApp Web (wa.me)
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RETROSPECTIVE & POST-MORTEM REPORT */}
      {activeTab === 'retrospective' && (
        <div className="bento-card" style={{ padding: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div>
              <h3 style={{ fontSize: 19, fontWeight: 700 }}>Post-Event Society Retrospective Report</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Automated post-mortem analysis synthesized by Gemma evaluating tasks, delays, assets, and society lessons learned
              </p>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={reportLoading}
              className="btn-primary"
            >
              <RefreshCw size={14} className={reportLoading ? "animate-spin" : ""} />
              {reportLoading ? 'Analyzing with Gemma...' : 'Re-Generate Retrospective'}
            </button>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 26,
            lineHeight: 1.75,
            fontSize: 14,
            maxHeight: 620,
            overflowY: 'auto'
          }}>
            {retrospectiveReport ? (
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>
                {retrospectiveReport}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                <FileText size={42} style={{ opacity: 0.3, marginBottom: 14 }} />
                <p>Click "Re-Generate Retrospective" to have Gemma analyze event completion data and synthesize the society report.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: NEW EVENT INTAKE WIZARD */}
      {showNewEventModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={22} color="var(--color-cyan)" />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Intake New Campus Event (Gemma)</h3>
              </div>
              <button onClick={() => setShowNewEventModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Provide event parameters. Gemma will autonomously generate a 15-20 task dependency breakdown, assign roles, and map deliverables.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const eventPayload = {
                title: formData.get('title'),
                category: formData.get('category'),
                date_str: formData.get('date_str'),
                venue: formData.get('venue'),
                expected_audience: parseInt(formData.get('expected_audience') || '50', 10),
                budget: formData.get('budget'),
                description: formData.get('description'),
                volunteers: [
                  { name: 'Lead Coordinator', role: 'Event Lead', phone: '+1234567890', skills: ['Management', 'Hosting'] },
                  { name: 'Visual Artist', role: 'Design & Creative', phone: '+1234567891', skills: ['Figma', 'Posters'] },
                  { name: 'Camera Crew', role: 'Media & Videography', phone: '+1234567892', skills: ['Photography', 'Reel Editing'] },
                  { name: 'Logistics Officer', role: 'Logistics & Tech', phone: '+1234567893', skills: ['Hardware', 'Lab Check'] },
                  { name: 'PR Ambassador', role: 'Social Media & PR', phone: '+1234567894', skills: ['WhatsApp Outreach', 'Promotions'] }
                ]
              };

              setActionLoading(true);
              try {
                const res = await fetch(`${API_BASE}/events`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(eventPayload)
                });
                const data = await res.json();
                setCurrentEventId(data.event_id);
                setState(data.state);
                setShowNewEventModal(false);
                fetchEvents();
                showToast(`New Event '${eventPayload.title}' created and scaffolded!`, 'success');
              } catch (err) {
                showToast('Failed to create event', 'error');
              } finally {
                setActionLoading(false);
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Event Title</label>
                  <input name="title" defaultValue="Inter-University AI & Robotics Hackathon" required className="input-field" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Category</label>
                    <select name="category" className="input-field" style={{ background: '#0a0d14' }}>
                      <option value="workshop">Workshop</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="seminar">Seminar</option>
                      <option value="competition">Competition</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Expected Audience</label>
                    <input name="expected_audience" type="number" defaultValue="80" className="input-field" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Date</label>
                    <input name="date_str" defaultValue="Dec 05, 2026" className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Venue</label>
                    <input name="venue" defaultValue="Auditorium Hall B" className="input-field" />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Description & Goals</label>
                  <textarea name="description" rows={3} defaultValue="Flagship annual hackathon bringing together 80 engineering students to build autonomous hardware & AI applications." className="input-field" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                  <button type="button" onClick={() => setShowNewEventModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn-primary">
                    <Sparkles size={14} />
                    Generate Event Operations with Gemma
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GEMMA LLM SETTINGS */}
      {showSettingsModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color="var(--color-cyan)" />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Gemma LLM Configuration</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Campus Society Autopilot runs on Google's <strong>Gemma</strong> models via Google AI Studio API.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                  Google AI Studio API Key
                </label>
                <input
                  type="password"
                  placeholder={settings.key_preview ? `Current: ${settings.key_preview}` : 'Paste API Key (e.g. AIzaSy...)'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="input-field"
                />
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 5 }}>
                  Get your free API key at{' '}
                  <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--color-cyan)' }}>
                    aistudio.google.com ↗
                  </a>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                  Gemma Model Variant
                </label>
                <select
                  value={modelSelect}
                  onChange={(e) => setModelSelect(e.target.value)}
                  className="input-field"
                  style={{ background: '#0a0d14' }}
                >
                  <option value="gemma-2-9b-it">gemma-2-9b-it (Recommended & Fast)</option>
                  <option value="gemma-2-27b-it">gemma-2-27b-it (High Reasoning)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button onClick={() => setShowSettingsModal(false)} className="btn-secondary">Close</button>
                <button onClick={handleSaveSettings} className="btn-primary">
                  Save Credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
