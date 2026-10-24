'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { Navbar } from '@/components/Navbar';
import { ChatDrawer } from '@/components/ChatDrawer';
import { SanitizedText } from '@/components/SanitizedText';
import { Switch } from '@/components/Switch';
import { PERMISSION_DEFINITIONS, canManageRole, hasPermission } from '@/lib/permissions';
import { Role, PermissionCode, PermissionDefinition } from '@/types';
import {
  Shield,
  Plus,
  X,
  Sparkles,
  ArrowRight,
  Lock,
  Users,
  Calendar,
  Share2,
  MessageSquare,
  Building,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function RolesManagementPage() {
  const currentOrg = store.getCurrentOrg();
  const currentUser = store.getCurrentUser();
  const { role: currentActorRole } = store.getCurrentMembership();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const canEditRoles = hasPermission(currentActorRole, 'roles.edit');

  // Local reactive state for roles list
  const [rolesList, setRolesList] = useState<Role[]>(() => {
    return currentOrg ? store.getRoles(currentOrg.id) : [];
  });

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#4F46E5');
  const [newRolePerms, setNewRolePerms] = useState<PermissionCode[]>(['members.view', 'availability.view']);

  // Plain language AI bar
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessage, setAiMessage] = useState('');

  // Sync with store on mount or currentOrg change
  useEffect(() => {
    if (currentOrg) {
      const freshRoles = store.getRoles(currentOrg.id);
      setRolesList(freshRoles);
      if (!selectedRoleId && freshRoles.length > 0) {
        setSelectedRoleId(freshRoles[0].id);
      }
    }
  }, [currentOrg, selectedRoleId]);

  // Close create modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentOrg) return null;

  const activeRole = rolesList.find((r) => r.id === (selectedRoleId || rolesList[0]?.id));

  // Categorize permissions
  const categories: Array<{
    name: PermissionDefinition['category'];
    icon: React.ReactNode;
    defs: PermissionDefinition[];
  }> = [
    {
      name: 'Members',
      icon: <Users size={16} color="var(--brand-primary)" />,
      defs: PERMISSION_DEFINITIONS.filter((p) => p.category === 'Members'),
    },
    {
      name: 'Events & Tasks',
      icon: <Calendar size={16} color="#06B6D4" />,
      defs: PERMISSION_DEFINITIONS.filter((p) => p.category === 'Events & Tasks'),
    },
    {
      name: 'Media & Social',
      icon: <Share2 size={16} color="#F97316" />,
      defs: PERMISSION_DEFINITIONS.filter((p) => p.category === 'Media & Social'),
    },
    {
      name: 'Chat',
      icon: <MessageSquare size={16} color="#10B981" />,
      defs: PERMISSION_DEFINITIONS.filter((p) => p.category === 'Chat'),
    },
    {
      name: 'Organisation',
      icon: <Building size={16} color="#8B5CF6" />,
      defs: PERMISSION_DEFINITIONS.filter((p) => p.category === 'Organisation'),
    },
  ];

  // Optimistic Toggle with Server Rollback
  const handleTogglePermission = (roleId: string, permCode: PermissionCode) => {
    const targetRole = rolesList.find((r) => r.id === roleId);
    if (!targetRole || targetRole.isOwner) return;

    if (!canManageRole(currentActorRole, targetRole, rolesList)) {
      toast.error('You cannot edit a role higher in the hierarchy order than your own.', 'Hierarchy Protection');
      return;
    }

    const previousRoles = [...rolesList];
    const currentPerms = targetRole.permissions;
    const nextPerms = currentPerms.includes(permCode)
      ? currentPerms.filter((p) => p !== permCode)
      : [...currentPerms, permCode];

    // Optimistic UI update
    setRolesList((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, permissions: nextPerms } : r))
    );

    try {
      const ok = store.updateRolePermissions(roleId, nextPerms);
      if (!ok) {
        throw new Error('Server rejected permission update');
      }
      store.logAction('role.permissions.toggle', 'role', roleId, { permCode });
      toast.success(`Updated permissions for ${targetRole.name}`, 'Permission Saved');
    } catch (err) {
      // Rollback on failure
      setRolesList(previousRoles);
      toast.error(`Failed to save permission change. Changes were rolled back.`, 'Save Failed');
    }
  };

  // Move role up or down to change hierarchy order
  const handleMoveRole = (roleId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditRoles) return;

    const previousRoles = [...rolesList];
    const success = store.moveRole(currentOrg.id, roleId, direction);

    if (success) {
      const updated = store.getRoles(currentOrg.id);
      setRolesList(updated);
      toast.success(`Hierarchy updated. Order determines role authority.`, 'Order Saved');
    } else {
      setRolesList(previousRoles);
      toast.error('Could not move role.', 'Hierarchy Reorder');
    }
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    // By default created roles place below existing roles, hierarchy determined by list order
    const created = store.createRole(currentOrg.id, newRoleName.trim(), 10, newRolePerms, newRoleColor);
    store.logAction('role.create', 'role', created.id, { name: newRoleName });

    const updatedRoles = store.getRoles(currentOrg.id);
    setRolesList(updatedRoles);
    setSelectedRoleId(created.id);
    setShowCreateModal(false);
    setNewRoleName('');
    toast.success(`Role "${created.name}" created successfully.`, 'Role Created');
  };

  const handleAiCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const query = aiPrompt.toLowerCase();
    if (query.includes('media') && (query.includes('task') || query.includes('edit tasks'))) {
      const mediaRole = rolesList.find((r) => r.name.toLowerCase().includes('media'));
      if (mediaRole && !mediaRole.permissions.includes('tasks.edit')) {
        handleTogglePermission(mediaRole.id, 'tasks.edit');
        setAiMessage(`Granted task editing permissions to ${mediaRole.name}.`);
      } else {
        setAiMessage(`${mediaRole?.name || 'Media role'} already has task permissions.`);
      }
    } else {
      setAiMessage(`Processed request: "${aiPrompt}". For custom changes, use the permission switches directly.`);
    }
    setAiPrompt('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar onOpenChat={() => setIsChatOpen(true)} />

      <main className="container" style={{ flex: 1, paddingTop: '1.75rem', paddingBottom: '3.5rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>
                Roles and Permissions
              </h1>
              <span className="badge badge-info">{rolesList.length} Defined Roles</span>
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <SanitizedText>
                Role hierarchy is determined strictly by list order. Top of the list is the highest role.
              </SanitizedText>
            </p>
          </div>

          {canEditRoles && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ minHeight: '42px' }}
            >
              <Plus size={16} />
              <span>Create Custom Role</span>
            </button>
          )}
        </div>

        {/* Natural Language AI Prompt Bar */}
        {canEditRoles && (
          <div
            className="card"
            style={{
              padding: '1.25rem',
              marginBottom: '1.75rem',
              border: '1px solid var(--border-focus)',
              background: 'var(--bg-glass)',
            }}
          >
            <form onSubmit={handleAiCommand} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: '260px' }}>
                <Sparkles size={20} color="var(--brand-primary)" />
                <input
                  type="text"
                  placeholder='Ask AI in plain language: "Give Media Director permission to edit tasks"'
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  style={{ minHeight: '42px', fontSize: '0.9375rem' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ minHeight: '42px' }}>
                <span>Apply with Gemma 4</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Prompt:</span>
              <button
                type="button"
                onClick={() => setAiPrompt('Give Media Director permission to edit tasks')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  color: 'var(--brand-primary-text)',
                  cursor: 'pointer',
                }}
              >
                &quot;Give Media Director permission to edit tasks&quot;
              </button>
            </div>

            {aiMessage && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--brand-primary-text)', fontWeight: 600 }}>
                <SanitizedText>{aiMessage}</SanitizedText>
              </div>
            )}
          </div>
        )}

        {/* 2-Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Left Column: Role Hierarchy List */}
          <div className="card" style={{ padding: '1.25rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Role Hierarchy Order
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top = Highest</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rolesList.map((r, index) => {
                const isSelected = r.id === (activeRole?.id ?? '');
                const isFirst = index === 0;
                const isLast = index === rolesList.length - 1;

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '0.625rem',
                      border: isSelected ? '2px solid var(--border-focus)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'var(--brand-primary-subtle)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--brand-primary-text)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minHeight: '48px',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: r.color || 'var(--brand-primary)',
                          boxShadow: isSelected ? `0 0 10px ${r.color || 'var(--brand-primary)'}` : 'none',
                        }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{r.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {r.isOwner && <Lock size={14} color="var(--text-muted)" />}

                      {canEditRoles && !r.isOwner && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={isFirst || rolesList[index - 1]?.isOwner}
                            onClick={(e) => handleMoveRole(r.id, 'up', e)}
                            style={{
                              padding: '0.25rem',
                              borderRadius: '0.25rem',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-surface-elevated)',
                              color: 'var(--text-primary)',
                              cursor: isFirst || rolesList[index - 1]?.isOwner ? 'not-allowed' : 'pointer',
                              opacity: isFirst || rolesList[index - 1]?.isOwner ? 0.3 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Move role higher in hierarchy"
                            aria-label={`Move ${r.name} up`}
                          >
                            <ArrowUp size={14} />
                          </button>

                          <button
                            type="button"
                            disabled={isLast}
                            onClick={(e) => handleMoveRole(r.id, 'down', e)}
                            style={{
                              padding: '0.25rem',
                              borderRadius: '0.25rem',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-surface-elevated)',
                              color: 'var(--text-primary)',
                              cursor: isLast ? 'not-allowed' : 'pointer',
                              opacity: isLast ? 0.3 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Move role lower in hierarchy"
                            aria-label={`Move ${r.name} down`}
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Categorized Permission Matrix */}
          {activeRole && (
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: activeRole.color || 'var(--brand-primary)',
                      }}
                    />
                    <h2 style={{ fontSize: '1.375rem' }}>{activeRole.name}</h2>
                    {activeRole.isOwner && <span className="badge badge-warning">Root Owner</span>}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Permissions grant capabilities across the society workspace.
                  </div>
                </div>

                <div className="badge badge-info" style={{ padding: '0.35rem 0.75rem' }}>
                  {activeRole.isOwner ? 'All Enabled' : `${activeRole.permissions.length} Active`}
                </div>
              </div>

              {activeRole.isOwner && (
                <div
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--badge-warning-bg)',
                    color: 'var(--badge-warning-text)',
                    fontSize: '0.875rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Lock size={16} />
                  <SanitizedText>
                    The Society Owner role holds immutable root access to all permissions across the platform.
                  </SanitizedText>
                </div>
              )}

              {/* Categorized Permission Groups */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {categories.map((cat) => (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {cat.icon}
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {cat.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {cat.defs.map((def) => {
                        const isEnabled = activeRole.isOwner || activeRole.permissions.includes(def.code);
                        const isLocked = activeRole.isOwner || !canEditRoles || !canManageRole(currentActorRole, activeRole, rolesList);

                        return (
                          <Switch
                            key={def.code}
                            id={`switch-${activeRole.id}-${def.code}`}
                            checked={isEnabled}
                            disabled={isLocked}
                            label={def.label}
                            description={def.description}
                            onChange={() => handleTogglePermission(activeRole.id, def.code)}
                            ariaLabel={`Toggle ${def.label} for ${activeRole.name}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal: Create Custom Role */}
        {showCreateModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div className="card" style={{ width: '100%', maxWidth: '460px', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Create Custom Role</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label htmlFor="r-name">Role Name</label>
                  <input
                    id="r-name"
                    type="text"
                    placeholder="e.g. Flight Safety Officer"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    required
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    New roles are added below existing roles. Use arrow buttons to reorder.
                  </div>
                </div>

                <div>
                  <label htmlFor="r-color">Role Badge Color</label>
                  <input
                    id="r-color"
                    type="color"
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    style={{ height: '44px', cursor: 'pointer', padding: '0.25rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Create Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
