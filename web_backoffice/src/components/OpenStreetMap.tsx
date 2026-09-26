'use client';

import React, { useEffect, useRef } from 'react';

interface MarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type: 'vehicle' | 'pickup' | 'destination';
  status?: string;
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
}: OpenStreetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const markersGroup = useRef<any>(null);
  const selectionModeRef = useRef(selectionMode);

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

      // Render Markers
      if (markersGroup.current && L) {
        markersGroup.current.clearLayers();

        markers.forEach((m) => {
          let customHtml = '';
          if (m.type === 'vehicle') {
            customHtml = `
              <div style="background-color: #D4AF37; color: #000; font-weight: bold; font-size: 10px; padding: 4px 8px; border-radius: 12px; border: 2px solid #FFF; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; items-center; gap: 4px; white-space: nowrap;">
                🚗 <span>${m.title}</span>
              </div>
            `;
          } else if (m.type === 'pickup') {
            customHtml = `
              <div style="background-color: #10B981; color: #FFF; font-weight: bold; font-size: 10px; padding: 4px 8px; border-radius: 12px; border: 2px solid #FFF; box-shadow: 0 4px 10px rgba(0,0,0,0.5); white-space: nowrap;">
                📍 Origen: ${m.title}
              </div>
            `;
          } else {
            customHtml = `
              <div style="background-color: #EF4444; color: #FFF; font-weight: bold; font-size: 10px; padding: 4px 8px; border-radius: 12px; border: 2px solid #FFF; box-shadow: 0 4px 10px rgba(0,0,0,0.5); white-space: nowrap;">
                🏁 Destino: ${m.title}
              </div>
            `;
          }

          const icon = L.divIcon({
            html: customHtml,
            className: 'custom-leaflet-marker',
            iconSize: [120, 30],
            iconAnchor: [60, 15],
          });

          const marker = L.marker([m.lat, m.lng], { icon });

          if (m.subtitle || m.status) {
            marker.bindPopup(`
              <div style="color: #000; font-family: sans-serif; font-size: 12px;">
                <strong>${m.title}</strong><br/>
                <span style="color: #555;">${m.subtitle || ''}</span><br/>
                ${m.status ? `<span style="display:inline-block; margin-top:4px; padding:2px 6px; background:#D4AF37; color:#000; font-weight:bold; border-radius:4px; font-size:10px;">ESTADO: ${m.status}</span>` : ''}
              </div>
            `);
          }

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
            opacity: 0.8,
            dashArray: '8, 8',
          });
          markersGroup.current.addLayer(polyline);
        }
      }
    };

    loadLeafletScript();
  }, [centerLat, centerLng, zoom, markers, routePolyline, onLocationSelect, selectionMode]);

  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl overflow-hidden relative border border-executive-border shadow-xl">
      <div ref={mapRef} className="w-full h-full z-10 cursor-crosshair" />

      {/* Map Header Attribution Badge */}
      <div className="absolute top-3 left-3 z-20 bg-executive-dark/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-executive-border text-[11px] text-gray-300 font-bold flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        🇻🇪 Red de Telemetría VIP Rumbo Fino Venezuela
      </div>

      {/* Interactive Selection Helper Overlay */}
      {selectionMode !== 'none' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-executive-dark/95 backdrop-blur-md px-4 py-2 rounded-xl border border-luxury-gold text-xs font-bold text-luxury-gold shadow-2xl flex items-center gap-2 animate-bounce">
          <span>
            {selectionMode === 'pickup'
              ? '📍 Haga clic en cualquier punto de Venezuela para marcar el Origen (Abordaje)'
              : '🏁 Haga clic en cualquier punto de Venezuela para marcar el Destino'}
          </span>
        </div>
      )}
    </div>
  );
}
