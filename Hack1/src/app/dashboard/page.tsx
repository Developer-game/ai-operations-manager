'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { Navbar } from '@/components/Navbar';
import { ChatDrawer } from '@/components/ChatDrawer';
import { SanitizedText } from '@/components/SanitizedText';
import {
  Calendar,
  CheckSquare,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { Task, Event, AvailabilityResponse } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(store.getCurrentUser());
  const [currentOrg, setCurrentOrg] = useState(store.getCurrentOrg());
  const [membershipDetails, setMembershipDetails] = useState(store.getCurrentMembership());
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Availability prompt state
  const [rsvpEvent, setRsvpEvent] = useState<Event | null>(null);
  const [rsvpReason, setRsvpReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  useEffect(() => {
    const user = store.getCurrentUser();
    const org = store.getCurrentOrg();
    const mem = store.getCurrentMembership();

    setCurrentUser(user);
    setCurrentOrg(org);
    setMembershipDetails(mem);

    if (!mem.membership) {
      router.push('/waiting');
      return;
    }

    if (org && user) {
      const events = store.getEvents(org.id);
      const openEvent = events.find((e) => e.status === 'published');
      if (openEvent) {
        const existingRsvp = store.getEventAvailability(openEvent.id).find((a) => a.userId === user.id);
        if (!existingRsvp || !existingRsvp.confirmedByMember) {
          setRsvpEvent(openEvent);
        }
      }
    }
  }, [router]);

  if (!currentUser || !currentOrg) {
    return null;
  }

  const { role, team } = membershipDetails;
  const isOrganiser = currentOrg.ownerUserId === currentUser.id || role?.isOwner || role?.name.toLowerCase().includes('organiser');
  const isTeamLead = team && team.leadUserId === currentUser.id;

  const allEvents = store.getEvents(currentOrg.id);
  const userTasks = store.getUserTasks(currentUser.id);
  const allTasks = store.getTasks(currentOrg.id);
  const pendingTasks = isOrganiser ? allTasks.filter((t) => t.status !== 'completed') : userTasks.filter((t) => t.status !== 'completed');

  const handleTaskToggle = (taskId: string, currentStatus: Task['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    store.updateTaskStatus(taskId, nextStatus);
    store.logAction('task.update_status', 'task', taskId, { status: nextStatus });
    setMembershipDetails(store.getCurrentMembership());

    if (nextStatus === 'completed') {
      toast.success('Task marked as complete.', 'Task Finished');
    } else {
      toast.info('Task reopened.', 'Task Updated');
    }
  };

  const handleRsvp = (status: AvailabilityResponse['status'], reason = '') => {
    if (!rsvpEvent) return;
    store.setMemberAvailability(rsvpEvent.id, currentUser.id, status, reason);
    store.logAction('availability.rsvp', 'event', rsvpEvent.id, { status, reason });
    toast.success(`Availability marked as ${status.toUpperCase()} for ${rsvpEvent.title}`, 'RSVP Recorded');
    setRsvpEvent(null);
    setShowReasonInput(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar onOpenChat={() => setIsChatOpen(true)} />

      <main className="container" style={{ flex: 1, paddingTop: '1.75rem', paddingBottom: '3.5rem' }}>
        {/* Helper Line at top (Section H.6) */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.875rem', color: 'var(--text-primary)' }}>
                Hello, {currentUser.fullName.split(' ')[0]}
              </h1>
              {role && (
                <span
                  className="badge"
                  style={{
                    backgroundColor: role.color ? `${role.color}18` : 'var(--brand-primary-subtle)',
                    color: role.color || 'var(--brand-primary-text)',
                    border: `1px solid ${role.color || '#4F46E5'}40`,
                    padding: '0.3rem 0.65rem',
                  }}
                >
                  {role.name}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <SanitizedText>
                Here is what requires your attention today: upcoming events and pending tasks.
              </SanitizedText>
            </p>
          </div>

          {/* Single Primary Action per screen (Section H.3) */}
          <div>
            {isOrganiser ? (
              <Link href="/events" className="btn btn-primary" style={{ minHeight: '44px', textDecoration: 'none' }}>
                <Plus size={16} />
                <span>Create New Event</span>
              </Link>
            ) : (
              <Link href="/tasks" className="btn btn-primary" style={{ minHeight: '44px', textDecoration: 'none' }}>
                <CheckSquare size={16} />
                <span>View My Tasks ({pendingTasks.length})</span>
              </Link>
            )}
          </div>
        </div>

        {/* Ambient AI Pulse Strip (Computed from Real Data) */}
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.75rem',
            border: '1px solid var(--border-focus)',
            background: 'var(--bg-glass)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--brand-gradient)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} />
          </div>
          <div style={{ flex: 1, fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary-text)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
              Operations Pulse
            </div>
            <SanitizedText>
              {isOrganiser
                ? `${allEvents.length} events scheduled on the calendar. ${pendingTasks.length} open tasks across all teams.`
                : `You have ${pendingTasks.length} tasks needing attention. Next upcoming event starts on ${allEvents[0] ? new Date(allEvents[0].startTime).toLocaleDateString() : 'the calendar'}.`}
            </SanitizedText>
          </div>
        </div>

        {/* Event Availability RSVP Banner (if member has pending RSVP) */}
        {rsvpEvent && (
          <div
            className="card"
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--brand-primary-subtle)',
              border: '2px solid var(--border-focus)',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Clock size={20} color="var(--brand-primary)" />
              <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--brand-primary-text)' }}>
                RSVP Requested: {rsvpEvent.title}
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              <SanitizedText>
                Please confirm whether you are available to attend this event.
              </SanitizedText>
            </p>

            {!showReasonInput ? (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleRsvp('confirmed')}
                  className="btn btn-primary"
                  style={{ minHeight: '40px', fontSize: '0.875rem' }}
                >
                  <CheckCircle2 size={16} />
                  <span>I am Available</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReasonInput(true)}
                  className="btn btn-secondary"
                  style={{ minHeight: '40px', fontSize: '0.875rem' }}
                >
                  <AlertCircle size={16} />
                  <span>Mark Unavailable</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '440px' }}>
                <input
                  type="text"
                  placeholder="Reason for absence (e.g. Tutorial clash, travelling)"
                  value={rsvpReason}
                  onChange={(e) => setRsvpReason(e.target.value)}
                  style={{ minHeight: '40px', fontSize: '0.875rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleRsvp('unavailable', rsvpReason)}
                    className="btn btn-danger"
                    style={{ minHeight: '38px', fontSize: '0.8125rem' }}
                  >
                    Confirm Unavailability
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReasonInput(false)}
                    className="btn btn-secondary"
                    style={{ minHeight: '38px', fontSize: '0.8125rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Home Content: What matters now (Section H.3) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {/* Column 1: Upcoming Events */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Upcoming Events</h2>
              <Link href="/events" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                View All ({allEvents.length})
              </Link>
            </div>

            {allEvents.length === 0 ? (
              <div className="card empty-state" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <Calendar size={28} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.25rem' }}>No events scheduled</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Events created will appear right here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {allEvents.slice(0, 3).map((evt) => (
                  <div key={evt.id} className="card card-interactive" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.0625rem', color: 'var(--text-primary)' }}>
                        <SanitizedText>{evt.title}</SanitizedText>
                      </h3>
                      <span className={`badge ${evt.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                        {evt.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      <SanitizedText>{evt.description}</SanitizedText>
                    </p>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <MapPin size={14} color="var(--brand-primary)" />
                        <span>Location: <strong>{evt.location}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar size={14} color="#06B6D4" />
                        <span>Date: <strong>{new Date(evt.startTime).toLocaleDateString()}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Pending Tasks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                {isOrganiser ? 'Pending Tasks' : 'My Tasks'}
              </h2>
              <Link href={isOrganiser ? '/events' : '/tasks'} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {pendingTasks.length} Pending
              </Link>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="card empty-state" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <CheckCircle2 size={28} color="var(--brand-primary)" style={{ marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.25rem' }}>All caught up</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  There are no pending tasks requiring action.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingTasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="card"
                    onClick={() => handleTaskToggle(t.id, t.status)}
                    style={{
                      padding: '0.875rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={t.status === 'completed'}
                        onChange={() => handleTaskToggle(t.id, t.status)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          <SanitizedText>{t.title}</SanitizedText>
                        </div>
                        {t.description && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            <SanitizedText>{t.description}</SanitizedText>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                      {t.priority}
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
