import { create } from 'zustand';

export type ToastType =
  | 'log'
  | 'info'
  | 'success'
  | 'warn'
  | 'error'
  | 'achievement';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  body?: string;
  meta?: string;
  duration: number;
  createdAt: number;
  action?: ToastAction;
}

export interface ToastInput {
  type?: ToastType;
  title: string;
  body?: string;
  meta?: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastState {
  toasts: ToastItem[];
  push: (
    messageOrInput: string | ToastInput,
    type?: ToastType,
    duration?: number,
  ) => number;
  pushToast: (input: ToastInput) => number;
  dismiss: (id: number) => void;
}

const TOAST_MAX = 3;
const DEFAULT_DURATION = 3200;
let nextId = 1;

function toItem(input: ToastInput): ToastItem {
  return {
    id: nextId++,
    type: input.type ?? 'log',
    title: input.title,
    body: input.body,
    meta: input.meta,
    duration: input.duration ?? DEFAULT_DURATION,
    createdAt: Date.now(),
    action: input.action,
  };
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (messageOrInput, type, duration) => {
    const input: ToastInput =
      typeof messageOrInput === 'string'
        ? { title: messageOrInput, type, duration }
        : messageOrInput;
    const item = toItem(input);
    set((s) => {
      const trimmed =
        s.toasts.length >= TOAST_MAX ? s.toasts.slice(1) : s.toasts;
      return { toasts: [...trimmed, item] };
    });
    return item.id;
  },
  pushToast: (input) => {
    const item = toItem(input);
    set((s) => {
      const trimmed =
        s.toasts.length >= TOAST_MAX ? s.toasts.slice(1) : s.toasts;
      return { toasts: [...trimmed, item] };
    });
    return item.id;
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

export function pushToast(input: ToastInput): number {
  return useToastStore.getState().pushToast(input);
}

export function useToast() {
  return useToastStore((s) => s.push);
}
