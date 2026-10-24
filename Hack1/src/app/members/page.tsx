'use client';

import React, { useState, useEffect, useRef } from 'react';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { Navbar } from '@/components/Navbar';
import { ChatDrawer } from '@/components/ChatDrawer';
import { SanitizedText } from '@/components/SanitizedText';
import {
  parseSpreadsheetFile,
  commitSpreadsheetImport,
  ExcelImportPreview,
  StagedMemberRow,
} from '@/lib/agents/excelImportAgent';
import { hasPermission } from '@/lib/permissions';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Mail,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  UploadCloud,
  X,
  Search,
  Crown,
  CheckSquare,
  Trash2,
  Calendar,
  Lock,
  Loader2,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function MembersDirectoryPage() {
  const currentOrg = store.getCurrentOrg();
  const currentUser = store.getCurrentUser();
  const { role } = store.getCurrentMembership();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Permission checking
  const canViewAllMembers = currentOrg && currentUser ? store.canUserViewMembers(currentUser.id, currentOrg.id) : false;
  const canEditMembers = hasPermission(role, 'members.edit');

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');

  // Member list state (joined + invited)
  const [memberRoster, setMemberRoster] = useState(() => {
    return currentOrg ? store.getMembersAndInvites(currentOrg.id) : [];
  });

  // Manual Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Spreadsheet Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [importPreview, setImportPreview] = useState<ExcelImportPreview | null>(null);
  const [importSummary, setImportSummary] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: close modals on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setShowImportModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync member roster when org changes
  useEffect(() => {
    if (currentOrg) {
      setMemberRoster(store.getMembersAndInvites(currentOrg.id));
    }
  }, [currentOrg]);

  if (!currentOrg || !currentUser) return null;

  const roles = store.getRoles(currentOrg.id);
  const teams = store.getTeams(currentOrg.id);
  const tasks = store.getTasks(currentOrg.id);
  const events = store.getEvents(currentOrg.id);

  // If user is a normal member without members.view permission, show only personal profile
  if (!canViewAllMembers) {
    const userTasks = tasks.filter((t) => t.assignedToUserId === currentUser.id);
    const userMembership = store.getMemberships().find(
      (m: any) => m.userId === currentUser.id && m.organisationId === currentOrg.id
    );
    const userRole = roles.find((r) => r.id === userMembership?.roleId);
    const userTeam = teams.find((t) => t.id === userMembership?.teamId);
    const teamLead = userTeam?.leadUserId
      ? store.getUsers().find((u) => u.id === userTeam.leadUserId)
      : null;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
        <Navbar onOpenChat={() => setIsChatOpen(true)} />

        <main className="container" style={{ flex: 1, paddingTop: '2rem', paddingBottom: '3.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              My Membership Profile
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <SanitizedText>
                Member directory access is restricted to leadership roles. You can view your personal profile, assigned tasks, team lead, and society events below.
              </SanitizedText>
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            {/* Personal Profile Card */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: userRole?.color || 'var(--brand-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.375rem',
                  }}
                >
                  {currentUser.fullName.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{currentUser.fullName}</h2>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{currentUser.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Designated Role</span>
                  <span className="badge badge-info">{userRole?.name || 'Member'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Assigned Team</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{userTeam?.name || 'No team assigned'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Team Lead</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: teamLead ? 'var(--brand-primary-text)' : 'var(--text-muted)' }}>
                    {teamLead ? teamLead.fullName : 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* My Tasks Overview */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckSquare size={20} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.125rem' }}>My Assigned Tasks ({userTasks.length})</h3>
              </div>

              {userTasks.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No active tasks assigned to you currently.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {userTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.title}</span>
                      <span className={`badge ${t.status === 'completed' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '0.75rem' }}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    );
  }

  // Filter members by search and team
  const filteredMembers = memberRoster.filter((m) => {
    const roleName = m.role?.name || 'Member';
    const matchesSearch =
      m.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedTeamFilter === 'all') return true;
    if (selectedTeamFilter === 'leads') return m.team?.leadUserId === m.user.id;
    return m.team?.id === selectedTeamFilter;
  });

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) return;
    setAddError('');
    setAddSuccess('');

    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanName = newName.trim();

    if (!cleanEmail || !cleanName) {
      setAddError('Please provide both full name and university email address.');
      return;
    }

    setIsAdding(true);

    const assignedRoleId = newRoleId || (roles[0]?.id ?? '');
    const res = store.createInvitation(currentOrg.id, cleanEmail, assignedRoleId, newTeamId || undefined);

    if (!res.success) {
      setAddError(res.message);
      toast.error(res.message, 'Duplicate Member');
      setIsAdding(false);
      return;
    }

    // Refresh list immediately
    const updated = store.getMembersAndInvites(currentOrg.id);
    setMemberRoster(updated);

    store.logAction('member.invite', 'invitation', res.invitation?.id, { email: cleanEmail, roleId: assignedRoleId });
    setAddSuccess(`Invitation sent to ${cleanEmail}. They now appear in the roster.`);
    toast.success(`Invitation dispatched to ${cleanEmail}`, 'Member Invited');
    setNewName('');
    setNewEmail('');
    setIsAdding(false);

    setTimeout(() => {
      setShowAddModal(false);
      setAddSuccess('');
    }, 1200);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setParseError('');
    setIsParsing(true);
    setImportSummary('');

    try {
      const preview = await parseSpreadsheetFile(currentOrg.id, file);
      setImportPreview(preview);
      setIsParsing(false);
    } catch (err: any) {
      setIsParsing(false);
      setParseError(err?.message || 'Failed to read file. Please check that it is a valid .xlsx, .xls, or .csv spreadsheet.');
    }
  };

  const handleCellEdit = (
    rowId: string,
    field: 'fullName' | 'email' | 'roleName' | 'teamName',
    val: string
  ) => {
    if (!importPreview) return;
    setImportPreview({
      ...importPreview,
      members: importPreview.members.map((m) =>
        m.id === rowId ? { ...m, [field]: val } : m
      ),
    });
  };

  const handleDeleteStagedRow = (rowId: string) => {
    if (!importPreview) return;
    setImportPreview({
      ...importPreview,
      members: importPreview.members.filter((m) => m.id !== rowId),
    });
  };

  const handleCommitImport = () => {
    if (!importPreview || isImporting) return;
    setIsImporting(true);

    try {
      const result = commitSpreadsheetImport(currentOrg.id, importPreview.members);
      const summaryMsg = `${result.addedCount} members added, ${result.skippedCount} skipped.`;
      setImportSummary(summaryMsg);
      toast.success(summaryMsg, 'Import Finished');

      // Update roster immediately
      setMemberRoster(store.getMembersAndInvites(currentOrg.id));
      setIsImporting(false);

      setTimeout(() => {
        setShowImportModal(false);
        setImportPreview(null);
        setImportFile(null);
        setImportSummary('');
      }, 1500);
    } catch (err: any) {
      setIsImporting(false);
      setParseError('Failed to import rows. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar onOpenChat={() => setIsChatOpen(true)} />

      <main className="container" style={{ flex: 1, paddingTop: '1.75rem', paddingBottom: '3.5rem' }}>
        {/* Header Bar */}
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
                Members and Teams
              </h1>
              <span className="badge badge-info">{memberRoster.length} Total</span>
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <SanitizedText>
                Manage society roster, team groupings, lead assignments, and bulk spreadsheet imports.
              </SanitizedText>
            </p>
          </div>

          {canEditMembers && (
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setImportPreview(null);
                  setParseError('');
                  setImportSummary('');
                  setShowImportModal(true);
                }}
                className="btn btn-secondary"
                style={{ minHeight: '42px' }}
              >
                <FileSpreadsheet size={16} />
                <span>Import Spreadsheet</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddError('');
                  setAddSuccess('');
                  setShowAddModal(true);
                }}
                className="btn btn-primary"
                style={{ minHeight: '42px' }}
              >
                <UserPlus size={16} />
                <span>Add Member</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div
          className="card"
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Filter by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', minHeight: '40px', fontSize: '0.875rem' }}
            />
          </div>

          {/* Team Filter Pills */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedTeamFilter('all')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: selectedTeamFilter === 'all' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                color: selectedTeamFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '38px',
              }}
            >
              All ({memberRoster.length})
            </button>

            {teams.map((t) => {
              const isSelected = selectedTeamFilter === t.id;
              const count = memberRoster.filter((m) => m.team?.id === t.id).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTeamFilter(t.id)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '38px',
                  }}
                >
                  {t.name} ({count})
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelectedTeamFilter('leads')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: selectedTeamFilter === 'leads' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                color: selectedTeamFilter === 'leads' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '38px',
              }}
            >
              Team Leads
            </button>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredMembers.map((m) => {
            const memberTasks = tasks.filter((t) => t.assignedToUserId === m.id);

            return (
              <div
                key={m.id}
                className="card card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.5rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        border: `2px solid ${m.role?.color || 'var(--brand-primary)'}`,
                        padding: '2px',
                        backgroundColor: 'var(--bg-surface)',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          backgroundColor: m.role?.color || 'var(--brand-primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.125rem',
                        }}
                      >
                        {m.user.fullName.charAt(0) || 'M'}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.0625rem', color: 'var(--text-primary)', margin: 0 }}>
                          {m.user.fullName}
                        </h3>
                        {m.team?.leadUserId === m.user.id && (
                          <span
                            className="badge badge-warning"
                            style={{ fontSize: '0.6875rem', gap: '0.25rem', padding: '0.2rem 0.5rem' }}
                          >
                            <Crown size={12} />
                            <span>Lead</span>
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {m.user.email}
                      </div>
                    </div>
                  </div>

                  {/* Role and Team Tags */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${m.role?.color || '#4F46E5'}18`,
                        color: m.role?.color || 'var(--brand-primary-text)',
                        border: `1px solid ${m.role?.color || '#4F46E5'}40`,
                      }}
                    >
                      {m.role?.name || 'Member'}
                    </span>

                    {m.team ? (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <Layers size={12} />
                        <span>{m.team.name}</span>
                      </span>
                    ) : (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        No Team
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Operational Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.875rem',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <CheckSquare size={14} color="var(--brand-primary)" />
                    <span>{memberTasks.length} tasks assigned</span>
                  </div>

                  <span
                    className={`badge ${m.status === 'Joined' ? 'badge-success' : 'badge-info'}`}
                    style={{ fontSize: '0.6875rem' }}
                  >
                    {m.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="empty-state" style={{ marginTop: '1.5rem', padding: '3.5rem 1.5rem' }}>
            <div className="empty-state-icon">
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              No members match your search
            </h3>
            <p style={{ fontSize: '0.9375rem', maxWidth: '420px', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
              We could not find any members matching &quot;{searchQuery}&quot; or the selected team filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTeamFilter('all');
              }}
              className="btn btn-secondary"
              style={{ minHeight: '40px' }}
            >
              Clear Search Filters
            </button>
          </div>
        )}

        {/* Modal: Manual Add Member */}
        {showAddModal && (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={20} color="var(--brand-primary)" />
                  <h2 style={{ fontSize: '1.25rem' }}>Add Society Member</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {addError && (
                <div className="badge badge-error" style={{ width: '100%', padding: '0.625rem', marginBottom: '1rem' }}>
                  <AlertCircle size={16} />
                  <span>{addError}</span>
                </div>
              )}

              {addSuccess && (
                <div className="badge badge-success" style={{ width: '100%', padding: '0.625rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{addSuccess}</span>
                </div>
              )}

              <form onSubmit={handleManualAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label htmlFor="m-name">Full Name</label>
                  <input
                    id="m-name"
                    type="text"
                    placeholder="e.g. Liam Foster"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      setAddError('');
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="m-email">University Email</label>
                  <input
                    id="m-email"
                    type="email"
                    placeholder="e.g. liam.foster@imperial.ac.uk"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setAddError('');
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="m-role">Role</label>
                  <select
                    id="m-role"
                    value={newRoleId}
                    onChange={(e) => setNewRoleId(e.target.value)}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="m-team">Team Assignment (Optional)</label>
                  <select
                    id="m-team"
                    value={newTeamId}
                    onChange={(e) => setNewTeamId(e.target.value)}
                  >
                    <option value="">No team assigned</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" disabled={isAdding} className="btn btn-primary" style={{ flex: 1 }}>
                    {isAdding ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending Invitation...</span>
                      </>
                    ) : (
                      <span>Send Invitation</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Spreadsheet Import */}
        {showImportModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '820px',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-float)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--brand-primary-subtle)',
                      color: 'var(--brand-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                      Import Members Spreadsheet
                    </h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Supported formats: .xlsx, .xls, .csv (Max 5 MB)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {parseError && (
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--badge-error-bg)',
                    color: 'var(--badge-error-text)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{parseError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setParseError('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--badge-error-text)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    Try again
                  </button>
                </div>
              )}

              {importSummary && (
                <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{importSummary}</span>
                </div>
              )}

              {/* Upload Input Area */}
              {!importPreview && (
                <div
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '0.75rem',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <UploadCloud size={36} color="var(--brand-primary)" style={{ marginBottom: '0.75rem' }} />
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.375rem' }}>
                    {isParsing ? 'Reading and analysing spreadsheet...' : 'Click to select spreadsheet'}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Select an Excel or CSV file from your computer. Column mappings and duplicates will be analysed automatically.
                  </p>
                </div>
              )}

              {/* Editable Preview Table */}
              {importPreview && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      File: <strong>{importPreview.fileName}</strong> ({importPreview.members.length} rows analysed)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: '30px' }}
                    >
                      Choose different file
                    </button>
                  </div>

                  {/* Summary Metric Chips */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span className="badge badge-success" style={{ padding: '0.35rem 0.75rem' }}>
                      {importPreview.validCount} Valid
                    </span>
                    {importPreview.errorCount > 0 && (
                      <span className="badge badge-error" style={{ padding: '0.35rem 0.75rem' }}>
                        {importPreview.errorCount} Issues Flagged
                      </span>
                    )}
                    {importPreview.rolesToCreate.length > 0 && (
                      <span className="badge badge-info" style={{ padding: '0.35rem 0.75rem' }}>
                        New Roles: {importPreview.rolesToCreate.join(', ')}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    You can edit any cell directly below before confirming. Nothing is saved until you click the IMPORT button.
                  </p>

                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '0.625rem', marginBottom: '1.5rem', maxHeight: '350px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Full Name</th>
                          <th style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Email Address</th>
                          <th style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Role</th>
                          <th style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Team</th>
                          <th style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Status & Notes</th>
                          <th style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.members.map((row) => (
                          <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="text"
                                value={row.fullName}
                                onChange={(e) => handleCellEdit(row.id, 'fullName', e.target.value)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem', minHeight: '32px' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="email"
                                value={row.email}
                                onChange={(e) => handleCellEdit(row.id, 'email', e.target.value)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem', minHeight: '32px' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="text"
                                value={row.roleName}
                                onChange={(e) => handleCellEdit(row.id, 'roleName', e.target.value)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem', minHeight: '32px' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="text"
                                value={row.teamName}
                                onChange={(e) => handleCellEdit(row.id, 'teamName', e.target.value)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem', minHeight: '32px' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <span
                                className={`badge ${
                                  row.status === 'valid'
                                    ? 'badge-success'
                                    : row.status === 'warning'
                                    ? 'badge-warning'
                                    : 'badge-error'
                                }`}
                                style={{ fontSize: '0.6875rem', whiteSpace: 'nowrap' }}
                              >
                                {row.issue || 'Ready to import'}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteStagedRow(row.id)}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  color: 'var(--badge-error-text)',
                                  cursor: 'pointer',
                                  padding: '0.25rem',
                                }}
                                title="Remove row"
                                aria-label="Delete row"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCommitImport}
                      disabled={isImporting || importPreview.members.length === 0}
                      className="btn btn-primary"
                      style={{ minWidth: '120px' }}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <span>IMPORT</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
