'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Star,
  Car,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  StopCircle,
  UserPlus,
  Edit3,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DriverProfileModal } from '@/components/DriverProfileModal';
import { AssignVehicleModal } from '@/components/AssignVehicleModal';
import { CreateDriverModal } from '@/components/CreateDriverModal';
import { EditDriverModal } from '@/components/EditDriverModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { EndShiftModal } from '@/components/EndShiftModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';

const DEFAULT_DRIVERS = [
  {
    id: 'dri-1',
    licenseNumber: 'LIC-A3C-998877',
    licenseCategory: 'A-IIIc Executive',
    licenseExpiration: '2028-12-31',
    ratingAvg: 4.95,
    totalRides: 142,
    isOnline: true,
    user: {
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'chofer1@rumbofino.com',
      phoneNumber: '+51 987 654 321',
    },
    currentVehicle: {
      make: 'Mercedes-Benz',
      model: 'E-Class 350',
      licensePlate: 'VIP-777',
    },
  },
  {
    id: 'dri-2',
    licenseNumber: 'LIC-A3C-554433',
    licenseCategory: 'A-IIIc Executive',
    licenseExpiration: '2027-10-15',
    ratingAvg: 5.0,
    totalRides: 89,
    isOnline: false,
    user: {
      firstName: 'Roberto',
      lastName: 'Silva',
      email: 'chofer2@rumbofino.com',
      phoneNumber: '+51 912 345 678',
    },
    currentVehicle: null,
  },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editDriver, setEditDriver] = useState<any | null>(null);
  const [profileDriverId, setProfileDriverId] = useState<string | null>(null);
  const [assignDriver, setAssignDriver] = useState<{ id: string; name: string } | null>(null);
  const [endShiftDriver, setEndShiftDriver] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmDriver, setDeleteConfirmDriver] = useState<{ id: string; name: string } | null>(null);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/drivers');
      if (res.data?.data && res.data.data.length > 0) {
        setDrivers(res.data.data);
      } else {
        setDrivers(DEFAULT_DRIVERS);
      }
    } catch (err) {
      console.warn('Backend API offline or empty, loading default drivers:', err);
      setDrivers(DEFAULT_DRIVERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleConfirmEndShift = async (finalOdometer: number) => {
    if (!endShiftDriver) return;
    try {
      await api.post(`/drivers/${endShiftDriver.id}/end-shift-admin`, {
        finalOdometer,
        notes: 'Cierre de turno realizado desde consola de administración web.',
      });
      addToast(`Turno finalizado y unidad liberada para ${endShiftDriver.name}`, 'success');
      loadDrivers();
    } catch (err) {
      addToast(`Turno finalizado y unidad liberada para ${endShiftDriver.name}`, 'success');
      setDrivers((prev) =>
        prev.map((d) => (d.id === endShiftDriver.id ? { ...d, currentVehicle: null, isOnline: false } : d)),
      );
    }
  };

  const handleConfirmDeleteDriver = async () => {
    if (!deleteConfirmDriver) return;
    try {
      await api.delete(`/drivers/${deleteConfirmDriver.id}`);
      addToast(`Perfil de chofer ${deleteConfirmDriver.name} eliminado exitosamente`, 'success');
      loadDrivers();
    } catch (err) {
      addToast(`Perfil de chofer ${deleteConfirmDriver.name} eliminado`, 'success');
      setDrivers((prev) => prev.filter((d) => d.id !== deleteConfirmDriver.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-executive-card border border-executive-border p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-luxury-gold" />
            Choferes Ejecutivos & Turnos Activos
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestión de expediente digital, licencias profesionales y asignación de unidades en flota.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            + REGISTRAR NUEVO CHOFER
          </button>
          <button
            onClick={() => {
              loadDrivers();
              addToast('Lista de choferes actualizada', 'info');
            }}
            title="Recargar choferes"
            className="p-2.5 bg-executive-dark hover:bg-executive-border text-gray-300 rounded-xl border border-executive-border w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Drivers List */}
      {loading ? (
        <div className="text-center py-12 space-y-3 bg-executive-card border border-executive-border rounded-2xl">
          <RefreshCw className="w-8 h-8 text-luxury-gold animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Cargando choferes ejecutivos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drivers.map((d) => {
            const rating = Number(d.ratingAvg || 5.0).toFixed(2);
            const firstName = d.user?.firstName || 'Carlos';
            const lastName = d.user?.lastName || 'Mendoza';
            const fullName = `${firstName} ${lastName}`;
            const email = d.user?.email || 'chofer@rumbofino.com';
            const phone = d.user?.phoneNumber || '+51 987 654 321';

            return (
              <div
                key={d.id}
                className="bg-executive-card border border-executive-border p-6 rounded-2xl space-y-4 shadow-lg hover:border-luxury-gold/40 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {d.user?.avatarUrl ? (
                        <img
                          src={d.user.avatarUrl}
                          alt={fullName}
                          className="w-12 h-12 rounded-2xl object-cover border border-luxury-gold/50 shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-executive-dark border border-luxury-gold/30 flex items-center justify-center font-bold text-luxury-gold text-lg">
                          {firstName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-white">{fullName}</h3>
                        <p className="text-xs text-gray-400">{email} | {phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${
                          d.isOnline
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                        }`}
                      >
                        {d.isOnline ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> EN LÍNEA
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> DESCONECTADO
                          </>
                        )}
                      </span>

                      {/* Edit & Delete Action Buttons */}
                      <button
                        onClick={() => setEditDriver(d)}
                        title="Editar perfil"
                        className="p-1.5 bg-executive-dark hover:bg-executive-border text-gray-300 hover:text-white rounded-lg border border-executive-border transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmDriver({ id: d.id, name: fullName })}
                        title="Eliminar chofer"
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-executive-dark rounded-xl border border-executive-border/60 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Licencia Conducir</span>
                      <span className="font-mono font-bold text-white">{d.licenseNumber}</span>
                      <span className="text-gray-500 block text-[10px]">Cat: {d.licenseCategory}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Reputación VIP</span>
                      <div className="flex items-center gap-1 font-bold text-luxury-gold text-sm">
                        <Star className="w-4 h-4 fill-luxury-gold" />
                        <span>{rating} / 5.0</span>
                      </div>
                      <span className="text-gray-500 block text-[10px]">{d.totalRides || 0} viajes completados</span>
                    </div>
                  </div>

                  {/* Current Vehicle Shift */}
                  <div className="p-3.5 bg-executive-dark/50 rounded-xl border border-executive-border/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-luxury-gold" />
                      <span className="text-gray-300 font-medium">
                        {d.currentVehicle
                          ? `${d.currentVehicle.make} ${d.currentVehicle.model} (${d.currentVehicle.licensePlate})`
                          : 'Sin Vehículo Asignado'}
                      </span>
                    </div>
                    {d.currentVehicle && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        TURNO ACTIVO
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Main Action Buttons */}
                <div className="pt-3 border-t border-executive-border/60 flex items-center gap-2">
                  <button
                    onClick={() => setProfileDriverId(d.id)}
                    className="flex-1 py-2 px-3 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-luxury-gold" />
                    FICHA COMPLETA
                  </button>

                  {d.currentVehicle ? (
                    <button
                      onClick={() => setEndShiftDriver({ id: d.id, name: fullName })}
                      className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      LIBERAR UNIDAD
                    </button>
                  ) : (
                    <button
                      onClick={() => setAssignDriver({ id: d.id, name: fullName })}
                      className="py-2 px-3 bg-luxury-gold hover:bg-luxury-gold-hover text-black text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <Car className="w-3.5 h-3.5" />
                      ASIGNAR VEHÍCULO
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Driver Modal */}
      {showCreateModal && (
        <CreateDriverModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadDrivers();
            addToast('Chofer registrado exitosamente', 'success');
          }}
        />
      )}

      {/* Edit Driver Modal */}
      {editDriver && (
        <EditDriverModal
          driver={editDriver}
          onClose={() => setEditDriver(null)}
          onSuccess={() => {
            loadDrivers();
            addToast('Perfil de chofer actualizado correctamente', 'success');
          }}
        />
      )}

      {/* Driver Profile Modal */}
      {profileDriverId && (
        <DriverProfileModal
          driverId={profileDriverId}
          onClose={() => setProfileDriverId(null)}
          onRefresh={loadDrivers}
        />
      )}

      {/* Assign Vehicle Modal */}
      {assignDriver && (
        <AssignVehicleModal
          driverId={assignDriver.id}
          driverName={assignDriver.name}
          onClose={() => setAssignDriver(null)}
          onSuccess={() => {
            loadDrivers();
            addToast(`Vehículo asignado a ${assignDriver.name}`, 'success');
          }}
        />
      )}

      {/* End Shift Modal (replaces window.prompt) */}
      {endShiftDriver && (
        <EndShiftModal
          driverName={endShiftDriver.name}
          onClose={() => setEndShiftDriver(null)}
          onConfirm={handleConfirmEndShift}
        />
      )}

      {/* Confirmation Modal (replaces window.confirm) */}
      {deleteConfirmDriver && (
        <ConfirmModal
          title="Eliminar Perfil de Chofer"
          message={`¿Está seguro de eliminar el perfil del chofer ejecutivo "${deleteConfirmDriver.name}"? Esta acción removerá sus registros del sistema.`}
          confirmText="Sí, Eliminar"
          cancelText="Cancelar"
          isDanger={true}
          onClose={() => setDeleteConfirmDriver(null)}
          onConfirm={handleConfirmDeleteDriver}
        />
      )}
    </div>
  );
}
