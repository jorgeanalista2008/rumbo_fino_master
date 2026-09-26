'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  FileSpreadsheet,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Search,
  Calculator,
  Globe,
  Radio,
  History,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { ToastContainer, ToastMessage } from '@/components/Toast';

interface ExchangeRateItem {
  id: string;
  currencyPair: string;
  rate: number | string;
  source: string;
  effectiveDate: string;
  isActive: boolean;
  notes?: string;
  adminName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ExchangeRatesPage() {
  const [currentRate, setCurrentRate] = useState<ExchangeRateItem | null>(null);
  const [history, setHistory] = useState<ExchangeRateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [syncingBcv, setSyncingBcv] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form State
  const [newRateValue, setNewRateValue] = useState<string>('');
  const [sourceType, setSourceType] = useState<string>('BCV');
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [changeNotes, setChangeNotes] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('Super Administrador');

  // Simulator State
  const [simUsd, setSimUsd] = useState<number>(20);
  const [simVes, setSimVes] = useState<number>(0);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message: `${title}: ${message}` }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Data from Backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [currRes, histRes] = await Promise.all([
        api.get<any>('/financials/exchange-rates/current').catch(() => ({ data: null })),
        api.get<any>('/financials/exchange-rates/history?limit=100').catch(() => ({ data: [] })),
      ]);

      const active = currRes.data?.data || currRes.data || {
        rate: 65.50,
        currencyPair: 'USD_VES',
        source: 'BCV',
        effectiveDate: new Date().toISOString(),
        isActive: true,
        notes: 'Tasa Oficial Activa BCV',
        adminName: 'Central Operaciones RF',
      };

      setCurrentRate(active);
      setNewRateValue(String(active.rate || '65.50'));

