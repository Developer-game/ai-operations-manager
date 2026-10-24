'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { AppShell } from '@/components/AppShell';
import { SanitizedText } from '@/components/SanitizedText';
import { DateTimePicker } from '@/components/DateTimePicker';
import { hasPermission } from '@/lib/permissions';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Send,
  Users,
  MessageSquare,
  ArrowRight,
  X,
  AlertCircle,
} from 'lucide-react';
import { Event } from '@/types';

export default function EventsManagementPage() {
  const currentOrg = store.getCurrentOrg();
  const currentUser = store.getCurrentUser();
  const { role } = store.getCurrentMembership();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const canManageEvents = hasPermission(role, 'events.create_publish');
  const canComment = hasPermission(role, 'members.comment');

  // Create Event state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('2026-11-15T14:00');
  const [endTime, setEndTime] = useState('2026-11-15T17:00');
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [formError, setFormError] = useState('');

  // Selected event for member assignment & comments
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberEventRole, setMemberEventRole] = useState('Safety Coordinator');
  const [memberTaskSummary, setMemberTaskSummary] = useState('');
  const [memberCommentText, setMemberCommentText] = useState('');
  const [assignmentNotice, setAssignmentNotice] = useState('');

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

  const events = store.getEvents(currentOrg.id);
  const allMembers = store.getMembersWithDetails(currentOrg.id);
  const activeEvent = events.find((e) => e.id === (selectedEventId || events[0]?.id));

  // Date and Time validation
  const startTimestamp = new Date(startTime).getTime();
  const endTimestamp = new Date(endTime).getTime();
  const isEndInvalid = !isNaN(startTimestamp) && !isNaN(endTimestamp) && endTimestamp <= startTimestamp;
  const timeError = isEndInvalid ? 'End date and time must be after the start date and time.' : '';

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter an event title.');
      return;
    }

    if (!location.trim()) {
      setFormError('Please enter an event location.');
      return;
    }

    if (isEndInvalid) {
      setFormError('End date and time must be after the start date and time.');
      return;
    }

    if (!currentUser) return;

    const newEvt = store.createEvent({
      organisationId: currentOrg.id,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      status: publishImmediately ? 'published' : 'draft',
      createdByUserId: currentUser.id,
      publishedAt: publishImmediately ? new Date().toISOString() : undefined,
    });

    store.logAction('event.create', 'event', newEvt.id, { title, status: newEvt.status });

    setSelectedEventId(newEvt.id);
    setShowCreateModal(false);
    toast.success(`Event "${newEvt.title}" created successfully!`, 'Event Scheduled');
    setTitle('');
    setDescription('');
    setLocation('');
  };

  const handlePublish = (eventId: string) => {
    store.publishEvent(eventId);
    store.logAction('event.publish', 'event', eventId, {});
    toast.success('Event published! Notification dispatched to all assigned members.', 'Event Published');
    setAssignmentNotice('Event published! Notification emails sent to all assigned members.');
    setTimeout(() => setAssignmentNotice(''), 3000);
  };

  const handleAssignMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !selectedMemberId) return;

    store.assignEventMember(activeEvent.id, selectedMemberId, memberEventRole, memberTaskSummary);
    store.logAction('event.assign_member', 'event', activeEvent.id, { userId: selectedMemberId, role: memberEventRole });

    if (memberCommentText.trim()) {
      store.addEventComment(activeEvent.id, selectedMemberId, memberCommentText);
    }

    toast.success('Member assigned and duty roster updated.', 'Roster Updated');
    setAssignmentNotice('Member assigned and profile notes updated.');
    setSelectedMemberId('');
    setMemberTaskSummary('');
    setMemberCommentText('');
    setTimeout(() => setAssignmentNotice(''), 3000);
  };

  return (
    <AppShell>
      <div>
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
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Events and Operations
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <SanitizedText>
                Draft, publish, assign duties, and track conflict free availability.
              </SanitizedText>
            </p>
          </div>

          {canManageEvents && (
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setShowCreateModal(true);
              }}
              className="btn btn-primary"
              style={{ minHeight: '40px' }}
            >
              <Plus size={16} />
              <span>Create New Event</span>
            </button>
          )}
        </div>

        {assignmentNotice && (
          <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem' }}>
            <CheckCircle2 size={16} />
            <span>{assignmentNotice}</span>
          </div>
        )}

        {/* Empty State when no events exist */}
        {events.length === 0 ? (
          <div className="card empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div className="empty-state-icon">
              <Calendar size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              No events yet
            </h2>
            <p style={{ fontSize: '0.9375rem', maxWidth: '400px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }}>
              Create your first event to organize workshops, competitions, and society meetings.
            </p>
            {canManageEvents && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Create Your First Event</span>
              </button>
            )}
          </div>
        ) : (
          /* 2-Column Layout */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Left: Events List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Society Events ({events.length})
              </div>

              {events.map((evt) => {
                const isSelected = evt.id === activeEvent?.id;
                return (
                  <div
                    key={evt.id}
                    className="card"
                    onClick={() => setSelectedEventId(evt.id)}
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--border-focus)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'var(--brand-primary-subtle)' : 'var(--bg-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                        <SanitizedText>{evt.title}</SanitizedText>
                      </h3>
                      <span className={`badge ${evt.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                        {evt.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      <SanitizedText>{evt.description}</SanitizedText>
                    </p>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                      <div>Location: <strong>{evt.location}</strong></div>
                      <div>Date: <strong>{new Date(evt.startTime).toLocaleDateString()}</strong></div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link
                        href={`/events/${evt.id}/availability`}
                        className="btn btn-secondary"
                        style={{ minHeight: '34px', fontSize: '0.75rem', textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Availability AI</span>
                        <ArrowRight size={14} />
                      </Link>

                      {evt.status === 'draft' && canManageEvents && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(evt.id);
                          }}
                          className="btn btn-primary"
                          style={{ minHeight: '34px', fontSize: '0.75rem' }}
                        >
                          <Send size={14} />
                          <span>Publish Event</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Event Detail, Staff Assignment, & Comments */}
            {activeEvent && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>
                    Event Detail
                  </span>
                  <h2 style={{ fontSize: '1.375rem', marginBottom: '0.25rem' }}>
                    <SanitizedText>{activeEvent.title}</SanitizedText>
                  </h2>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Location: {activeEvent.location} | Starts: {new Date(activeEvent.startTime).toLocaleString()}
                  </div>
                </div>

                {/* Assigned Staff List */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    Assigned Team Members
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {store.getEventMembers(activeEvent.id).map((em) => {
                      const comments = store.getEventComments(activeEvent.id, em.userId);
                      return (
                        <div
                          key={em.id}
                          style={{
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {em.user?.fullName}
                            </span>
                            <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                              {em.eventRole}
                            </span>
                          </div>
                          {em.taskSummary && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              Duty: {em.taskSummary}
                            </div>
                          )}

                          {comments.length > 0 && (
                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                              {comments.map((c) => (
                                <div key={c.id} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Note: <SanitizedText>{c.comment}</SanitizedText>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {store.getEventMembers(activeEvent.id).length === 0 && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No members assigned to this event yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Assign Member Form */}
                {canManageEvents && (
                  <form onSubmit={handleAssignMember} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      Assign Duty to Member
                    </div>

                    <div>
                      <label htmlFor="assign-member">Select Member</label>
                      <select
                        id="assign-member"
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        required
                      >
                        <option value="">Select a member...</option>
                        {allMembers.map((m) => (
                          <option key={m.user?.id} value={m.user?.id}>
                            {m.user?.fullName} ({m.role?.name || 'Member'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="assign-role">Assigned Duty / Title</label>
                      <input
                        id="assign-role"
                        type="text"
                        placeholder="e.g. Flight Safety Coordinator"
                        value={memberEventRole}
                        onChange={(e) => setMemberEventRole(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="task-summary">Duty Description</label>
                      <input
                        id="task-summary"
                        type="text"
                        placeholder="e.g. Pre-flight motor calibration"
                        value={memberTaskSummary}
                        onChange={(e) => setMemberTaskSummary(e.target.value)}
                      />
                    </div>

                    {canComment && (
                      <div>
                        <label htmlFor="profile-comment">Internal Profile Comment (Optional)</label>
                        <input
                          id="profile-comment"
                          type="text"
                          placeholder="Private note on member performance"
                          value={memberCommentText}
                          onChange={(e) => setMemberCommentText(e.target.value)}
                        />
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.25rem' }}>
                      Assign Duty to Member
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal: Create Event */}
        {showCreateModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
                maxWidth: '520px',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Create Society Event</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {formError && (
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
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label htmlFor="ev-title">Event Title</label>
                  <input
                    id="ev-title"
                    type="text"
                    placeholder="e.g. Autonomous Drone Field Demonstration"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setFormError('');
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ev-desc">Description</label>
                  <textarea
                    id="ev-desc"
                    rows={2}
                    placeholder="Brief description of the event"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="ev-loc">Location</label>
                  <input
                    id="ev-loc"
                    type="text"
                    placeholder="e.g. Engineering Quad & Great Hall"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setFormError('');
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <DateTimePicker
                    id="ev-start"
                    label="Start Date & Time"
                    value={startTime}
                    onChange={(val) => {
                      setStartTime(val);
                      setFormError('');
                    }}
                    required
                  />

                  <DateTimePicker
                    id="ev-end"
                    label="End Date & Time"
                    value={endTime}
                    min={startTime}
                    error={timeError}
                    onChange={(val) => {
                      setEndTime(val);
                      setFormError('');
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    type="checkbox"
                    id="pub-imm"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    style={{ width: '18px', height: '18px', minHeight: '18px' }}
                  />
                  <label htmlFor="pub-imm" style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>
                    Publish immediately (Dispatches emails to assigned roster)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={isEndInvalid}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Save Event
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
      </div>
    </AppShell>
  );
}
