'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SanitizedText } from '@/components/SanitizedText';
import { MailOpen, ArrowLeft, Ticket, CheckCircle2, AlertCircle, Building, ShieldCheck, Loader2 } from 'lucide-react';

function InvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokenInput, setTokenInput] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setTokenInput(tokenFromUrl);
      const invite = store.getInvitationByToken(tokenFromUrl);
      if (invite) {
        setEmail(invite.email);
      }
    }
  }, [searchParams]);

  const currentInvite = tokenInput.trim() ? store.getInvitationByToken(tokenInput.trim()) : null;
  const targetOrg = currentInvite ? store.getOrganisations().find((o) => o.id === currentInvite.organisationId) : null;
  const targetRole = targetOrg && currentInvite?.roleId ? store.getRoles(targetOrg.id).find((r) => r.id === currentInvite.roleId) : null;
  const targetTeam = targetOrg && currentInvite?.teamId ? store.getTeams(targetOrg.id).find((t) => t.id === currentInvite.teamId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setSuccess('');

    const cleanToken = tokenInput.trim();
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanToken) {
      setError('Please provide your invitation code.');
      toast.error('Please enter your invitation code.', 'Token Required');
      return;
    }

    if (!cleanName || !cleanEmail) {
      setError('Please provide your full name and university email address.');
      toast.error('Please enter your name and email.', 'Missing Information');
      return;
    }

    setIsSubmitting(true);

    const result = store.acceptInvitation(cleanToken, {
      fullName: cleanName,
      email: cleanEmail,
    });

    if (!result.success) {
      setError(result.message);
      toast.error(result.message, 'Invitation Error');
      setIsSubmitting(false);
      return;
    }

    toast.success('Invitation accepted! You have joined the society.', 'Welcome');
    setSuccess('Invitation accepted! You have joined the society. Redirecting to your dashboard...');
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div
      className="card"
      style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#10B981',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <MailOpen size={28} />
        </div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem', color: 'var(--text-primary)' }}>
          Join with Invitation
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <SanitizedText>
            Enter your invitation token to activate your designated society role and assigned tasks.
          </SanitizedText>
        </p>
      </div>

      {currentInvite && targetOrg && (
        <div
          style={{
            padding: '0.875rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--badge-success-bg)',
            border: '1px solid var(--badge-success-text)',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: 'var(--badge-success-text)',
              marginBottom: '0.25rem',
            }}
          >
            <ShieldCheck size={16} />
            <span>Valid Invitation Found</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
            Target Society: <strong>{targetOrg.name}</strong>
          </div>
          {targetRole && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
              Assigned Role: <strong>{targetRole.name}</strong>
            </div>
          )}
          {targetTeam && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
              Assigned Team: <strong>{targetTeam.name}</strong>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--badge-error-bg)',
            color: 'var(--badge-error-text)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          <AlertCircle size={16} />
          <SanitizedText>{error}</SanitizedText>
        </div>
      )}

      {success && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--badge-success-bg)',
            color: 'var(--badge-success-text)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          <CheckCircle2 size={16} />
          <SanitizedText>{success}</SanitizedText>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="token">Invitation Code / Token</label>
          <div style={{ position: 'relative' }}>
            <Ticket
              size={16}
              style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }}
            />
            <input
              id="token"
              type="text"
              placeholder="e.g. INVITE-DEMO-2026"
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                setError('');
              }}
              style={{ paddingLeft: '2.5rem', fontFamily: 'monospace' }}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="name">Your Full Name</label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Alex Morgan"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError('');
            }}
            required
          />
        </div>

        <div>
          <label htmlFor="email">University Email</label>
          <input
            id="email"
            type="email"
            placeholder="e.g. alex.morgan@imperial.ac.uk"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{ marginTop: '0.5rem', width: '100%', minHeight: '48px' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Joining Society...</span>
            </>
          ) : (
            <span>Accept Invitation and Join Society</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function InvitationRedemptionPage() {
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
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Entry Gateway</span>
        </Link>
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
          paddingTop: '2rem',
          paddingBottom: '2rem',
        }}
      >
        <React.Suspense fallback={<div className="card">Loading invitation form...</div>}>
          <InvitationForm />
        </React.Suspense>
      </main>
    </div>
  );
}
