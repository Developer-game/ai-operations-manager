'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SanitizedText } from '@/components/SanitizedText';
import { UserCheck, ArrowLeft, Mail, KeyRound, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function MemberLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo member account
  const demoMember = {
    label: 'Demo Member [Demo Data]',
    email: 'member@demo.rally.ac.uk',
  };

  const handleFillDemo = () => {
    setError('');
    setEmail(demoMember.email);
    setStep('email');
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();

    if (!trimmed) {
      setError('Please enter your university email address.');
      toast.error('Please enter your university email address.', 'Email Required');
      return;
    }

    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Please provide a valid university email address.');
      toast.error('Please enter a valid university email address.', 'Invalid Email');
      return;
    }

    setInfo(`Verification code dispatched to ${trimmed}. For testing, enter 123456.`);
    toast.info(`Verification code sent to ${trimmed}`, 'Code Dispatched');
    setStep('otp');
    setOtpCode('123456');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    const trimmedOtp = otpCode.trim();
    if (trimmedOtp !== '123456' && trimmedOtp.length < 6) {
      setError('Invalid verification code. Enter 123456 for testing.');
      toast.error('Invalid verification code. Enter 123456 for testing.', 'Verification Failed');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find or create user
      const users = store.getUsers();
      const cleanEmail = email.trim().toLowerCase();
      let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        user = {
          id: `usr-${Date.now()}`,
          email: cleanEmail,
          fullName: cleanEmail.split('@')[0].replace('.', ' '),
          phoneOptIn: false,
          themePreference: 'light',
          isVerified: true,
          createdAt: new Date().toISOString(),
        };
      }

      store.setCurrentUser(user.id);
      toast.success('Email verified successfully.', 'Verified');

      // Check if user has an active membership
      const { membership } = store.getCurrentMembership();

      if (membership && membership.status === 'active') {
        router.push('/dashboard');
      } else {
        // Verified but no active membership yet
        router.push('/waiting');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
      setIsSubmitting(false);
    }
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
            maxWidth: '480px',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                color: '#06B6D4',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <UserCheck size={28} />
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem', color: 'var(--text-primary)' }}>
              Member Verification
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <SanitizedText>
                Sign in with your university email or use instant test login.
              </SanitizedText>
            </p>
          </div>

          {/* Quick 1-Click Testing Login Button */}
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => {
                store.loginDemoUser('member');
                toast.success('Logged in as Demo Member', 'Welcome to Rally');
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
              <UserCheck size={18} />
              <span>Instant Test Login as Member</span>
            </button>
          </div>

          {/* Single Demo Helper */}
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.25rem',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Demo Account (Click to fill):
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
                border: email === demoMember.email ? '1px solid var(--border-focus)' : '1px solid var(--border-color)',
                backgroundColor: email === demoMember.email ? 'var(--brand-primary-subtle)' : 'var(--bg-surface)',
                color: email === demoMember.email ? 'var(--brand-primary-text)' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                textAlign: 'left',
              }}
            >
              <span style={{ fontWeight: 600 }}>{demoMember.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>{demoMember.email}</span>
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

          {info && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--badge-info-bg)',
                color: 'var(--badge-info-text)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={16} />
              <SanitizedText>{info}</SanitizedText>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="member-email">University Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }}
                  />
                  <input
                    id="member-email"
                    type="email"
                    placeholder="e.g. member@demo.rally.ac.uk"
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: '48px' }}>
                <span>Send One Time Code</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="otp">Enter 6 Digit Code</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }}
                  />
                  <input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value);
                      setError('');
                    }}
                    style={{ paddingLeft: '2.5rem', letterSpacing: '0.25em', fontSize: '1.25rem', fontWeight: 700 }}
                    required
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '48px' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify and Enter</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                }}
                className="btn btn-secondary"
                style={{ width: '100%', minHeight: '40px' }}
              >
                Change Email Address
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
