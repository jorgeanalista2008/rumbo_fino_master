'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Plus,
  Navigation,
  MapPin,
  Car,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Clock,
  ShieldCheck,
  UserCheck,
  DollarSign,
  Wifi,
  Zap,
  FileSpreadsheet,
  AlertOctagon,
  Star,
  Award,
  Phone,
  Mail,
  UserPlus,
  CreditCard,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Sliders,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { OpenStreetMap, MarkerItem } from '@/components/OpenStreetMap';
import { CreateRideModal } from '@/components/CreateRideModal';
import { SosAlertModal } from '@/components/SosAlertModal';
import { FinishAndRateRideModal } from '@/components/FinishAndRateRideModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';

export default function DispatchPage() {
  const [rides, setRides] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [finishRateRide, setFinishRateRide] = useState<any | null>(null);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Inline Quick Driver Assignment
  const [assigningDriverId, setAssigningDriverId] = useState<string>('');
  const [assigningLoading, setAssigningLoading] = useState<boolean>(false);

  // Filter Tab
  const [statusTabFilter, setStatusTabFilter] = useState<string>('ALL');

  // Emergency SOS State
  const [sosAlert, setSosAlert] = useState<any | null>(null);

  // Rate & Unit Configuration Panel (Venezuela)
  const [ratePerUnit, setRatePerUnit] = useState<number>(1.8);
  const [unitType, setUnitType] = useState<'KM' | 'MILES'>('KM');
  const [baseFare, setBaseFare] = useState<number>(5.0);
  const [bcvRate, setBcvRate] = useState<number>(65.5);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);

  // WebSocket Live Telemetry State
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [liveDriverLocations, setLiveDriverLocations] = useState<Record<string, { lat: number; lng: number }>>({});

  // Interactive Map Selection States
  const [mapSelectionMode, setMapSelectionMode] = useState<'pickup' | 'destination' | 'none'>('none');
  const [customOrigin, setCustomOrigin] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [customDestination, setCustomDestination] = useState<{ lat: number; lng: number; name?: string } | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message: `${title}: ${message}` }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ridesRes, driversRes] = await Promise.all([
        api.get('/rides'),
        api.get('/drivers'),
      ]);

      if (driversRes.data?.data) {
        setDrivers(driversRes.data.data);
      }

      if (ridesRes.data?.data && ridesRes.data.data.length > 0) {
        const formatted = ridesRes.data.data.map((r: any) => ({
          ...r,
          originLat: Number(r.originLatitude || r.originLat || 10.4806),
          originLng: Number(r.originLongitude || r.originLng || -66.8622),
          destinationLat: Number(r.destinationLatitude || r.destinationLat || 10.6031),
          destinationLng: Number(r.destinationLongitude || r.destinationLng || -66.9906),
          totalFare: Number(r.totalFare || 50.0),
        }));
        setRides(formatted);
        setSelectedRide((curr: any) => {
          if (curr) {
            return formatted.find((item: any) => item.id === curr.id) || formatted[0];
          }
          return formatted[0];
        });
      }
    } catch (err) {
      console.warn('Error al cargar datos del centro de despacho:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Initialize WebSocket for real-time live telemetry
    const socket = getSocket();
    if (socket) {
      setIsWsConnected(socket.connected);

      socket.on('connect', () => setIsWsConnected(true));
      socket.on('disconnect', () => setIsWsConnected(false));

      socket.on('ride:global_status', (data: any) => {
        setRides((prev) =>
          prev.map((r) => (r.id === data.rideId ? { ...r, status: data.status } : r)),
        );
        setSelectedRide((curr: any) =>
          curr && curr.id === data.rideId ? { ...curr, status: data.status } : curr,
        );
        addToast('info', 'Actualización de Viaje', `Servicio ${data.rideId.substring(0, 8)} cambió a ${data.status}`);
      });

      socket.on('ride:created', (data: any) => {
        if (data.ride) {
          const newRide = {
            ...data.ride,
            originLat: Number(data.ride.originLatitude || data.ride.originLat || 10.4806),
            originLng: Number(data.ride.originLongitude || data.ride.originLng || -66.8622),
            destinationLat: Number(data.ride.destinationLatitude || data.ride.destinationLat || 10.6031),
            destinationLng: Number(data.ride.destinationLongitude || data.ride.destinationLng || -66.9906),
            totalFare: Number(data.ride.totalFare || 50.0),
          };
          setRides((prev) => [newRide, ...prev.filter((r) => r.id !== newRide.id)]);
          setSelectedRide(newRide);
          addToast('success', 'Nuevo Viaje Despachado', `Servicio registrado con éxito.`);
        }
      });

      socket.on('driver:global_location', (data: any) => {
        if (data.driverId && data.latitude && data.longitude) {
          setLiveDriverLocations((prev) => ({
            ...prev,
            [data.driverId]: { lat: data.latitude, lng: data.longitude },
          }));
        }
      });

      socket.on('ride:emergency_sos', (data: any) => {
        setSosAlert(data);
      });
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('ride:global_status');
        socket.off('ride:created');
        socket.off('driver:global_location');
        socket.off('ride:emergency_sos');
      }
    };
  }, []);

  // Quick Inline Driver Assignment Action
  const handleAssignDriverToRide = async (rideId: string, driverId: string) => {
    if (!driverId) return;
    setAssigningLoading(true);
    try {
      const res = await api.post(`/rides/${rideId}/assign-driver`, { driverId });
      const updated = res.data?.data;
      if (updated) {
        setRides((prev) => prev.map((r) => (r.id === rideId ? updated : r)));
        if (selectedRide?.id === rideId) {
          setSelectedRide(updated);
        }
      }
      addToast('success', 'Chofer Asignado', 'El chofer fue asignado y el viaje pasó a estado ASIGNADO.');
      loadAllData();
    } catch (err: any) {
      console.error('Error asignando chofer:', err);
      const msg = err.response?.data?.message || 'Error al asignar chofer.';
      addToast('error', 'Error de Asignación', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setAssigningLoading(false);
    }
  };

  const handleUpdateStatus = async (rideId: string, nextStatus: string) => {
    try {
      const res = await api.patch(`/rides/${rideId}/status`, { status: nextStatus });
      const updated = res.data?.data;
      addToast('success', 'Estado Actualizado', `El viaje ha avanzado a estado ${nextStatus}`);

      setRides((prev) =>
        prev.map((r) => (r.id === rideId ? { ...r, status: nextStatus, ...updated } : r)),
      );
      if (selectedRide && selectedRide.id === rideId) {
        setSelectedRide((prev: any) => ({ ...prev, status: nextStatus, ...updated }));
      }
      loadAllData();
    } catch (err: any) {
      console.warn('Error actualizando estado:', err);
      setRides((prev) =>
        prev.map((r) => (r.id === rideId ? { ...r, status: nextStatus } : r)),
      );
      if (selectedRide && selectedRide.id === rideId) {
        setSelectedRide((prev: any) => ({ ...prev, status: nextStatus }));
      }
    }
  };

  const handleLocationSelectFromMap = (lat: number, lng: number, mode: 'pickup' | 'destination', placeName?: string) => {
    const titleText = placeName || `Venezuela (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    if (mode === 'pickup') {
      setCustomOrigin({ lat, lng, name: titleText });
      addToast('info', 'Abordaje Fijado', `Origen: ${titleText}`);
    } else {
      setCustomDestination({ lat, lng, name: titleText });
      addToast('info', 'Destino Fijado', `Destino: ${titleText}`);
    }
    setMapSelectionMode('none');
  };

  const handleSimulateSos = () => {
    const targetRide = selectedRide || rides[0];
    setSosAlert({
      rideId: targetRide?.id || 'ride-vip-sos-911',
      driverName: targetRide?.driver?.user
        ? `${targetRide.driver.user.firstName} ${targetRide.driver.user.lastName}`
        : 'Carlos Mendoza',
      driverPhone: targetRide?.driver?.user?.phoneNumber || '+58 412 987 654',
      passengerName: targetRide?.passenger
        ? `${targetRide.passenger.firstName} ${targetRide.passenger.lastName}`
        : 'Dr. Alejandro Rossi',
      passengerPhone: '+58 414 111 2233',
      vehiclePlate: targetRide?.vehicle?.licensePlate || 'VIP-777',
      locationName: targetRide?.originAddress || 'Autopista Francisco Fajardo, Caracas',
      lat: targetRide?.originLat || 10.485,
      lng: targetRide?.originLng || -66.865,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const exportRidesToCSV = () => {
    const headers = 'ID Viaje,Pasajero,Origen,Destino,Categoría,Tarifa USD,Tarifa Bs BCV,Estado\n';
    const rows = rides.map(r =>
      `"${r.id}","${r.passenger?.firstName || 'VIP'} ${r.passenger?.lastName || ''}","${r.originAddress}","${r.destinationAddress}","${r.categoryRequested}",${r.totalFare},${(r.totalFare * bcvRate).toFixed(2)},"${r.status}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RumboFino_Despacho_Venezuela_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPIs
  const kpis = useMemo(() => {
    const active = rides.filter((r) => ['ASIGNADO', 'EN_CAMINO', 'ABORDAJE', 'EN_CURSO'].includes(r.status)).length;
    const requested = rides.filter((r) => r.status === 'SOLICITADO').length;
    const completed = rides.filter((r) => r.status === 'FINALIZADO').length;
    const onlineDrivers = drivers.filter((d) => d.isOnline || d.currentVehicleId).length;
    return { active, requested, completed, onlineDrivers };
  }, [rides, drivers]);

  // Filtered Rides
  const filteredRides = useMemo(() => {
    if (statusTabFilter === 'ACTIVE') {
      return rides.filter((r) => ['ASIGNADO', 'EN_CAMINO', 'ABORDAJE', 'EN_CURSO'].includes(r.status));
    }
    if (statusTabFilter === 'REQUESTED') {
      return rides.filter((r) => r.status === 'SOLICITADO');
    }
    if (statusTabFilter === 'COMPLETED') {
      return rides.filter((r) => r.status === 'FINALIZADO');
    }
    return rides;
  }, [rides, statusTabFilter]);

  // Map Markers
  const mapMarkers = useMemo(() => {
    return rides.flatMap((r) => {
      const liveLoc = r.driver?.id ? liveDriverLocations[r.driver.id] : null;
      const vehicleLat = liveLoc?.lat || (r.originLat || 10.4806) + 0.003;
      const vehicleLng = liveLoc?.lng || (r.originLng || -66.8622) + 0.003;

      const items: MarkerItem[] = [
        {
          id: `pickup-${r.id}`,
          lat: r.originLat || 10.4806,
          lng: r.originLng || -66.8622,
          title: r.originAddress || 'Origen Viaje',
          subtitle: `Pasajero: ${r.passenger?.firstName || 'VIP'} (${r.status})`,
          type: 'pickup' as const,
          status: r.status,
        },
        {
          id: `dest-${r.id}`,
          lat: r.destinationLat || 10.6031,
          lng: r.destinationLng || -66.9906,
          title: r.destinationAddress || 'Destino Viaje',
          subtitle: `Tarifa: $${r.totalFare} USD`,
          type: 'destination' as const,
          status: r.status,
        },
      ];

      if (r.driverId || r.driver) {
        items.push({
          id: `driver-${r.id}`,
          lat: vehicleLat,
          lng: vehicleLng,
          title: r.vehicle ? `${r.vehicle.make} (${r.vehicle.licensePlate})` : 'Unidad VIP Asignada',
          subtitle: `Chofer: ${r.driver?.user?.firstName || 'Asignado'}`,
          type: 'vehicle' as const,
          status: r.status,
        });
      }

      return items;
    });
  }, [rides, liveDriverLocations]);

  const activeMapCardData = useMemo(() => {
    const targetRide = selectedRide || rides.find((r) => r.status !== 'FINALIZADO' && r.status !== 'CANCELADO') || rides[0];
    if (!targetRide) return null;
    return {
      id: targetRide.id,
      originAddress: targetRide.originAddress,
      destinationAddress: targetRide.destinationAddress,
      passengerName: targetRide.passenger ? `${targetRide.passenger.firstName} ${targetRide.passenger.lastName}` : (targetRide.passengerName || 'Pasajero VIP'),
      passengerPhone: targetRide.passenger?.phone,
      driverName: targetRide.driver?.user ? `${targetRide.driver.user.firstName} ${targetRide.driver.user.lastName}` : undefined,
      vehicleInfo: targetRide.vehicle ? `${targetRide.vehicle.make} ${targetRide.vehicle.model || ''} (${targetRide.vehicle.licensePlate})` : undefined,
      totalFare: targetRide.totalFare,
      bcvFare: (Number(targetRide.totalFare || 0) * Number(bcvRate || 50)).toFixed(2),
      status: targetRide.status,
      paymentMethod: targetRide.paymentMethod,
    };
  }, [selectedRide, rides, bcvRate]);

  const activeRoutePolyline: Array<[number, number]> = customOrigin && customDestination
    ? [
        [customOrigin.lat, customOrigin.lng],
        [customDestination.lat, customDestination.lng],
      ]
    : selectedRide
    ? [
        [selectedRide.originLat || 10.4806, selectedRide.originLng || -66.8622],
        [
          ((selectedRide.originLat || 10.4806) + (selectedRide.destinationLat || 10.6031)) / 2,
          ((selectedRide.originLng || -66.8622) + (selectedRide.destinationLng || -66.9906)) / 2,
        ],
        [selectedRide.destinationLat || 10.6031, selectedRide.destinationLng || -66.9906],
      ]
    : [];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* SOS Alert Modal if triggered */}
      {sosAlert && (
        <SosAlertModal
          alertData={sosAlert}
          onClose={() => setSosAlert(null)}
          onLocateOnMap={(lat, lng) => {
            setCustomOrigin({ lat, lng, name: `ALERTA SOS (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
            addToast('error', 'Alerta SOS Localizada', `Cámara enfocada en el vehículo en emergencia`);
          }}
        />
      )}

      {/* TOP COMMAND & CONTROL HEADER */}
      <div className="bg-executive-card border border-executive-border p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
                  Consola de Despacho Ejecutivo & Telemetría en Vivo
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 border ${
                      isWsConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <Wifi className="w-3 h-3" />
                    {isWsConnected ? 'WEBSOCKETS EN VIVO' : 'CONECTANDO TELEMETRÍA...'}
                  </span>
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Centro de operaciones de alta gama, auto-asignación por cercanía en Venezuela, tasa BCV y protocolo SOS.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className="px-3.5 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
            >
              <Sliders className="w-4 h-4 text-luxury-gold" />
              Tarifas & BCV
            </button>

            <button
              onClick={handleSimulateSos}
              className="px-3.5 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
              title="Probar protocolo de pánico en tiempo real"
            >
              <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
              Simular Alerta SOS
            </button>

            <button
              onClick={exportRidesToCSV}
              className="px-3.5 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-luxury-gold" />
              Exportar CSV
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-black text-xs rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              + DESPACHAR VIAJE VIP
            </button>
          </div>
        </div>

        {/* 4 LIVE KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-executive-dark/80 p-3.5 rounded-2xl border border-executive-border flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-luxury-gold/10 text-luxury-gold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Choferes en Red</span>
              <span className="text-lg font-black text-white">{kpis.onlineDrivers} Conectados</span>
            </div>
          </div>

          <div className="bg-executive-dark/80 p-3.5 rounded-2xl border border-emerald-500/30 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Viajes en Ruta</span>
              <span className="text-lg font-black text-white">{kpis.active} Activos</span>
            </div>
          </div>

          <div className="bg-executive-dark/80 p-3.5 rounded-2xl border border-amber-500/30 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 uppercase font-bold block">Por Asignar</span>
              <span className="text-lg font-black text-white">{kpis.requested} Solicitudes</span>
            </div>
          </div>

          <div className="bg-executive-dark/80 p-3.5 rounded-2xl border border-luxury-gold/30 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-luxury-gold/10 text-luxury-gold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Tasa Oficial BCV</span>
              <span className="text-lg font-black text-luxury-gold font-mono">Bs. {bcvRate.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Optional Collapsible Settings Panel */}
        {showSettingsPanel && (
          <div className="p-4 bg-executive-dark border border-luxury-gold/30 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-center text-xs animate-fadeIn">
            <div>
              <label className="text-gray-400 block mb-1">Unidad de Distancia</label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value as 'KM' | 'MILES')}
                className="w-full bg-executive-card border border-executive-border rounded-lg p-2 text-white font-bold"
              >
                <option value="KM">Kilómetros (KM)</option>
                <option value="MILES">Millas (MILES)</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Tarifa Base (USD)</label>
              <input
                type="number"
                step="0.5"
                value={baseFare}
                onChange={(e) => setBaseFare(Number(e.target.value))}
                className="w-full bg-executive-card border border-executive-border rounded-lg p-2 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Costo por {unitType} (USD)</label>
              <input
                type="number"
                step="0.1"
                value={ratePerUnit}
                onChange={(e) => setRatePerUnit(Number(e.target.value))}
                className="w-full bg-executive-card border border-executive-border rounded-lg p-2 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-emerald-400 font-bold block mb-1">Tasa Oficial BCV (Bs.)</label>
              <input
                type="number"
                step="0.5"
                value={bcvRate}
                onChange={(e) => setBcvRate(Number(e.target.value))}
                className="w-full bg-executive-card border border-emerald-500/40 rounded-lg p-2 text-emerald-400 font-mono font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* MAIN SPLIT WORKSPACE: MAP (LEFT) + SELECTED SERVICE ACTION HUB (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Real OpenStreetMap Container (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          {/* Map Interactive Toolbar */}
          <div className="flex items-center justify-between bg-executive-card p-3 rounded-2xl border border-executive-border text-xs">
            <span className="text-gray-300 font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-luxury-gold" />
              Telemetría de Flota & Puntos de Recogida:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMapSelectionMode(mapSelectionMode === 'pickup' ? 'none' : 'pickup')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                  mapSelectionMode === 'pickup'
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                    : 'bg-executive-dark text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                }`}
              >
                📍 Fijar Abordaje
              </button>
              <button
                onClick={() => setMapSelectionMode(mapSelectionMode === 'destination' ? 'none' : 'destination')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                  mapSelectionMode === 'destination'
                    ? 'bg-red-500 text-white border-red-400 shadow-md'
                    : 'bg-executive-dark text-red-400 border-red-500/40 hover:bg-red-500/20'
                }`}
              >
                🏁 Fijar Destino
              </button>
            </div>
          </div>

          <div className="h-[520px] rounded-3xl overflow-hidden border border-executive-border shadow-2xl">
            <OpenStreetMap
              centerLat={selectedRide?.originLat || 10.4806}
              centerLng={selectedRide?.originLng || -66.8622}
              zoom={13}
              markers={mapMarkers}
              routePolyline={activeRoutePolyline}
              selectionMode={mapSelectionMode}
              onLocationSelect={handleLocationSelectFromMap}
              activeCardData={activeMapCardData}
            />
          </div>
        </div>

        {/* RIGHT PANEL: SELECTED RIDE EXPEDIENT & INSTANT DISPATCH ACTION HUB */}
        <div className="bg-executive-card border border-executive-border p-6 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-executive-border pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-luxury-gold" />
              Control del Servicio Seleccionado
            </h3>
            <button
              onClick={loadAllAllData => loadAllData()}
              className="p-2 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-xl transition-all"
              title="Recargar telemetría"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-luxury-gold' : ''}`} />
            </button>
          </div>

          {selectedRide ? (
            <div className="space-y-4 text-xs">
              {/* Status Header Badge */}
              <div className="p-3 bg-executive-dark rounded-2xl border border-executive-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">ID del Servicio</span>
                  <span className="font-mono font-bold text-white text-xs">{selectedRide.id.substring(0, 14)}</span>
                </div>
                <span className="px-3 py-1 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 font-black rounded-full text-xs">
                  {selectedRide.status}
                </span>
              </div>

              {/* Status Stepper Progression */}
              <div className="p-3 bg-executive-dark/70 rounded-2xl border border-executive-border space-y-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Fase Operativa</span>
                <div className="flex items-center justify-between gap-1 text-[9px] font-bold">
                  {['SOLICITADO', 'ASIGNADO', 'EN_CAMINO', 'ABORDAJE', 'EN_CURSO', 'FINALIZADO'].map((st, i) => {
                    const statuses = ['SOLICITADO', 'ASIGNADO', 'EN_CAMINO', 'ABORDAJE', 'EN_CURSO', 'FINALIZADO'];
                    const currentIndex = statuses.indexOf(selectedRide.status);
                    const isPassed = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    return (
                      <div
                        key={st}
                        className={`flex-1 py-1 text-center rounded-md transition-all ${
                          isCurrent
                            ? 'bg-luxury-gold text-black font-black shadow-md'
                            : isPassed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-executive-card text-gray-500'
                        }`}
                      >
                        {st.substring(0, 4)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Passenger Details */}
              <div className="p-3.5 bg-executive-dark rounded-2xl border border-executive-border space-y-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">👤 Pasajero VIP</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    {selectedRide.passenger?.firstName || 'Dr. Alejandro'} {selectedRide.passenger?.lastName || 'Rossi'}
                  </span>
                  <span className="px-2 py-0.5 bg-luxury-gold/10 text-luxury-gold rounded-md text-[10px] font-bold">
                    {selectedRide.paymentMethod || 'PAGO_MOVIL'}
                  </span>
                </div>
                <p className="text-gray-400 text-[11px] flex items-center gap-1">
                  <Mail className="w-3 h-3 text-luxury-gold" /> {selectedRide.passenger?.email || 'corporativo@rumbofino.com'}
                </p>
              </div>

              {/* Driver & Vehicle Assignment Section */}
              <div className="p-3.5 bg-executive-dark rounded-2xl border border-executive-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">🚗 Chofer & Unidad</span>
                  {selectedRide.driver ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> ASIGNADO
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 animate-pulse">
                      ⚠️ PENDIENTE DE ASIGNACIÓN
                    </span>
                  )}
                </div>

                {selectedRide.driver ? (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">
                        {selectedRide.driver.user?.firstName} {selectedRide.driver.user?.lastName}
                      </span>
                      <span className="text-luxury-gold font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-luxury-gold" /> {Number(selectedRide.driver.ratingAvg || 5).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span className="flex items-center gap-1 text-luxury-gold font-mono font-bold">
                        <ShieldCheck className="w-3 h-3" /> {selectedRide.vehicle?.make} {selectedRide.vehicle?.model} ({selectedRide.vehicle?.licensePlate || 'VIP-777'})
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {selectedRide.driver.user?.phoneNumber || 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* INLINE QUICK DRIVER ASSIGNMENT FORM */
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] text-gray-300 font-semibold block">
                      Seleccionar Chofer Disponible para este Viaje:
                    </label>
                    <select
                      value={assigningDriverId}
                      onChange={(e) => setAssigningDriverId(e.target.value)}
                      className="w-full bg-executive-card border border-executive-border rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-luxury-gold font-medium"
                    >
                      <option value="">-- Seleccione Chofer --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.user?.firstName} {d.user?.lastName} (⭐ {Number(d.ratingAvg || 5).toFixed(1)}) {d.isOnline ? '🟢 Online' : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!assigningDriverId || assigningLoading}
                      onClick={() => handleAssignDriverToRide(selectedRide.id, assigningDriverId)}
                      className="w-full py-2 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50"
                    >
                      {assigningLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      Asignar Chofer & Pasar a ASIGNADO
                    </button>
                  </div>
                )}
              </div>

              {/* Route Addresses */}
              <div className="space-y-2 bg-executive-dark p-3.5 rounded-2xl border border-executive-border text-[11px]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">🟢 Origen:</span>
                  <span className="text-white font-medium leading-relaxed">{selectedRide.originAddress}</span>
                </div>
                <div className="pt-2 border-t border-executive-border/60">
                  <span className="text-[10px] uppercase font-bold text-luxury-gold block mb-0.5">🏁 Destino:</span>
                  <span className="text-white font-medium leading-relaxed">{selectedRide.destinationAddress}</span>
                </div>
              </div>

              {/* Dual Fare Box */}
              <div className="p-3.5 bg-executive-dark rounded-2xl border border-luxury-gold/30 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Tarifa Total:</span>
                  <span className="font-black text-luxury-gold text-xl font-mono">
                    ${Number(selectedRide.totalFare).toFixed(2)} USD
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Equivalente BCV:</span>
                  <span className="font-extrabold text-emerald-400 text-sm font-mono">
                    Bs. {(Number(selectedRide.totalFare) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* MAIN STATUS TRANSITION ACTIONS */}
              <div className="pt-2 space-y-2">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">
                  Acción Operativa Recomendada:
                </span>

                {selectedRide.status === 'SOLICITADO' && (
                  <button
                    onClick={() => {
                      if (drivers.length > 0) {
                        handleAssignDriverToRide(selectedRide.id, drivers[0].id);
                      } else {
                        handleUpdateStatus(selectedRide.id, 'ASIGNADO');
                      }
                    }}
                    className="w-full py-3 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-luxury-gold/20 text-xs"
                  >
                    <UserCheck className="w-4 h-4" /> Despachar & Asignar Unidad Disponible
                  </button>
                )}

                {selectedRide.status === 'ASIGNADO' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedRide.id, 'EN_CAMINO')}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-black font-black rounded-xl flex items-center justify-center gap-2 shadow-lg text-xs"
                  >
                    <Car className="w-4 h-4" /> Iniciar Ruta (En Camino al Origen)
                  </button>
                )}

                {selectedRide.status === 'EN_CAMINO' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedRide.id, 'ABORDAJE')}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-xl flex items-center justify-center gap-2 shadow-lg text-xs"
                  >
                    <MapPin className="w-4 h-4" /> Llegada a Punto de Abordaje
                  </button>
                )}

                {selectedRide.status === 'ABORDAJE' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedRide.id, 'EN_CURSO')}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-black rounded-xl flex items-center justify-center gap-2 shadow-lg text-xs"
                  >
                    <Play className="w-4 h-4" /> Pasajero a Bordo (Iniciar Servicio)
                  </button>
                )}

                {selectedRide.status === 'EN_CURSO' && (
                  <button
                    onClick={() => setFinishRateRide(selectedRide)}
                    className="w-full py-3 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-luxury-gold/20 transition-all text-xs transform hover:scale-[1.02]"
                  >
                    <Star className="w-4 h-4 fill-black" /> Finalizar Viaje, Liquidar & Calificar ⭐
                  </button>
                )}

                {selectedRide.status !== 'FINALIZADO' && selectedRide.status !== 'CANCELADO' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedRide.id, 'CANCELADO')}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Cancelar Viaje
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-executive-dark border border-executive-border flex items-center justify-center mx-auto text-luxury-gold">
                <Car className="w-7 h-7" />
              </div>
              <p className="text-white font-bold text-sm">Ningún viaje seleccionado</p>
              <p className="text-gray-400 text-xs max-w-xs mx-auto">
                Selecciona cualquier servicio de la tabla inferior o del mapa para gestionar su asignación y telemetría.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-4 py-2 bg-luxury-gold text-black font-extrabold rounded-xl text-xs"
              >
                + Despachar Nuevo Viaje
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM FEED: LIVE SERVICES CONSOLE TABLE WITH TABS */}
      <div className="bg-executive-card border border-executive-border rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-executive-border pb-4">
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-luxury-gold" />
            <h3 className="text-lg font-black text-white">
              Bitácora de Servicios VIP en Consola ({filteredRides.length})
            </h3>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setStatusTabFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                statusTabFilter === 'ALL'
                  ? 'bg-luxury-gold text-black shadow-md'
                  : 'bg-executive-dark text-gray-400 hover:text-white'
              }`}
            >
              Todos ({rides.length})
            </button>
            <button
              onClick={() => setStatusTabFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                statusTabFilter === 'ACTIVE'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-executive-dark text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              En Ruta ({kpis.active})
            </button>
            <button
              onClick={() => setStatusTabFilter('REQUESTED')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                statusTabFilter === 'REQUESTED'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-executive-dark text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              Por Asignar ({kpis.requested})
            </button>
            <button
              onClick={() => setStatusTabFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                statusTabFilter === 'COMPLETED'
                  ? 'bg-sky-500 text-black shadow-md'
                  : 'bg-executive-dark text-sky-400 hover:bg-sky-500/10'
              }`}
            >
              Completados ({kpis.completed})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-executive-dark text-gray-400 uppercase font-bold border-b border-executive-border">
              <tr>
                <th className="p-3">ID Viaje</th>
                <th className="p-3">Pasajero</th>
                <th className="p-3">Origen ➔ Destino</th>
                <th className="p-3">Chofer Asignado</th>
                <th className="p-3">Vehículo</th>
                <th className="p-3">Tarifa Dual (USD / Bs. BCV)</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-executive-border/60">
              {filteredRides.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 font-semibold">
                    No hay viajes registrados bajo este criterio de filtro.
                  </td>
                </tr>
              ) : (
                filteredRides.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRide(r)}
                    className={`hover:bg-executive-dark/60 cursor-pointer transition-colors ${
                      selectedRide?.id === r.id ? 'bg-luxury-gold/10 border-l-4 border-luxury-gold' : ''
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-luxury-gold">{r.id.substring(0, 12)}</td>
                    <td className="p-3 font-medium text-white">
                      {r.passenger?.firstName || 'Pasajero VIP'} {r.passenger?.lastName || ''}
                    </td>
                    <td className="p-3 max-w-xs">
                      <span className="text-gray-200 block truncate">{r.originAddress}</span>
                      <span className="text-gray-500 text-[10px]">➔ {r.destinationAddress}</span>
                    </td>
                    <td className="p-3 font-semibold text-gray-200">
                      {r.driver ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <UserCheck className="w-3.5 h-3.5" />
                          {r.driver.user?.firstName} {r.driver.user?.lastName}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold">⚠️ Sin Chofer</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-luxury-gold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-luxury-gold" />
                      {r.vehicle ? `${r.vehicle.make} (${r.vehicle.licensePlate})` : 'VIP-777'}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-emerald-400 block">${Number(r.totalFare).toFixed(2)} USD</span>
                      <span className="font-mono text-[10px] text-gray-400">≈ Bs. {(Number(r.totalFare) * bcvRate).toFixed(2)}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
                          r.status === 'EN_CURSO'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : r.status === 'SOLICITADO'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : r.status === 'FINALIZADO'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'EN_CURSO' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFinishRateRide(r);
                            }}
                            className="px-2.5 py-1 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold rounded-lg shadow-sm flex items-center gap-1 text-[11px] transition-all"
                          >
                            <Star className="w-3 h-3 fill-black" /> Cerrar & Calificar
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRide(r);
                          }}
                          className="px-3 py-1 bg-executive-dark hover:bg-executive-border text-luxury-gold font-bold rounded-lg border border-executive-border"
                        >
                          Monitorear ➔
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating / Dispatching New Ride */}
      {showCreateModal && (
        <CreateRideModal
          initialOriginLat={customOrigin?.lat}
          initialOriginLng={customOrigin?.lng}
          initialDestinationLat={customDestination?.lat}
          initialDestinationLng={customDestination?.lng}
          ratePerUnit={ratePerUnit}
          unitType={unitType}
          bcvRate={bcvRate}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadAllData();
            addToast('success', 'Viaje VIP Despachado', 'El servicio ha sido registrado con unidades aprobadas');
          }}
        />
      )}

      {/* Modal for Finishing and Rating a Ride */}
      {finishRateRide && (
        <FinishAndRateRideModal
          ride={finishRateRide}
          bcvRate={bcvRate}
          onClose={() => setFinishRateRide(null)}
          onSuccess={() => {
            addToast(
              'success',
              '🏆 Servicio Liquidado & Calificado',
              `El viaje ha sido cerrado exitosamente y la valoración VIP fue registrada en el expediente del chofer.`,
            );
            setFinishRateRide(null);
            loadAllData();
          }}
        />
      )}
    </div>
  );
}
