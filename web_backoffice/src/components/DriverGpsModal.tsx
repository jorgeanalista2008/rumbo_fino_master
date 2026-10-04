'use client';

import React from 'react';
import { X, Navigation, Radio, Car, Star, Phone, Mail, ShieldCheck, ExternalLink, MapPin } from 'lucide-react';
import { OpenStreetMap } from './OpenStreetMap';
import { ModalPortal } from './ModalPortal';
import Link from 'next/link';

interface DriverGpsModalProps {
  driver: any;
  onClose: () => void;
}

function getVenezuelanRegion(lat: number, lng: number): string {
  if (!lat || !lng) return 'Venezuela (GPS)';

  // Yaracuy (San Felipe / Chivacoa / Nirgua / Yaritagua)
  if (lat >= 9.8 && lat <= 10.8 && lng >= -69.2 && lng <= -68.4) {
    return 'Yaracuy, Venezuela';
  }
  // Carabobo (Valencia / Puerto Cabello / Guacara)
  if (lat >= 9.8 && lat <= 10.6 && lng > -68.4 && lng <= -67.7) {
    return 'Carabobo (Valencia), Venezuela';
  }
  // Aragua (Maracay / Cagua / La Victoria)
  if (lat >= 9.8 && lat <= 10.6 && lng > -67.7 && lng <= -67.2) {
    return 'Aragua (Maracay), Venezuela';
  }
  // Caracas (Distrito Capital / Chacao / Baruta / Sucre)
  if (lat >= 10.4 && lat <= 10.6 && lng > -67.1 && lng <= -66.8) {
    return 'Caracas (Distrito Capital), Venezuela';
  }
  // Miranda (Guarenas / Guatire / Los Teques / Valles del Tuy)
  if (lat >= 10.1 && lat <= 10.6 && lng > -67.2 && lng <= -65.7) {
    return 'Miranda, Venezuela';
  }
  // La Guaira / Vargas
  if (lat >= 10.5 && lat <= 10.7 && lng >= -67.3 && lng <= -66.5) {
    return 'La Guaira, Venezuela';
  }
  // Lara (Barquisimeto / Cabudare)
  if (lat >= 9.5 && lat <= 10.8 && lng >= -70.8 && lng < -69.2) {
    return 'Lara (Barquisimeto), Venezuela';
  }
  // Falcon (Coro / Punto Fijo)
  if (lat >= 10.8 && lat <= 12.3 && lng >= -71.5 && lng <= -68.2) {
    return 'Falcón, Venezuela';
  }
  // Zulia (Maracaibo / Cabimas)
  if (lat >= 8.5 && lat <= 11.9 && lng >= -73.4 && lng < -70.8) {
    return 'Zulia (Maracaibo), Venezuela';
  }
  // Nueva Esparta (Margarita)
  if (lat >= 10.8 && lat <= 11.2 && lng >= -64.5 && lng <= -63.7) {
    return 'Nueva Esparta (Margarita), Venezuela';
  }
  // Anzoategui (Lecheria / Puerto La Cruz / Barcelona)
  if (lat >= 7.6 && lat <= 10.3 && lng >= -65.5 && lng <= -63.7) {
    return 'Anzoátegui, Venezuela';
  }

  return 'Venezuela (Nacional)';
}

export function DriverGpsModal({ driver, onClose }: DriverGpsModalProps) {
  if (!driver) return null;

  const firstName = driver.user?.firstName || 'Chofer';
  const lastName = driver.user?.lastName || 'Ejecutivo';
  const fullName = `${firstName} ${lastName}`.trim();
  const phone = driver.user?.phoneNumber || '+58 412 1110001';
  const email = driver.user?.email || 'chofer@rumbofino.com';
  const rating = Number(driver.ratingAvg || 5.0).toFixed(2);
  const vehicle = driver.currentVehicle || driver.assignedVehicle;

  // Driver GPS coordinates (Caracas corridor default if offline/simulated)
  const lat = Number(driver.currentLatitude || 10.4806);
  const lng = Number(driver.currentLongitude || -66.9036);

  const marker = {
    id: `driver-gps-${driver.id}`,
    lat,
    lng,
    title: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'Unidad Ejecutiva VIP',
    subtitle: `Chofer: ${fullName} • ${driver.isOnline ? '🟢 EN LÍNEA' : '⚪ DESCONECTADO'}`,
    type: 'vehicle' as const,
    status: driver.isOnline ? 'EN_LINEA' : 'OFFLINE',
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div className="bg-executive-card border border-luxury-gold/50 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto">
          {/* Header */}
          <div className="p-5 bg-executive-dark border-b border-executive-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
                <Radio className={`w-5 h-5 ${driver.isOnline ? 'animate-pulse text-emerald-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">Rastreo GPS Satelital en Tiempo Real</h2>
                  {driver.isOnline ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      EN LÍNEA • TRANSMITIENDO
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-500/10 text-gray-400 border border-gray-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                      DESCONECTADO (OFFLINE)
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Monitoreo de telemetría y geolocalización satelital para la unidad de {fullName}
                </p>
              </div>
            </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-executive-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Map Container */}
          <div className="h-80 w-full rounded-2xl overflow-hidden border border-executive-border shadow-inner relative">
            <OpenStreetMap
              centerLat={lat}
              centerLng={lng}
              zoom={15}
              markers={[marker]}
            />
          </div>

          {/* Telemetry & Driver Card Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Driver Identity */}
            <div className="bg-executive-dark border border-executive-border p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Chofer Ejecutivo
              </span>
              <div className="flex items-center gap-3">
                {driver.user?.avatarUrl ? (
                  <img
                    src={driver.user.avatarUrl}
                    alt={fullName}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-luxury-gold/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold font-black text-lg flex items-center justify-center">
                    {firstName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">{fullName}</h4>
                  <p className="text-xs text-luxury-gold flex items-center gap-1 font-bold">
                    <Star className="w-3.5 h-3.5 fill-luxury-gold" /> {rating} / 5.0
                  </p>
                  <p className="text-[11px] text-gray-400">{driver.totalRides || 0} viajes realizados</p>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="bg-executive-dark border border-executive-border p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Vehículo en Servicio
              </span>
              {vehicle ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-luxury-gold" />
                    <span className="text-sm font-bold text-white">
                      {vehicle.make} {vehicle.model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Placa VIP:</span>
                    <span className="font-mono font-bold text-luxury-gold bg-executive-card px-2 py-0.5 rounded border border-luxury-gold/30">
                      {vehicle.licensePlate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Categoría:</span>
                    <span className="text-emerald-400 font-bold">BLACK TIER</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Sin vehículo asignado</p>
              )}
            </div>

            {/* GPS Telemetry Specs */}
            <div className="bg-executive-dark border border-executive-border p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Coordenadas Satelitales
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Latitud:</span>
                  <span className="font-mono font-bold text-white">{lat.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Longitud:</span>
                  <span className="font-mono font-bold text-white">{lng.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Zona:</span>
                  <span className="text-luxury-gold font-bold">{getVenezuelanRegion(lat, lng)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-executive-dark border-t border-executive-border flex items-center justify-between gap-3">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-luxury-gold" />
            <span>Transmisión activa cada 6 segundos</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/dispatch"
              className="px-4 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Abrir en Consola de Despacho
            </Link>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-executive-card hover:bg-executive-border text-gray-300 hover:text-white text-xs font-bold rounded-xl border border-executive-border transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
);
}
