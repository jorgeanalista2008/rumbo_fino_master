'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, Phone, ShieldAlert, MapPin, X, CheckCircle2 } from 'lucide-react';

interface SosAlertModalProps {
  alertData: {
    rideId: string;
    driverName: string;
    driverPhone: string;
    passengerName: string;
    passengerPhone: string;
    vehiclePlate: string;
    locationName: string;
    lat: number;
    lng: number;
    timestamp: string;
  };
  onClose: () => void;
  onLocateOnMap: (lat: number, lng: number) => void;
}

export function SosAlertModal({ alertData, onClose, onLocateOnMap }: SosAlertModalProps) {
  // Beep sound using native Web Audio API
  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800 Hz alarm
      oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('AudioContext no permitido antes de interacción del usuario');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-executive-card border-2 border-red-500 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(239,68,68,0.4)] overflow-hidden">
        {/* Urgent Header */}
        <div className="bg-red-600 p-5 flex items-center justify-between text-white animate-pulse">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-8 h-8 shrink-0 text-white" />
            <div>
              <h2 className="text-xl font-black tracking-wide">¡ALERTA SOS EN RUTA!</h2>
              <p className="text-xs font-semibold text-red-100">Señal de pánico activada en servicio activo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Details Card */}
          <div className="bg-executive-dark p-4 rounded-2xl border border-red-500/30 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-executive-border">
              <span className="text-gray-400 font-bold uppercase text-[10px]">ID de Viaje:</span>
              <span className="font-mono text-luxury-gold font-bold">{alertData.rideId.substring(0, 12)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Chofer en Ruta:</span>
                <span className="text-white font-bold">{alertData.driverName}</span>
                <a
                  href={`tel:${alertData.driverPhone}`}
                  className="text-emerald-400 font-semibold block text-[11px] mt-0.5 hover:underline"
                >
                  📞 {alertData.driverPhone}
                </a>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Pasajero VIP:</span>
                <span className="text-white font-bold">{alertData.passengerName}</span>
                <a
                  href={`tel:${alertData.passengerPhone}`}
                  className="text-emerald-400 font-semibold block text-[11px] mt-0.5 hover:underline"
                >
                  📞 {alertData.passengerPhone}
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-executive-border flex justify-between items-center">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Placa de Rodaje:</span>
                <span className="text-luxury-gold font-mono font-bold text-sm">{alertData.vehiclePlate}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Hora Reportada:</span>
                <span className="text-gray-200 font-mono text-[11px]">{alertData.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Location Box */}
          <div className="bg-executive-dark p-3.5 rounded-xl border border-executive-border flex items-start gap-2.5">
            <MapPin className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Última Ubicación GPS:</span>
              <span className="text-white font-medium">{alertData.locationName}</span>
              <span className="text-gray-400 block font-mono text-[10px] mt-0.5">
                ({alertData.lat.toFixed(5)}, {alertData.lng.toFixed(5)})
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                onLocateOnMap(alertData.lat, alertData.lng);
                onClose();
              }}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all text-xs"
            >
              <MapPin className="w-4 h-4" />
              Rastrear en el Mapa
            </button>

            <button
              onClick={onClose}
              className="px-5 py-3 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Atender & Silenciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
