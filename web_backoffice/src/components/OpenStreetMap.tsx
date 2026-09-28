'use client';

import React, { useEffect, useRef } from 'react';

export interface MarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type: 'vehicle' | 'pickup' | 'destination';
  status?: string;
}

export interface MapOverlayCardData {
  id?: string;
  originAddress?: string;
  destinationAddress?: string;
  passengerName?: string;
  passengerPhone?: string;
  driverName?: string;
  vehicleInfo?: string;
  totalFare?: number | string;
  bcvFare?: number | string;
  status?: string;
  paymentMethod?: string;
}

interface OpenStreetMapProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  markers?: MarkerItem[];
  routePolyline?: Array<[number, number]>;
  onMarkerClick?: (marker: MarkerItem) => void;
  selectionMode?: 'pickup' | 'destination' | 'none';
  onLocationSelect?: (lat: number, lng: number, mode: 'pickup' | 'destination', placeName?: string) => void;
  activeCardData?: MapOverlayCardData | null;
}

// Bounding Box Geográfico Estricto de Venezuela
const VENEZUELA_BOUNDS: [[number, number], [number, number]] = [
  [0.65, -73.38], // Suroeste (Amazonas / Apure)
  [12.25, -59.80], // Noreste (Isla de Aves / Falcón / Delta Amacuro)
];

