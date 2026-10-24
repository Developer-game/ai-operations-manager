'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';

interface DateTimePickerProps {
  id: string;
  label: string;
  value: string; // ISO string or YYYY-MM-DDTHH:mm
  onChange: (val: string) => void;
  min?: string;
  error?: string;
  required?: boolean;
}

export function DateTimePicker({
  id,
  label,
  value,
  onChange,
  min,
  error,
  required = false,
}: DateTimePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize input format YYYY-MM-DDTHH:mm
  const formatForInput = (val: string) => {
    if (!val) return '';
    if (val.length === 16) return val;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return val;
    }
  };

  const formattedVal = formatForInput(value);
  const minVal = min ? formatForInput(min) : undefined;

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          marginBottom: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {label}
      </label>

      <div style={{ position: 'relative', width: '100%' }}>
        <CalendarIcon
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          id={id}
          type="datetime-local"
          value={formattedVal}
          min={minVal}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '2.5rem',
            paddingRight: '0.75rem',
            minHeight: '44px',
            borderRadius: '0.5rem',
            border: error ? '1.5px solid var(--badge-error-text)' : '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
          }}
        />
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: 'var(--badge-error-text)',
            fontSize: '0.75rem',
            marginTop: '0.375rem',
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
