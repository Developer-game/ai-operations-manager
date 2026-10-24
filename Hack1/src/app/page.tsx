'use client';

import React from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SanitizedText } from '@/components/SanitizedText';
import {
  Crown,
  UserCheck,
  MailOpen,
  ArrowRight,
  Sparkles,
  Shield,
  Rocket,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';

export default function EntryGatewayPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Top Glassmorphic Header */}
      <header
        style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-glass)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--brand-gradient)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.25rem',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            R
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Rally
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              University Society Intelligence Platform
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <main
        className="container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '3.5rem',
          paddingBottom: '4rem',
          textAlign: 'center',
        }}
      >
        {/* Ambient AI Badge */}
        <div
          className="badge badge-info"
          style={{
            marginBottom: '1.5rem',
            padding: '0.4rem 1rem',
            fontSize: '0.8125rem',
            borderRadius: '9999px',
            border: '1px solid var(--border-focus)',
            backgroundColor: 'var(--brand-primary-subtle)',
            color: 'var(--brand-primary-text)',
            gap: '0.5rem',
          }}
        >
          <div className="pulse-indicator" />
          <span>Powered by Google Gemma 4 Intelligence</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)',
            fontWeight: 800,
            marginBottom: '1.25rem',
            maxWidth: '820px',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
          }}
        >
          <SanitizedText>Student Society Operations, Simplified with AI</SanitizedText>
        </h1>

        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            marginBottom: '3rem',
            lineHeight: 1.6,
          }}
        >
          <SanitizedText>
            Select your entry pathway below to manage members, events, custom roles, and conflict free timetables.
          </SanitizedText>
        </p>

        {/* 3 Main Choice Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '1.75rem',
            width: '100%',
            maxWidth: '1020px',
            marginBottom: '3rem',
            textAlign: 'left',
          }}
        >
          {/* Option 1: Organiser */}
          <Link
            href="/auth/organiser"
            className="card card-interactive"
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              padding: '1.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%)',
                    color: 'var(--brand-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Crown size={26} />
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                  Root Access
                </span>
              </div>

              <h2 style={{ fontSize: '1.375rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Organiser
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                <SanitizedText>
                  Redeem a single use Organiser Key to establish your society workspace, define custom roles, and onboard members.
                </SanitizedText>
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.75rem',
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: 'var(--brand-primary-text)',
              }}
            >
              <span>Redeem Key and Create Society</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          {/* Option 2: Member */}
          <Link
            href="/auth/member"
            className="card card-interactive"
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              padding: '1.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                    color: '#06B6D4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserCheck size={26} />
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                  Open Verification
                </span>
              </div>

              <h2 style={{ fontSize: '1.375rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Member
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                <SanitizedText>
                  Sign in with your university email. Workspace data is unlocked once your society organiser invites you.
                </SanitizedText>
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.75rem',
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: '#06B6D4',
              }}
            >
              <span>Verify Email to Enter</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          {/* Option 3: I Have an Invitation */}
          <Link
            href="/auth/invite"
            className="card card-interactive"
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              padding: '1.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MailOpen size={26} />
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                  Direct Onboarding
                </span>
              </div>

              <h2 style={{ fontSize: '1.375rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                I Have an Invitation
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                <SanitizedText>
                  Enter your invitation token to immediately bind with your designated role, team, and assigned tasks.
                </SanitizedText>
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.75rem',
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: '#10B981',
              }}
            >
              <span>Enter Invitation Token</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        </div>

        {/* Feature Value Props Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '3rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--brand-primary)" />
            <span>Zero hardcoded roles</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={16} color="#06B6D4" />
            <span>Class free/busy privacy protected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="#10B981" />
            <span>5 Accessible WCAG AA Themes</span>
          </div>
        </div>

        {/* Quick Launch Testing Strip */}
        <div
          className="card"
          style={{
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            maxWidth: '1020px',
            width: '100%',
            border: '2px solid var(--border-focus)',
            background: 'var(--bg-glass)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', textAlign: 'left' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-primary-subtle)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Rocket size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Unlimited Testing & Live Demo Environment
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Pre-populated Imperial Robotics society with events, teams, members, WhatsApp, and Rally AI.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <Link
              href="/dashboard"
              onClick={() => store.loginDemoUser('organiser')}
              className="btn btn-primary"
              style={{ minHeight: '44px', textDecoration: 'none' }}
            >
              <span>Login as Organiser</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/dashboard"
              onClick={() => store.loginDemoUser('member')}
              className="btn btn-secondary"
              style={{ minHeight: '44px', textDecoration: 'none' }}
            >
              <span>Login as Member</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <SanitizedText>
          Rally: University Club and Society Operations Platform. Strict Zero Em Dash Interface Guarantee.
        </SanitizedText>
      </footer>
    </div>
  );
}
