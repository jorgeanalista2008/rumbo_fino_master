'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Navigation,
  RefreshCw,
  Layers,
  Crosshair,
  Check,
  AlertCircle,
  MessageCircle,
  DollarSign,
  ArrowUpDown,
  LocateFixed,
  Route,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import OpenStreetMap, { MarkerItem } from '@/components/OpenStreetMap';
import { fetchMapboxRoute, reverseGeocodeMapbox } from '@/lib/mapbox';

interface LocationPreset {
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  icon: string;
}

const POPULAR_LOCATIONS: LocationPreset[] = [
  {
    name: 'Aeropuerto Internacional de Maiquetía (CCS)',
    shortName: 'Aeropuerto CCS',
    lat: 10.6033,
    lng: -66.9906,
    icon: '✈️',
  },
  {
    name: 'Las Mercedes (Zona Gourmet & Financiera), Caracas',
    shortName: 'Las Mercedes',
    lat: 10.4795,
    lng: -66.8624,
    icon: '🍸',
  },
  {
    name: 'Altamira / Plaza Francia, Chacao',
    shortName: 'Altamira',
    lat: 10.4965,
    lng: -66.8529,
    icon: '🏛️',
  },
  {
    name: 'El Rosal / Centro Financiero de Caracas',
    shortName: 'El Rosal',
    lat: 10.4901,
    lng: -66.8687,
    icon: '💼',
  },
  {
    name: 'La Castellana / Centro San Ignacio',
    shortName: 'La Castellana',
    lat: 10.4998,
    lng: -66.8552,
    icon: '🏢',
  },
  {
    name: 'Hotel Humboldt / Warairarepano (El Ávila)',
    shortName: 'Hotel Humboldt',
    lat: 10.5398,
    lng: -66.8837,
    icon: '⛰️',
  },
  {
    name: 'La Lagunita Country Club, El Hatillo',
    shortName: 'La Lagunita',
    lat: 10.4285,
    lng: -66.8042,
    icon: '⛳',
  },
  {
    name: 'Valencia (Urb. Guaparo / El Viñedo), Carabobo',
    shortName: 'Valencia',
    lat: 10.2201,
    lng: -68.0062,
    icon: '🏭',
  },
];

interface FareTier {
  id: string;
  name: string;
  models: string;
  passengers: number;
  luggage: string;
  baseFare: number;
  perKm: number;
  perMinute: number;
  airportMinFare: number;
  badge: string;
}

