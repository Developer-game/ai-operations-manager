'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SanitizedText } from '@/components/SanitizedText';
import { Crown, ArrowLeft, Key, Building2, User, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function OrganiserSignupPage() {
  const router = useRouter();
  const [keyInput, setKeyInput] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single demo organiser key for convenience
  const demoKey = 'KEY-NEW-2026';

  const handleFillDemo = () => {
    setError('');
    setKeyInput(demoKey);
    setSocietyName('Imperial AI and Robotics Society');
    setFullName('Sarah Chen');
    setEmail('sarah.chen@imperial.ac.uk');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setSuccess('');

    const trimmedKey = keyInput.trim();
    if (!trimmedKey) {
      const msg = 'Please enter an organiser key.';
      setError(msg);
      toast.error(msg, 'Key Required');
      return;
    }

    if (!societyName.trim() || !fullName.trim() || !email.trim()) {
      const msg = 'Please fill in all society and personal details.';
      setError(msg);
      toast.error(msg, 'Details Required');
      return;
    }

    setIsSubmitting(true);

    const result = store.redeemKey(trimmedKey, {
      email: email.trim(),
      fullName: fullName.trim(),
      societyName: societyName.trim(),
    });

    if (!result.success) {
      setError(result.message);
      toast.error(result.message, 'Redemption Error');
      setIsSubmitting(false);
      return;
    }

    toast.success('Key redeemed successfully! Welcome to Rally.', 'Society Established');
    setSuccess('Key redeemed successfully! Redirecting to your new society dashboard...');
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
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
        <div
          className="card"
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                color: 'var(--brand-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Crown size={28} />
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem', color: 'var(--text-primary)' }}>
              Organiser Society Setup
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <SanitizedText>
                Redeem an Organiser Key to establish your society workspace, or use instant test login.
              </SanitizedText>
            </p>
          </div>

          {/* Quick 1-Click Testing Login Button */}
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => {
                store.loginDemoUser('organiser');
                toast.success('Logged in as Demo Organiser (President)', 'Welcome to Rally');
                router.push('/dashboard');
              }}
              className="btn btn-primary"
              style={{
                width: '100%',
                minHeight: '44px',
                fontSize: '0.9375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Crown size={18} />
              <span>Instant Test Login as Organiser</span>
            </button>
          </div>

          {/* Demo Organiser Key Helper */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.25rem',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Fill Demo Organiser Form (Unlimited testing use):
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: keyInput === demoKey ? '1px solid var(--border-focus)' : '1px solid var(--border-color)',
                backgroundColor: keyInput === demoKey ? 'var(--brand-primary-subtle)' : 'var(--bg-surface)',
                color: keyInput === demoKey ? 'var(--brand-primary-text)' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                textAlign: 'left',
              }}
            >
              <span style={{ fontWeight: 600 }}>Demo Organiser Setup</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--brand-primary)' }}>{demoKey}</span>
            </button>
          </div>

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
              <label htmlFor="key">Single Use Organiser Key</label>
              <div style={{ position: 'relative' }}>
                <Key
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }}
                />
                <input
                  id="key"
                  type="text"
                  placeholder="e.g. KEY-NEW-2026"
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    setError('');
                  }}
                  style={{ paddingLeft: '2.5rem', fontFamily: 'monospace', textTransform: 'uppercase' }}
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label htmlFor="society">Society or Club Name</label>
              <div style={{ position: 'relative' }}>
                <Building2
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }}
                />
                <input
                  id="society"
                  type="text"
                  placeholder="e.g. Imperial Robotics Society"
                  value={societyName}
                  onChange={(e) => {
                    setSocietyName(e.target.value);
                    setError('');
                  }}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                  autoComplete="organization"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name">Your Full Name</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }}
                />
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Sarah Chen"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError('');
                  }}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email">University Email</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }}
                />
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. sarah.chen@imperial.ac.uk"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                  autoComplete="email"
                />
              </div>
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
                  <span>Establishing Society...</span>
                </>
              ) : (
                <span>Redeem Key and Launch Society</span>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
