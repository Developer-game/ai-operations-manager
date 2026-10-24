'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { Navbar } from '@/components/Navbar';
import { ChatDrawer } from '@/components/ChatDrawer';
import { SanitizedText } from '@/components/SanitizedText';
import { hasPermission } from '@/lib/permissions';
import {
  Settings,
  Shield,
  Building,
  Share2,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const currentOrg = store.getCurrentOrg();
  const currentUser = store.getCurrentUser();
  const { role } = store.getCurrentMembership();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const canEditRoles = hasPermission(role, 'roles.edit');
  const isOwner = currentOrg?.ownerUserId === currentUser?.id || role?.isOwner;

  const [societyName, setSocietyName] = useState(currentOrg?.name || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!currentOrg || !currentUser) return null;

  const handleSaveSociety = (e: React.FormEvent) => {
    e.preventDefault();
    if (!societyName.trim()) return;
    currentOrg.name = societyName.trim();
    setIsSaved(true);
    toast.success('Society details updated.', 'Saved');
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDeleteDemo = () => {
    if (confirm('Are you sure you want to delete all demo data? This will clear the demo robotics society and demo member.')) {
      store.deleteDemoData();
      toast.success('Demo data removed successfully.', 'Cleaned');
      router.push('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar onOpenChat={() => setIsChatOpen(true)} />

      <main className="container" style={{ flex: 1, paddingTop: '1.75rem', paddingBottom: '3.5rem', maxWidth: '800px' }}>
        {/* Helper Line at top in plain language */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Settings and Advanced Operations
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            <SanitizedText>
              Manage your society workspace, custom roles, permissions, social channels, and demo data.
            </SanitizedText>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Society Details */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <Building size={20} color="var(--brand-primary)" />
              <h2 style={{ fontSize: '1.1875rem' }}>Society Profile</h2>
            </div>

            <form onSubmit={handleSaveSociety} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="set-name">Society or Club Name</label>
                <input
                  id="set-name"
                  type="text"
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                  disabled={!isOwner}
                  required
                />
              </div>

              {isOwner && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ minHeight: '40px' }}>
                    Save Changes
                  </button>
                  {isSaved && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--badge-success-text)' }}>
                      Changes saved successfully.
                    </span>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Section 2: Roles and Permissions Link */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                  <Shield size={20} color="#06B6D4" />
                  <h2 style={{ fontSize: '1.1875rem' }}>Role and Permission Hierarchy</h2>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  <SanitizedText>
                    Define custom roles, reorder authority, and toggle server side permissions.
                  </SanitizedText>
                </p>
              </div>

              <Link href="/roles" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                <span>Configure Roles</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Section 3: Social Media & Integrations */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                  <Share2 size={20} color="#F97316" />
                  <h2 style={{ fontSize: '1.1875rem' }}>Social Media & Channels</h2>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  <SanitizedText>
                    Draft, approve, and schedule posts across Instagram, LinkedIn, and Discord.
                  </SanitizedText>
                </p>
              </div>

              <Link href="/social" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                <span>Social Hub</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Section 4: Demo Data Management (Section G) */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface-elevated)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Trash2 size={18} color="var(--badge-error-text)" />
                  <h2 style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                    Demo Data Cleanup
                  </h2>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                  <SanitizedText>
                    Permanently delete the demo organisation and single demo member account.
                  </SanitizedText>
                </p>
              </div>

              <button
                type="button"
                onClick={handleDeleteDemo}
                className="btn btn-secondary"
                style={{
                  color: 'var(--badge-error-text)',
                  borderColor: 'var(--badge-error-text)',
                }}
              >
                Delete Demo Data
              </button>
            </div>
          </div>
        </div>
      </main>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
