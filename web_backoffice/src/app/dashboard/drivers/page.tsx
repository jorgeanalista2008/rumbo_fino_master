'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Search,
  Filter,
  LayoutGrid,
  List,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  Phone,
  Mail,
  Award,
  Clock,
  ChevronRight,
  Upload,
  CreditCard,
  UserCheck,
  Eye,
  Radio,
  Navigation,
  MapPin,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DriverProfileModal } from '@/components/DriverProfileModal';
import { AssignVehicleModal } from '@/components/AssignVehicleModal';
import { CreateDriverModal } from '@/components/CreateDriverModal';
import { EditDriverModal } from '@/components/EditDriverModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { EndShiftModal } from '@/components/EndShiftModal';
import { DriverGpsModal } from '@/components/DriverGpsModal';

interface DriverItem {
  id: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiration: string;
  ratingAvg: number;
  totalRides: number;
  isOnline: boolean;
  user?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string;
    status?: string;
  };
  currentVehicle?: {
    id?: string;
    make: string;
    model: string;
    licensePlate: string;
    status?: string;
  } | null;
  documents?: any[];
  documentStats?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  balance?: {
    currentBalance: number;
    pendingPayout: number;
    totalEarned: number;
    totalCommissionPaid: number;
  };
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineFilter, setOnlineFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [docFilter, setDocFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editDriver, setEditDriver] = useState<any | null>(null);
  const [profileDriverId, setProfileDriverId] = useState<string | null>(null);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'docs' | 'upload_doc' | 'balance' | 'history'>('profile');
  const [assignDriver, setAssignDriver] = useState<{ id: string; name: string } | null>(null);
  const [endShiftDriver, setEndShiftDriver] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmDriver, setDeleteConfirmDriver] = useState<{ id: string; name: string } | null>(null);
  const [gpsDriver, setGpsDriver] = useState<DriverItem | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/drivers');
      if (res.data?.data) {
        setDrivers(res.data.data);
      }
    } catch (err: any) {
      console.error('Error cargando lista de choferes:', err);
      showToast('No se pudo sincronizar la lista de choferes.', 'error');
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
        notes: 'Cierre de turno administrativo desde la consola web.',
      });
      showToast(`Turno finalizado y unidad liberada para ${endShiftDriver.name}`, 'success');
      loadDrivers();
    } catch (err: any) {
      console.error('Error cerrando turno:', err);
      const msg = err.response?.data?.message || 'Error al finalizar el turno del chofer.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    }
  };

  const handleConfirmDeleteDriver = async () => {
    if (!deleteConfirmDriver) return;
    try {
      await api.delete(`/drivers/${deleteConfirmDriver.id}`);
      showToast(`Perfil de chofer "${deleteConfirmDriver.name}" eliminado correctamente`, 'success');
      loadDrivers();
    } catch (err: any) {
      console.error('Error eliminando chofer:', err);
      const msg = err.response?.data?.message || 'Error al eliminar el chofer.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = drivers.length;
    const online = drivers.filter((d) => d.isOnline).length;
    const inShift = drivers.filter((d) => d.currentVehicle !== null && d.currentVehicle !== undefined).length;
    const available = total - inShift;

    let pendingDocsCount = 0;
    let driversWithPending = 0;
    drivers.forEach((d) => {
      const p = d.documentStats?.pending || 0;
      if (p > 0) {
        pendingDocsCount += p;
        driversWithPending++;
      }
    });

    return { total, online, inShift, available, pendingDocsCount, driversWithPending };
  }, [drivers]);

  // Filtering
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${d.user?.firstName || ''} ${d.user?.lastName || ''}`.toLowerCase();
      const email = (d.user?.email || '').toLowerCase();
      const phone = (d.user?.phoneNumber || '').toLowerCase();
      const license = (d.licenseNumber || '').toLowerCase();
      const vehicle = d.currentVehicle
        ? `${d.currentVehicle.make} ${d.currentVehicle.model} ${d.currentVehicle.licensePlate}`.toLowerCase()
        : '';

      const matchSearch =
        !q ||
        fullName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        license.includes(q) ||
        vehicle.includes(q);

      let matchOnline = true;
      if (onlineFilter === 'ONLINE') matchOnline = d.isOnline === true;
      if (onlineFilter === 'OFFLINE') matchOnline = d.isOnline === false;

      let matchShift = true;
      if (shiftFilter === 'IN_SHIFT') matchShift = Boolean(d.currentVehicle);
      if (shiftFilter === 'NO_SHIFT') matchShift = !d.currentVehicle;

      let matchDoc = true;
      if (docFilter === 'PENDING') {
        matchDoc = (d.documentStats?.pending || 0) > 0;
      } else if (docFilter === 'APPROVED') {
        matchDoc = (d.documentStats?.total || 0) > 0 && (d.documentStats?.pending || 0) === 0 && (d.documentStats?.rejected || 0) === 0;
      } else if (docFilter === 'REJECTED') {
        matchDoc = (d.documentStats?.rejected || 0) > 0;
      }

      return matchSearch && matchOnline && matchShift && matchDoc;
    });
  }, [drivers, searchQuery, onlineFilter, shiftFilter, docFilter]);

  const openFullProfile = (driverId: string, tab: 'profile' | 'docs' | 'upload_doc' | 'balance' | 'history' = 'profile') => {
    setProfileDriverId(driverId);
    setProfileInitialTab(tab);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 font-bold text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500 text-black border-emerald-400'
              : toastMessage.type === 'error'
              ? 'bg-red-500 text-white border-red-400'
              : 'bg-luxury-gold text-black border-luxury-gold/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <ShieldCheck className="w-5 h-5 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <RefreshCw className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-executive-card border border-executive-border p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <Users className="w-64 h-64 text-luxury-gold" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                Gestión de Choferes Ejecutivos & Turnos
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Expedientes digitales, licencias profesionales, auditoría de documentos y asignación de unidades en flota.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={loadDrivers}
            title="Recargar choferes"
            className="p-3 bg-executive-dark hover:bg-executive-border text-gray-300 rounded-xl border border-executive-border transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-luxury-gold' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-xl shadow-lg shadow-luxury-gold/20 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> REGISTRAR NUEVO CHOFER
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-executive-card border border-executive-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Choferes Totales</span>
            <Users className="w-4 h-4 text-luxury-gold" />
          </div>
          <p className="text-2xl font-black text-white">{kpis.total}</p>
          <p className="text-[10px] text-gray-500">Conductores registrados</p>
        </div>

        <div className="bg-executive-card border border-emerald-500/20 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span>En Línea (GPS)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{kpis.online}</p>
          <p className="text-[10px] text-gray-500">Conectados en tiempo real</p>
        </div>

        <div className="bg-executive-card border border-luxury-gold/20 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-luxury-gold text-xs">
            <span>En Turno Activo</span>
            <Car className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-luxury-gold">{kpis.inShift}</p>
          <p className="text-[10px] text-gray-500">Con vehículo asignado</p>
        </div>

        <div className="bg-executive-card border border-blue-500/20 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-blue-400 text-xs">
            <span>Disponibles / Libres</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-blue-400">{kpis.available}</p>
          <p className="text-[10px] text-gray-500">Listos para asignar turno</p>
        </div>

        <div
          onClick={() => setDocFilter(docFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`bg-executive-card rounded-2xl p-4 space-y-1 cursor-pointer transition-all border ${
            kpis.pendingDocsCount > 0
              ? 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10'
              : 'border-executive-border'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span className="font-bold">Docs por Aprobar</span>
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-400">{kpis.pendingDocsCount}</p>
            <span className="text-[10px] text-gray-400">({kpis.driversWithPending} choferes)</span>
          </div>
          <p className="text-[10px] text-amber-400/80 font-medium">Click para filtrar pendientes</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-executive-card border border-executive-border rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono, licencia o placa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-executive-dark border border-executive-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-luxury-gold/50 transition-colors"
            />
          </div>

          {/* Filters and View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Online Filter */}
            <select
              value={onlineFilter}
              onChange={(e) => setOnlineFilter(e.target.value)}
              className="bg-executive-dark border border-executive-border text-gray-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-luxury-gold/50"
            >
              <option value="ALL">Conexión: Todos</option>
              <option value="ONLINE">🟢 En Línea</option>
              <option value="OFFLINE">⚪ Desconectado</option>
            </select>

            {/* Shift Filter */}
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="bg-executive-dark border border-executive-border text-gray-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-luxury-gold/50"
            >
              <option value="ALL">Turno: Todos</option>
              <option value="IN_SHIFT">🚗 Con Vehículo Asignado</option>
              <option value="NO_SHIFT">🚶 Libre (Sin Turno)</option>
            </select>

            {/* Document Filter */}
            <select
              value={docFilter}
              onChange={(e) => setDocFilter(e.target.value)}
              className="bg-executive-dark border border-executive-border text-gray-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-luxury-gold/50 font-medium"
            >
              <option value="ALL">Auditoría: Todos</option>
              <option value="PENDING">⏳ Con Docs Pendientes</option>
              <option value="APPROVED">✅ 100% Homologados</option>
              <option value="REJECTED">❌ Con Rechazos</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-executive-dark border border-executive-border rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-luxury-gold text-black' : 'text-gray-400 hover:text-white'
                }`}
                title="Vista Cuadrícula VIP"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-luxury-gold text-black' : 'text-gray-400 hover:text-white'
                }`}
                title="Vista Tabla Detallada"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Drivers Display */}
      {loading ? (
        <div className="bg-executive-card border border-executive-border rounded-2xl p-16 text-center space-y-3">
          <RefreshCw className="w-10 h-10 text-luxury-gold animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-300">Sincronizando choferes y expedientes...</p>
          <p className="text-xs text-gray-500">Consultando licencias y auditoría de documentos</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="bg-executive-card border border-executive-border rounded-2xl p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-executive-dark border border-executive-border flex items-center justify-center mx-auto text-gray-500">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No se encontraron choferes</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            No hay conductores que coincidan con los filtros aplicados.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setOnlineFilter('ALL');
              setShiftFilter('ALL');
              setDocFilter('ALL');
            }}
            className="px-4 py-2 bg-executive-dark hover:bg-executive-border text-luxury-gold text-xs font-bold rounded-xl border border-luxury-gold/30 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restablecer Filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrivers.map((d) => {
            const firstName = d.user?.firstName || 'Chofer';
            const lastName = d.user?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const rating = Number(d.ratingAvg || 5.0).toFixed(2);
            const pendingDocs = d.documentStats?.pending || 0;
            const approvedDocs = d.documentStats?.approved || 0;
            const totalDocs = d.documentStats?.total || 0;

            return (
              <div
                key={d.id}
                className="bg-executive-card border border-executive-border hover:border-luxury-gold/40 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Driver Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {d.user?.avatarUrl ? (
                        <img
                          src={d.user.avatarUrl}
                          alt={fullName}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-luxury-gold/50 shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold font-black text-lg flex items-center justify-center shadow-md">
                          {firstName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-black text-white">{fullName}</h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-luxury-gold" /> {d.user?.email || 'chofer@rumbofino.com'}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-luxury-gold" /> {d.user?.phoneNumber || 'Sin teléfono'}
                        </p>
                      </div>
                    </div>

                    {/* Online Badge with GPS quick click */}
                    {d.isOnline ? (
                      <button
                        onClick={() => setGpsDriver(d)}
                        className="px-2.5 py-1 text-[10px] font-black rounded-full border shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
                        title="Click para ver ubicación GPS en tiempo real"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>🟢 EN LÍNEA</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full border shrink-0 bg-gray-500/10 text-gray-400 border-gray-500/30">
                        ⚪ OFFLINE
                      </span>
                    )}
                  </div>

                  {/* Specs & Rating Bar */}
                  <div className="grid grid-cols-2 gap-2 bg-executive-dark/70 p-3 rounded-xl border border-executive-border/60 text-[11px]">
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase">Licencia Conducir</span>
                      <span className="font-mono font-bold text-luxury-gold">{d.licenseNumber}</span>
                      <span className="text-gray-400 block text-[9px]">Cat: {d.licenseCategory}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase">Reputación VIP</span>
                      <div className="flex items-center gap-1 font-bold text-luxury-gold text-xs">
                        <Star className="w-3.5 h-3.5 fill-luxury-gold" />
                        <span>{rating} / 5.0</span>
                      </div>
                      <span className="text-gray-400 block text-[9px]">{d.totalRides || 0} viajes completados</span>
                    </div>
                  </div>

                  {/* Vehicle Shift Box */}
                  <div className="p-3 bg-executive-dark/40 border border-executive-border/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-executive-dark border border-executive-border text-luxury-gold">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block">Vehículo en Turno</span>
                        <span className="text-xs font-bold text-white">
                          {d.currentVehicle
                            ? `${d.currentVehicle.make} ${d.currentVehicle.model}`
                            : 'Sin vehículo asignado'}
                        </span>
                      </div>
                    </div>
                    {d.currentVehicle ? (
                      <span className="px-2 py-0.5 bg-executive-dark border border-luxury-gold/40 text-luxury-gold font-mono font-bold text-[10px] rounded-lg">
                        {d.currentVehicle.licensePlate}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic">Libre</span>
                    )}
                  </div>

                  {/* Document Audit Indicator */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-400 text-[11px] flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-luxury-gold" /> Expediente Chofer:
                    </span>
                    {pendingDocs > 0 ? (
                      <button
                        onClick={() => openFullProfile(d.id, 'docs')}
                        className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[11px] font-bold rounded-lg flex items-center gap-1 animate-pulse"
                      >
                        <AlertTriangle className="w-3 h-3" /> {pendingDocs} Doc{pendingDocs > 1 ? 's' : ''} Pendiente{pendingDocs > 1 ? 's' : ''}
                      </button>
                    ) : totalDocs > 0 ? (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {approvedDocs}/{totalDocs} Homologado
                      </span>
                    ) : (
                      <button
                        onClick={() => openFullProfile(d.id, 'upload_doc')}
                        className="text-luxury-gold hover:underline text-[11px] font-bold flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Subir Documentos
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-executive-border space-y-2">
                  {/* Realtime GPS Tracker Button if Driver is Online */}
                  {d.isOnline && (
                    <button
                      onClick={() => setGpsDriver(d)}
                      className="w-full py-2.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group hover:border-emerald-400"
                    >
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse group-hover:scale-110 transition-transform" />
                      <span>📍 Ver Ubicación en Tiempo Real</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openFullProfile(d.id, 'profile')}
                      className="flex-1 py-2.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold text-xs font-bold rounded-xl border border-luxury-gold/30 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-4 h-4" /> Ficha Completa
                    </button>

                    {d.currentVehicle ? (
                      <button
                        onClick={() => setEndShiftDriver({ id: d.id, name: fullName })}
                        className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors"
                        title="Liberar vehículo y cerrar turno"
                      >
                        <StopCircle className="w-4 h-4" /> Liberar
                      </button>
                    ) : (
                      <button
                        onClick={() => setAssignDriver({ id: d.id, name: fullName })}
                        className="py-2.5 px-3 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-md transition-all"
                        title="Asignar vehículo a este chofer"
                      >
                        <Car className="w-4 h-4" /> Asignar
                      </button>
                    )}

                    <button
                      onClick={() => setEditDriver(d)}
                      title="Editar chofer"
                      className="p-2.5 bg-executive-dark hover:bg-executive-border text-gray-300 hover:text-white rounded-xl border border-executive-border transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmDriver({ id: d.id, name: fullName })}
                      title="Eliminar chofer"
                      className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-executive-card border border-executive-border rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-executive-dark text-xs uppercase text-gray-400 border-b border-executive-border">
                <tr>
                  <th className="px-5 py-4">Chofer Ejecutivo</th>
                  <th className="px-5 py-4">Licencia</th>
                  <th className="px-5 py-4">Reputación</th>
                  <th className="px-5 py-4">Vehículo en Turno</th>
                  <th className="px-5 py-4">Conexión</th>
                  <th className="px-5 py-4">Expediente Digital</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-executive-border/60">
                {filteredDrivers.map((d) => {
                  const firstName = d.user?.firstName || 'Chofer';
                  const lastName = d.user?.lastName || '';
                  const fullName = `${firstName} ${lastName}`.trim();
                  const rating = Number(d.ratingAvg || 5.0).toFixed(2);
                  const pendingDocs = d.documentStats?.pending || 0;
                  const approvedDocs = d.documentStats?.approved || 0;
                  const totalDocs = d.documentStats?.total || 0;

                  return (
                    <tr key={d.id} className="hover:bg-executive-dark/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold font-black text-sm flex items-center justify-center">
                            {firstName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{fullName}</div>
                            <div className="text-[11px] text-gray-400">{d.user?.email || 'N/A'} • {d.user?.phoneNumber || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-luxury-gold text-xs block">{d.licenseNumber}</span>
                        <span className="text-[10px] text-gray-400">Cat: {d.licenseCategory}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 font-bold text-luxury-gold text-xs">
                          <Star className="w-3.5 h-3.5 fill-luxury-gold" />
                          <span>{rating}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">{d.totalRides || 0} viajes</span>
                      </td>
                      <td className="px-5 py-4">
                        {d.currentVehicle ? (
                          <div>
                            <div className="font-bold text-white text-xs">
                              {d.currentVehicle.make} {d.currentVehicle.model}
                            </div>
                            <span className="px-2 py-0.5 bg-executive-dark border border-luxury-gold/40 text-luxury-gold font-mono font-bold text-[10px] rounded-md inline-block mt-0.5">
                              {d.currentVehicle.licensePlate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {d.isOnline ? (
                          <button
                            onClick={() => setGpsDriver(d)}
                            className="px-2.5 py-1 text-[10px] font-black rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
                            title="Click para ver ubicación GPS en tiempo real"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>🟢 ONLINE</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full border bg-gray-500/10 text-gray-400 border-gray-500/30">
                            ⚪ OFFLINE
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {pendingDocs > 0 ? (
                          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3.5 h-3.5" /> {pendingDocs} Pendiente{pendingDocs > 1 ? 's' : ''}
                          </span>
                        ) : totalDocs > 0 ? (
                          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {approvedDocs}/{totalDocs} Homologado
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Sin documentos</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {d.isOnline && (
                            <button
                              onClick={() => setGpsDriver(d)}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition-colors"
                              title="Ver ubicación GPS en tiempo real"
                            >
                              <Radio className="w-3.5 h-3.5 animate-pulse" />
                            </button>
                          )}
                          <button
                            onClick={() => openFullProfile(d.id, 'profile')}
                            className="px-2.5 py-1.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold text-xs font-bold rounded-lg border border-luxury-gold/30 inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ficha
                          </button>
                          {d.currentVehicle ? (
                            <button
                              onClick={() => setEndShiftDriver({ id: d.id, name: fullName })}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30"
                              title="Liberar unidad"
                            >
                              <StopCircle className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setAssignDriver({ id: d.id, name: fullName })}
                              className="p-1.5 bg-luxury-gold text-black rounded-lg font-bold"
                              title="Asignar vehículo"
                            >
                              <Car className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditDriver(d)}
                            className="p-1.5 bg-executive-dark hover:bg-executive-border text-gray-300 rounded-lg border border-executive-border"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmDriver({ id: d.id, name: fullName })}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Driver Modal */}
      {showCreateModal && (
        <CreateDriverModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadDrivers();
            showToast('Chofer registrado exitosamente en el sistema', 'success');
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
            showToast('Perfil de chofer actualizado correctamente', 'success');
          }}
        />
      )}

      {/* Driver Profile Modal */}
      {profileDriverId && (
        <DriverProfileModal
          driverId={profileDriverId}
          initialTab={profileInitialTab}
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
            showToast(`Vehículo asignado exitosamente a ${assignDriver.name}`, 'success');
          }}
        />
      )}

      {/* End Shift Modal */}
      {endShiftDriver && (
        <EndShiftModal
          driverName={endShiftDriver.name}
          onClose={() => setEndShiftDriver(null)}
          onConfirm={handleConfirmEndShift}
        />
      )}

      {/* Delete Confirmation Modal */}
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

      {/* Realtime Driver GPS Modal */}
      {gpsDriver && (
        <DriverGpsModal
          driver={gpsDriver}
          onClose={() => setGpsDriver(null)}
        />
      )}
    </div>
  );
}
