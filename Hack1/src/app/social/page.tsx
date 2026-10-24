'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { AppShell } from '@/components/AppShell';
import { SanitizedText } from '@/components/SanitizedText';
import { generateSocialCampaign, stageGeneratedPost } from '@/lib/agents/mediaAssetAgent';
import { draftWhatsAppMessage, WhatsAppTemplateType } from '@/lib/agents/whatsAppAgent';
import { hasPermission } from '@/lib/permissions';
import {
  Share2,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Calendar,
  Lock,
  Heart,
  MessageCircle,
  Bookmark,
  ThumbsUp,
  Repeat,
  Phone,
  MessageSquare,
  Radio,
  Sliders,
  CheckCheck,
  Users,
  Settings,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { SocialPlatform, SocialPost } from '@/types';

function InstagramIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function SocialMediaHubPage() {
  const currentOrg = store.getCurrentOrg();
  const currentUser = store.getCurrentUser();
  const { role } = store.getCurrentMembership();

  const canManageSocial = hasPermission(role, 'social.manage') || role?.isOwner;

  // Active section tab: 'whatsapp' | 'instagram' | 'linkedin' | 'history'
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'instagram' | 'linkedin' | 'history'>('whatsapp');

  // WhatsApp Broadcast state
  const [whatsappAttached, setWhatsappAttached] = useState(true);
  const [broadcastChannelName, setBroadcastChannelName] = useState('Imperial Robotics Official Broadcast');
  const [phoneNumberId, setPhoneNumberId] = useState('whatsapp-biz-2026-9941');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [templateType, setTemplateType] = useState<WhatsAppTemplateType>('urgent_alert');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'specific_team' | 'event'>('all');
  const [selectedTeamTarget, setSelectedTeamTarget] = useState('');
  const [customWhatsAppBody, setCustomWhatsAppBody] = useState('');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Instagram state
  const [igCaption, setIgCaption] = useState(
    'Excited to announce our upcoming Autonomous Drone Challenge! 🚀 Over 40 university teams building open-source quadcopters. Tap the link in bio to register.\n\n#Robotics #ImperialCollege #AI #STEM #Engineering'
  );
  const [igImageUrl, setIgImageUrl] = useState(
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
  );
  const [igAspectRatio, setIgAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [isPublishingIg, setIsPublishingIg] = useState(false);

  // LinkedIn state
  const [liHeadline, setLiHeadline] = useState('Autonomous Robotics Showcase: Building the Future of University AI');
  const [liBody, setLiBody] = useState(
    'We are thrilled to celebrate the kickoff of the 2026 Society term! Our student members have completed early prototyping on computer-vision navigation and obstacle detection.\n\nSpecial thanks to our university society sponsors and department mentors for providing lab space and computing hardware.\n\nAre you an engineering alumnus or industry partner interested in mentoring student teams? Connect with our team or drop a comment below.'
  );
  const [liTargetAudience, setLiTargetAudience] = useState<'public' | 'alumni' | 'industry'>('public');
  const [isPublishingLi, setIsPublishingLi] = useState(false);

  // AI draft generator state
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  if (!currentOrg || !currentUser) return null;

  const events = store.getEvents(currentOrg.id);
  const teams = store.getTeams(currentOrg.id);
  const posts = store.getSocialPosts(currentOrg.id);
  const allMembers = store.getMembersAndInvites(currentOrg.id);
  const optedInCount = allMembers.filter((m) => m.user && (m.user as any).phoneOptIn !== false).length;

  // Generate AI copy for Instagram
  const handleAiGenerateIg = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const targetEvent = events[0];
      const draft = generateSocialCampaign(targetEvent?.id || '', 'instagram');
      setIgCaption(draft.caption);
      if (draft.suggestedImageUrl) setIgImageUrl(draft.suggestedImageUrl);
      setIsAiGenerating(false);
      toast.success('AI drafted new Instagram copy with hashtags!', 'Content Generated');
    }, 400);
  };

  // Generate AI copy for LinkedIn
  const handleAiGenerateLi = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const targetEvent = events[0];
      const draft = generateSocialCampaign(targetEvent?.id || '', 'linkedin');
      setLiBody(draft.caption);
      setIsAiGenerating(false);
      toast.success('AI drafted executive LinkedIn article copy!', 'Content Generated');
    }, 400);
  };

  // Dispatch WhatsApp Broadcast
  const handleDispatchWhatsApp = () => {
    setIsSendingWhatsApp(true);

    const messageText =
      customWhatsAppBody.trim() ||
      draftWhatsAppMessage(currentOrg.id, templateType, {
        eventTitle: events[0]?.title || 'Robotics Term Showcase',
        location: events[0]?.location || 'Main Lecture Theatre 1',
      }).body;

    setTimeout(() => {
      store.logAction('whatsapp.broadcast', 'comms', undefined, {
        channelName: broadcastChannelName,
        recipientFilter,
        messagePreview: messageText.slice(0, 80),
        recipientsCount: optedInCount,
      });

      // Add to store socialPosts log
      store.createSocialPost({
        organisationId: currentOrg.id,
        platform: 'twitter' as any, // Representing WhatsApp broadcast in log
        caption: `[WhatsApp Broadcast to ${optedInCount} members]: ${messageText}`,
        status: 'posted',
        postedAt: new Date().toISOString(),
      });

      setIsSendingWhatsApp(false);
      toast.success(
        `WhatsApp broadcast sent to ${optedInCount} opted-in members via attached broadcast channel!`,
        'Broadcast Dispatched'
      );
      setCustomWhatsAppBody('');
    }, 500);
  };

  // Publish / Schedule Instagram Post
  const handlePublishInstagram = (schedule = false) => {
    setIsPublishingIg(true);
    setTimeout(() => {
      const newPost = store.createSocialPost({
        organisationId: currentOrg.id,
        platform: 'instagram',
        caption: igCaption,
        status: schedule ? 'scheduled' : 'posted',
        scheduledFor: schedule ? new Date(Date.now() + 86400000).toISOString() : undefined,
        postedAt: schedule ? undefined : new Date().toISOString(),
      });

      setIsPublishingIg(false);
      if (schedule) {
        toast.success('Instagram post scheduled for tomorrow morning!', 'Scheduled');
      } else {
        toast.success('Post published directly to society Instagram feed!', 'Published');
      }
    }, 400);
  };

  // Publish / Schedule LinkedIn Post
  const handlePublishLinkedIn = (schedule = false) => {
    setIsPublishingLi(true);
    setTimeout(() => {
      const fullContent = `${liHeadline}\n\n${liBody}`;
      store.createSocialPost({
        organisationId: currentOrg.id,
        platform: 'linkedin',
        caption: fullContent,
        status: schedule ? 'scheduled' : 'posted',
        scheduledFor: schedule ? new Date(Date.now() + 86400000).toISOString() : undefined,
        postedAt: schedule ? undefined : new Date().toISOString(),
      });

      setIsPublishingLi(false);
      if (schedule) {
        toast.success('LinkedIn announcement scheduled!', 'Scheduled');
      } else {
        toast.success('Announcement published to society LinkedIn page!', 'Published');
      }
    }, 400);
  };

  return (
    <AppShell>
      {/* Top Banner & Title */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>
                Social & Broadcast Management
              </h1>
              <span
                className="badge"
                style={{
                  backgroundColor: 'var(--brand-primary-subtle)',
                  color: 'var(--brand-primary-text)',
                  border: '1px solid var(--brand-primary)',
                  fontSize: '0.6875rem',
                }}
              >
                Multi-Channel
              </span>
            </div>
            <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>
              <SanitizedText>
                Manage attached WhatsApp broadcast lists, compose posts for Instagram and LinkedIn, and review cross-platform analytics.
              </SanitizedText>
            </p>
          </div>
        </div>
      </div>

      {/* Channel Switcher Tabs (Linear / Asana inspired) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.25rem',
          paddingBottom: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveChannel('whatsapp')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.875rem',
            fontSize: '0.84375rem',
            fontWeight: activeChannel === 'whatsapp' ? 600 : 500,
            color: activeChannel === 'whatsapp' ? '#25D366' : 'var(--text-muted)',
            borderBottom: activeChannel === 'whatsapp' ? '2px solid #25D366' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          <Phone size={15} color="#25D366" />
          <span>WhatsApp Broadcast</span>
          <span
            className="status-pill"
            style={{
              backgroundColor: whatsappAttached ? '#DCFCE7' : 'var(--badge-warning-bg)',
              color: whatsappAttached ? '#15803D' : 'var(--badge-warning-text)',
              fontSize: '0.6875rem',
            }}
          >
            {whatsappAttached ? 'Attached' : 'Unattached'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannel('instagram')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.875rem',
            fontSize: '0.84375rem',
            fontWeight: activeChannel === 'instagram' ? 600 : 500,
            color: activeChannel === 'instagram' ? '#E1306C' : 'var(--text-muted)',
            borderBottom: activeChannel === 'instagram' ? '2px solid #E1306C' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          <InstagramIcon size={15} color="#E1306C" />
          <span>Instagram Page</span>
          <span
            className="badge"
            style={{
              fontSize: '0.6875rem',
              backgroundColor: 'var(--bg-surface-elevated)',
            }}
          >
            @imperial_robotics
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannel('linkedin')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.875rem',
            fontSize: '0.84375rem',
            fontWeight: activeChannel === 'linkedin' ? 600 : 500,
            color: activeChannel === 'linkedin' ? '#0A66C2' : 'var(--text-muted)',
            borderBottom: activeChannel === 'linkedin' ? '2px solid #0A66C2' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          <LinkedinIcon size={15} color="#0A66C2" />
          <span>LinkedIn Page</span>
          <span
            className="badge"
            style={{
              fontSize: '0.6875rem',
              backgroundColor: 'var(--bg-surface-elevated)',
            }}
          >
            Alumni & Industry
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannel('history')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.875rem',
            fontSize: '0.84375rem',
            fontWeight: activeChannel === 'history' ? 600 : 500,
            color: activeChannel === 'history' ? 'var(--brand-primary-text)' : 'var(--text-muted)',
            borderBottom: activeChannel === 'history' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          <Clock size={15} />
          <span>History & Scheduled ({posts.length})</span>
        </button>
      </div>

      {/* TAB 1: WHATSAPP BROADCAST */}
      {activeChannel === 'whatsapp' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {/* Left: Broadcast Configuration & Message Composer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Attached Broadcast Status Card */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: '4px solid #25D366',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0 }}>
                      {broadcastChannelName}
                    </h3>
                    <div style={{ fontSize: '0.71875rem', color: '#15803D', fontWeight: 600 }}>
                      • Attached via WhatsApp Cloud API
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAttachModal(true)}
                  className="btn btn-secondary"
                  style={{ minHeight: '30px', padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                >
                  <Settings size={12} />
                  <span>Configure</span>
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.78125rem',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.375rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Channel ID: </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{phoneNumberId}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Opted-In Members: </span>
                  <span style={{ fontWeight: 600, color: '#15803D' }}>{optedInCount} of {allMembers.length}</span>
                </div>
              </div>
            </div>

            {/* Broadcast Composer */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>
                Compose Broadcast Message
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Recipient Filter */}
                <div>
                  <label style={{ fontSize: '0.78125rem' }}>Target Audience</label>
                  <select
                    value={recipientFilter}
                    onChange={(e) => setRecipientFilter(e.target.value as any)}
                    style={{ fontSize: '0.8125rem', minHeight: '36px' }}
                  >
                    <option value="all">All Opted-In Society Members ({optedInCount} recipients)</option>
                    <option value="specific_team">Specific Team / Squad only</option>
                    <option value="event">Upcoming Event Attendees only</option>
                  </select>
                </div>

                {recipientFilter === 'specific_team' && (
                  <div>
                    <label style={{ fontSize: '0.78125rem' }}>Select Target Team</label>
                    <select
                      value={selectedTeamTarget}
                      onChange={(e) => setSelectedTeamTarget(e.target.value)}
                      style={{ fontSize: '0.8125rem', minHeight: '36px' }}
                    >
                      <option value="">Choose team...</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Template Preset Selector */}
                <div>
                  <label style={{ fontSize: '0.78125rem' }}>Message Template</label>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateType('urgent_alert');
                        setCustomWhatsAppBody('');
                      }}
                      className={`filter-chip ${templateType === 'urgent_alert' ? 'active' : ''}`}
                    >
                      Urgent Alert
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateType('broadcast_invite');
                        setCustomWhatsAppBody('');
                      }}
                      className={`filter-chip ${templateType === 'broadcast_invite' ? 'active' : ''}`}
                    >
                      Broadcast Invite
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateType('polite_checkin');
                        setCustomWhatsAppBody('');
                      }}
                      className={`filter-chip ${templateType === 'polite_checkin' ? 'active' : ''}`}
                    >
                      Member Check-in
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div>
                  <label style={{ fontSize: '0.78125rem' }}>Custom Text or Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Type broadcast text or overrides for the message..."
                    value={customWhatsAppBody}
                    onChange={(e) => setCustomWhatsAppBody(e.target.value)}
                    style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDispatchWhatsApp}
                  disabled={isSendingWhatsApp}
                  style={{
                    minHeight: '40px',
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <Send size={15} />
                  <span>{isSendingWhatsApp ? 'Dispatching...' : `Dispatch to ${optedInCount} Members`}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Realistic WhatsApp Mobile Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '360px',
                borderRadius: '1.25rem',
                border: '1px solid var(--border-color)',
                backgroundColor: '#0B141A',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                color: '#E9EDEF',
              }}
            >
              {/* WhatsApp App Bar */}
              <div
                style={{
                  backgroundColor: '#202C33',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  borderBottom: '1px solid #2A3942',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: '#fff',
                  }}
                >
                  R
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {broadcastChannelName}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#8696A0' }}>
                    Broadcast Channel • {optedInCount} recipients
                  </div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div
                style={{
                  padding: '1.25rem 1rem',
                  minHeight: '340px',
                  backgroundColor: '#0B141A',
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                {/* Outgoing Message Bubble */}
                <div
                  style={{
                    alignSelf: 'flex-end',
                    maxWidth: '88%',
                    backgroundColor: '#005C4B',
                    color: '#E9EDEF',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.5rem',
                    borderTopRightRadius: '0.125rem',
                    boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                    fontSize: '0.84375rem',
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {customWhatsAppBody.trim() ||
                      draftWhatsAppMessage(currentOrg.id, templateType, {
                        eventTitle: events[0]?.title || 'Robotics Term Showcase',
                        location: events[0]?.location || 'Main Lecture Theatre 1',
                      }).body}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.25rem',
                      fontSize: '0.6875rem',
                      color: '#8696A0',
                      marginTop: '0.25rem',
                    }}
                  >
                    <span>12:00</span>
                    <CheckCheck size={14} color="#53BDEB" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INSTAGRAM MANAGEMENT */}
      {activeChannel === 'instagram' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {/* Post Editor */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <InstagramIcon size={20} color="#E1306C" />
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
                  Create Instagram Post
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAiGenerateIg}
                disabled={isAiGenerating}
                className="btn btn-secondary"
                style={{ minHeight: '32px', padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
              >
                <Sparkles size={13} color="var(--brand-primary)" />
                <span>{isAiGenerating ? 'Drafting...' : 'AI Generate Caption'}</span>
              </button>
            </div>

            {/* Media URL / Asset */}
            <div>
              <label style={{ fontSize: '0.78125rem' }}>Post Visual URL</label>
              <input
                type="text"
                value={igImageUrl}
                onChange={(e) => setIgImageUrl(e.target.value)}
                style={{ fontSize: '0.8125rem', minHeight: '36px' }}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <label style={{ fontSize: '0.78125rem' }}>Aspect Ratio</label>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button
                  type="button"
                  onClick={() => setIgAspectRatio('1:1')}
                  className={`filter-chip ${igAspectRatio === '1:1' ? 'active' : ''}`}
                >
                  1:1 Square
                </button>
                <button
                  type="button"
                  onClick={() => setIgAspectRatio('4:5')}
                  className={`filter-chip ${igAspectRatio === '4:5' ? 'active' : ''}`}
                >
                  4:5 Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setIgAspectRatio('9:16')}
                  className={`filter-chip ${igAspectRatio === '9:16' ? 'active' : ''}`}
                >
                  9:16 Story
                </button>
              </div>
            </div>

            {/* Caption & Hashtags */}
            <div>
              <label style={{ fontSize: '0.78125rem' }}>Caption & Hashtags</label>
              <textarea
                rows={6}
                value={igCaption}
                onChange={(e) => setIgCaption(e.target.value)}
                style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}
              />
            </div>

            {/* Publishing Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => handlePublishInstagram(false)}
                disabled={isPublishingIg}
                className="btn btn-primary"
                style={{ flex: 1, minHeight: '38px', fontSize: '0.84375rem' }}
              >
                Post Now to Instagram
              </button>
              <button
                type="button"
                onClick={() => handlePublishInstagram(true)}
                disabled={isPublishingIg}
                className="btn btn-secondary"
                style={{ minHeight: '38px', fontSize: '0.84375rem' }}
              >
                <Clock size={14} />
                <span>Schedule</span>
              </button>
            </div>
          </div>

          {/* Live Instagram Feed Card Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
              }}
            >
              {/* Instagram Card Header */}
              <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)',
                      padding: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        color: '#000',
                      }}
                    >
                      R
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      imperial_robotics
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>London, UK</div>
                  </div>
                </div>

                <MoreVertical size={16} color="var(--text-muted)" />
              </div>

              {/* Photo */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: igAspectRatio === '1:1' ? '1 / 1' : igAspectRatio === '4:5' ? '4 / 5' : '9 / 16',
                  backgroundColor: '#000',
                  backgroundImage: `url(${igImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              {/* Action Bar */}
              <div style={{ padding: '0.625rem 0.875rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <Heart size={20} color="var(--text-primary)" />
                  <MessageCircle size={20} color="var(--text-primary)" />
                  <Send size={19} color="var(--text-primary)" />
                </div>
                <Bookmark size={20} color="var(--text-primary)" />
              </div>

              {/* Caption */}
              <div style={{ padding: '0.25rem 0.875rem 0.875rem' }}>
                <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  142 likes
                </div>
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-primary)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  <strong>imperial_robotics</strong> {igCaption}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LINKEDIN MANAGEMENT */}
      {activeChannel === 'linkedin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {/* LinkedIn Post Editor */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LinkedinIcon size={20} color="#0A66C2" />
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
                  Create LinkedIn Article / Post
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAiGenerateLi}
                disabled={isAiGenerating}
                className="btn btn-secondary"
                style={{ minHeight: '32px', padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
              >
                <Sparkles size={13} color="var(--brand-primary)" />
                <span>{isAiGenerating ? 'Drafting...' : 'AI Enhance'}</span>
              </button>
            </div>

            {/* Target Audience */}
            <div>
              <label style={{ fontSize: '0.78125rem' }}>Target Audience</label>
              <select
                value={liTargetAudience}
                onChange={(e) => setLiTargetAudience(e.target.value as any)}
                style={{ fontSize: '0.8125rem', minHeight: '36px' }}
              >
                <option value="public">Anyone (Public Network & University Feeds)</option>
                <option value="alumni">Society Alumni & Mentors</option>
                <option value="industry">Sponsors & Industry Partners</option>
              </select>
            </div>

            {/* Headline */}
            <div>
              <label style={{ fontSize: '0.78125rem' }}>Headline / Topic</label>
              <input
                type="text"
                value={liHeadline}
                onChange={(e) => setLiHeadline(e.target.value)}
                style={{ fontSize: '0.8125rem', minHeight: '36px' }}
              />
            </div>

            {/* Body */}
            <div>
              <label style={{ fontSize: '0.78125rem' }}>Post Content</label>
              <textarea
                rows={8}
                value={liBody}
                onChange={(e) => setLiBody(e.target.value)}
                style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => handlePublishLinkedIn(false)}
                disabled={isPublishingLi}
                className="btn btn-primary"
                style={{ flex: 1, minHeight: '38px', fontSize: '0.84375rem' }}
              >
                Publish to LinkedIn Page
              </button>
              <button
                type="button"
                onClick={() => handlePublishLinkedIn(true)}
                disabled={isPublishingLi}
                className="btn btn-secondary"
                style={{ minHeight: '38px', fontSize: '0.84375rem' }}
              >
                <Clock size={14} />
                <span>Schedule</span>
              </button>
            </div>
          </div>

          {/* Live LinkedIn Post Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                borderRadius: '0.625rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-sm)',
                padding: '1rem',
              }}
            >
              {/* LinkedIn Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    backgroundColor: '#0A66C2',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.125rem',
                    flexShrink: 0,
                  }}
                >
                  R
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Imperial College AI & Robotics Society
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                    1,850 followers • 1h • Edited • 🌐
                  </div>
                </div>
              </div>

              {/* Headline */}
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {liHeadline}
              </div>

              {/* Body */}
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  marginBottom: '1rem',
                }}
              >
                {liBody}
              </div>

              {/* LinkedIn Reaction Strip */}
              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                  <ThumbsUp size={15} color="#0A66C2" />
                  <span>Like</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                  <MessageCircle size={15} />
                  <span>Comment</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                  <Repeat size={15} />
                  <span>Repost</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                  <Send size={15} />
                  <span>Send</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HISTORY & SCHEDULED POSTS */}
      {activeChannel === 'history' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>
            Publishing History & Active Queue
          </h3>

          <div className="enterprise-table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Platform</th>
                  <th style={{ width: '50%' }}>Content Summary</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '20%' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No social posts or broadcasts created yet. Use the tabs above to compose your first post.
                    </td>
                  </tr>
                ) : (
                  posts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              p.platform === 'instagram'
                                ? 'rgba(225, 48, 108, 0.15)'
                                : p.platform === 'linkedin'
                                ? 'rgba(10, 102, 194, 0.15)'
                                : 'rgba(37, 211, 102, 0.15)',
                            color:
                              p.platform === 'instagram'
                                ? '#E1306C'
                                : p.platform === 'linkedin'
                                ? '#0A66C2'
                                : '#15803D',
                            textTransform: 'uppercase',
                            fontSize: '0.6875rem',
                          }}
                        >
                          {p.platform}
                        </span>
                      </td>

                      <td>
                        <div
                          style={{
                            maxWidth: '480px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.8125rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {p.caption}
                        </div>
                      </td>

                      <td>
                        <span
                          className="status-pill"
                          style={{
                            backgroundColor:
                              p.status === 'posted'
                                ? 'var(--badge-success-bg)'
                                : p.status === 'scheduled'
                                ? 'var(--badge-info-bg)'
                                : 'var(--badge-warning-bg)',
                            color:
                              p.status === 'posted'
                                ? 'var(--badge-success-text)'
                                : p.status === 'scheduled'
                                ? 'var(--badge-info-text)'
                                : 'var(--badge-warning-text)',
                          }}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.postedAt
                          ? new Date(p.postedAt).toLocaleString()
                          : p.scheduledFor
                          ? `Scheduled: ${new Date(p.scheduledFor).toLocaleDateString()}`
                          : new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ATTACH WHATSAPP BROADCAST MODAL */}
      {showAttachModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '1.5rem',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={18} color="#25D366" />
                <h3 style={{ fontSize: '1.0625rem', color: 'var(--text-primary)', margin: 0 }}>
                  Attach WhatsApp Broadcast List
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.78125rem' }}>Broadcast Channel Name</label>
                <input
                  type="text"
                  value={broadcastChannelName}
                  onChange={(e) => setBroadcastChannelName(e.target.value)}
                  style={{ fontSize: '0.8125rem', minHeight: '38px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78125rem' }}>WhatsApp Business Phone ID</label>
                <input
                  type="text"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  style={{ fontSize: '0.8125rem', minHeight: '38px' }}
                />
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                Connecting your society broadcast list automatically pulls all members who opted in during university verification. Broadcasts dispatch via official Meta Cloud API.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, minHeight: '38px', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWhatsappAttached(true);
                    setShowAttachModal(false);
                    toast.success('WhatsApp Broadcast configuration updated!', 'Channel Attached');
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, minHeight: '38px', fontSize: '0.8125rem' }}
                >
                  Save & Attach
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