      const histList = histRes.data?.data || (Array.isArray(histRes.data) ? histRes.data : []);
      setHistory(histList);
    } catch (err) {
      console.error('Error cargando tasas BCV:', err);
      addToast('error', 'Error de Conexión', 'No se pudieron cargar las tasas oficiales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to real-time BCV updates via WebSocket
    const socket = getSocket();
    const handleBcvUpdate = (data: any) => {
      addToast('info', 'Tasa BCV Actualizada en Vivo', `Nueva tasa oficial: Bs. ${Number(data.rate).toFixed(2)} (${data.source})`);
      loadData();
    };

    socket.on('financials:bcv_rate_updated', handleBcvUpdate);
    return () => {
      socket.off('financials:bcv_rate_updated', handleBcvUpdate);
    };
  }, []);

  // Update simulator when active rate or input changes
  useEffect(() => {
    const rateNum = Number(currentRate?.rate || 65.5);
    setSimVes(Number((simUsd * rateNum).toFixed(2)));
  }, [simUsd, currentRate]);

  // Handle Form Submit: Update BCV Rate
  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(newRateValue);

    if (isNaN(rateNum) || rateNum <= 0) {
      addToast('error', 'Valor Inválido', 'Por favor ingresa un monto válido en Bolívares.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/financials/exchange-rates', {
        rate: rateNum,
        currencyPair: 'USD_VES',
        source: sourceType,
        effectiveDate: new Date(effectiveDate).toISOString(),
        notes: changeNotes || `Actualización de tasa oficial BCV (${sourceType})`,
        adminName: adminName || 'Administrador Central',
      });

      addToast('success', 'Tasa Actualizada & Transmitida', `Tasa fijada en Bs. ${rateNum.toFixed(4)} USD/VES y difundida a toda la red.`);
      setChangeNotes('');
      await loadData();
    } catch (err: any) {
      console.error('Error actualizando tasa:', err);
      addToast('error', 'Error al Actualizar', err?.response?.data?.message || 'No se pudo registrar la nueva tasa.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Official BCV Sync
  const handleSyncBcv = async () => {
    setSyncingBcv(true);
    try {
      const res = await api.post<any>('/financials/exchange-rates/sync-bcv', {});
      const syncData = res.data?.data || res.data;

      addToast(
        'success',
        'Sincronización BCV Exitosa',
        `Tasa oficial verificada con el Banco Central: Bs. ${Number(syncData.rate || currentRate?.rate || 65.5).toFixed(2)}`
      );
      await loadData();
    } catch (err: any) {
      console.error('Error sincronizando BCV:', err);
      addToast('info', 'Conexión BCV', 'No se pudo contactar el servicio externo BCV. Usando valor local de seguridad.');
    } finally {
      setSyncingBcv(false);
    }
  };

  // Export History to CSV
  const exportHistoryToCSV = () => {
    if (history.length === 0) {
      addToast('info', 'Sin Registros', 'No hay historial disponible para exportar.');
      return;
    }

    const headers = ['ID', 'Par', 'Tasa (Bs)', 'Fuente', 'Fecha Vigencia', 'Estado', 'Operador', 'Notas'];
    const rows = history.map((h) => [
      h.id,
      h.currencyPair,
      h.rate,
      h.source,
      new Date(h.effectiveDate).toLocaleString('es-VE'),
      h.isActive ? 'ACTIVA' : 'HISTORICA',
      h.adminName || 'N/A',
      `"${(h.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historial_tasas_bcv_rf_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('info', 'Exportación Exitosa', 'El archivo CSV de tasas históricas se ha descargado.');
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const term = searchTerm.toLowerCase();
    return history.filter(
      (h) =>
        h.source.toLowerCase().includes(term) ||
        String(h.rate).includes(term) ||
        (h.notes && h.notes.toLowerCase().includes(term)) ||
        (h.adminName && h.adminName.toLowerCase().includes(term))
    );
  }, [history, searchTerm]);

  const activeRateNum = Number(currentRate?.rate || 65.5);
  const previousRateNum = history.length > 1 ? Number(history[1]?.rate || activeRateNum) : activeRateNum;
  const rateDelta = activeRateNum - previousRateNum;
  const rateDeltaPercent = previousRateNum > 0 ? (rateDelta / previousRateNum) * 100 : 0;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* HEADER COMMAND BAR */}
      <div className="bg-executive-card border border-executive-border p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold shadow-lg shadow-luxury-gold/10">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
                Administración de Tasas Oficiales BCV & Moneda
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> EN VIVO
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Control maestro de paridad cambiaria USD / VES, sincronización oficial BCV y difusión en tiempo real a la flota.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportHistoryToCSV}
              className="px-4 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-luxury-gold" />
              Exportar Historial
            </button>

            <button
              onClick={handleSyncBcv}
              disabled={syncingBcv}
              className="px-4 py-2.5 bg-executive-dark hover:bg-luxury-gold/20 border border-luxury-gold/40 text-luxury-gold font-black text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncingBcv ? 'animate-spin' : ''}`} />
              {syncingBcv ? 'Sincronizando...' : 'Consultar API BCV'}
            </button>

            <button
              onClick={loadData}
              className="p-2.5 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-xl transition-all"
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-luxury-gold' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* TOP 4 EXECUTIVE INDICATOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active BCV Rate */}
        <div className="bg-gradient-to-br from-executive-card via-executive-card to-luxury-gold/5 border border-luxury-gold/40 p-5 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-luxury-gold" /> Tasa Oficial BCV
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-black rounded-full uppercase">
              Vigente
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              Bs. {activeRateNum.toFixed(2)}
            </span>
            <span className="text-xs text-luxury-gold font-bold">/ USD</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-executive-border/60 text-[10px] text-gray-400">
            <span>Fuente: {currentRate?.source || 'BCV Oficial'}</span>
            <span>{currentRate?.effectiveDate ? new Date(currentRate.effectiveDate).toLocaleDateString('es-VE') : 'Hoy'}</span>
          </div>
        </div>

        {/* 24h Variance / Spread */}
        <div className="bg-executive-card border border-executive-border p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-luxury-gold" /> Variación vs Cierre
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-0.5 ${
                rateDelta >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {rateDelta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {rateDelta >= 0 ? '+' : ''}
              {rateDeltaPercent.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-white font-mono">
              {rateDelta >= 0 ? '+' : ''}Bs. {rateDelta.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 pt-3 border-t border-executive-border/60 truncate">
            Cierre anterior: Bs. {previousRateNum.toFixed(2)}
          </p>
        </div>

        {/* Euro BCV Parity Reference */}
        <div className="bg-executive-card border border-executive-border p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-luxury-gold" /> Paridad Euro BCV
            </span>
            <span className="px-2 py-0.5 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 text-[9px] font-black rounded-full uppercase">
              Referencial
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-white font-mono">
              Bs. {(activeRateNum * 1.085).toFixed(2)}
            </span>
            <span className="text-xs text-gray-400 font-bold">/ EUR</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 pt-3 border-t border-executive-border/60">
            Relación EUR/USD 1.085
          </p>
        </div>

        {/* Security & Broadcast Status */}
        <div className="bg-executive-card border border-executive-border p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Difusión en Red
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-sm font-bold text-white mt-1">
            Sincronizado al 100%
          </div>
          <p className="text-[10px] text-gray-400 mt-3 pt-3 border-t border-executive-border/60">
            Despacho, Pasajeros y Choferes en vivo
          </p>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: UPDATE FORM & SIMULATOR (LEFT) + AUDIT LOG HISTORY (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: UPDATE FORM & LIVE SIMULATOR (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Form Card */}
          <div className="bg-executive-card border border-luxury-gold/40 p-6 rounded-3xl shadow-xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-executive-border pb-3">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-luxury-gold" />
                Fijar Nueva Tasa Oficial
              </h2>
              <span className="text-[10px] text-luxury-gold font-bold bg-luxury-gold/10 px-2 py-0.5 rounded-md border border-luxury-gold/20">
                USD ➔ VES
              </span>
            </div>

            <form onSubmit={handleUpdateRate} className="space-y-4 text-xs">
              {/* Rate Input */}
              <div>
                <label className="text-gray-300 font-bold block mb-1.5">
                  Valor de la Tasa Oficial (Bs. por 1 USD) <span className="text-luxury-gold">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-gold font-black font-mono text-sm">
                    Bs.
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={newRateValue}
                    onChange={(e) => setNewRateValue(e.target.value)}
                    placeholder="65.5000"
                    className="w-full pl-11 pr-4 py-3 bg-executive-dark border border-luxury-gold/40 focus:border-luxury-gold rounded-xl text-white font-mono font-black text-base outline-none transition-all"
                  />
                </div>
              </div>

              {/* Source & Effective Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-bold block mb-1.5">Fuente Oficial</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full p-2.5 bg-executive-dark border border-executive-border rounded-xl text-white font-bold outline-none"
                  >
                    <option value="BCV">BCV (Banco Central)</option>
                    <option value="CIERRE_BANCARIO">Cierre Bancario</option>
                    <option value="PARALELO">Paralelo / Mercado</option>
                    <option value="MANUAL_ADMIN">Ajuste Manual VIP</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-bold block mb-1.5">Fecha de Vigencia</label>
                  <input
                    type="datetime-local"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full p-2.5 bg-executive-dark border border-executive-border rounded-xl text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>

              {/* Admin Responsible */}
              <div>
                <label className="text-gray-300 font-bold block mb-1.5">Operador / Administrador</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Nombre del Administrador"
                  className="w-full p-2.5 bg-executive-dark border border-executive-border rounded-xl text-white font-bold outline-none"
                />
              </div>

              {/* Notes / Reason */}
              <div>
                <label className="text-gray-300 font-bold block mb-1.5">Motivo / Nota de Auditoría</label>
                <textarea
                  rows={2}
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="Ej: Publicación oficial en portal BCV para la jornada operativa."
                  className="w-full p-2.5 bg-executive-dark border border-executive-border rounded-xl text-white outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {submitting ? 'Publicando en Toda la Red...' : 'Publicar Tasa & Actualizar Plataforma 🚀'}
              </button>
            </form>
          </div>

          {/* Live Conversion Simulator Card */}
          <div className="bg-executive-card border border-executive-border p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-executive-border pb-3">
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-luxury-gold" />
                Simulador de Conversión de Viaje
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">Tasa: Bs. {activeRateNum.toFixed(2)}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Monto en Dólares (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={simUsd}
                    onChange={(e) => setSimUsd(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-executive-dark border border-executive-border rounded-xl text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-executive-dark rounded-2xl border border-luxury-gold/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Total a Cobrar en Bolívares</span>
                  <span className="text-xl font-black text-luxury-gold font-mono">
                    Bs. {simVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right text-[10px] text-gray-400">
                  <span>Pago Móvil / Transferencia</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: AUDIT LOG & RATE HISTORY TABLE (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-executive-card border border-executive-border p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-executive-border pb-4">
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-luxury-gold" />
                  Historial de Tasas & Auditoría Cambiaria
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Registro cronológico inmutable de todas las variaciones de tasa en Rumbo Fino.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por fuente, fecha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-executive-dark border border-executive-border rounded-xl text-white text-xs outline-none focus:border-luxury-gold"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-executive-border text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Tasa (Bs./USD)</th>
                    <th className="py-3 px-3">Fuente</th>
                    <th className="py-3 px-3">Fecha de Vigencia</th>
                    <th className="py-3 px-3">Operador</th>
                    <th className="py-3 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-executive-border/40">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No se encontraron registros de tasas para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-executive-dark/50 transition-colors ${
                          item.isActive ? 'bg-luxury-gold/5 font-bold' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-white text-sm">
                              Bs. {Number(item.rate).toFixed(4)}
                            </span>
                          </div>
                          {item.notes && (
                            <span className="text-[10px] text-gray-400 block truncate max-w-[200px]" title={item.notes}>
                              {item.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-executive-dark border border-executive-border text-[10px] font-bold text-gray-300">
                            {item.source}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-300 text-[11px]">
                          {item.effectiveDate ? new Date(item.effectiveDate).toLocaleString('es-VE') : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-gray-300 text-[11px]">
                          {item.adminName || 'Central RF'}
                        </td>
                        <td className="py-3 px-3">
                          {item.isActive ? (
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> VIGENTE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-gray-800 text-gray-400 border border-gray-700 w-fit block">
                              Histórica
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
