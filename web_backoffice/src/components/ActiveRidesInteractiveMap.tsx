'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Car,
  Activity,
  Users,
  Navigation,
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  MapPin,
  ShieldCheck,
  Radio,
  Sliders,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Maximize2,
} from 'lucide-react';
import { MarkerItem, MapOverlayCardData } from '@/components/MapboxMap';

// Dynamically load MapboxMap on client only
const MapboxMap = dynamic(
  () => import('@/components/MapboxMap').then((m) => m.MapboxMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] rounded-3xl bg-executive-dark flex flex-col items-center justify-center text-gray-500 border border-executive-border">
        <RefreshCw className="w-8 h-8 text-luxury-gold animate-spin mb-3" />
        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
          Iniciando Telemetría Mapbox VIP...
        </span>
      </div>
    ),
  }
);

// Curated Luxury Color Palette for Driver/Ride identification (similar to gsolsumed)
const RIDE_PALETTE = [
  { hex: '#D4AF37', name: 'Oro Imperial', ring: 'rgba(212,175,55,0.35)' },
  { hex: '#10B981', name: 'Esmeralda', ring: 'rgba(16,185,129,0.35)' },
  { hex: '#0EA5E9', name: 'Zafiro Azul', ring: 'rgba(14,165,233,0.35)' },
  { hex: '#F59E0B', name: 'Ámbar Real', ring: 'rgba(245,158,11,0.35)' },
  { hex: '#8B5CF6', name: 'Púrpura VIP', ring: 'rgba(139,92,246,0.35)' },
  { hex: '#EC4899', name: 'Rosa Magenta', ring: 'rgba(236,72,153,0.35)' },
  { hex: '#14B8A6', name: 'Teal Caribe', ring: 'rgba(20,184,166,0.35)' },
  { hex: '#F97316', name: 'Naranja Cobre', ring: 'rgba(249,115,22,0.35)' },
];

function colorForIndex(i: number) {
  return RIDE_PALETTE[i % RIDE_PALETTE.length];
}

interface ActiveRidesInteractiveMapProps {
  rides: any[];
  drivers: any[];
  bcvRate: number;
  onRefresh?: () => void;
  loading?: boolean;
}

