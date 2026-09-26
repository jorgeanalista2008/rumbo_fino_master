'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className={`pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md transition-all animate-in slide-in-from-right duration-300 ${
        isSuccess
          ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          : isError
          ? 'bg-red-950/90 border-red-500/40 text-red-200'
          : 'bg-executive-card/95 border-luxury-gold/40 text-luxury-gold'
      }`}
    >
      <div className="flex items-center gap-3">
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {isError && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-luxury-gold shrink-0" />}
        <span>{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
