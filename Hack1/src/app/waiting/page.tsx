'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SanitizedText } from '@/components/SanitizedText';
import { Clock, RefreshCw, Mail, LogOut, CheckCircle2 } from 'lucide-react';

export default function WaitingForInvitationPage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const currentUser = store.getCurrentUser();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setStatusMessage('');

    setTimeout(() => {
      setIsRefreshing(false);
      const { membership } = store.getCurrentMembership();
      if (membership && membership.status === 'active') {
        toast.success('Active invitation detected! Entering your society dashboard.', 'Invitation Accepted');
        router.push('/dashboard');
      } else {
        setStatusMessage('No active invitations found yet. Please check with your society organiser.');
        toast.info('No active invitations found yet.', 'Status Checked');
      }
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <header
        style={{
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
            }}
          >
            C
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>ClubOps</span>
        </div>

        <ThemeSwitcher />
      </header>

      <main
        className="container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '3rem',
          paddingBottom: '3rem',
          textAlign: 'center',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '540px',
            width: '100%',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'var(--brand-primary-subtle)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <Clock size={32} />
          </div>

          <div
            className="badge badge-success"
            style={{ marginBottom: '1rem', padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
          >
            <CheckCircle2 size={14} />
            <span>Email Verified</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Waiting for an Invitation
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
            }}
          >
            <SanitizedText>
              Your email is verified. As soon as a society organiser invites your email address, your club workspace and assigned tasks will appear here automatically.
            </SanitizedText>
          </p>

          <div
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Mail size={16} />
            <span>Signed in as: <strong>{currentUser?.email || 'student@university.ac.uk'}</strong></span>
          </div>

          {statusMessage && (
            <div
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--badge-warning-bg)',
                color: 'var(--badge-warning-text)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              <SanitizedText>{statusMessage}</SanitizedText>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '46px' }}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Checking Invitations...' : 'Check Invitation Status'}</span>
            </button>

            <Link
              href="/"
              className="btn btn-secondary"
              style={{ width: '100%', minHeight: '42px', textDecoration: 'none' }}
            >
              <LogOut size={16} />
              <span>Return to Entry Gateway</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
