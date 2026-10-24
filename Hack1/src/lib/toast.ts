// src/lib/toast.ts
// Lightweight event-driven toast notification manager for ClubOps
// Designed with UI/UX Pro Max principles: auto-dismiss 3-4s, accessible status, zero em dashes.

import { sanitizeText } from './sanitizer';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  createdAt: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public show(message: string, type: ToastType = 'info', title?: string, duration: number = 3800): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedMsg = sanitizeText(message);
    const sanitizedTitle = title ? sanitizeText(title) : undefined;

    const item: ToastItem = {
      id,
      type,
      title: sanitizedTitle,
      message: sanitizedMsg,
      duration,
      createdAt: Date.now(),
    };

    // Max 4 toasts visible at once to avoid screen crowding
    if (this.toasts.length >= 4) {
      const oldest = this.toasts[0];
      this.dismiss(oldest.id);
    }

    this.toasts.push(item);
    this.notify();

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  public dismiss(id: string) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    const index = this.toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.toasts.splice(index, 1);
      this.notify();
    }
  }

  public success(message: string, title?: string, duration?: number) {
    return this.show(message, 'success', title || 'Success', duration);
  }

  public error(message: string, title?: string, duration?: number) {
    return this.show(message, 'error', title || 'Attention Needed', duration || 5000);
  }

  public info(message: string, title?: string, duration?: number) {
    return this.show(message, 'info', title || 'Notice', duration);
  }

  public warning(message: string, title?: string, duration?: number) {
    return this.show(message, 'warning', title || 'Warning', duration);
  }

  public clearAll() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.toasts = [];
    this.notify();
  }
}

export const toast = new ToastManager();
