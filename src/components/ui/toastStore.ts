import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warn' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, type?: ToastType, duration?: number) => number;
  dismiss: (id: number) => void;
}

const TOAST_MAX = 3;
const DEFAULT_DURATION = 2600;
let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, type = 'info', duration = DEFAULT_DURATION) => {
    const id = nextId++;
    set((s) => {
      const trimmed =
        s.toasts.length >= TOAST_MAX ? s.toasts.slice(1) : s.toasts;
      return { toasts: [...trimmed, { id, message, type, duration }] };
    });
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(
  message: string,
  type: ToastType = 'info',
  duration: number = DEFAULT_DURATION,
): number {
  return useToastStore.getState().push(message, type, duration);
}

export function useToast() {
  return useToastStore((s) => s.push);
}
