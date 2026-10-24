// src/components/ToastContainer.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { toast, ToastItem } from '@/lib/toast';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return () => unsubscribe();
  }, []);

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#10B981" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle size={18} color="#F59E0B" aria-hidden="true" />;
      case 'error':
        return <AlertCircle size={18} color="#EF4444" aria-hidden="true" />;
      case 'info':
      default:
        return <Info size={18} color="#3B82F6" aria-hidden="true" />;
    }
  };

  const getBorderColor = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.4)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.4)';
      case 'error':
        return 'rgba(239, 68, 68, 0.4)';
      case 'info':
      default:
        return 'rgba(59, 130, 246, 0.4)';
    }
  };

  return (
    <div
      role="region"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        maxWidth: '380px',
        width: 'calc(100vw - 3rem)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          aria-atomic="true"
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--bg-glass)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${getBorderColor(item.type)}`,
            boxShadow: 'var(--shadow-float), var(--shadow-glow)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            lineHeight: 1.45,
            animation: 'toast-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon(item.type)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {item.title && (
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.01em',
                  marginBottom: '2px',
                  color: 'var(--text-primary)',
                }}
              >
                {item.title}
              </div>
            )}
            <div style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
              {item.message}
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(item.id)}
            aria-label="Dismiss notification"
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              padding: '2px',
              minHeight: '28px',
              minWidth: '28px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              borderRadius: '0.375rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={15} />
          </button>
        </div>
      ))}
      <style jsx>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
