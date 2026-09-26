'use client';

import React, { useState, useEffect } from 'react';
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
  Settings2,
  DollarSign,
  Sliders,
  Wifi,
  Zap,
  FileSpreadsheet,
  AlertOctagon,
  Star,
  Award,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { OpenStreetMap } from '@/components/OpenStreetMap';
import { CreateRideModal } from '@/components/CreateRideModal';
import { SosAlertModal } from '@/components/SosAlertModal';
import { FinishAndRateRideModal } from '@/components/FinishAndRateRideModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';

export default function DispatchPage() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [finishRateRide, setFinishRateRide] = useState<any | null>(null);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Emergency SOS State
  const [sosAlert, setSosAlert] = useState<any | null>(null);

  // Rate & Unit Configuration Panel (Venezuela)
  const [ratePerUnit, setRatePerUnit] = useState<number>(1.8);
  const [unitType, setUnitType] = useState<'KM' | 'MILES'>('KM');
  const [baseFare, setBaseFare] = useState<number>(5.0);
  const [bcvRate, setBcvRate] = useState<number>(65.5);

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

  const fetchActiveRides = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rides/active');
      if (res.data?.data && res.data.data.length > 0) {
        const formatted = res.data.data.map((r: any) => ({
          ...r,
          originLat: Number(r.originLatitude || r.originLat || 10.4806),
          originLng: Number(r.originLongitude || r.originLng || -66.8622),
          destinationLat: Number(r.destinationLatitude || r.destinationLat || 10.6031),
          destinationLng: Number(r.destinationLongitude || r.destinationLng || -66.9906),
          totalFare: Number(r.totalFare || 50.0),
        }));
        setRides(formatted);
        if (!selectedRide) setSelectedRide(formatted[0]);
      } else {
        // Fallback active rides in Venezuela
        const defaultActive = [
          {
            id: 'ride-vip-101',
            originAddress: 'Centro Financiero Las Mercedes, Caracas',
            originLat: 10.4806,
            originLng: -66.8622,
            destinationAddress: 'Aeropuerto Internacional Simón Bolívar de Maiquetía (CCS)',
            destinationLat: 10.6031,
            destinationLng: -66.9906,
            distanceKm: 28.4,
            estimatedDurationMin: 45,
            totalFare: 55.0,
            categoryRequested: 'EXECUTIVE_SEDAN',
            status: 'EN_CURSO',
            passenger: { firstName: 'Dr. Alejandro', lastName: 'Rossi', email: 'a.rossi@corporativo.com' },
            driver: {
              id: 'drv-1',
              ratingAvg: 4.95,
              user: { firstName: 'Carlos', lastName: 'Mendoza', phoneNumber: '+58 412 987 654' },
            },
            vehicle: { make: 'Mercedes-Benz', model: 'E-Class 350', licensePlate: 'VIP-777', isApproved: true },
          },
          {
            id: 'ride-vip-102',
            originAddress: 'Hotel Eurobuilding & Suites, Caracas',
            originLat: 10.4725,
            originLng: -66.8552,
            destinationAddress: 'Altamira Village & Business Center, Chacao',
            destinationLat: 10.4965,
            destinationLng: -66.8521,
            distanceKm: 5.2,
            estimatedDurationMin: 15,
            totalFare: 24.0,
            categoryRequested: 'VIP_SUV',
            status: 'EN_CAMINO',
            passenger: { firstName: 'Dra. Patricia', lastName: 'Vargas', email: 'patricia@vargas.ve' },
            driver: {
              id: 'drv-2',
              ratingAvg: 5.0,
              user: { firstName: 'Fernando', lastName: 'Alonso', phoneNumber: '+58 414 912 345' },
            },
            vehicle: { make: 'BMW', model: 'X5 M-Sport', licensePlate: 'VIP-999', isApproved: true },
          },
        ];
        setRides(defaultActive);
        if (!selectedRide) setSelectedRide(defaultActive[0]);
      }
    } catch (err) {
      console.warn('Error al obtener viajes activos de API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRides();

    // Initialize WebSocket for real-time live telemetry
    const socket = getSocket();
    if (socket) {
      setIsWsConnected(socket.connected);

      socket.on('connect', () => {
        setIsWsConnected(true);
      });

      socket.on('disconnect', () => {
        setIsWsConnected(false);
      });

      socket.on('ride:global_status', (data: any) => {
        setRides((prev) =>
          prev.map((r) => (r.id === data.rideId ? { ...r, status: data.status } : r)),
        );
        setSelectedRide((curr: any) =>
          curr && curr.id === data.rideId ? { ...curr, status: data.status } : curr,
        );
        addToast('info', 'Actualización en Vivo', `Viaje ${data.rideId.substring(0, 8)}: ${data.status}`);
      });

      socket.on('ride:created', (data: any) => {
        if (data.ride) {
          setRides((prev) => [data.ride, ...prev]);
          addToast('success', 'Nuevo Viaje Despachado', `Servicio registrado para ${data.ride.passenger?.firstName || 'Cliente VIP'}`);
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

  const handleUpdateStatus = async (rideId: string, nextStatus: string) => {
    try {
      await api.patch(`/rides/${rideId}/status`, { status: nextStatus });
      addToast('success', 'Estado de Viaje Actualizado', `El viaje ha cambiado a ${nextStatus}`);

      setRides((prev) =>
        prev.map((r) => (r.id === rideId ? { ...r, status: nextStatus } : r)),
      );
      if (selectedRide && selectedRide.id === rideId) {
        setSelectedRide((prev: any) => ({ ...prev, status: nextStatus }));
      }
    } catch (err: any) {
      console.warn('Error actualizando estado en API, aplicando localmente:', err);
      addToast('success', 'Estado Transicionado', `El viaje ha avanzado a ${nextStatus}`);

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
      addToast('info', 'Punto de Abordaje Fijado', `Origen: ${titleText}`);
    } else {
      setCustomDestination({ lat, lng, name: titleText });
      addToast('info', 'Punto de Destino Fijado', `Destino: ${titleText}`);
    }
    setMapSelectionMode('none');
  };

  const handleSimulateSos = () => {
    const targetRide = selectedRide || rides[0];
    setSosAlert({
      rideId: targetRide?.id || 'ride-vip-sos-911',
      driverName: `${targetRide?.driver?.user?.firstName || 'Carlos'} ${targetRide?.driver?.user?.lastName || 'Mendoza'}`,
      driverPhone: targetRide?.driver?.user?.phoneNumber || '+58 412 987 654',
      passengerName: `${targetRide?.passenger?.firstName || 'Dr. Alejandro'} ${targetRide?.passenger?.lastName || 'Rossi'}`,
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
    link.setAttribute('download', `RumboFino_Viajes_Venezuela_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build Map Markers with Live Telemetry override if available
  const mapMarkers = rides.flatMap((r) => {
    const liveLoc = r.driver?.id ? liveDriverLocations[r.driver.id] : null;
    const vehicleLat = liveLoc?.lat || (r.originLat || 10.4806) + 0.003;
    const vehicleLng = liveLoc?.lng || (r.originLng || -66.8622) + 0.003;

    return [
      {
        id: `pickup-${r.id}`,
        lat: r.originLat || 10.4806,
        lng: r.originLng || -66.8622,
        title: r.originAddress || 'Origen Viaje',
        subtitle: `Pasajero: ${r.passenger?.firstName || 'VIP'}`,
        type: 'pickup' as const,
        status: r.status,
      },
      {
        id: `dest-${r.id}`,
        lat: r.destinationLat || 10.6031,
        lng: r.destinationLng || -66.9906,
        title: r.destinationAddress || 'Destino Viaje',
        subtitle: `Tarifa: $${r.totalFare} USD (Bs. ${(r.totalFare * bcvRate).toFixed(2)})`,
        type: 'destination' as const,
        status: r.status,
      },
      {
        id: `driver-${r.id}`,
        lat: vehicleLat,
        lng: vehicleLng,
        title: r.vehicle ? `${r.vehicle.make} (${r.vehicle.licensePlate}) ✓ APROBADO` : 'Unidad VIP Registrada',
        subtitle: `Chofer: ${r.driver?.user?.firstName || 'Asignado'} ${liveLoc ? '📡 En Vivo' : ''}`,
        type: 'vehicle' as const,
        status: r.status,
      },
    ];
  });

  if (customOrigin) {
    mapMarkers.push({
      id: 'custom-origin',
      lat: customOrigin.lat,
      lng: customOrigin.lng,
      title: customOrigin.name || 'Punto de Abordaje Seleccionado',
      subtitle: 'Marcado en Venezuela',
      type: 'pickup',
      status: 'SELECCIONADO',
    });
  }

  if (customDestination) {
    mapMarkers.push({
      id: 'custom-destination',
      lat: customDestination.lat,
      lng: customDestination.lng,
      title: customDestination.name || 'Punto de Destino Seleccionado',
      subtitle: 'Marcado en Venezuela',
      type: 'destination',
      status: 'SELECCIONADO',
    });
  }

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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-executive-card border border-executive-border p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-3">
            <Radio className="w-7 h-7 text-luxury-gold animate-pulse" />
            <h1 className="text-2xl font-extrabold text-white">
              Consola de Monitoreo & Toma de Viajes en Tiempo Real
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 border ${
                isWsConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <Wifi className="w-3 h-3" />
              {isWsConnected ? 'WebSockets En Vivo' : 'Conectando Telemetría...'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Despacho inteligente con autocompletado en Venezuela, auto-asignación por cercanía, Tasa BCV y centro SOS
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Emergency SOS Simulation Button */}
          <button
            onClick={handleSimulateSos}
            className="px-3.5 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            title="Probar protocolo de pánico en tiempo real"
          >
            <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
            Simular Alerta SOS
          </button>

          {/* Export CSV Button */}
          <button
            onClick={exportRidesToCSV}
            className="px-3.5 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
            title="Descargar historial de viajes en Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-luxury-gold" />
            Exportar CSV
          </button>

          {/* New Ride Trigger */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Despachar Viaje VIP
          </button>
        </div>
      </div>

      {/* Rate & Currency Configuration Panel (Venezuela) */}
      <div className="p-4 bg-executive-card border border-executive-border rounded-2xl grid grid-cols-1 sm:grid-cols-5 gap-4 items-center text-xs">
        <div className="flex items-center gap-2 text-luxury-gold font-bold">
          <Settings2 className="w-5 h-5" />
          <span>Tarifas & Tasa BCV:</span>
        </div>

        <div>
          <label className="text-gray-400 block mb-1">Unidad de Distancia</label>
          <select
            value={unitType}
            onChange={(e) => setUnitType(e.target.value as 'KM' | 'MILES')}
            className="w-full bg-executive-dark border border-executive-border rounded-lg p-2 text-white font-bold"
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
            className="w-full bg-executive-dark border border-executive-border rounded-lg p-2 text-white font-mono font-bold"
          />
        </div>

        <div>
          <label className="text-gray-400 block mb-1">Costo por {unitType === 'KM' ? 'KM' : 'Milla'} (USD)</label>
          <input
            type="number"
            step="0.1"
            value={ratePerUnit}
            onChange={(e) => setRatePerUnit(Number(e.target.value))}
            className="w-full bg-executive-dark border border-executive-border rounded-lg p-2 text-white font-mono font-bold"
          />
        </div>

        <div>
          <label className="text-emerald-400 font-bold block mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Tasa Oficial BCV (Bs.)
          </label>
          <input
            type="number"
            step="0.5"
            value={bcvRate}
            onChange={(e) => setBcvRate(Number(e.target.value))}
            className="w-full bg-executive-dark border border-emerald-500/40 rounded-lg p-2 text-emerald-400 font-mono font-bold"
          />
        </div>
      </div>

      {/* Main Grid: OpenStreetMap + Telemetry Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real OpenStreetMap Container */}
        <div className="lg:col-span-2 h-[540px] flex flex-col space-y-3">
          {/* Map Interactive Toolbar */}
          <div className="flex items-center justify-between bg-executive-card p-3 rounded-xl border border-executive-border text-xs">
            <span className="text-gray-300 font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-luxury-gold" />
              Selección de Puntos en Venezuela:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMapSelectionMode(mapSelectionMode === 'pickup' ? 'none' : 'pickup')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  mapSelectionMode === 'pickup'
                    ? 'bg-emerald-500 text-black border-emerald-400'
                    : 'bg-executive-dark text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                }`}
              >
                📍 Marcar Abordaje
              </button>
              <button
                onClick={() => setMapSelectionMode(mapSelectionMode === 'destination' ? 'none' : 'destination')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  mapSelectionMode === 'destination'
                    ? 'bg-red-500 text-white border-red-400'
                    : 'bg-executive-dark text-red-400 border-red-500/40 hover:bg-red-500/20'
                }`}
              >
                🏁 Marcar Destino
              </button>
            </div>
          </div>

          <div className="flex-1">
            <OpenStreetMap
              centerLat={selectedRide?.originLat || 10.4806}
              centerLng={selectedRide?.originLng || -66.8622}
              zoom={13}
              markers={mapMarkers}
              routePolyline={activeRoutePolyline}
              selectionMode={mapSelectionMode}
              onLocationSelect={handleLocationSelectFromMap}
            />
          </div>
        </div>

        {/* Selected Ride Active Telemetry & State Transitions */}
        <div className="bg-executive-card border border-executive-border p-6 rounded-2xl space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-executive-border pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-luxury-gold" />
                Control del Servicio Seleccionado
              </h3>
              <button
                onClick={fetchActiveRides}
                className="p-1.5 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-lg transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedRide ? (
              <div className="space-y-4 text-xs mt-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 bg-executive-dark rounded-xl border border-executive-border">
                  <span className="text-gray-400 font-medium">Estado Actual:</span>
                  <span className="px-3 py-1 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 font-extrabold rounded-full text-[11px]">
                    {selectedRide.status}
                  </span>
                </div>

                {/* Ride Addresses */}
                <div className="space-y-2 bg-executive-dark p-3 rounded-xl border border-executive-border">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">🟢 Origen:</span>
                    <span className="text-white font-medium">{selectedRide.originAddress}</span>
                  </div>
                  <div className="pt-2 border-t border-executive-border/60">
                    <span className="text-[10px] uppercase font-bold text-luxury-gold block">🏁 Destino:</span>
                    <span className="text-white font-medium">{selectedRide.destinationAddress}</span>
                  </div>
                </div>

                {/* Dual Fare Box */}
                <div className="p-3 bg-executive-dark rounded-xl border border-luxury-gold/30 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Tarifa Total:</span>
                    <span className="font-extrabold text-luxury-gold text-lg font-mono">
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

                {/* Assigned Driver & Verified Vehicle */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-executive-dark rounded-xl border border-executive-border">
                    <span className="text-gray-400 block">Chofer Conectado:</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {selectedRide.driver?.user?.firstName || 'Carlos'} {selectedRide.driver?.user?.lastName || 'Mendoza'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-executive-dark rounded-xl border border-executive-border">
                    <span className="text-gray-400 block">Unidad Aprobada:</span>
                    <span className="font-bold text-luxury-gold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-luxury-gold" />
                      {selectedRide.vehicle?.licensePlate || 'VIP-777'}
                    </span>
                  </div>
                </div>

                {/* State Machine Transition Buttons */}
                <div className="pt-4 border-t border-executive-border space-y-2">
                  <span className="text-gray-400 font-bold block text-[10px] uppercase">
                    Transiciones de Estado en Tiempo Real:
                  </span>

                  {selectedRide.status === 'SOLICITADO' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRide.id, 'ASIGNADO')}
                      className="w-full py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" /> Aceptar & Asignar Unidad
                    </button>
                  )}

                  {selectedRide.status === 'ASIGNADO' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRide.id, 'EN_CAMINO')}
                      className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-black font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <Car className="w-4 h-4" /> Iniciar Ruta (En Camino al Origen)
                    </button>
                  )}

                  {selectedRide.status === 'EN_CAMINO' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRide.id, 'ABORDAJE')}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" /> Llegada a Punto de Abordaje
                    </button>
                  )}

                  {selectedRide.status === 'ABORDAJE' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRide.id, 'EN_CURSO')}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" /> Pasajero a Bordo (Iniciar Servicio)
                    </button>
                  )}

                  {selectedRide.status === 'EN_CURSO' && (
                    <button
                      onClick={() => setFinishRateRide(selectedRide)}
                      className="w-full py-3 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-luxury-gold/20 transition-all text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Finalizar Viaje, Liquidar & Calificar ⭐
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
              <p className="text-gray-400 text-xs py-8 text-center">Seleccione un viaje de la lista para gestionar.</p>
            )}
          </div>
        </div>
      </div>

      {/* Active Rides Table / Console List */}
      <div className="bg-executive-card border border-executive-border rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Car className="w-5 h-5 text-luxury-gold" />
          Servicios VIP en Ejecución con Unidades Aprobadas en Línea ({rides.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-executive-dark text-gray-400 uppercase font-bold border-b border-executive-border">
              <tr>
                <th className="p-3">ID Viaje</th>
                <th className="p-3">Pasajero</th>
                <th className="p-3">Origen ➔ Destino</th>
                <th className="p-3">Vehículo Registrado</th>
                <th className="p-3">Tarifa Dual (USD / Bs. BCV)</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-executive-border/60">
              {rides.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedRide(r)}
                  className={`hover:bg-executive-dark/50 cursor-pointer transition-colors ${
                    selectedRide?.id === r.id ? 'bg-luxury-gold/5 border-l-4 border-luxury-gold' : ''
                  }`}
                >
                  <td className="p-3 font-mono font-bold text-luxury-gold">{r.id.substring(0, 12)}</td>
                  <td className="p-3 font-medium text-white">
                    {r.passenger?.firstName || 'Pasajero VIP'} {r.passenger?.lastName || ''}
                  </td>
                  <td className="p-3">
                    <span className="text-gray-200">{r.originAddress}</span>
                    <span className="text-gray-500 mx-1">➔</span>
                    <span className="text-gray-400">{r.destinationAddress}</span>
                  </td>
                  <td className="p-3 font-semibold text-luxury-gold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {r.vehicle ? `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.licensePlate})` : 'VIP-777 (Aprobado)'}
                  </td>
                  <td className="p-3">
                    <span className="font-mono font-bold text-emerald-400 block">${Number(r.totalFare).toFixed(2)} USD</span>
                    <span className="font-mono text-[10px] text-gray-400">≈ Bs. {(Number(r.totalFare) * bcvRate).toFixed(2)}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20">
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
              ))}
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
            fetchActiveRides();
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
          onSuccess={(updatedRide) => {
            addToast(
              'success',
              '🏆 Servicio Liquidado & Calificado',
              `El viaje ha sido cerrado exitosamente y la valoración VIP fue registrada en el expediente del chofer.`,
            );
            setFinishRateRide(null);
            fetchActiveRides();
          }}
        />
      )}
    </div>
  );
}
