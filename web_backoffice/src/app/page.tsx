'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Car,
  Plane,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Users,
  Building,
  CreditCard,
  Lock,
  Compass,
  Radio,
  Coins,
  Send,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function LandingPage() {
  const [bcvRate, setBcvRate] = useState<number>(875.0);
  const [quoteOrigin, setQuoteOrigin] = useState<string>('Las Mercedes, Caracas');
  const [quoteDestination, setQuoteDestination] = useState<string>('Aeropuerto Internacional de Maiquetía (CCS)');
  const [quoteCategory, setQuoteCategory] = useState<string>('SEDAN');
  const [quoteSuccess, setQuoteSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Fetch live BCV rate for display
    api
      .get('/financials/exchange-rates/current')
      .then((res) => {
        if (res.data?.data?.rate) {
          setBcvRate(Number(res.data.data.rate));
        }
      })
      .catch(() => {});
  }, []);

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSuccess(true);
    setTimeout(() => setQuoteSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-gray-100 selection:bg-luxury-gold selection:text-black font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP ANNOUNCEMENT & BCV TICKER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0B1120] via-luxury-gold/15 to-[#0B1120] border-b border-luxury-gold/20 py-2 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <span className="flex items-center gap-1.5 text-luxury-gold font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Flota Ejecutiva Rumbo Fino Venezuela 🇻🇪
          </span>
          <span className="text-gray-400 font-mono text-[11px]">
            Tasa Oficial BCV: <strong className="text-emerald-400">1 USD = Bs. {bcvRate.toFixed(2)}</strong>
          </span>
          <span className="hidden sm:inline-block text-gray-500">•</span>
          <span className="hidden sm:inline-block text-gray-300 text-[11px]">
            Atención VIP 24/7 en Caracas, Maiquetía y todo el territorio nacional
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION BAR */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#060913]/90 border-b border-executive-border/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-luxury-gold to-yellow-500 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-luxury-gold/20 transform group-hover:scale-105 transition-transform">
              RF
            </div>
            <div>
              <span className="text-lg font-black tracking-widest text-white block leading-none">
                RUMBO FINO
              </span>
              <span className="text-[10px] text-luxury-gold font-bold uppercase tracking-[0.25em]">
                VIP Executive Mobility
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-gray-300">
            <a href="#servicios" className="hover:text-luxury-gold transition-colors">
              Servicios VIP
            </a>
            <a href="#flota" className="hover:text-luxury-gold transition-colors">
              Nuestra Flota
            </a>
            <a href="#seguridad" className="hover:text-luxury-gold transition-colors">
              Blindaje & Escolta
            </a>
            <a href="#cotizador" className="hover:text-luxury-gold transition-colors">
              Cotización Rápida
            </a>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl border border-luxury-gold/40 hover:border-luxury-gold bg-luxury-gold/10 hover:bg-luxury-gold text-luxury-gold hover:text-black font-extrabold text-xs tracking-wider transition-all duration-300 flex items-center gap-2 shadow-lg shadow-luxury-gold/10"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Consola Administrativa</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Ambient Lights */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-luxury-gold/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold text-xs font-extrabold tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              <span>Líder en Seguridad y Transporte Ejecutivo en Venezuela</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Movilidad Ejecutiva &amp; Traslados VIP de{' '}
              <span className="bg-gradient-to-r from-luxury-gold via-yellow-400 to-amber-200 bg-clip-text text-transparent">
                Clase Mundial
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto font-normal">
              Flota de lujo de última generación, unidades blindadas certificadas y choferes profesionales bilingües con monitoreo satelital Mapbox en tiempo real 24/7.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#cotizador"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-luxury-gold to-yellow-500 hover:from-yellow-400 hover:to-luxury-gold text-black font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-2xl shadow-luxury-gold/25 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <span>Solicitar Traslado Inmediato</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#servicios"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-executive-card hover:bg-executive-border border border-executive-border text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Explorar Servicios</span>
              </a>
            </div>

            {/* Key Value Points Badges */}
            <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left text-xs">
              <div className="p-3.5 bg-executive-card/60 backdrop-blur-md rounded-2xl border border-executive-border/60 space-y-1">
                <Plane className="w-5 h-5 text-luxury-gold" />
                <div className="font-extrabold text-white">Maiquetía VIP</div>
                <div className="text-[11px] text-gray-400">Recepción en rampa/puerta</div>
              </div>

              <div className="p-3.5 bg-executive-card/60 backdrop-blur-md rounded-2xl border border-executive-border/60 space-y-1">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div className="font-extrabold text-white">Flota Blindada</div>
                <div className="text-[11px] text-gray-400">Nivel III, IV y escoltas</div>
              </div>

              <div className="p-3.5 bg-executive-card/60 backdrop-blur-md rounded-2xl border border-executive-border/60 space-y-1">
                <Radio className="w-5 h-5 text-sky-400" />
                <div className="font-extrabold text-white">Telemetría GPS</div>
                <div className="text-[11px] text-gray-400">Rastreo activo Mapbox GL</div>
              </div>

              <div className="p-3.5 bg-executive-card/60 backdrop-blur-md rounded-2xl border border-executive-border/60 space-y-1">
                <Coins className="w-5 h-5 text-amber-400" />
                <div className="font-extrabold text-white">Tasa Oficial BCV</div>
                <div className="text-[11px] text-gray-400">Pago Móvil y divisas</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SERVICIOS VIP */}
      {/* ========================================================================= */}
      <section id="servicios" className="py-20 bg-[#080D1A] border-y border-executive-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-black text-luxury-gold uppercase tracking-[0.25em]">
              Excelencia Operativa
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-white">
              Servicios Diseñados para Exigencias de Alto Nivel
            </p>
            <p className="text-xs sm:text-sm text-gray-400">
              Soluciones integrales de transporte para diplomáticos, empresas multinacionales y personalidades VIP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-executive-card border border-executive-border hover:border-luxury-gold/50 rounded-3xl p-8 space-y-4 transition-all duration-300 group hover:-translate-y-1 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Traslados Aeropuerto Maiquetía</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Monitoreo de vuelo en tiempo real, bienvenida personalizada en la terminal internacional o nacional y asistencia completa con equipaje directo a su destino en Caracas.
              </p>
              <ul className="text-xs text-gray-300 space-y-2 pt-2 border-t border-executive-border/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sin costo adicional por retrasos de vuelo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Agua mineral premium y Wi-Fi a bordo</span>
                </li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="bg-executive-card border border-luxury-gold/30 rounded-3xl p-8 space-y-4 transition-all duration-300 group hover:-translate-y-1 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-luxury-gold text-black font-black text-[10px] rounded-bl-xl uppercase tracking-wider">
                Exclusivo
              </div>
              <div className="w-12 h-12 rounded-2xl bg-luxury-gold text-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-luxury-gold/20">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Flota Blindada &amp; Escolta</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Unidades blindadas Nivel III y IV contra proyectiles de alta velocidad, conducidas por choferes formados en evasión, primeros auxilios y protocolos de protección ejecutiva.
              </p>
              <ul className="text-xs text-gray-300 space-y-2 pt-2 border-t border-executive-border/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Blindaje certificado internacionalmente</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Escoltas armados acreditados opcionales</span>
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="bg-executive-card border border-executive-border hover:border-luxury-gold/50 rounded-3xl p-8 space-y-4 transition-all duration-300 group hover:-translate-y-1 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Convenios Corporativos</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Líneas de crédito para empresas, estados de cuenta consolidados, trazabilidad por centro de costos y conciliación transparente en bolívares a Tasa Oficial BCV o divisas.
              </p>
              <ul className="text-xs text-gray-300 space-y-2 pt-2 border-t border-executive-border/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Factura fiscal digital seniat</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Panel web corporativo para secretaría</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SHOWROOM DE FLOTA */}
      {/* ========================================================================= */}
      <section id="flota" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
            <div>
              <h2 className="text-xs font-black text-luxury-gold uppercase tracking-[0.25em]">
                Vehículos de Élite
              </h2>
              <p className="text-3xl sm:text-4xl font-black text-white mt-1">
                La Flota Más Distinguida de Venezuela
              </p>
            </div>
            <p className="text-xs text-gray-400 max-w-md">
              Todas nuestras unidades son sometidas a inspección mecánica computarizada diaria y desinfección integral antes de cada servicio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sedan VIP */}
            <div className="bg-executive-card border border-executive-border rounded-3xl overflow-hidden group hover:border-luxury-gold/40 transition-all">
              <div className="h-52 bg-gradient-to-t from-black via-executive-dark to-[#0f172a] flex items-center justify-center p-6 relative">
                <div className="w-20 h-20 rounded-full bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold group-hover:scale-110 transition-transform">
                  <Car className="w-10 h-10" />
                </div>
                <span className="absolute bottom-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-luxury-gold border border-luxury-gold/30">
                  Capacidad: 3 Pasajeros
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-black text-white">Sedán Black VIP</h3>
                <p className="text-xs text-gray-400">
                  Toyota Camry / Mercedes-Benz Clase C / Lexus ES. Tapicería en cuero premium, climatizador bizona y confort acústico insuperable.
                </p>
                <div className="pt-3 border-t border-executive-border/60 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-bold">Ideal para:</span>
                  <span className="text-white font-semibold">Urbano &amp; Maiquetía</span>
                </div>
              </div>
            </div>

            {/* SUV Premium */}
            <div className="bg-executive-card border border-luxury-gold/40 rounded-3xl overflow-hidden group hover:border-luxury-gold transition-all shadow-xl">
              <div className="h-52 bg-gradient-to-t from-black via-executive-dark to-[#0f172a] flex items-center justify-center p-6 relative">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <span className="absolute bottom-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-emerald-400 border border-emerald-500/30">
                  Capacidad: 4-6 Pasajeros
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-black text-white">SUV Premium Executive</h3>
                <p className="text-xs text-gray-400">
                  Toyota Land Cruiser 300 / Chevrolet Tahoe / Prado TXL. Potencia, amplitud para equipaje voluminoso y seguridad en trayectos largos.
                </p>
                <div className="pt-3 border-t border-executive-border/60 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-bold">Ideal para:</span>
                  <span className="text-luxury-gold font-semibold">Ejecutivos &amp; Diplomáticos</span>
                </div>
              </div>
            </div>

            {/* Blindados */}
            <div className="bg-executive-card border border-executive-border rounded-3xl overflow-hidden group hover:border-luxury-gold/40 transition-all">
              <div className="h-52 bg-gradient-to-t from-black via-executive-dark to-[#0f172a] flex items-center justify-center p-6 relative">
                <div className="w-20 h-20 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <Shield className="w-10 h-10" />
                </div>
                <span className="absolute bottom-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-sky-400 border border-sky-500/30">
                  Nivel III / IV Balístico
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-black text-white">Unidad Blindada de Alta Seguridad</h3>
                <p className="text-xs text-gray-400">
                  Vidrios multilaminados de 38mm, run-flats en neumáticos, suelo antiexplosivo y chofer certificado en maniobras evasivas.
                </p>
                <div className="pt-3 border-t border-executive-border/60 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-bold">Ideal para:</span>
                  <span className="text-white font-semibold">Protección Personalizada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. COTIZADOR RÁPIDO & RESERVAS */}
      {/* ========================================================================= */}
      <section id="cotizador" className="py-20 bg-[#080D1A] border-t border-executive-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-executive-card border border-luxury-gold/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="text-center space-y-2 mb-8">
              <span className="text-xs font-black text-luxury-gold uppercase tracking-[0.2em]">
                Cotizador en Vivo
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Reserve su Próximo Traslado Ejecutivo
              </h2>
              <p className="text-xs text-gray-400">
                Respuesta inmediata y confirmación de disponibilidad con chofer asignado.
              </p>
            </div>

            {quoteSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>¡Solicitud enviada con éxito! Nuestro equipo de despacho le contactará en menos de 5 minutos.</span>
              </div>
            )}

            <form onSubmit={handleQuoteSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                    Punto de Recogida (Origen)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={quoteOrigin}
                      onChange={(e) => setQuoteOrigin(e.target.value)}
                      placeholder="Ej. Las Mercedes, Caracas"
                      className="w-full bg-executive-dark border border-executive-border rounded-xl py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-luxury-gold font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                    Punto de Destino
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-luxury-gold absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={quoteDestination}
                      onChange={(e) => setQuoteDestination(e.target.value)}
                      placeholder="Ej. Aeropuerto de Maiquetía"
                      className="w-full bg-executive-dark border border-executive-border rounded-xl py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-luxury-gold font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                    Categoría de Vehículo
                  </label>
                  <select
                    value={quoteCategory}
                    onChange={(e) => setQuoteCategory(e.target.value)}
                    className="w-full bg-executive-dark border border-executive-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-luxury-gold font-medium"
                  >
                    <option value="SEDAN">Sedán Black VIP ($45 USD)</option>
                    <option value="SUV">SUV Premium ($75 USD)</option>
                    <option value="ARMORED">SUV Blindada Nivel IV ($180 USD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                    Nombre o Empresa
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Dr. Alejandro Rossi"
                    className="w-full bg-executive-dark border border-executive-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-luxury-gold font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1.5 uppercase tracking-wider">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+58 414 000 0000"
                    className="w-full bg-executive-dark border border-executive-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-luxury-gold font-medium font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-luxury-gold to-yellow-500 hover:from-yellow-400 hover:to-luxury-gold text-black font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl shadow-luxury-gold/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirmar Solicitud de Traslado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-executive-border/60 py-12 bg-[#04060C] text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-luxury-gold flex items-center justify-center text-black font-black text-sm">
              RF
            </div>
            <div>
              <div className="text-white font-extrabold tracking-wider">RUMBO FINO VIP</div>
              <div className="text-[10px] text-gray-500 font-mono">Caracas • Maiquetía • Venezuela</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#servicios" className="hover:text-white transition-colors">
              Servicios
            </a>
            <a href="#flota" className="hover:text-white transition-colors">
              Flota
            </a>
            <Link href="/login" className="text-luxury-gold hover:underline font-bold">
              Consola Administrativa
            </Link>
          </div>

          <div className="text-[11px] text-gray-500">
            © {new Date().getFullYear()} Rumbo Fino. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
