'use client';

import React, { useState } from 'react';
import { X, Gauge, StopCircle, CheckCircle2 } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface EndShiftModalProps {
  driverName: string;
  onConfirm: (finalOdometer: number) => void;
  onClose: () => void;
}

export function EndShiftModal({ driverName, onConfirm, onClose }: EndShiftModalProps) {
  const [odometer, setOdometer] = useState(45350);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(Number(odometer));
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
        <div className="bg-executive-card border border-executive-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-executive-border bg-executive-dark/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
              <StopCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Liberar Unidad / Cierre de Turno</h3>
              <p className="text-xs text-gray-400">Chofer: <span className="text-luxury-gold font-bold">{driverName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-gray-300 font-bold block mb-1.5 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-luxury-gold" />
              Ingrese Kilometraje / Odómetro Final (km)
            </label>
            <input
              type="number"
              required
              min="0"
              value={odometer}
              onChange={(e) => setOdometer(Number(e.target.value))}
              className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold font-mono text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Al confirmar, el estado del vehículo cambiará a disponible y el turno quedará cerrado.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3 font-bold">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Cerrar Turno y Liberar
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}