export function ActiveRidesInteractiveMap({
  rides,
  drivers,
  bcvRate,
  onRefresh,
  loading = false,
}: ActiveRidesInteractiveMapProps) {
  // Operational View Modes
  const [viewMode, setViewMode] = useState<'fleet' | 'individual'>('fleet');
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [focusedCoords, setFocusedCoords] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('IN_PROGRESS'); // IN_PROGRESS | ALL | EN_CURSO | EN_CAMINO | ABORDAJE | ASIGNADO
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Replay & Timeline State (inspired by gsolsumed)
  const [replayMinute, setReplayMinute] = useState<number | null>(null); // null = Live, 0..100 = Replay percentage
  const [replayPlaying, setReplayPlaying] = useState<boolean>(false);

  // Auto-refresh timer
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString());

  // 1. Filter out only Active / Relevant In-Process Rides
  const activeRides = useMemo(() => {
    return rides.filter((r) => {
      const isOngoing =
        r.status === 'EN_CURSO' ||
        r.status === 'EN_CAMINO' ||
        r.status === 'ABORDAJE' ||
        r.status === 'ASIGNADO' ||
        r.status === 'SOLICITADO';
      return isOngoing;
    });
  }, [rides]);

  // Apply Status & Search Filter for the Roster
  const displayedRides = useMemo(() => {
    return rides.filter((r) => {
      // Filter by status
      if (statusFilter === 'IN_PROGRESS') {
        const inProg = ['EN_CURSO', 'EN_CAMINO', 'ABORDAJE', 'ASIGNADO'].includes(r.status);
        if (!inProg) return false;
      } else if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }

      // Filter by search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const passenger = `${r.passenger?.firstName || ''} ${r.passenger?.lastName || ''} ${r.guestName || ''}`.toLowerCase();
        const driver = `${r.driver?.user?.firstName || ''} ${r.driver?.user?.lastName || ''}`.toLowerCase();
        const vehicle = `${r.vehicle?.brand || ''} ${r.vehicle?.model || ''} ${r.vehicle?.licensePlate || ''}`.toLowerCase();
        const address = `${r.originAddress || ''} ${r.destinationAddress || ''}`.toLowerCase();
        return passenger.includes(term) || driver.includes(term) || vehicle.includes(term) || address.includes(term);
      }

      return true;
    });
  }, [rides, statusFilter, searchTerm]);

  // Color Mapping per Ride for consistent visual association
  const rideColorMap = useMemo(() => {
    const map = new Map<string, { hex: string; ring: string; name: string }>();
    rides.forEach((ride, idx) => {
      map.set(ride.id, colorForIndex(idx));
    });
    return map;
  }, [rides]);

  // Replay Simulator Timeline Tick
  useEffect(() => {
    if (!replayPlaying || replayMinute === null) return;
    const interval = setInterval(() => {
      setReplayMinute((prev) => {
        if (prev === null || prev >= 100) {
          setReplayPlaying(false);
          return 100;
        }
        return prev + 2;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [replayPlaying, replayMinute]);

  // Auto-refresh every 15s
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;
    const timer = setInterval(() => {
      onRefresh();
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh, onRefresh]);

  // Calculate Real-Time Signals & Metrics
  const metrics = useMemo(() => {
    const inTransit = activeRides.filter((r) => ['EN_CURSO', 'EN_CAMINO', 'ABORDAJE'].includes(r.status));
    const totalKm = inTransit.reduce((acc, r) => acc + Number(r.distanceKm || 12.5), 0);
    const totalVolumeUsd = inTransit.reduce((acc, r) => acc + Number(r.totalFare || 0), 0);
    const totalVolumeBcv = totalVolumeUsd * (bcvRate || 65.5);
    const onlineDriversCount = drivers.filter((d) => d.isOnline).length;

    return {
      activeRidesCount: inTransit.length,
      assignedRidesCount: activeRides.filter((r) => r.status === 'ASIGNADO').length,
      onlineDriversCount,
      totalDriversCount: drivers.length,
      totalKm: totalKm.toFixed(1),
      totalVolumeUsd: totalVolumeUsd.toFixed(2),
      totalVolumeBcv: totalVolumeBcv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      passengersOnboard: inTransit.length,
    };
  }, [activeRides, drivers, bcvRate]);

  // Resolve target ride for focused single view or overlay card
  const activeSelectedRide = useMemo(() => {
    if (selectedRideId) {
      return rides.find((r) => r.id === selectedRideId) || displayedRides[0] || null;
    }
    return displayedRides[0] || null;
  }, [selectedRideId, rides, displayedRides]);

  // Generate Map Markers
  const mapMarkers = useMemo(() => {
    const items: MarkerItem[] = [];

    // Filter rides to plot based on viewMode
    const ridesToPlot =
      viewMode === 'individual' && activeSelectedRide
        ? [activeSelectedRide]
        : displayedRides;

    ridesToPlot.forEach((r) => {
      const color = rideColorMap.get(r.id)?.hex || '#D4AF37';
      const oLat = Number(r.originLatitude || r.originLat || 10.4806);
      const oLng = Number(r.originLongitude || r.originLng || -66.8622);
      const dLat = Number(r.destinationLatitude || r.destinationLat || 10.6031);
      const dLng = Number(r.destinationLongitude || r.destinationLng || -66.9906);

      // Interpolate current vehicle position if in replay mode
      let vLat = oLat;
      let vLng = oLng;
      if (replayMinute !== null) {
        const factor = replayMinute / 100;
        vLat = oLat + (dLat - oLat) * factor;
        vLng = oLng + (dLng - oLng) * factor;
      } else {
        // Approximate live vehicle location between origin and destination based on status
        if (r.status === 'EN_CURSO') {
          vLat = (oLat * 0.4) + (dLat * 0.6);
          vLng = (oLng * 0.4) + (dLng * 0.6);
        } else if (r.status === 'ABORDAJE' || r.status === 'EN_CAMINO') {
          vLat = (oLat * 0.8) + (dLat * 0.2);
          vLng = (oLng * 0.8) + (dLng * 0.2);
        } else {
          vLat = oLat;
          vLng = oLng;
        }
      }

      // 1. Vehicle Live/Replay Marker
      const driverName = r.driver?.user ? `${r.driver.user.firstName} ${r.driver.user.lastName}` : 'Unidad Asignada';
      const vehicleDesc = r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model} (${r.vehicle.licensePlate})` : 'VIP';

      items.push({
        id: `veh-${r.id}`,
        lat: vLat,
        lng: vLng,
        title: `${vehicleDesc}`,
        subtitle: `Chofer: ${driverName} • Estado: ${r.status}`,
        type: 'vehicle',
        status: r.status,
        color: color,
      });

      // 2. Pickup Marker
      items.push({
        id: `pickup-${r.id}`,
        lat: oLat,
        lng: oLng,
        title: r.originAddress || 'Origen VIP',
        subtitle: `Pasajero: ${r.passenger?.firstName || 'VIP'}`,
        type: 'pickup',
        status: r.status,
      });

      // 3. Destination Marker
      items.push({
        id: `dest-${r.id}`,
        lat: dLat,
        lng: dLng,
        title: r.destinationAddress || 'Destino VIP',
        subtitle: `Tarifa: $${Number(r.totalFare || 0).toFixed(2)} USD`,
        type: 'destination',
        status: r.status,
      });
    });

    return items;
  }, [viewMode, activeSelectedRide, displayedRides, rideColorMap, replayMinute]);

  // Generate Route Polyline for Mapbox
  const routePolyline = useMemo(() => {
    if (!activeSelectedRide) return [];
    const oLat = Number(activeSelectedRide.originLatitude || activeSelectedRide.originLat || 10.4806);
    const oLng = Number(activeSelectedRide.originLongitude || activeSelectedRide.originLng || -66.8622);
    const dLat = Number(activeSelectedRide.destinationLatitude || activeSelectedRide.destinationLat || 10.6031);
    const dLng = Number(activeSelectedRide.destinationLongitude || activeSelectedRide.destinationLng || -66.9906);

    // Provide a smoothed multi-point polyline for Mapbox rendering
    const mid1Lat = oLat + (dLat - oLat) * 0.33 + 0.005;
    const mid1Lng = oLng + (dLng - oLng) * 0.33 - 0.004;
    const mid2Lat = oLat + (dLat - oLat) * 0.66 - 0.003;
    const mid2Lng = oLng + (dLng - oLng) * 0.66 + 0.002;

    return [
      [oLat, oLng],
      [mid1Lat, mid1Lng],
      [mid2Lat, mid2Lng],
      [dLat, dLng],
    ] as Array<[number, number]>;
  }, [activeSelectedRide]);

  // Floating Overlay Card Data
  const overlayCardData: MapOverlayCardData | null = useMemo(() => {
    if (!activeSelectedRide) return null;
    return {
      id: activeSelectedRide.id,
      originAddress: activeSelectedRide.originAddress,
      destinationAddress: activeSelectedRide.destinationAddress,
      passengerName: activeSelectedRide.passenger
        ? `${activeSelectedRide.passenger.firstName} ${activeSelectedRide.passenger.lastName}`
        : (activeSelectedRide.guestName || 'Pasajero VIP'),
      passengerPhone: activeSelectedRide.passenger?.phone || activeSelectedRide.guestPhone,
      driverName: activeSelectedRide.driver?.user
        ? `${activeSelectedRide.driver.user.firstName} ${activeSelectedRide.driver.user.lastName}`
        : 'Por asignar',
      vehicleInfo: activeSelectedRide.vehicle
        ? `${activeSelectedRide.vehicle.brand} ${activeSelectedRide.vehicle.model} (${activeSelectedRide.vehicle.licensePlate})`
        : undefined,
      totalFare: Number(activeSelectedRide.totalFare || 0).toFixed(2),
      bcvFare: (Number(activeSelectedRide.totalFare || 0) * (bcvRate || 65.5)).toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      status: activeSelectedRide.status,
      paymentMethod: activeSelectedRide.paymentMethod || 'PAGO_MOVIL',
      routeDistanceKm: Number(activeSelectedRide.distanceKm || 14.2),
      routeDurationMin: Number(activeSelectedRide.durationMin || 28),
    };
  }, [activeSelectedRide, bcvRate]);

  // Focus on a specific ride in map
  const handleFocusRide = (ride: any) => {
    setSelectedRideId(ride.id);
    const oLat = Number(ride.originLatitude || ride.originLat || 10.4806);
    const oLng = Number(ride.originLongitude || ride.originLng || -66.8622);
    setFocusedCoords({ lat: oLat, lng: oLng, zoom: 14.5 });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_CURSO':
        return (
          <span className="px-2.5 py-0.5 bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30 rounded-full text-[10px] font-black flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-ping inline-block" />
            EN CURSO
          </span>
        );
      case 'EN_CAMINO':
        return (
          <span className="px-2.5 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/30 rounded-full text-[10px] font-black flex items-center gap-1">
            <Navigation className="w-2.5 h-2.5" />
            EN CAMINO
          </span>
        );
      case 'ABORDAJE':
        return (
          <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-black flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />
            ABORDAJE
          </span>
        );
      case 'ASIGNADO':
        return (
          <span className="px-2.5 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-black">
            ASIGNADO
          </span>
        );
      case 'SOLICITADO':
        return (
          <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-full text-[10px] font-black">
            SOLICITADO
          </span>
        );
      case 'FINALIZADO':
        return (
          <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black">
            FINALIZADO
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-gray-500/15 text-gray-400 border border-gray-500/30 rounded-full text-[10px] font-black">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ══════════════════════════════════════════════════════════════════
          1. SIGNALS BAR: EXECUTIVE TELEMETRY KPIS (Inspired by Gsolsumed)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-executive-card border border-executive-border rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-executive-border/60">
          {/* Signal 1: Choferes en Red */}
          <div className="pt-2 lg:pt-0 lg:px-3 first:px-0 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                Choferes en Servicio
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
              {metrics.onlineDriversCount}
              <span className="text-xs font-semibold text-gray-400 font-mono">
                / {metrics.totalDriversCount} en flota
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <Radio className="w-3 h-3 animate-pulse" /> Telemetría GPS en tiempo real
            </p>
          </div>

          {/* Signal 2: Carreras en Proceso */}
          <div className="pt-2 lg:pt-0 lg:px-3 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-luxury-gold block">
              Carreras en Proceso
            </span>
            <div className="text-2xl font-black text-luxury-gold flex items-baseline gap-1.5 font-mono">
              {metrics.activeRidesCount}
              <span className="text-xs font-semibold text-gray-400 font-sans">activas</span>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-luxury-gold" /> {metrics.assignedRidesCount} por iniciar
            </p>
          </div>

          {/* Signal 3: Pasajeros VIP a Bordo */}
          <div className="pt-2 lg:pt-0 lg:px-3 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block">
              Pasajeros VIP a Bordo
            </span>
            <div className="text-2xl font-black text-white flex items-baseline gap-1.5 font-mono">
              {metrics.passengersOnboard}
              <span className="text-xs font-semibold text-gray-400 font-sans">traslados</span>
            </div>
            <p className="text-[11px] text-sky-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Monitoreo y custodia activa
            </p>
          </div>

          {/* Signal 4: Distancia en Tránsito */}
          <div className="pt-2 lg:pt-0 lg:px-3 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block">
              Distancia en Ruta
            </span>
            <div className="text-2xl font-black text-white flex items-baseline gap-1.5 font-mono">
              {metrics.totalKm}
              <span className="text-xs font-bold text-gray-400 font-mono">km</span>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Trazado dinámico Mapbox
            </p>
          </div>

          {/* Signal 5: Recaudación en Curso ($ USD y Bs.) */}
          <div className="pt-2 lg:pt-0 lg:px-3 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">
              Tarifa en Tránsito
            </span>
            <div className="text-2xl font-black text-white flex items-baseline gap-1 font-mono">
              ${metrics.totalVolumeUsd}
              <span className="text-xs font-bold text-gray-400 font-sans">USD</span>
            </div>
            <p className="text-[11px] text-luxury-gold font-mono truncate" title={`Bs. ${metrics.totalVolumeBcv}`}>
              Bs. {metrics.totalVolumeBcv} (BCV)
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. OPERATIONAL TOOLBAR: MODE SWITCH, REPLAY & TELEMETRY CONTROLS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-executive-card border border-executive-border rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mode Tabs & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Fleet vs Individual Mode */}
          <div className="bg-executive-dark p-1 rounded-xl border border-executive-border flex items-center">
            <button
              onClick={() => {
                setViewMode('fleet');
                setFocusedCoords(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'fleet'
                  ? 'bg-luxury-gold text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Flota Completa ({displayedRides.length})
            </button>
            <button
              onClick={() => {
                setViewMode('individual');
                if (displayedRides[0]) handleFocusRide(displayedRides[0]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'individual'
                  ? 'bg-luxury-gold text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Foco Individual
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-executive-dark px-3 py-1.5 rounded-xl border border-executive-border text-xs">
            <Filter className="w-3.5 h-3.5 text-luxury-gold" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="IN_PROGRESS" className="bg-executive-dark">En Proceso (Ruta)</option>
              <option value="ALL" className="bg-executive-dark">Todos los Servicios</option>
              <option value="EN_CURSO" className="bg-executive-dark">Solo EN CURSO</option>
              <option value="EN_CAMINO" className="bg-executive-dark">Solo EN CAMINO</option>
              <option value="ABORDAJE" className="bg-executive-dark">Solo ABORDAJE</option>
              <option value="ASIGNADO" className="bg-executive-dark">Solo ASIGNADOS</option>
            </select>
          </div>

          {/* Auto Refresh Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-executive-dark px-3 py-1.5 rounded-xl border border-executive-border text-xs">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-emerald-400 rounded cursor-pointer"
            />
            <span className="text-gray-300 font-bold flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
              Auto-sync 15s
            </span>
          </label>

          <span className="text-[10px] text-gray-400 font-mono hidden md:inline-block">
            Sincronizado: {lastSyncTime}
          </span>
        </div>

        {/* Right: Timeline Replay Controls & Manual Sync */}
        <div className="flex items-center gap-2.5">
          {/* Replay Timeline Bar */}
          <div className="bg-executive-dark border border-executive-border px-3 py-1.5 rounded-xl flex items-center gap-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-luxury-gold" />
              {replayMinute === null ? 'En Vivo' : `Replay: ${replayMinute}%`}
            </span>

            {replayMinute !== null ? (
              <>
                <button
                  onClick={() => setReplayPlaying(!replayPlaying)}
                  className="p-1 bg-luxury-gold text-black rounded-md hover:bg-luxury-gold-hover transition-colors"
                  title={replayPlaying ? 'Pausar Replay' : 'Reproducir Replay'}
                >
                  {replayPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={replayMinute}
                  onChange={(e) => {
                    setReplayPlaying(false);
                    setReplayMinute(Number(e.target.value));
                  }}
                  className="w-24 accent-luxury-gold cursor-pointer"
                />
                <button
                  onClick={() => {
                    setReplayMinute(null);
                    setReplayPlaying(false);
                  }}
                  className="text-[10px] font-bold text-gray-400 hover:text-white underline ml-1"
                >
                  Volver al Vivo
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setReplayMinute(10);
                  setReplayPlaying(true);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-[10px] font-extrabold transition-all border border-executive-border"
              >
                ▶ Simular Replay
              </button>
            )}
          </div>

          {/* Sync Button */}
          {onRefresh && (
            <button
              onClick={() => {
                onRefresh();
                setLastSyncTime(new Date().toLocaleTimeString());
              }}
              disabled={loading}
              className="p-2.5 bg-luxury-gold/10 hover:bg-luxury-gold text-luxury-gold hover:text-black border border-luxury-gold/30 rounded-xl transition-all shadow-sm"
              title="Sincronizar telemetría ahora"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. MAIN SPLIT INTERACTIVE WORKSPACE: ROSTER (LEFT) + MAPBOX (RIGHT)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ──── LEFT ROSTER: ACTIVE RIDES FEED (4 Cols) ──── */}
        <div className="lg:col-span-4 bg-executive-card border border-executive-border rounded-3xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-executive-border">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-luxury-gold" />
                Carreras en Proceso ({displayedRides.length})
              </h3>
              <p className="text-[11px] text-gray-400">Roster operativo en telemetría continua</p>
            </div>
            {viewMode === 'individual' && (
              <button
                onClick={() => {
                  setViewMode('fleet');
                  setFocusedCoords(null);
                }}
                className="text-[10px] font-bold text-luxury-gold hover:underline"
              >
                Ver Todas
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por pasajero, chofer, placa o ruta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-executive-dark border border-executive-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:border-luxury-gold focus:outline-none transition-all"
            />
          </div>

          {/* Roster Cards List */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {displayedRides.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Car className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-xs font-bold text-gray-400">Sin carreras activas bajo este filtro</p>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                  Los nuevos servicios solicitados o despachados aparecerán en este panel automáticamente.
                </p>
              </div>
            ) : (
              displayedRides.map((ride) => {
                const colorInfo = rideColorMap.get(ride.id) || RIDE_PALETTE[0];
                const isSelected = activeSelectedRide?.id === ride.id;
                const passengerName = ride.passenger
                  ? `${ride.passenger.firstName} ${ride.passenger.lastName}`
                  : (ride.guestName || 'Pasajero VIP');
                const driverName = ride.driver?.user
                  ? `${ride.driver.user.firstName} ${ride.driver.user.lastName}`
                  : 'Chofer sin asignar';
                const vehicleDesc = ride.vehicle
                  ? `${ride.vehicle.brand} ${ride.vehicle.model} • ${ride.vehicle.licensePlate}`
                  : 'Unidad VIP';

                return (
                  <div
                    key={ride.id}
                    onClick={() => handleFocusRide(ride)}
                    className={`group relative rounded-2xl p-3.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-luxury-gold/10 border-luxury-gold shadow-lg shadow-luxury-gold/10'
                        : 'bg-executive-dark/70 hover:bg-executive-dark border-executive-border hover:border-gray-600'
                    }`}
                  >
                    {/* Left Color Indicator Stripe */}
                    <div
                      className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full"
                      style={{ backgroundColor: colorInfo.hex }}
                    />

                    <div className="pl-2 space-y-2">
                      {/* Top Header: Passenger + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-extrabold text-white flex items-center gap-1.5 group-hover:text-luxury-gold transition-colors">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: colorInfo.hex }}
                            />
                            {passengerName}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {driverName} • {vehicleDesc}
                          </div>
                        </div>
                        <div>{getStatusBadge(ride.status)}</div>
                      </div>

                      {/* Route Summary */}
                      <div className="text-[11px] text-gray-300 bg-black/40 p-2 rounded-xl border border-white/5 space-y-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="truncate">{ride.originAddress || 'Origen'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold shrink-0" />
                          <span className="truncate">{ride.destinationAddress || 'Destino'}</span>
                        </div>
                      </div>

                      {/* Bottom Fare & Focus Button */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-xs font-black text-luxury-gold font-mono">
                            ${Number(ride.totalFare || 0).toFixed(2)} USD
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono block">
                            Bs. {(Number(ride.totalFare || 0) * (bcvRate || 65.5)).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusRide(ride);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                            isSelected
                              ? 'bg-luxury-gold text-black shadow-sm'
                              : 'bg-white/5 hover:bg-luxury-gold/20 text-gray-300 hover:text-luxury-gold border border-white/10'
                          }`}
                        >
                          <Navigation className="w-3 h-3" />
                          Enfocar en Mapa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ──── RIGHT: MAPBOX HD INTERACTIVE CANVAS (8 Cols) ──── */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative rounded-3xl overflow-hidden border border-executive-border shadow-2xl bg-executive-dark h-[680px]">
            <MapboxMap
              centerLat={10.4806}
              centerLng={-66.9036}
              zoom={13}
              markers={mapMarkers}
              routePolyline={routePolyline}
              activeCardData={overlayCardData}
              focusCoords={focusedCoords}
              className="w-full h-full"
            />
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              4. DYNAMIC LEGEND: ACTIVE UNITS IN MAP (Inspired by Gsolsumed)
              ══════════════════════════════════════════════════════════════════ */}
          {displayedRides.length > 0 && (
            <div className="bg-executive-card border border-executive-border rounded-2xl px-4 py-3 shadow-lg flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-luxury-gold" />
                Unidades en el Mapa:
              </span>
              <span className="h-4 w-px bg-executive-border mx-1" />

              {displayedRides.map((ride) => {
                const colorInfo = rideColorMap.get(ride.id) || RIDE_PALETTE[0];
                const isSelected = activeSelectedRide?.id === ride.id;
                const label = ride.driver?.user?.firstName || ride.passenger?.firstName || 'VIP';

                return (
                  <button
                    key={ride.id}
                    onClick={() => handleFocusRide(ride)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-black text-white shadow-md border-luxury-gold'
                        : 'bg-executive-dark/80 text-gray-300 hover:text-white border-executive-border'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colorInfo.hex }}
                    />
                    <span>{label}</span>
                    <span className="text-[10px] font-mono text-gray-400">
                      (${Number(ride.totalFare || 0).toFixed(0)})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
