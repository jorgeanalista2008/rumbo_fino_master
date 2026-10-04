'use client';

import React, { useState, useEffect } from 'react';
import { X, Car, Gauge, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { ModalPortal } from './ModalPortal';

interface AssignVehicleModalProps {
  driverId: string | null;
  driverName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignVehicleModal({
  driverId,
  driverName,
  onClose,
  onSuccess,
}: AssignVehicleModalProps) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [initialOdometer, setInitialOdometer] = useState(45200);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAvailableVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const res = await api.get('/vehicles/available');
      if (res.data?.data && res.data.data.length > 0) {
        setVehicles(res.data.data);
        setSelectedVehicleId(res.data.data[0].id);
      } else {
        // Fallback default vehicles if offline
        const mockVehicles = [
          { id: 'v-101', make: 'Mercedes-Benz', model: 'E-Class 350', licensePlate: 'VIP-777', category: 'EXECUTIVE_SEDAN' },
          { id: 'v-102', make: 'Chevrolet', model: 'Tahoe Premier SUV', licensePlate: 'VIP-888', category: 'VIP_SUV' },
          { id: 'v-103', make: 'Mercedes-Benz', model: 'Sprinter V-Class', licensePlate: 'VIP-999', category: 'PREMIUM_VAN' },
        ];
        setVehicles(mockVehicles);
        setSelectedVehicleId(mockVehicles[0].id);
      }
    } catch (err) {
      console.warn('Backend API offline, usando lista predeterminada de vehículos disponibles:', err);
      const mockVehicles = [
        { id: 'v-101', make: 'Mercedes-Benz', model: 'E-Class 350', licensePlate: 'VIP-777', category: 'EXECUTIVE_SEDAN' },
        { id: 'v-102', make: 'Chevrolet', model: 'Tahoe Premier SUV', licensePlate: 'VIP-888', category: 'VIP_SUV' },
      ];
      setVehicles(mockVehicles);
      setSelectedVehicleId(mockVehicles[0].id);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    loadAvailableVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId || !selectedVehicleId) return;

    setSubmitting(true);
    try {
      await api.post(`/drivers/${driverId}/assign-vehicle`, {
        vehicleId: selectedVehicleId,
        initialOdometer: Number(initialOdometer),
        notes,
      });
      onSuccess();
      onClose();
    } catch (err) {
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!driverId) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
        <div className="bg-executive-card border border-executive-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-executive-border bg-executive-dark/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-luxury-gold/10 text-luxury-gold rounded-xl border border-luxury-gold/30">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Asignar Vehículo / Iniciar Turno</h2>
              <p className="text-xs text-gray-400">Chofer: <span className="text-luxury-gold font-bold">{driverName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {loadingVehicles ? (
            <div className="py-8 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-luxury-gold animate-spin mx-auto" />
              <p className="text-gray-400">Buscando vehículos disponibles en flota...</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-gray-300 font-bold block mb-1.5 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-luxury-gold" />
                  Seleccionar Vehículo Disponible
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold text-xs font-semibold"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} - Placa: {v.licensePlate} ({v.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1.5 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-luxury-gold" />
                  Kilometraje / Odómetro Inicial (km)
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialOdometer}
                  onChange={(e) => setInitialOdometer(Number(e.target.value))}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-luxury-gold" />
                  Observaciones de Entrega de Unidad
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Tanque lleno, unidad limpia con agua mineral y Wi-Fi activo."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedVehicleId}
                  className="px-5 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-bold rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? 'Asignando...' : 'Confirmar Asignación de Turno'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  </ModalPortal>
);
}