const FARE_TIERS: Record<string, FareTier> = {
  SEDAN: {
    id: 'SEDAN',
    name: 'Sedán Black VIP',
    models: 'Toyota Camry / Mercedes-Benz C-Class',
    passengers: 3,
    luggage: '2 Maletas Grandes',
    baseFare: 20.0,
    perKm: 1.5,
    perMinute: 0.2,
    airportMinFare: 45.0,
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  SUV: {
    id: 'SUV',
    name: 'SUV Premium Executive',
    models: 'Land Cruiser 300 / Tahoe / Prado TXL',
    passengers: 5,
    luggage: '4 Maletas Grandes',
    baseFare: 35.0,
    perKm: 2.2,
    perMinute: 0.3,
    airportMinFare: 75.0,
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  ARMORED: {
    id: 'ARMORED',
    name: 'SUV Blindada Nivel VR7',
    models: 'Suburban / Escalade Armor Nivel IV Balístico',
    passengers: 4,
    luggage: '3 Maletas Grandes',
    baseFare: 80.0,
    perKm: 4.5,
    perMinute: 0.6,
    airportMinFare: 180.0,
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
};

export default function LandingPage() {
  const [bcvRate, setBcvRate] = useState<number>(875.0);

  // Cotizador State
  const [quoteOrigin, setQuoteOrigin] = useState<string>('Las Mercedes (Zona Gourmet & Financiera), Caracas');
  const [quoteDestination, setQuoteDestination] = useState<string>('Aeropuerto Internacional de Maiquetía (CCS)');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number }>({
    lat: 10.4795,
    lng: -66.8624,
  });
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number }>({
    lat: 10.6033,
    lng: -66.9906,
  });
  const [quoteCategory, setQuoteCategory] = useState<string>('SEDAN');
  const [mapSelectionMode, setMapSelectionMode] = useState<'pickup' | 'destination' | 'none'>('none');
  const [routePolyline, setRoutePolyline] = useState<Array<[number, number]>>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(31.4);
  const [routeDurationMin, setRouteDurationMin] = useState<number>(42);
  const [calculatingRoute, setCalculatingRoute] = useState<boolean>(false);

  // Passenger form
  const [passengerName, setPassengerName] = useState<string>('');
  const [passengerPhone, setPassengerPhone] = useState<string>('');
  const [passengerNotes, setPassengerNotes] = useState<string>('');
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

  // Route Calculation Handler
  const calculateRouteBetween = useCallback(
    async (orig: { lat: number; lng: number }, dest: { lat: number; lng: number }) => {
      setCalculatingRoute(true);
      try {
        const routeData = await fetchMapboxRoute([orig.lng, orig.lat], [dest.lng, dest.lat]);
        if (routeData && routeData.coordinates.length > 0) {
          // Convert GeoJSON [lng, lat] to [lat, lng] for MapboxMap polyline
          const poly: Array<[number, number]> = routeData.coordinates.map(([lng, lat]) => [lat, lng]);
          setRoutePolyline(poly);
          setRouteDistanceKm(routeData.distanceKm);
          setRouteDurationMin(routeData.durationMinutes);
        }
      } catch (err) {
        console.warn('Error calculando ruta en cotizador:', err);
      } finally {
        setCalculatingRoute(false);
      }
    },
    []
  );

  useEffect(() => {
    // Initial route computation for Las Mercedes -> Maiquetía
    calculateRouteBetween(originCoords, destinationCoords);
  }, [calculateRouteBetween]);

  // Handle Preset Select
  const handleSelectPreset = (preset: LocationPreset, target: 'origin' | 'destination') => {
    if (target === 'origin') {
      setOriginCoords({ lat: preset.lat, lng: preset.lng });
      setQuoteOrigin(preset.name);
      calculateRouteBetween({ lat: preset.lat, lng: preset.lng }, destinationCoords);
    } else {
      setDestinationCoords({ lat: preset.lat, lng: preset.lng });
      setQuoteDestination(preset.name);
      calculateRouteBetween(originCoords, { lat: preset.lat, lng: preset.lng });
    }
  };

  // Handle Map Click Selection
  const handleMapLocationSelect = (
    lat: number,
    lng: number,
    mode: 'pickup' | 'destination',
    placeName?: string
  ) => {
    const formatted = placeName || `Punto en Mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    if (mapSelectionMode === 'pickup' || mode === 'pickup') {
      setOriginCoords({ lat, lng });
      setQuoteOrigin(formatted);
      calculateRouteBetween({ lat, lng }, destinationCoords);
      setMapSelectionMode('destination');
    } else {
      setDestinationCoords({ lat, lng });
      setQuoteDestination(formatted);
      calculateRouteBetween(originCoords, { lat, lng });
      setMapSelectionMode('none');
    }
  };

  // Swap Locations
  const handleSwapLocations = () => {
    const tempCoords = originCoords;
    const tempName = quoteOrigin;
    setOriginCoords(destinationCoords);
    setQuoteOrigin(quoteDestination);
    setDestinationCoords(tempCoords);
    setQuoteDestination(tempName);
    calculateRouteBetween(destinationCoords, tempCoords);
  };

  // Map Markers
  const mapMarkers: MarkerItem[] = useMemo(() => {
    return [
      {
        id: 'cotizador-origin',
        lat: originCoords.lat,
        lng: originCoords.lng,
        title: 'Punto de Recogida',
        subtitle: quoteOrigin,
        type: 'pickup',
      },
      {
        id: 'cotizador-destination',
        lat: destinationCoords.lat,
        lng: destinationCoords.lng,
        title: 'Destino Ejecutivo',
        subtitle: quoteDestination,
        type: 'destination',
      },
    ];
  }, [originCoords, destinationCoords, quoteOrigin, quoteDestination]);

  // Fare Calculation
  const isAirportRoute = useMemo(() => {
    const fullText = `${quoteOrigin} ${quoteDestination}`.toLowerCase();
    return fullText.includes('maiquet') || fullText.includes('ccs') || fullText.includes('aeropuerto');
  }, [quoteOrigin, quoteDestination]);

  const activeTier = FARE_TIERS[quoteCategory] || FARE_TIERS.SEDAN;
  const estimatedFareUsd = useMemo(() => {
    const base = activeTier.baseFare;
    const distanceCost = routeDistanceKm * activeTier.perKm;
    const timeCost = routeDurationMin * activeTier.perMinute;
    const total = base + distanceCost + timeCost;
    if (isAirportRoute) {
      return Math.max(total, activeTier.airportMinFare);
    }
    return Math.max(total, activeTier.baseFare);
  }, [activeTier, routeDistanceKm, routeDurationMin, isAirportRoute]);

  const estimatedFareBcv = useMemo(() => {
    return estimatedFareUsd * bcvRate;
  }, [estimatedFareUsd, bcvRate]);

  // WhatsApp Booking
  const handleWhatsAppBooking = () => {
    const msg =
      `*SOLICITUD DE TRASLADO VIP - RUMBO FINO*\n\n` +
      `🚗 *Vehículo:* ${activeTier.name} (${activeTier.models})\n` +
      `📍 *Punto de Inicio:* ${quoteOrigin}\n` +
      `🏁 *Punto de Llegada:* ${quoteDestination}\n` +
      `📏 *Distancia:* ${routeDistanceKm.toFixed(1)} km (~${routeDurationMin} min de trayecto)\n` +
      `💵 *Tarifa Estimada:* $${estimatedFareUsd.toFixed(2)} USD (Bs. ${estimatedFareBcv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})\n` +
      (passengerName ? `👤 *Titular / Empresa:* ${passengerName}\n` : '') +
      (passengerPhone ? `📞 *Contacto:* ${passengerPhone}\n` : '') +
      (passengerNotes ? `📝 *Observaciones:* ${passengerNotes}\n` : '') +
      `\nSolicito confirmación de reserva inmediata con protocolo ejecutivo.`;

    const url = `https://wa.me/584140000000?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSuccess(true);
    setTimeout(() => setQuoteSuccess(false), 6000);
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
      {/* 6. COTIZADOR INTERACTIVO CON MAPBOX GL & ESTIMACIÓN DE TARIFA */}
      {/* ========================================================================= */}
      <section id="cotizador" className="py-20 bg-[#080D1A] border-t border-executive-border/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black text-luxury-gold uppercase tracking-[0.25em] flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> MAPBOX VECTOR GL • ESTIMADOR DE RUTA Y TARIFA EN TIEMPO REAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Calculadora de Rutas &amp; Cotizador Ejecutivo VIP
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Establezca su punto de inicio y punto de llegada directamente en el mapa satelital o explore nuestras ubicaciones frecuentes para calcular la distancia de viaje, tiempo estimado y costo oficial en USD y Bolívares BCV.
            </p>
          </div>

          {/* Interactive Cotizador Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: MAPBOX INTERACTIVE MAP & PRESETS (7 COLS) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Map Action Bar */}
              <div className="bg-executive-card border border-executive-border rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-luxury-gold" /> Marcar en Mapa:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMapSelectionMode((prev) => (prev === 'pickup' ? 'none' : 'pickup'))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      mapSelectionMode === 'pickup'
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 animate-pulse'
                        : 'bg-executive-dark hover:bg-executive-border text-gray-300 border border-emerald-500/30'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Punto de Inicio (A)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMapSelectionMode((prev) => (prev === 'destination' ? 'none' : 'destination'))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      mapSelectionMode === 'destination'
                        ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20 animate-pulse'
                        : 'bg-executive-dark hover:bg-executive-border text-gray-300 border border-luxury-gold/30'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-luxury-gold" />
                    Punto de Llegada (B)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="px-3 py-1.5 bg-executive-dark hover:bg-executive-border text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-executive-border flex items-center gap-1.5 transition-colors"
                  title="Invertir Origen y Destino"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-luxury-gold" />
                  <span>Invertir</span>
                </button>
              </div>

              {/* Mapbox Map Container */}
              <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border-2 border-luxury-gold/40 shadow-2xl bg-executive-dark">
                <OpenStreetMap
                  centerLat={originCoords.lat}
                  centerLng={originCoords.lng}
                  zoom={11}
                  markers={mapMarkers}
                  routePolyline={routePolyline}
                  selectionMode={mapSelectionMode}
                  onLocationSelect={handleMapLocationSelect}
                  className="w-full h-full min-h-[520px]"
                />

                {/* Helper prompt banner overlay */}
                {mapSelectionMode !== 'none' && (
                  <div className="absolute top-4 inset-x-4 mx-auto max-w-md bg-black/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-luxury-gold shadow-2xl text-center text-xs font-bold text-white flex items-center justify-between gap-3 z-30 animate-bounce">
                    <span className="flex items-center gap-2">
                      <LocateFixed className="w-4 h-4 text-luxury-gold animate-spin" />
                      {mapSelectionMode === 'pickup'
                        ? 'Haz clic en el mapa para situar el Punto de Inicio (Origen)'
                        : 'Haz clic en el mapa para situar el Punto de Llegada (Destino)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMapSelectionMode('none')}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-gray-300 text-[10px] rounded-lg"
                    >
                      Listo
                    </button>
                  </div>
                )}

                {/* Calculating Route Spinner Overlay */}
                {calculatingRoute && (
                  <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-luxury-gold/40 flex items-center gap-2 z-20 text-xs font-bold text-luxury-gold shadow-xl">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculando ruta Mapbox v5...</span>
                  </div>
                )}
              </div>

              {/* VIP Popular Locations Chips */}
              <div className="bg-executive-card/80 border border-executive-border rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-luxury-gold" /> Ubicaciones VIP Más Frecuentes (Clic para seleccionar):
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">1-Clic Origen / Destino</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LOCATIONS.map((preset) => {
                    const isOrigin = originCoords.lat === preset.lat && originCoords.lng === preset.lng;
                    const isDest = destinationCoords.lat === preset.lat && destinationCoords.lng === preset.lng;

                    return (
                      <div
                        key={preset.name}
                        className={`group px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                          isOrigin
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 ring-1 ring-emerald-500/30'
                            : isDest
                            ? 'bg-luxury-gold/10 border-luxury-gold/50 text-luxury-gold ring-1 ring-luxury-gold/30'
                            : 'bg-executive-dark border-executive-border text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.shortName}</span>
                        <div className="flex items-center gap-1 pl-1 border-l border-executive-border/60">
                          <button
                            type="button"
                            onClick={() => handleSelectPreset(preset, 'origin')}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black font-bold transition-colors"
                            title="Fijar como Punto de Inicio"
                          >
                            Origen
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPreset(preset, 'destination')}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-luxury-gold/20 text-luxury-gold hover:bg-luxury-gold hover:text-black font-bold transition-colors"
                            title="Fijar como Punto de Llegada"
                          >
                            Destino
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: TARIFF ESTIMATION & BOOKING CARD (5 COLS) */}
            <div className="lg:col-span-5 bg-executive-card border border-luxury-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-executive-border pb-4">
                <div>
                  <span className="text-[10px] font-black text-luxury-gold uppercase tracking-wider">
                    Tarifa Oficial Transparente
                  </span>
                  <h3 className="text-xl font-black text-white">Detalle de Cotización</h3>
                </div>
                <div className="p-2 rounded-xl bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {quoteSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-3 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>
                    ¡Solicitud de traslado recibida con éxito! Nuestro despacho VIP le contactará en menos de 5 minutos.
                  </span>
                </div>
              )}

              {/* Origin & Destination Inputs */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Punto de Inicio (Origen)
                    </label>
                    <button
                      type="button"
                      onClick={() => setMapSelectionMode('pickup')}
                      className="text-[10px] text-emerald-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Crosshair className="w-3 h-3" /> Clic en mapa
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={quoteOrigin}
                      onChange={(e) => setQuoteOrigin(e.target.value)}
                      placeholder="Ej. Las Mercedes, Caracas"
                      className="w-full pl-9 pr-3 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-medium outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-luxury-gold" />
                      Punto de Llegada (Destino)
                    </label>
                    <button
                      type="button"
                      onClick={() => setMapSelectionMode('destination')}
                      className="text-[10px] text-luxury-gold hover:underline font-bold flex items-center gap-1"
                    >
                      <Crosshair className="w-3 h-3" /> Clic en mapa
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-luxury-gold absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={quoteDestination}
                      onChange={(e) => setQuoteDestination(e.target.value)}
                      placeholder="Ej. Aeropuerto Internacional de Maiquetía"
                      className="w-full pl-9 pr-3 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-medium outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Category Selector */}
              <div className="space-y-2">
                <label className="text-gray-300 font-bold block uppercase tracking-wider text-[11px]">
                  Seleccionar Categoría de Vehículo
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(FARE_TIERS).map((tier) => {
                    const isSelected = quoteCategory === tier.id;
                    return (
                      <button
                        type="button"
                        key={tier.id}
                        onClick={() => setQuoteCategory(tier.id)}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex items-center justify-between ${
                          isSelected
                            ? 'bg-executive-dark border-luxury-gold ring-1 ring-luxury-gold shadow-lg shadow-luxury-gold/10'
                            : 'bg-executive-dark/50 border-executive-border hover:border-gray-600'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-xs">{tier.name}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${tier.badge}`}>
                              {tier.passengers} Pasajeros
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 line-clamp-1">{tier.models}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-luxury-gold">
                            ${tier.baseFare.toFixed(0)}+
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fare & Route Live Calculation Box */}
              <div className="bg-gradient-to-br from-executive-dark via-[#0c1427] to-black border-2 border-luxury-gold/50 rounded-2xl p-5 space-y-4 shadow-xl">
                {/* Distance & Duration Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/60 p-2.5 rounded-xl border border-white/10 flex items-center gap-2">
                    <Route className="w-4 h-4 text-luxury-gold shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Distancia</span>
                      <strong className="text-white font-mono">{routeDistanceKm.toFixed(1)} km</strong>
                    </div>
                  </div>
                  <div className="bg-black/60 p-2.5 rounded-xl border border-white/10 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-luxury-gold shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Tiempo Aprox.</span>
                      <strong className="text-white font-mono">~{routeDurationMin} min</strong>
                    </div>
                  </div>
                </div>

                {/* Big Price Display */}
                <div className="pt-2 border-t border-luxury-gold/20 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">
                      Tarifa Total Estimada:
                    </span>
                    <div className="text-3xl font-black text-luxury-gold tracking-tight">
                      ${estimatedFareUsd.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-gray-400">USD</span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      Tasa Oficial BCV ({bcvRate.toFixed(2)})
                    </span>
                    <span className="text-sm font-extrabold text-white font-mono">
                      Bs. {estimatedFareBcv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 leading-tight pt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Incluye peajes, seguro RCV y chofer con protocolo de vestimenta ejecutiva.</span>
                </div>
              </div>

              {/* Passenger Quick Form */}
              <form onSubmit={handleQuoteSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Nombre o Empresa</label>
                    <input
                      type="text"
                      required
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder="Ej. Dr. Alejandro Rossi"
                      className="w-full bg-executive-dark border border-executive-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-luxury-gold font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      placeholder="+58 414 000 0000"
                      className="w-full bg-executive-dark border border-executive-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-luxury-gold font-medium font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-bold block mb-1">Observaciones / N° de Vuelo (Opcional)</label>
                  <input
                    type="text"
                    value={passengerNotes}
                    onChange={(e) => setPassengerNotes(e.target.value)}
                    placeholder="Ej. Vuelo Laser QL-1922 llegando a las 14:30"
                    className="w-full bg-executive-dark border border-executive-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-luxury-gold font-medium"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-luxury-gold to-yellow-500 hover:from-yellow-400 hover:to-luxury-gold text-black font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl shadow-luxury-gold/20 flex items-center justify-center gap-2 transform hover:scale-[1.01]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Confirmar Solicitud de Traslado</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppBooking}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Cotizar Inmediatamente vía WhatsApp Oficial</span>
                  </button>
                </div>
              </form>
            </div>
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
