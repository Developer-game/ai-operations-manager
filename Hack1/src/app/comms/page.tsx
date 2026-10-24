'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { Navbar } from '@/components/Navbar';
import { ChatDrawer } from '@/components/ChatDrawer';
import { SanitizedText } from '@/components/SanitizedText';
import { draftWhatsAppMessage, WhatsAppTemplateType } from '@/lib/agents/whatsAppAgent';
import { hasPermission } from '@/lib/permissions';
import {
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldCheck,
  Building,
  UserCheck,
  Share2,
  CheckCheck,
  Users,
} from 'lucide-react';

export default function CommsAndCollaborationPage() {
  const currentOrg = store.getCurrentOrg();
  const currentUser = store.getCurrentUser();
  const { role } = store.getCurrentMembership();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [templateType, setTemplateType] = useState<WhatsAppTemplateType>('urgent_alert');
  const [customNote, setCustomNote] = useState('');
  const [draftResult, setDraftResult] = useState(
    draftWhatsAppMessage(currentOrg?.id || '', 'urgent_alert', { customNote: 'Please check your tasks.' })
  );
  const [sendSuccess, setSendSuccess] = useState('');

  const [targetSlug, setTargetSlug] = useState('imperial-ai');
  const [sharedSpaceName, setSharedSpaceName] = useState('RoboAI Autonomous Challenge Space');
  const [collabNotice, setCollabNotice] = useState('');

  if (!currentOrg) return null;

  const events = store.getEvents(currentOrg.id);
  const collaborations = store.getCollaborations(currentOrg.id);

  const handleGenerateDraft = () => {
    const draft = draftWhatsAppMessage(currentOrg.id, templateType, {
      eventTitle: events[0]?.title || 'Autonomous Demonstration',
      location: events[0]?.location || 'Campus Quad',
      customNote,
    });
    setDraftResult(draft);
    setSendSuccess('');
    toast.info(`Drafted WhatsApp template "${draft.templateName}"`, 'Template Ready');
  };

  const handleSendWhatsApp = () => {
    store.logAction('whatsapp.broadcast', 'comms', undefined, {
      template: draftResult.templateName,
      recipients: draftResult.eligibleRecipients.length,
    });
    toast.success(
      `Dispatched template "${draftResult.templateName}" to ${draftResult.eligibleRecipients.length} opted-in members!`,
      'WhatsApp Broadcast Dispatched'
    );
    setSendSuccess(
      `Dispatched WhatsApp template "${draftResult.templateName}" to ${draftResult.eligibleRecipients.length} opted-in members!`
    );
    setTimeout(() => setSendSuccess(''), 4000);
  };

  const handleInviteCollab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSlug.trim() || !sharedSpaceName.trim()) return;

    const res = store.createCollaboration(currentOrg.id, targetSlug, sharedSpaceName);
    toast.success(res.message, 'Joint Space Created');
    setCollabNotice(res.message);
    setTimeout(() => setCollabNotice(''), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar onOpenChat={() => setIsChatOpen(true)} />

      <main className="container" style={{ flex: 1, paddingTop: '1.75rem', paddingBottom: '3.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>
              WhatsApp Comms and Partner Collaboration
            </h1>
            <span className="badge badge-success">Meta Cloud API</span>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            <SanitizedText>
              Draft tone appropriate broadcast messages with member phone opt in consent, and manage isolated joint society spaces.
            </SanitizedText>
          </p>
        </div>

        {sendSuccess && (
          <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem' }}>
            <CheckCircle2 size={16} />
            <span>{sendSuccess}</span>
          </div>
        )}

        {/* 2-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {/* Column 1: WhatsApp Comms Agent Studio */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(37, 211, 102, 0.15)',
                  color: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={20} />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>WhatsApp Comms Studio</h2>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.55 }}>
              <SanitizedText>
                Only contacts members who have explicitly opted in with verified phone numbers. Uses Meta approved template structures.
              </SanitizedText>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label htmlFor="wa-temp">Message Purpose & Approved Template</label>
                <select
                  id="wa-temp"
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as WhatsAppTemplateType)}
                >
                  <option value="urgent_alert">Urgent Alert (Critical event / flight updates)</option>
                  <option value="broadcast_invite">Broadcast Invite (General society invitation)</option>
                  <option value="polite_checkin">Polite Check-in (Duty and task progress)</option>
                </select>
              </div>

              <div>
                <label htmlFor="wa-note">Custom Instruction / Add-on Note</label>
                <input
                  id="wa-note"
                  type="text"
                  placeholder="e.g. Please bring safety goggles and sensor manuals"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateDraft}
                className="btn btn-secondary"
                style={{ minHeight: '40px', fontSize: '0.8125rem' }}
              >
                <Sparkles size={16} />
                <span>Re-draft Template with Gemma 4</span>
              </button>
            </div>

            {/* Realistic WhatsApp Chat Bubble Mockup */}
            <div
              style={{
                borderRadius: '0.75rem',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  OFFICIAL TEMPLATE: {draftResult.templateName}
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                  {draftResult.eligibleRecipients.length} Opted-In
                </span>
              </div>

              {/* Chat Bubble Box */}
              <div
                style={{
                  backgroundColor: 'rgba(37, 211, 102, 0.1)',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  borderRadius: '0.75rem 0.75rem 0.75rem 0.15rem',
                  padding: '1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  position: 'relative',
                  marginBottom: '0.75rem',
                }}
              >
                <SanitizedText>{draftResult.body}</SanitizedText>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  <span>14:35</span>
                  <CheckCheck size={14} color="#25D366" />
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {draftResult.optedOutCount} member did not opt in to WhatsApp alerts and will be notified via university email only.
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '46px' }}
            >
              <Send size={16} />
              <span>Review and Send WhatsApp Broadcast</span>
            </button>
          </div>

          {/* Column 2: Cross-Organisation Collaboration Hub */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--brand-primary-subtle)',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building size={20} />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>Society Collaborations</h2>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.55 }}>
              <SanitizedText>
                Partner with other societies. Both organisations must accept. Shared teams and events exist in an isolated workspace with no cross data leakage.
              </SanitizedText>
            </p>

            {collabNotice && (
              <div className="badge badge-info" style={{ width: '100%', padding: '0.625rem', marginBottom: '1rem' }}>
                <span>{collabNotice}</span>
              </div>
            )}

            {/* Active Partnerships List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                Active Collaborative Spaces
              </div>

              {collaborations.map((collab) => (
                <div
                  key={collab.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.625rem',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      <SanitizedText>{collab.sharedSpaceName}</SanitizedText>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Partner Society: Imperial AI Society
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                    {collab.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInviteCollab} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Invite Another Society
              </div>

              <div>
                <label htmlFor="co-slug">Target Society Slug</label>
                <input
                  id="co-slug"
                  type="text"
                  placeholder="e.g. imperial-ai"
                  value={targetSlug}
                  onChange={(e) => setTargetSlug(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="co-name">Shared Space Name</label>
                <input
                  id="co-name"
                  type="text"
                  placeholder="e.g. Joint Robotics & AI Hackathon"
                  value={sharedSpaceName}
                  onChange={(e) => setSharedSpaceName(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ marginTop: '0.25rem' }}>
                Send Collaboration Request
              </button>
            </form>
          </div>
        </div>
      </main>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
