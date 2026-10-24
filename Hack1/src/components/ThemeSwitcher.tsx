'use client';

import React, { useEffect, useState } from 'react';
import { ThemeName } from '@/types';
import { store } from '@/lib/store';
import { toast } from '@/lib/toast';
import { Sun, Moon, Waves, Sunset, Trees } from 'lucide-react';

interface ThemeOption {
  id: ThemeName;
  label: string;
  icon: React.ReactNode;
}

const THEMES: ThemeOption[] = [
  { id: 'light', label: 'Light', icon: <Sun size={16} /> },
  { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
  { id: 'ocean', label: 'Ocean', icon: <Waves size={16} /> },
  { id: 'sunset', label: 'Sunset', icon: <Sunset size={16} /> },
  { id: 'forest', label: 'Forest', icon: <Trees size={16} /> },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('light');

  useEffect(() => {
    const user = store.getCurrentUser();
    const saved = (user?.themePreference as ThemeName) || 'light';
    setCurrentTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    const user = store.getCurrentUser();
    if (user) {
      store.updateUserTheme(user.id, theme);
    }
    const themeObj = THEMES.find((t) => t.id === theme);
    toast.info(`Theme set to ${themeObj?.label || theme}`, 'Theme Updated', 2000);
  };

  return (
    <div
      role="group"
      aria-label="Interface theme selector"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem',
        borderRadius: '0.5rem',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-color)',
        gap: '0.25rem',
      }}
    >
      {THEMES.map((t) => {
        const isActive = currentTheme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => handleThemeChange(t.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.625rem',
              minHeight: '36px',
              minWidth: '36px',
              fontSize: '0.8125rem',
              fontWeight: isActive ? 600 : 500,
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
              color: isActive ? 'var(--brand-primary-text)' : 'var(--text-secondary)',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={`Switch to ${t.label} theme`}
            aria-pressed={isActive}
          >
            {t.icon}
            <span style={{ display: 'none', minWidth: '0' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