export function OpenStreetMap({
  centerLat = 10.4806, // Caracas, Venezuela
  centerLng = -66.9036,
  zoom = 13,
  markers = [],
  routePolyline = [],
  onMarkerClick,
  selectionMode = 'none',
  onLocationSelect,
  activeCardData,
}: OpenStreetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const markersGroup = useRef<any>(null);
  const selectionModeRef = useRef(selectionMode);
  const [isCardMinimized, setIsCardMinimized] = React.useState(false);

  useEffect(() => {
    selectionModeRef.current = selectionMode;
  }, [selectionMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const linkId = 'leaflet-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject Custom Popup Dark VIP Styles
    const styleId = 'leaflet-luxury-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .leaflet-popup-content-wrapper {
          background: #0B1120 !important;
          color: #FFF !important;
          border: 1px solid rgba(212, 175, 55, 0.4) !important;
          border-radius: 16px !important;
          box-shadow: 0 15px 35px rgba(0,0,0,0.85) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .leaflet-popup-tip {
          background: #0B1120 !important;
          border-right: 1px solid rgba(212, 175, 55, 0.4);
          border-bottom: 1px solid rgba(212, 175, 55, 0.4);
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #D4AF37 !important;
          padding: 6px !important;
        }
      `;
      document.head.appendChild(style);
    }

    const loadLeafletScript = async () => {
      if (!(window as any).L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      if (!leafletInstance.current) {
        const map = L.map(mapRef.current, {
          center: [centerLat, centerLng],
          zoom,
          minZoom: 6,
          maxZoom: 18,
          maxBounds: VENEZUELA_BOUNDS,
          maxBoundsViscosity: 1.0,
          zoomControl: true,
        });

        // OpenStreetMap Free Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          minZoom: 6,
          bounds: VENEZUELA_BOUNDS,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Rumbo Fino Venezuela',
        }).addTo(map);

        markersGroup.current = L.layerGroup().addTo(map);
        leafletInstance.current = map;
      } else {
        leafletInstance.current.setView([centerLat, centerLng], zoom);
      }

      // Map Click Event for selecting Pickup Origen or Destination anywhere in Venezuela
      if (leafletInstance.current && onLocationSelect) {
        leafletInstance.current.off('click');
        leafletInstance.current.on('click', async (e: any) => {
          const { lat, lng } = e.latlng;
          const mode = selectionModeRef.current || 'pickup';
          if (mode !== 'none') {
            let placeName = `Venezuela (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'User-Agent': 'RumboFino-Venezuela-App/1.0' } }
              );
              const data = await res.json();
              if (data && data.display_name) {
                const parts = data.display_name.split(', ');
                placeName = parts.slice(0, 3).join(', ');
              }
            } catch (err) {
              console.warn('Geocodificación inversa preliminar offline:', err);
            }
            onLocationSelect(lat, lng, mode, placeName);
          }
        });
      }

      // Render Compact Luxury Circular Markers
      if (markersGroup.current && L) {
        markersGroup.current.clearLayers();

        markers.forEach((m) => {
          let customHtml = '';
          if (m.type === 'vehicle') {
            customHtml = `
              <div style="position:relative; display:flex; align-items:center; justify-content:center; width:38px; height:38px; background:linear-gradient(135deg, #FAD961 0%, #D4AF37 50%, #997819 100%); border-radius:50%; border:2.5px solid #FFFFFF; box-shadow:0 6px 16px rgba(0,0,0,0.6), 0 0 14px rgba(212,175,55,0.7); cursor:pointer; transform:scale(1); transition:all 0.2s;">
                <span style="font-size:18px; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4));">🚗</span>
                <div style="position:absolute; inset:-5px; border-radius:50%; border:1.5px solid #D4AF37; animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity:0.6; pointer-events:none;"></div>
              </div>
            `;
          } else if (m.type === 'pickup') {
            customHtml = `
              <div style="position:relative; display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:linear-gradient(135deg, #34D399 0%, #10B981 100%); border-radius:50%; border:2px solid #FFFFFF; box-shadow:0 6px 14px rgba(0,0,0,0.6), 0 0 12px rgba(16,185,129,0.5); cursor:pointer;">
                <span style="font-size:16px;">📍</span>
              </div>
            `;
          } else {
            customHtml = `
              <div style="position:relative; display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:linear-gradient(135deg, #F87171 0%, #EF4444 100%); border-radius:50%; border:2px solid #FFFFFF; box-shadow:0 6px 14px rgba(0,0,0,0.6), 0 0 12px rgba(239,68,68,0.5); cursor:pointer;">
                <span style="font-size:16px;">🏁</span>
              </div>
            `;
          }

          const icon = L.divIcon({
            html: customHtml,
            className: 'custom-luxury-pin-container',
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });

          const marker = L.marker([m.lat, m.lng], { icon });

          const popupHeaderType = m.type === 'vehicle' ? '🚗 UNIDAD VIP MÓVIL' : m.type === 'pickup' ? '📍 PUNTO DE ABORDAJE' : '🏁 DESTINO FINAL';
          const popupColor = m.type === 'vehicle' ? '#D4AF37' : m.type === 'pickup' ? '#10B981' : '#EF4444';

          marker.bindPopup(`
            <div style="padding:12px; min-width:210px; font-family:system-ui,-apple-system,sans-serif;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
                <span style="font-size:10px; font-weight:900; color:${popupColor}; text-transform:uppercase; letter-spacing:0.5px;">${popupHeaderType}</span>
                ${m.status ? `<span style="background:rgba(212,175,55,0.15); color:#D4AF37; font-size:9px; font-weight:800; padding:2px 6px; border-radius:6px; border:1px solid rgba(212,175,55,0.3);">${m.status}</span>` : ''}
              </div>
              <div style="font-size:12px; font-weight:bold; color:#FFFFFF; margin-bottom:4px;">${m.title}</div>
              ${m.subtitle ? `<div style="font-size:11px; color:#94A3B8; font-weight:500;">${m.subtitle}</div>` : ''}
            </div>
          `);

          if (onMarkerClick) {
            marker.on('click', () => onMarkerClick(m));
          }

          markersGroup.current.addLayer(marker);
        });

        // Draw Polyline route if provided
        if (routePolyline && routePolyline.length > 1) {
          const polyline = L.polyline(routePolyline, {
            color: '#D4AF37',
            weight: 4,
            opacity: 0.85,
            dashArray: '8, 8',
          });
          markersGroup.current.addLayer(polyline);
        }

        // Auto-fit camera to active driver pins and route markers
        if (markers.length > 0 && selectionMode === 'none' && leafletInstance.current) {
          try {
            const group = L.featureGroup(markersGroup.current.getLayers());
            const bounds = group.getBounds();
            if (bounds.isValid()) {
              leafletInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
          } catch (_) {}
        }
      }
    };

    loadLeafletScript();
  }, [centerLat, centerLng, zoom, markers, routePolyline, onLocationSelect, selectionMode]);

  return (
    <div className="w-full h-full min-h-[420px] rounded-3xl overflow-hidden relative border border-executive-border shadow-xl">
      <div ref={mapRef} className="w-full h-full z-10 cursor-crosshair" />

      {/* Map Header Attribution Badge */}
      <div className="absolute top-3 left-3 z-20 bg-executive-dark/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-executive-border text-[11px] text-gray-300 font-bold flex items-center gap-2 shadow-lg">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        🇻🇪 Red de Telemetría VIP Rumbo Fino Venezuela
      </div>

      {/* Interactive Selection Helper Overlay */}
      {selectionMode !== 'none' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-executive-dark/95 backdrop-blur-md px-4 py-2 rounded-xl border border-luxury-gold text-xs font-bold text-luxury-gold shadow-2xl flex items-center gap-2 animate-bounce">
          <span>
            {selectionMode === 'pickup'
              ? '📍 Haga clic en cualquier punto de Venezuela para marcar el Origen (Abordaje)'
              : '🏁 Haga clic en cualquier punto de Venezuela para marcar el Destino'}
          </span>
        </div>
      )}

      {/* FLOATING VIP TELEMETRY CARD OVERLAY ON MAP */}
      {activeCardData && (
        <div className="absolute bottom-4 left-4 z-20 max-w-sm w-[calc(100%-2rem)] sm:w-80 bg-executive-dark/95 backdrop-blur-xl border border-luxury-gold/40 rounded-2xl p-4 shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between border-b border-executive-border/60 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-luxury-gold animate-ping" />
              <span className="text-[11px] font-black text-white uppercase tracking-wider">
                Expediente de Ruta
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeCardData.status && (
                <span className="px-2 py-0.5 bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30 rounded-md text-[9px] font-black uppercase">
                  {activeCardData.status}
                </span>
              )}
              <button
                onClick={() => setIsCardMinimized(!isCardMinimized)}
                className="text-gray-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10"
                title={isCardMinimized ? 'Expandir Ficha' : 'Minimizar Ficha'}
              >
                {isCardMinimized ? '▲' : '▼'}
              </button>
            </div>
          </div>

          {!isCardMinimized && (
            <div className="space-y-2.5 text-xs">
              {/* Origin & Destination */}
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-black mt-0.5">📍</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Origen / Abordaje</span>
                    <p className="text-white font-medium text-[11px] truncate" title={activeCardData.originAddress}>
                      {activeCardData.originAddress || 'Origen por definir'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-red-400 font-black mt-0.5">🏁</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Destino Final</span>
                    <p className="text-white font-medium text-[11px] truncate" title={activeCardData.destinationAddress}>
                      {activeCardData.destinationAddress || 'Destino por definir'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Driver & Vehicle */}
              <div className="p-2 rounded-xl bg-black/40 border border-executive-border flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-gray-400 block font-bold uppercase">Unidad & Chofer</span>
                  <span className="text-luxury-gold font-bold text-[11px] truncate block">
                    {activeCardData.vehicleInfo || 'Unidad Asignada'}
                  </span>
                  <span className="text-gray-300 text-[10px] truncate block">
                    {activeCardData.driverName ? `Chofer: ${activeCardData.driverName}` : 'Chofer en espera de confirmación'}
                  </span>
                </div>
              </div>

              {/* Passenger & Fare Info */}
              <div className="flex items-center justify-between pt-1 text-[10px]">
                <div>
                  <span className="text-gray-400 block">Pasajero VIP</span>
                  <span className="text-white font-bold">{activeCardData.passengerName || 'Pasajero VIP'}</span>
                </div>
                {activeCardData.totalFare && (
                  <div className="text-right">
                    <span className="text-gray-400 block">Tarifa Estimada</span>
                    <span className="text-emerald-400 font-black font-mono text-xs">
                      ${activeCardData.totalFare} USD
                    </span>
                    {activeCardData.bcvFare && (
                      <span className="text-[9px] text-gray-400 block font-mono">
                        (~Bs. {activeCardData.bcvFare})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
