'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { ThemeSwitcher } from './ThemeSwitcher';
import { SanitizedText } from './SanitizedText';
import { toast } from '@/lib/toast';
import {
  Users,
  Calendar,
  MessageSquare,
  Sparkles,
  Settings,
  CheckSquare,
  Building,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onOpenChat?: () => void;
}

export function Navbar({ onOpenChat }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(store.getCurrentUser());
  const [currentOrg, setCurrentOrg] = useState(store.getCurrentOrg());
  const [membershipDetails, setMembershipDetails] = useState(store.getCurrentMembership());
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setCurrentUser(store.getCurrentUser());
      setCurrentOrg(store.getCurrentOrg());
      setMembershipDetails(store.getCurrentMembership());
    };
    refresh();
  }, [pathname]);

  const allUsers = store.getUsers();
  const { role } = membershipDetails;
  const isOrganiser = currentOrg?.ownerUserId === currentUser?.id || role?.isOwner || role?.name.toLowerCase().includes('organiser');

  const handleSwitchUser = (userId: string) => {
    store.setCurrentUser(userId);
    setShowUserDropdown(false);
    const updatedUser = store.getCurrentUser();
    const updatedMembership = store.getCurrentMembership();
    setCurrentUser(updatedUser);
    setMembershipDetails(updatedMembership);

    if (updatedUser) {
      toast.info(
        `Switched user to ${updatedUser.fullName} (${updatedMembership.role?.name || 'Member'})`,
        'Persona Switched'
      );
    }
    router.refresh();
  };

  const handleLogout = () => {
    store.logout();
    router.push('/');
  };

  // Strictly maximum 5 items per user type (Section H.2)
  const organiserNav = [
    { href: '/dashboard', label: 'Home', icon: <Building size={16} /> },
    { href: '/members', label: 'Members', icon: <Users size={16} /> },
    { href: '/events', label: 'Events', icon: <Calendar size={16} /> },
    { href: '/comms', label: 'Messages', icon: <MessageSquare size={16} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  const memberNav = [
    { href: '/dashboard', label: 'Home', icon: <Building size={16} /> },
    { href: '/events', label: 'My Events', icon: <Calendar size={16} /> },
    { href: '/tasks', label: 'My Tasks', icon: <CheckSquare size={16} /> },
  ];

  const activeNavItems = isOrganiser ? organiserNav : memberNav;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '60px',
          gap: '1rem',
          paddingTop: '0.4rem',
          paddingBottom: '0.4rem',
        }}
      >
        {/* Brand & Society Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'var(--brand-gradient)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.125rem',
              }}
            >
              C
            </div>
            <span>ClubOps</span>
          </Link>

          {currentOrg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingLeft: '0.75rem',
                borderLeft: '1px solid var(--border-color)',
              }}
            >
              <SanitizedText
                as="span"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentOrg.name}
              </SanitizedText>
            </div>
          )}
        </div>

        {/* 5-Item Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {activeNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'var(--brand-primary-subtle)' : 'transparent',
                  color: isActive ? 'var(--brand-primary-text)' : 'var(--text-secondary)',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Assistant Action Button */}
          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: 'var(--bg-surface-elevated)',
                color: 'var(--brand-primary-text)',
                border: '1px solid var(--border-focus)',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={16} color="var(--brand-primary)" />
              <span>Assistant</span>
            </button>
          )}
        </nav>

        {/* User Persona & Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ThemeSwitcher />

          {/* User Persona Switcher */}
          {currentUser && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {currentUser.fullName.charAt(0)}
                </div>
                <span>{currentUser.fullName.split(' ')[0]}</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {showUserDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '240px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.625rem',
                    boxShadow: 'var(--shadow-md)',
                    padding: '0.5rem',
                    zIndex: 60,
                  }}
                >
                  <div style={{ padding: '0.375rem 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.375rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      {currentUser.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {currentUser.email}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 700, padding: '0.25rem 0.5rem', textTransform: 'uppercase' }}>
                    Switch Demo Persona:
                  </div>

                  {allUsers.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSwitchUser(u.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.375rem 0.5rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          backgroundColor: isSelected ? 'var(--brand-primary-subtle)' : 'transparent',
                          color: isSelected ? 'var(--brand-primary-text)' : 'var(--text-primary)',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? 700 : 500 }}>{u.fullName}</span>
                      </button>
                    );
                  })}

                  <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.375rem', paddingTop: '0.375rem' }}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--badge-error-text)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
