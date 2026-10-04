'use client';

import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = true,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
        <div className="bg-executive-card border border-executive-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-executive-border bg-executive-dark/60">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isDanger
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-luxury-gold/10 border-luxury-gold/30 text-luxury-gold'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="p-6 text-xs text-gray-300 leading-relaxed space-y-4">
          <p>{message}</p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-executive-dark/50 border-t border-executive-border flex justify-end gap-3 text-xs font-bold">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg transition-all ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                : 'bg-luxury-gold hover:bg-luxury-gold-hover text-black shadow-luxury-gold/20'
            }`}
          >
            <Check className="w-4 h-4" />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
);
}
