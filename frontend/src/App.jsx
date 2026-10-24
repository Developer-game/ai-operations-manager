import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Bot, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Server, 
  Cpu, 
  Radio, 
  Check, 
  Zap,
  Clock,
  Layers
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

const DEFAULT_METRICS = [
  { name: 'System Health', value: 98.4, unit: '%', status: 'healthy', change_pct: +0.6 },
  { name: 'Active Incidents', value: 3, unit: 'items', status: 'warning', change_pct: -25.0 },
  { name: 'Mean Time to Resolution', value: 4.2, unit: 'min', status: 'healthy', change_pct: -18.4 },
  { name: 'Autonomous Action Rate', value: 89.1, unit: '%', status: 'healthy', change_pct: +5.2 }
];

const DEFAULT_INCIDENTS = [
  {
    id: 'INC-1042',
    title: 'Elevated Latency on Payment Gateway API',
    service: 'payment-service',
    severity: 'high',
    status: 'investigating',
    detected_at: '2 mins ago',
    root_cause: 'Connection pool exhaustion in Postgres read-replica',
    suggested_action: 'Scale DB read replicas & purge idle connection pools',
    ai_confidence: 0.94
  },
  {
    id: 'INC-1043',
    title: 'Memory Spike in Inference Worker Cluster',
    service: 'ai-inference-engine',
    severity: 'critical',
    status: 'remediating',
    detected_at: '6 mins ago',
    root_cause: 'KV Cache leak during long-context batch generation',
    suggested_action: 'Perform graceful worker pod rollout and recycle worker nodes',
    ai_confidence: 0.98
  },
  {
    id: 'INC-1044',
    title: 'SSL Certificate Expiry Warning (< 7 Days)',
    service: 'edge-cdn',
    severity: 'medium',
    status: 'open',
    detected_at: '18 mins ago',
    root_cause: 'Automated Let\'s Encrypt cron renewal failed challenge',
    suggested_action: 'Trigger manual DNS-01 challenge renewal via Certbot',
    ai_confidence: 0.99
  }
];

const DEFAULT_AGENTS = [
  {
    id: 'AGT-01',
    name: 'Triage-Sentinel',
    role: 'Log & Telemetry Anomaly Investigator',
    status: 'active',
    current_task: 'Analyzing log traces for payment-service',
    actions_count: 1420,
    accuracy_rate: 0.97
  },
  {
    id: 'AGT-02',
    name: 'Remediation-Bot',
    role: 'Autonomous Runbook & Cloud Orchestrator',
    status: 'active',
    current_task: 'Rolling restart on inference-worker-pod-4',
    actions_count: 874,
    accuracy_rate: 0.99
  },
  {
    id: 'AGT-03',
    name: 'Capacity-Planner',
    role: 'Predictive Resource Autoscaling',
    status: 'idle',
    current_task: 'Monitoring spot instance pricing signals',
    actions_count: 320,
    accuracy_rate: 0.96
  }
];

