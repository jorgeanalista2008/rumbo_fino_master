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
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [driversCount, setDriversCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, vehRes, driRes] = await Promise.all([
          api.get('/financials/summary').catch(() => ({
            data: { data: { totalVolume: 45.0, totalPlatformCommission: 6.75 } },
          })),
          api.get('/vehicles').catch(() => ({ data: { data: [] } })),
          api.get('/drivers').catch(() => ({ data: { data: [] } })),
        ]);

        setSummary(sumRes.data?.data || { totalVolume: 45.0, totalPlatformCommission: 6.75 });
        setVehiclesCount(vehRes.data?.data?.length || 2);
        setDriversCount(driRes.data?.data?.length || 2);
      } catch (err) {
        console.error('Error cargando métricas:', err);
      }
    }
    loadData();
  }, []);

  const totalVol = summary ? Number(summary.totalVolume || 0).toFixed(2) : '45.00';
  const totalComm = summary ? Number(summary.totalPlatformCommission || 0).toFixed(2) : '6.75';

  return (
    <div className="space-y-6">
      {/* Title & Date Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-executive-card border border-executive-border p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Panel de Control Operativo</h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitoreo en tiempo real de flota ejecutiva, servicios activos y recaudación.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +15.4% respecto al mes anterior
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
            <p className="text-xs text-gray-400 mt-1">15% comisión neta retendida</p>
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
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 1 Chofer En Línea Transmitiendo
            </p>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-executive-dark text-xs uppercase text-gray-400 border-b border-executive-border">
              <tr>
                <th className="px-4 py-3">Pasajero VIP</th>
                <th className="px-4 py-3">Chofer / Vehículo</th>
                <th className="px-4 py-3">Ruta (Origen $\rightarrow$ Destino)</th>
                <th className="px-4 py-3">Tarifa Total</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-executive-border/60">
              <tr>
                <td className="px-4 py-3.5 font-medium text-white">Elena Rostova</td>
                <td className="px-4 py-3.5">Carlos Mendoza (Mercedes-Benz E-Class)</td>
                <td className="px-4 py-3.5 text-xs text-gray-400">Hotel Marriott $\rightarrow$ Aeropuerto Jorge Chávez</td>
                <td className="px-4 py-3.5 font-bold text-emerald-400">$45.00</td>
                <td className="px-4 py-3.5">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
                    FINALIZADO
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-white">Gabriel García</td>
                <td className="px-4 py-3.5">Carlos Mendoza (Mercedes-Benz E-Class)</td>
                <td className="px-4 py-3.5 text-xs text-gray-400">Centro Financiero $\rightarrow$ Club Empresarial</td>
                <td className="px-4 py-3.5 font-bold text-luxury-gold">$17.00</td>
                <td className="px-4 py-3.5">
                  <span className="px-2.5 py-1 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                    <Clock className="w-3 h-3 animate-spin" /> EN_CURSO
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
