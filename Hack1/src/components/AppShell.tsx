'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { ChatDrawer } from '@/components/ChatDrawer';
import { SanitizedText } from '@/components/SanitizedText';
import { toast } from '@/lib/toast';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Share2,
  CheckSquare,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Search,
  Plus,
  Crown,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { ThemeName } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
  activeTab?: string;
  actions?: React.ReactNode;
}

export function AppShell({ children, actions }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(() => store.getCurrentUser());
  const [currentOrg, setCurrentOrg] = useState(() => store.getCurrentOrg());
  const [membershipDetails, setMembershipDetails] = useState(() => store.getCurrentMembership());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('light');

  useEffect(() => {
    const user = store.getCurrentUser();
    if (user?.themePreference) {
      setCurrentTheme(user.themePreference);
      document.documentElement.setAttribute('data-theme', user.themePreference);
    }
  }, []);

  useEffect(() => {
    setCurrentUser(store.getCurrentUser());
    setCurrentOrg(store.getCurrentOrg());
    setMembershipDetails(store.getCurrentMembership());
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const { role } = membershipDetails;
  const isOrganiser =
    currentOrg?.ownerUserId === currentUser?.id ||
    role?.isOwner ||
    role?.name.toLowerCase().includes('organiser');

  const toggleTheme = () => {
    const nextTheme: ThemeName = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (currentUser) {
      store.updateUserTheme(currentUser.id, nextTheme);
    }
    toast.info(`Theme set to ${nextTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}`, 'Theme Updated');
  };

  const handleSwitchPersona = () => {
    const targetType = isOrganiser ? 'member' : 'organiser';
    store.loginDemoUser(targetType);
    setCurrentUser(store.getCurrentUser());
    setCurrentOrg(store.getCurrentOrg());
    setMembershipDetails(store.getCurrentMembership());
    toast.success(
      `Switched to ${targetType === 'organiser' ? 'Demo Organiser' : 'Demo Member'} mode`,
      'Persona Switched'
    );
    router.refresh();
  };

  const handleLogout = () => {
    store.logout();
    router.push('/');
  };

  // Compute live badges
  const orgId = currentOrg?.id || '';
  const memberCount = orgId ? store.getMembersAndInvites(orgId).length : 0;
  const upcomingEventCount = orgId ? store.getEvents(orgId).filter((e) => e.status !== 'completed').length : 0;
  const pendingTaskCount = currentUser ? store.getUserTasks(currentUser.id).filter((t) => t.status !== 'completed').length : 0;

  const navItems = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: <LayoutDashboard size={18} />,
      badge: undefined,
    },
    {
      href: '/members',
      label: 'Members',
      icon: <Users size={18} />,
      badge: memberCount > 0 ? String(memberCount) : undefined,
    },
    {
      href: '/events',
      label: 'Events',
      icon: <Calendar size={18} />,
      badge: upcomingEventCount > 0 ? String(upcomingEventCount) : undefined,
    },
    {
      href: '/social',
      label: 'Social',
      icon: <Share2 size={18} />,
      badge: 'Hub',
    },
    {
      href: '/tasks',
      label: 'Tasks',
      icon: <CheckSquare size={18} />,
      badge: pendingTaskCount > 0 ? String(pendingTaskCount) : undefined,
    },
  ];

  if (isOrganiser) {
    navItems.push(
      {
        href: '/roles',
        label: 'Roles & Access',
        icon: <Shield size={18} />,
        badge: undefined,
      },
      {
        href: '/settings',
        label: 'Settings',
        icon: <Settings size={18} />,
        badge: undefined,
      }
    );
  }

  // Get current section label for breadcrumb
  const currentNav = navItems.find((item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
  const pageTitle = currentNav?.label || 'Workspace';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Persistent Left Sidebar for Desktop */}
      <aside
        style={{
          width: '248px',
          flexShrink: 0,
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
        className="app-sidebar-desktop"
      >
        {/* Workspace Brand Header */}
        <div
          style={{
            padding: '1rem 1.125rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              textDecoration: 'none',
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--brand-primary)',
                color: '#FFFFFF',
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
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Rally
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentOrg?.name || 'Society Ops'}
              </div>
            </div>
          </Link>

          <span
            className="badge"
            style={{
              fontSize: '0.625rem',
              padding: '0.15rem 0.4rem',
              backgroundColor: 'var(--brand-primary-subtle)',
              color: 'var(--brand-primary-text)',
              border: '1px solid var(--brand-primary)',
            }}
          >
            B2B
          </span>
        </div>

        {/* Quick Action Button */}
        <div style={{ padding: '0.75rem 0.875rem 0.5rem' }}>
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--brand-primary-subtle)',
              border: '1px solid var(--brand-primary)',
              color: 'var(--brand-primary-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '36px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={15} color="var(--brand-primary)" />
              <span>Ask Rally AI</span>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                opacity: 0.8,
                backgroundColor: 'var(--bg-surface)',
                padding: '0.1rem 0.35rem',
                borderRadius: '0.25rem',
              }}
            >
              ⌘K
            </span>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.625rem' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0.375rem 0.5rem 0.5rem',
            }}
          >
            Workspace
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            {navItems.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.4375rem',
                    fontSize: '0.84375rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--brand-primary-text)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--brand-primary-subtle)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    minHeight: '36px',
                    borderLeft: isActive ? '3px solid var(--brand-primary)' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.125rem 0.4rem',
                        borderRadius: '9999px',
                        backgroundColor: isActive ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)',
                        color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Utility Controls */}
        <div
          style={{
            padding: '0.75rem 0.875rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface-elevated)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {/* Quick Persona Switcher */}
          <button
            type="button"
            onClick={handleSwitchPersona}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.375rem 0.625rem',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '32px',
            }}
            title="Switch between Organiser and Member testing modes"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ArrowRightLeft size={13} color="var(--brand-primary)" />
              <span>Role: <strong>{isOrganiser ? 'Organiser' : 'Member'}</strong></span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--brand-primary)' }}>Switch</span>
          </button>

          {/* Theme & User Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            {/* User Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                {currentUser?.fullName.charAt(0) || 'U'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.78125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser?.fullName || 'User'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {role?.name || 'Member'}
                </div>
              </div>
            </div>

            {/* Quick Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Toggle theme (Light / Dark)"
            >
              {currentTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        {/* Top Control Bar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backgroundColor: 'var(--bg-glass)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-color)',
            minHeight: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.25rem',
            gap: '1rem',
          }}
        >
          {/* Breadcrumbs / Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-nav-toggle"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84375rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Rally</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pageTitle}</span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {actions}

            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="btn btn-secondary"
              style={{
                minHeight: '34px',
                padding: '0.3125rem 0.75rem',
                fontSize: '0.8125rem',
                gap: '0.375rem',
              }}
            >
              <Sparkles size={14} color="var(--brand-primary)" />
              <span>AI Assistant</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 90,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
            }}
          >
            <div
              style={{
                width: '260px',
                backgroundColor: 'var(--bg-surface)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Rally</span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: pathname.startsWith(item.href) ? 600 : 500,
                      color: pathname.startsWith(item.href) ? 'var(--brand-primary-text)' : 'var(--text-primary)',
                      backgroundColor: pathname.startsWith(item.href) ? 'var(--brand-primary-subtle)' : 'transparent',
                      textDecoration: 'none',
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Page Children Container */}
        <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      {/* Built-in Chat Drawer */}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
