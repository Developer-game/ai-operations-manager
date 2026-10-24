// src/components/Switch.tsx
'use client';

import React from 'react';

interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  ariaLabel?: string;
}

export function Switch({
  id,
  checked,
  onChange,
  disabled = false,
  label,
  description,
  ariaLabel,
}: SwitchProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        width: '100%',
        padding: '0.75rem 0.875rem',
        borderRadius: '0.625rem',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-color)',
        transition: 'border-color 0.15s ease',
      }}
    >
      {(label || description) && (
        <div style={{ flex: 1, minWidth: 0 }}>
          {label && (
            <div
              style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: 'var(--text-primary)',
                lineHeight: 1.3,
              }}
            >
              {label}
            </div>
          )}
          {description && (
            <div
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                marginTop: '0.2rem',
                lineHeight: 1.4,
              }}
            >
              {description}
            </div>
          )}
        </div>
      )}

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label || 'Toggle switch'}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          width: '46px',
          height: '26px',
          borderRadius: '9999px',
          backgroundColor: checked ? 'var(--brand-primary)' : 'var(--border-color)',
          border: 'none',
          padding: '2px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          position: 'relative',
          flexShrink: 0,
          transition: 'background-color 150ms ease',
          outline: 'none',
        }}
      >
        <span
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
            transform: checked ? 'translateX(20px)' : 'translateX(0px)',
            transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'block',
          }}
        />
      </button>
    </div>
  );
}