export default function App() {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [incidents, setIncidents] = useState(DEFAULT_INCIDENTS);
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [logs, setLogs] = useState([
    '[13:14:02] [Sentinel] Anomalous latency spike detected in service: payment-service (p99 > 850ms)',
    '[13:14:15] [Sentinel] Correlating telemetry traces with DB connection pool status...',
    '[13:14:28] [Remediation-Bot] Queued remediation: scale read replicas to +2 instances'
  ]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Attempt backend connection on mount
  useEffect(() => {
    fetch(`${API_BASE}/metrics`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setBackendConnected(true);
      })
      .catch(() => {
        setBackendConnected(false);
      });
  }, []);

  const handleTriage = (id) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { ...inc, status: 'investigating' };
      }
      return inc;
    }));
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [User Action] Triggered manual triage inspection for ${id}`, ...prev]);
  };

  const handleRemediate = (id) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { ...inc, status: 'resolved' };
      }
      return inc;
    }));
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [Remediation-Bot] Successfully applied automated remediation for ${id}`, ...prev]);
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingBottom: 24,
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)', 
            width: 44, 
            height: 44, 
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Bot size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
              AI Operations Manager
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Autonomous Infrastructure & Agentic Incident Orchestration
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 9999,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--color-emerald)',
            fontSize: 13,
            fontWeight: 500
          }}>
            <Radio size={14} className="animate-pulse" />
            <span>Autonomous Mode: Active</span>
          </div>

          <div style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: backendConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${backendConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            fontSize: 12,
            color: backendConnected ? 'var(--color-emerald)' : 'var(--color-amber)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Server size={14} />
            <span>API: {backendConnected ? 'Connected (Port 8000)' : 'Standalone / Mock'}</span>
          </div>
        </div>
      </header>

      {/* Metric Cards Row */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
        {metrics.map((m, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{m.name}</span>
              <Activity size={18} color="var(--color-cyan)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em' }}>{m.value}</span>
              <span style={{ fontSize: 16, color: 'var(--text-dim)' }}>{m.unit}</span>
            </div>
            <div style={{ 
              marginTop: 10, 
              fontSize: 12, 
              color: m.change_pct >= 0 ? 'var(--color-emerald)' : 'var(--color-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <Zap size={12} />
              <span>{m.change_pct >= 0 ? `+${m.change_pct}%` : `${m.change_pct}%`} vs last 24h</span>
            </div>
          </div>
        ))}
      </section>

      {/* Main Grid: Incidents & Autonomous Agents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Active Incidents Column */}
        <section className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={20} color="var(--color-crimson)" />
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>Active Operational Incidents</h2>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{incidents.length} Detected</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {incidents.map((inc) => (
              <div 
                key={inc.id} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 10, 
                  padding: 16 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        background: inc.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: inc.severity === 'critical' ? 'var(--color-crimson)' : 'var(--color-amber)',
                        textTransform: 'uppercase'
                      }}>
                        {inc.severity}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{inc.id}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {inc.service}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>{inc.title}</h3>
                  </div>

                  <span style={{
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    background: inc.status === 'resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    color: inc.status === 'resolved' ? 'var(--color-emerald)' : 'var(--color-indigo)',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}>
                    {inc.status}
                  </span>
                </div>

                {inc.root_cause && (
                  <div style={{ 
                    marginTop: 10, 
                    padding: 10, 
                    borderRadius: 6, 
                    background: 'rgba(0, 0, 0, 0.3)',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    borderLeft: '3px solid var(--color-indigo)'
                  }}>
                    <strong style={{ color: 'var(--text-main)' }}>AI Root Cause:</strong> {inc.root_cause}
                    <div style={{ marginTop: 4, color: 'var(--color-cyan)' }}>
                      <strong>Recommended Fix:</strong> {inc.suggested_action}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                  {inc.status !== 'resolved' && (
                    <>
                      <button 
                        onClick={() => handleTriage(inc.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)',
                          padding: '6px 14px',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <RefreshCw size={12} />
                        Run AI Triage
                      </button>
                      <button 
                        onClick={() => handleRemediate(inc.id)}
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                          border: 'none',
                          color: '#fff',
                          padding: '6px 14px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        <Play size={12} />
                        Auto-Remediate
                      </button>
                    </>
                  )}
                  {inc.status === 'resolved' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-emerald)', fontSize: 13 }}>
                      <CheckCircle2 size={16} />
                      <span>Remediation verified</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Autonomous Ops Agents Swarm */}
        <section className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Bot size={20} color="var(--color-cyan)" />
            <h2 style={{ fontSize: 17, fontWeight: 600 }}>Active Agent Swarm</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {agents.map((agent) => (
              <div 
                key={agent.id}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 10, 
                  padding: 16 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: agent.status === 'active' ? 'var(--color-emerald)' : 'var(--text-dim)',
                      boxShadow: agent.status === 'active' ? '0 0 8px var(--color-emerald)' : 'none'
                    }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{agent.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {(agent.accuracy_rate * 100).toFixed(0)}% Accuracy
                  </span>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>{agent.role}</p>

                {agent.current_task && (
                  <div style={{ 
                    fontSize: 12, 
                    color: 'var(--text-muted)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    padding: '6px 10px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 6
                  }}>
                    <Cpu size={12} color="var(--color-indigo)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {agent.current_task}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Live Operations Stream / Terminal */}
      <section className="glass-panel" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Terminal size={18} color="var(--color-indigo)" />
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Live Operations Audit Stream</h2>
        </div>
        <div style={{ 
          background: 'rgba(5, 7, 12, 0.95)', 
          borderRadius: 8, 
          padding: 14, 
          fontFamily: 'var(--font-mono)', 
          fontSize: 12,
          color: '#34d399',
          maxHeight: 140,
          overflowY: 'auto',
          lineHeight: 1.6
        }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
