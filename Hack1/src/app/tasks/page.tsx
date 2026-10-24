'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { AppShell } from '@/components/AppShell';
import { SanitizedText } from '@/components/SanitizedText';
import { CheckSquare, CheckCircle2, Clock, Plus, Filter, AlertCircle } from 'lucide-react';
import { Task } from '@/types';

export default function MyTasksPage() {
  const currentOrg = store.getCurrentOrg();
  const currentUser = store.getCurrentUser();
  const { membership } = store.getCurrentMembership();
  const [filter, setFilter] = useState<'all' | 'todo' | 'completed'>('all');

  const [taskList, setTaskList] = useState<Task[]>(() => {
    return currentUser ? store.getUserTasks(currentUser.id) : [];
  });

  if (!currentOrg || !currentUser) return null;

  const handleToggleTask = (taskId: string, currentStatus: Task['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    store.updateTaskStatus(taskId, nextStatus);
    setTaskList(store.getUserTasks(currentUser.id));

    if (nextStatus === 'completed') {
      toast.success('Task marked as completed.', 'Task Finished');
    } else {
      toast.info('Task reopened.', 'Task Updated');
    }
  };

  const filteredTasks = taskList.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  return (
    <AppShell>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* Helper Line */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            My Assigned Tasks
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            <SanitizedText>
              View and update your personal tasks and assigned society responsibilities.
            </SanitizedText>
          </p>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: filter === 'all' ? 'var(--brand-primary)' : 'var(--bg-surface)',
              color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All Tasks ({taskList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('todo')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: filter === 'todo' ? 'var(--brand-primary)' : 'var(--bg-surface)',
              color: filter === 'todo' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Pending ({taskList.filter((t) => t.status !== 'completed').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: filter === 'completed' ? 'var(--brand-primary)' : 'var(--bg-surface)',
              color: filter === 'completed' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Completed ({taskList.filter((t) => t.status === 'completed').length})
          </button>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="card empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div className="empty-state-icon">
              <CheckSquare size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              No tasks found
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              You have no tasks matching this filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTasks.map((t) => {
              const isCompleted = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  className="card"
                  onClick={() => handleToggleTask(t.id, t.status)}
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggleTask(t.id, t.status)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.9375rem',
                          color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                        }}
                      >
                        <SanitizedText>{t.title}</SanitizedText>
                      </div>
                      {t.description && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          <SanitizedText>{t.description}</SanitizedText>
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`badge ${isCompleted ? 'badge-success' : 'badge-info'}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {t.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
