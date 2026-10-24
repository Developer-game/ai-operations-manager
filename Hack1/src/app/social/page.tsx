'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { Navbar } from '@/components/Navbar';
import { ChatDrawer } from '@/components/ChatDrawer';
import { SanitizedText } from '@/components/SanitizedText';
import { generateSocialCampaign, stageGeneratedPost } from '@/lib/agents/mediaAssetAgent';
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
} from 'lucide-react';
import { SocialPlatform, SocialPost } from '@/types';

export default function SocialMediaHubPage() {
  const currentOrg = store.getCurrentOrg();
  const currentUser = store.getCurrentUser();
  const { role } = store.getCurrentMembership();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const canManageSocial = hasPermission(role, 'social.manage');

  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('instagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  if (!currentOrg) return null;

  const events = store.getEvents(currentOrg.id);
  const posts = store.getSocialPosts(currentOrg.id);
  const assets = store.getMediaAssets(currentOrg.id);

  const handleGenerate = () => {
    setIsGenerating(true);
    setActionNotice('');

    setTimeout(() => {
      const targetEventId = selectedEventId || (events[0]?.id ?? '');
      const draft = generateSocialCampaign(targetEventId, selectedPlatform);

      stageGeneratedPost(currentOrg.id, selectedPlatform, draft.caption, draft.suggestedImageUrl);
      setIsGenerating(false);
      toast.success(`Draft generated for ${selectedPlatform.toUpperCase()}! Review below.`, 'Campaign Drafted');
      setActionNotice(`Draft generated for ${selectedPlatform.toUpperCase()}! Review below.`);
      setTimeout(() => setActionNotice(''), 3000);
    }, 400);
  };

  const handleApprove = (postId: string) => {
    store.approveSocialPost(postId);
    store.logAction('social.approve', 'post', postId, {});
    toast.success('Post approved! It is now eligible for scheduling.', 'Approval Confirmed');
    setActionNotice('Post approved! It is now eligible for scheduling.');
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleSchedule = (postId: string) => {
    const scheduledTime = new Date(Date.now() + 86400000).toISOString();
    store.scheduleSocialPost(postId, scheduledTime);
    store.logAction('social.schedule', 'post', postId, { scheduledTime });
    toast.success('Post scheduled for publishing tomorrow morning!', 'Scheduled');
    setActionNotice('Post scheduled for tomorrow morning via MCP connector!');
    setTimeout(() => setActionNotice(''), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar onOpenChat={() => setIsChatOpen(true)} />

      <main className="container" style={{ flex: 1, paddingTop: '1.75rem', paddingBottom: '3.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>
              Social Media & Asset Pipeline
            </h1>
            <span className="badge badge-info">AI Studio</span>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            <SanitizedText>
              Generate posters and captions via Gemma 4. Content remains in draft state until approved by an authorised team lead.
            </SanitizedText>
          </p>
        </div>

        {actionNotice && (
          <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem' }}>
            <CheckCircle2 size={16} />
            <span>{actionNotice}</span>
          </div>
        )}

        {!canManageSocial && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.625rem',
              backgroundColor: 'var(--badge-warning-bg)',
              color: 'var(--badge-warning-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '1.5rem',
            }}
          >
            <Lock size={18} />
            <span>
              Your current role ({role?.name || 'Member'}) does not hold the &quot;Manage Social Media&quot; permission. Switch persona to Alex Chen or Jordan Lee in the top navigation to test authoring and approving posts.
            </span>
          </div>
        )}

        {/* AI Studio Generation Bar */}
        {canManageSocial && (
          <div
            className="card"
            style={{
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid var(--border-focus)',
              background: 'var(--bg-glass)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Sparkles size={20} color="var(--brand-primary)" />
              <h2 style={{ fontSize: '1.125rem' }}>Media & Asset Agent Studio</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label htmlFor="soc-event">Select Target Event</label>
                <select
                  id="soc-event"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="soc-plat">Target Social Channel</label>
                <select
                  id="soc-plat"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as SocialPlatform)}
                >
                  <option value="instagram">Instagram (Reels / Visual Post)</option>
                  <option value="linkedin">LinkedIn (Professional Engineering)</option>
                  <option value="twitter">X / Twitter (Live Broadcast Alert)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn btn-primary"
                style={{ minHeight: '44px' }}
              >
                <Sparkles size={16} />
                <span>{isGenerating ? 'Generating Studio Draft...' : 'Generate Poster & Caption'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Staged Posts Tracker (Drafts, Approved, Scheduled) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Content Pipeline ({posts.length} entries)
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Strict human approval enforced</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {posts.map((post) => {
            const asset = assets.find((a) => a.id === post.assetId);
            const isDraft = post.status === 'draft';
            const isApproved = post.status === 'approved';
            const isScheduled = post.status === 'scheduled';

            return (
              <div
                key={post.id}
                className="card card-interactive"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                {/* Platform Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: post.platform === 'instagram' ? '#E1306C' : post.platform === 'linkedin' ? '#0A66C2' : '#1DA1F2',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {post.platform.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {currentOrg.name}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        @{currentOrg.slug}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      isScheduled
                        ? 'badge-success'
                        : isApproved
                        ? 'badge-info'
                        : 'badge-warning'
                    }`}
                  >
                    {post.status}
                  </span>
                </div>

                {/* Visual Asset Thumbnail */}
                {asset && (
                  <div
                    style={{
                      height: '200px',
                      borderRadius: '0.625rem',
                      overflow: 'hidden',
                      marginBottom: '0.875rem',
                      backgroundColor: 'var(--bg-surface-elevated)',
                    }}
                  >
                    <img
                      src={asset.fileUrl}
                      alt={asset.fileName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Social Mock Engagement Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
                  {post.platform === 'instagram' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Heart size={16} /> 142</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MessageCircle size={16} /> 18</div>
                      <Bookmark size={16} style={{ marginLeft: 'auto' }} />
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ThumbsUp size={16} /> 89</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MessageCircle size={16} /> 12</div>
                      <Repeat size={16} />
                    </>
                  )}
                </div>

                {/* Caption Body */}
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.55, flex: 1, marginBottom: '1rem' }}>
                  <SanitizedText>{post.caption}</SanitizedText>
                </p>

                {post.scheduledFor && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
                    Scheduled for: {new Date(post.scheduledFor).toLocaleString()}
                  </div>
                )}

                {/* Human Approval Gate Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.875rem', borderTop: '1px solid var(--border-color)' }}>
                  {isDraft && canManageSocial && (
                    <button
                      type="button"
                      onClick={() => handleApprove(post.id)}
                      className="btn btn-primary"
                      style={{ flex: 1, minHeight: '38px', fontSize: '0.8125rem' }}
                    >
                      <Check size={16} />
                      <span>Approve Content</span>
                    </button>
                  )}

                  {isApproved && canManageSocial && (
                    <button
                      type="button"
                      onClick={() => handleSchedule(post.id)}
                      className="btn btn-secondary"
                      style={{ flex: 1, minHeight: '38px', fontSize: '0.8125rem' }}
                    >
                      <Calendar size={16} />
                      <span>Schedule MCP Dispatch</span>
                    </button>
                  )}

                  {isScheduled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--badge-success-text)', fontWeight: 600 }}>
                      <CheckCircle2 size={16} />
                      <span>Ready for Automated MCP Dispatch</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
