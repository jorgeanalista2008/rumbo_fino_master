'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Car,
  Users,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [driversCount, setDriversCount] = useState(0);
  const [onlineDriversCount, setOnlineDriversCount] = useState(0);
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, vehRes, driRes, ridesRes] = await Promise.all([
        api.get('/financials/summary').catch(() => ({
          data: { data: { totalVolume: 0, totalPlatformCommission: 0 } },
        })),
        api.get('/vehicles').catch(() => ({ data: { data: [] } })),
        api.get('/drivers').catch(() => ({ data: { data: [] } })),
        api.get('/rides').catch(() => ({ data: { data: [] } })),
      ]);

      const vehiclesList = Array.isArray(vehRes.data?.data) ? vehRes.data.data : [];
      const driversList = Array.isArray(driRes.data?.data) ? driRes.data.data : [];
      const ridesList = Array.isArray(ridesRes.data?.data) ? ridesRes.data.data : [];

      setSummary(sumRes.data?.data || { totalVolume: 0, totalPlatformCommission: 0 });
      setVehiclesCount(vehiclesList.length);
      setDriversCount(driversList.length);
      setOnlineDriversCount(driversList.filter((d: any) => d.isOnline === true).length);
      setRecentRides(ridesList);
    } catch (err) {
      console.error('Error cargando métricas del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalVol = summary?.totalVolume !== undefined ? Number(summary.totalVolume || 0).toFixed(2) : '0.00';
  const totalComm = summary?.totalPlatformCommission !== undefined ? Number(summary.totalPlatformCommission || 0).toFixed(2) : '0.00';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FINALIZADO':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
            FINALIZADO
          </span>
        );
      case 'EN_CURSO':
        return (
          <span className="px-2.5 py-1 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 animate-spin" /> EN_CURSO
          </span>
        );
      case 'EN_CAMINO':
      case 'ABORDAJE':
      case 'ASIGNADO':
        return (
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full">
            {status}
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-full">
            CANCELADO
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 text-xs font-bold rounded-full">
            {status || 'SOLICITADO'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-executive-card border border-executive-border p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Panel de Control Operativo</h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitoreo en tiempo real de flota ejecutiva, servicios activos y recaudación.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-executive-dark hover:bg-white/5 border border-executive-border text-gray-300 hover:text-white rounded-xl transition-all"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-luxury-gold' : ''}`} />
          </button>
          <Link
            href="/dashboard/vehicles"
            className="px-4 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-bold text-xs rounded-xl shadow-lg shadow-luxury-gold/20 transition-all"
          >
            VER REVISIÓN DE DOCUMENTOS
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Volume */}
        <div className="bg-executive-card border border-executive-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Volumen Transaccionado</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">${totalVol}</div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-luxury-gold" /> Recaudación acumulada
            </p>
          </div>
        </div>

        {/* Platform Commission */}
        <div className="bg-executive-card border border-executive-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Comisiones de Plataforma</span>
            <div className="p-2.5 bg-luxury-gold/10 text-luxury-gold rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-luxury-gold">${totalComm}</div>
            <p className="text-xs text-gray-400 mt-1">15% comisión neta retenida</p>
          </div>
        </div>

        {/* Flota de Vehículos */}
        <div className="bg-executive-card border border-executive-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Flota de Vehículos</span>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{vehiclesCount} Unidades</div>
            <p className="text-xs text-gray-400 mt-1">Sedán & SUV VIP Registrados</p>
          </div>
        </div>

        {/* Choferes Registrados */}
        <div className="bg-executive-card border border-executive-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Choferes Ejecutivos</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{driversCount} Choferes</div>
            {onlineDriversCount > 0 ? (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                {onlineDriversCount} {onlineDriversCount === 1 ? 'Chofer En Línea' : 'Choferes En Línea'}
              </p>
            ) : (
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />
                0 Choferes En Línea (Desconectados)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-executive-card border border-executive-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Últimos Servicios Ejecutivos</h2>
            <p className="text-xs text-gray-400">Estado de solicitudes de traslado VIP</p>
          </div>
          <Link
            href="/dashboard/dispatch"
            className="text-xs font-bold text-luxury-gold hover:underline flex items-center gap-1"
          >
            Ver Mapa en Vivo <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-luxury-gold animate-spin mb-3" />
            <p className="text-xs text-gray-400">Consultando servicios en la base de datos...</p>
          </div>
        ) : recentRides.length === 0 ? (
          <div className="py-14 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-executive-border flex items-center justify-center text-gray-400 mb-3">
              <Car className="w-7 h-7 text-luxury-gold/70" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Sin Servicios Registrados</h3>
            <p className="text-xs text-gray-400 max-w-md mb-5 leading-relaxed">
              La base de datos se encuentra limpia. Los nuevos traslados ejecutivos solicitados desde el cotizador de la web principal o creados desde la consola de despacho aparecerán aquí en tiempo real.
            </p>
            <Link
              href="/dashboard/dispatch"
              className="inline-flex items-center gap-2 px-4 py-2 bg-luxury-gold/10 hover:bg-luxury-gold text-luxury-gold hover:text-black border border-luxury-gold/30 rounded-xl text-xs font-bold transition-all"
            >
              Ir a Despacho de Flota <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-executive-dark text-xs uppercase text-gray-400 border-b border-executive-border">
                <tr>
                  <th className="px-4 py-3">Pasajero VIP</th>
                  <th className="px-4 py-3">Chofer / Vehículo</th>
                  <th className="px-4 py-3">Ruta (Origen → Destino)</th>
                  <th className="px-4 py-3">Tarifa Total</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-executive-border/60">
                {recentRides.slice(0, 5).map((ride: any) => {
                  const passengerName = ride.passenger
                    ? `${ride.passenger.firstName || ''} ${ride.passenger.lastName || ''}`.trim()
                    : (ride.guestName || 'Pasajero VIP');
                  const driverInfo = ride.driver?.user
                    ? `${ride.driver.user.firstName || ''} ${ride.driver.user.lastName || ''}`.trim()
                    : 'Sin asignar';
                  const vehicleInfo = ride.vehicle
                    ? ` (${ride.vehicle.brand} ${ride.vehicle.model})`
                    : '';
                  const routeStr = `${ride.originAddress || 'Origen'} → ${ride.destinationAddress || 'Destino'}`;
                  const fareStr = `$${Number(ride.totalFare || 0).toFixed(2)}`;

                  return (
                    <tr key={ride.id} className="hover:bg-executive-dark/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-white">{passengerName}</td>
                      <td className="px-4 py-3.5 text-gray-300">
                        {driverInfo}{vehicleInfo}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 max-w-xs truncate" title={routeStr}>
                        {routeStr}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-luxury-gold">{fareStr}</td>
                      <td className="px-4 py-3.5">{getStatusBadge(ride.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
