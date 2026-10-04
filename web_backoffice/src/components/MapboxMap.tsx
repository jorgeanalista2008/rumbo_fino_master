'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLES,
  fetchMapboxRoute,
  reverseGeocodeMapbox,
} from '@/lib/mapbox';
import {
  Car,
  MapPin,
  Navigation,
  Layers,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface MarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type: 'vehicle' | 'pickup' | 'destination';
  status?: string;
  heading?: number;
  color?: string;
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
  routeDistanceKm?: number;
  routeDurationMin?: number;
}

export interface MapboxMapProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  markers?: MarkerItem[];
  routePolyline?: Array<[number, number]>; // Array de [lat, lng]
  onMarkerClick?: (marker: MarkerItem) => void;
  selectionMode?: 'pickup' | 'destination' | 'none';
  onLocationSelect?: (lat: number, lng: number, mode: 'pickup' | 'destination', placeName?: string) => void;
  activeCardData?: MapOverlayCardData | null;
  focusCoords?: { lat: number; lng: number; zoom?: number } | null;
  className?: string;
}

// Bounding box estricto de Venezuela para evitar desplazamientos al vacío
const VENEZUELA_BOUNDS: [number, number, number, number] = [
  -73.38, 0.65, // Suroeste [lng, lat]
  -59.8, 12.25, // Noreste [lng, lat]
];

export function MapboxMap({
  centerLat = 10.4806, // Caracas por defecto
  centerLng = -66.9036,
  zoom = 13,
  markers = [],
  routePolyline = [],
  onMarkerClick,
  selectionMode = 'none',
  onLocationSelect,
  activeCardData,
  focusCoords,
  className = 'w-full h-full min-h-[480px]',
}: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const mapboxglRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const selectionModeRef = useRef(selectionMode);

  // Map state
  const [currentStyle, setCurrentStyle] = useState<string>(MAPBOX_STYLES.DARK_VIP);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMin: number; summary?: string } | null>(
    null
  );
  const [isCardMinimized, setIsCardMinimized] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Smooth Fly-To effect when focusCoords changes
  useEffect(() => {
    if (!focusCoords || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo({
      center: [focusCoords.lng, focusCoords.lat],
      zoom: focusCoords.zoom || 15,
      essential: true,
      duration: 1200,
    });
  }, [focusCoords]);

  useEffect(() => {
    selectionModeRef.current = selectionMode;
  }, [selectionMode]);

  // -----------------------------------------------------------------
  // 1. INICIALIZAR MAPBOX GL MAP DE FORMA DINÁMICA
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const initMap = async () => {
      // Inyectar CSS de Mapbox GL si no existe
      const linkId = 'mapbox-gl-css';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css';
        document.head.appendChild(link);
      }

      // Inyectar estilos personalizados para popups Dark VIP
      const styleId = 'mapbox-luxury-popup-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .luxury-mapbox-popup .mapboxgl-popup-content {
            background: #0B1120 !important;
            color: #FFF !important;
            border: 1px solid rgba(212, 175, 55, 0.5) !important;
            border-radius: 16px !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.85) !important;
            padding: 0 !important;
          }
          .luxury-mapbox-popup .mapboxgl-popup-tip {
            border-top-color: #0B1120 !important;
            border-bottom-color: #0B1120 !important;
          }
          .luxury-mapbox-popup .mapboxgl-popup-close-button {
            color: #D4AF37 !important;
            padding: 6px 10px !important;
            font-size: 16px !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Cargar mapbox-gl sólo en cliente
      const mapboxgl = (await import('mapbox-gl')).default;
      mapboxglRef.current = mapboxgl;

      if (!isMounted || !mapContainerRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: currentStyle,
        center: [centerLng, centerLat],
        zoom: zoom,
        pitch: is3DMode ? 45 : 0,
        bearing: is3DMode ? -15 : 0,
        maxBounds: VENEZUELA_BOUNDS,
        attributionControl: false,
      });

      // Añadir controles de navegación
      map.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
          showCompass: true,
          showZoom: true,
        }),
        'bottom-right'
      );

      map.on('load', () => {
        if (!isMounted) return;
        setMapLoaded(true);
        map.resize();

        // Capa de edificios 3D
        if (!map.getLayer('3d-buildings')) {
          const layers = map.getStyle().layers;
          const labelLayerId = layers?.find(
            (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
          )?.id;

          map.addLayer(
            {
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': '#111827',
                'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.05, ['get', 'height']],
                'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.05, ['get', 'min_height']],
                'fill-extrusion-opacity': 0.7,
              },
            },
            labelLayerId
          );
        }
      });

      // Manejador de clics para selección
      map.on('click', async (e) => {
        const mode = selectionModeRef.current;
        if (mode === 'none' || !onLocationSelect) return;

        const { lng, lat } = e.lngLat;
        const placeName = (await reverseGeocodeMapbox(lng, lat)) || `Ubicación (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        onLocationSelect(lat, lng, mode, placeName);
      });

      mapInstanceRef.current = map;
    };

    initMap();

    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setMapLoaded(false);
    };
  }, []);

  // -----------------------------------------------------------------
  // 2. CAMBIO DE ESTILO
  // -----------------------------------------------------------------
  const handleStyleChange = (styleUrl: string) => {
    setCurrentStyle(styleUrl);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setStyle(styleUrl);
      mapInstanceRef.current.once('style.load', () => {
        renderRouteOnMap();
      });
    }
  };

  const toggle3DPerspective = () => {
    if (!mapInstanceRef.current) return;
    const nextMode = !is3DMode;
    setIs3DMode(nextMode);
    mapInstanceRef.current.easeTo({
      pitch: nextMode ? 45 : 0,
      bearing: nextMode ? -15 : 0,
      duration: 1000,
    });
  };

  // -----------------------------------------------------------------
  // 3. PINES PERSONALIZADOS LUXURY VIP
  // -----------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    const mapboxgl = mapboxglRef.current;
    if (!map || !mapLoaded || !mapboxgl) return;

    // Eliminar marcadores obsoletos
    const currentMarkerIds = new Set(markers.map((m) => m.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentMarkerIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    markers.forEach((marker) => {
      if (markersRef.current[marker.id]) {
        markersRef.current[marker.id].setLngLat([marker.lng, marker.lat]);
        return;
      }

      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-110 transition-transform duration-300 relative';

      if (marker.type === 'vehicle') {
        const pinColor = marker.color || '#D4AF37';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-10 h-10 rounded-full animate-ping" style="background-color: ${pinColor}35"></span>
            <div class="w-9 h-9 rounded-2xl bg-black border-2 shadow-2xl flex items-center justify-center relative z-10 transition-transform" style="border-color: ${pinColor}; color: ${pinColor}; box-shadow: 0 0 16px ${pinColor}80">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <div class="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-black/90 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-md whitespace-nowrap font-mono pointer-events-none border" style="border-color: ${pinColor}60; color: ${pinColor}">
              ${marker.title.split(' ')[0] || 'VIP'}
            </div>
          </div>
        `;
      } else if (marker.type === 'pickup') {
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-pulse"></span>
            <div class="w-8 h-8 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center shadow-lg border-2 border-white relative z-10" style="box-shadow: 0 0 15px rgba(16, 185, 129, 0.7)">
              A
            </div>
            <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/90 border border-emerald-500/50 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap pointer-events-none">
              Origen
            </div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-yellow-500/30 animate-pulse"></span>
            <div class="w-8 h-8 rounded-full bg-luxury-gold text-black font-black text-xs flex items-center justify-center shadow-lg border-2 border-white relative z-10" style="box-shadow: 0 0 15px rgba(212, 175, 55, 0.7)">
              B
            </div>
            <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/90 border border-luxury-gold/50 text-luxury-gold text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap pointer-events-none">
              Destino
            </div>
          </div>
        `;
      }

      const popupContent = `
        <div class="p-3 bg-[#0B1120] text-white rounded-xl border border-luxury-gold/30 min-w-[180px]">
          <div class="text-[10px] font-bold uppercase tracking-wider text-luxury-gold mb-1">
            ${marker.type === 'vehicle' ? '🚗 Chofer VIP Rumbo Fino' : marker.type === 'pickup' ? '📍 Punto de Recogida' : '🏁 Destino Ejecutivo'}
          </div>
          <div class="text-sm font-extrabold text-white">${marker.title}</div>
          ${marker.subtitle ? `<div class="text-xs text-gray-400 mt-0.5">${marker.subtitle}</div>` : ''}
          ${marker.status ? `<div class="mt-2 text-[10px] font-mono px-2 py-0.5 inline-block rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${marker.status}</div>` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'luxury-mapbox-popup',
      }).setHTML(popupContent);

      const mapboxMarker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        if (onMarkerClick) onMarkerClick(marker);
      });

      markersRef.current[marker.id] = mapboxMarker;
    });
  }, [markers, mapLoaded, onMarkerClick]);

  // -----------------------------------------------------------------
  // 4. TRAZADO DE RUTA VIAL REAL (MAPBOX DIRECTIONS API)
  // -----------------------------------------------------------------
  const renderRouteOnMap = useCallback(async () => {
    const map = mapInstanceRef.current;
    const mapboxgl = mapboxglRef.current;
    if (!map || !mapLoaded || !mapboxgl) return;

    if (!routePolyline || routePolyline.length < 2) {
      if (map.getLayer('route-line-casing')) map.removeLayer('route-line-casing');
      if (map.getLayer('route-line-glow')) map.removeLayer('route-line-glow');
      if (map.getSource('route-source')) map.removeSource('route-source');
      setRouteStats(null);
      return;
    }

    let coordinates: Array<[number, number]> = [];

    if (routePolyline.length === 2) {
      const origin: [number, number] = [routePolyline[0][1], routePolyline[0][0]]; // [lng, lat]
      const dest: [number, number] = [routePolyline[1][1], routePolyline[1][0]]; // [lng, lat]

      const routeResult = await fetchMapboxRoute(origin, dest);
      if (routeResult) {
        coordinates = routeResult.coordinates;
        setRouteStats({
          distanceKm: routeResult.distanceKm,
          durationMin: routeResult.durationMinutes,
          summary: routeResult.summary,
        });
      } else {
        coordinates = [origin, dest];
      }
    } else {
      coordinates = routePolyline.map(([lat, lng]) => [lng, lat]);
    }

    if (coordinates.length < 2) return;

    const geojsonData: any = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates,
      },
    };

    if (map.getSource('route-source')) {
      (map.getSource('route-source') as any).setData(geojsonData);
    } else {
      map.addSource('route-source', {
        type: 'geojson',
        data: geojsonData,
      });

      map.addLayer({
        id: 'route-line-casing',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#000000',
          'line-width': 8,
          'line-opacity': 0.8,
        },
      });

      map.addLayer({
        id: 'route-line-glow',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#D4AF37',
          'line-width': 4.5,
          'line-opacity': 0.95,
        },
      });
    }

    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach((coord) => bounds.extend(coord));
    map.fitBounds(bounds, {
      padding: { top: 90, bottom: 90, left: 70, right: 70 },
      duration: 1400,
      maxZoom: 16,
    });
  }, [routePolyline, mapLoaded]);

  useEffect(() => {
    renderRouteOnMap();
  }, [renderRouteOnMap]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    mapInstanceRef.current.easeTo({
      center: [centerLng, centerLat],
      zoom: zoom,
      duration: 1000,
    });
  }, [centerLat, centerLng, zoom, mapLoaded]);

  return (
    <div className={`relative ${className} bg-executive-dark select-none overflow-hidden rounded-2xl`}>
      <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Controles de Capas Mapbox */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        <div className="bg-black/85 backdrop-blur-md border border-luxury-gold/30 rounded-xl p-1 flex items-center gap-1 shadow-2xl">
          <button
            onClick={() => handleStyleChange(MAPBOX_STYLES.DARK_VIP)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              currentStyle === MAPBOX_STYLES.DARK_VIP
                ? 'bg-luxury-gold text-black shadow-md shadow-luxury-gold/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Dark VIP
          </button>
          <button
            onClick={() => handleStyleChange(MAPBOX_STYLES.NAVIGATION_NIGHT)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              currentStyle === MAPBOX_STYLES.NAVIGATION_NIGHT
                ? 'bg-luxury-gold text-black shadow-md shadow-luxury-gold/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Noche Navegación
          </button>
          <button
            onClick={() => handleStyleChange(MAPBOX_STYLES.SATELLITE_VIP)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              currentStyle === MAPBOX_STYLES.SATELLITE_VIP
                ? 'bg-luxury-gold text-black shadow-md shadow-luxury-gold/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Satélite HD
          </button>
        </div>

        <button
          onClick={toggle3DPerspective}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border transition-all shadow-xl ${
            is3DMode
              ? 'bg-luxury-gold text-black border-luxury-gold font-extrabold shadow-luxury-gold/20'
              : 'bg-black/85 text-gray-300 hover:text-white border-executive-border'
          }`}
          title="Alternar vista 2D / 3D y perspectiva de edificios"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{is3DMode ? 'Modo 3D Activo' : 'Vista 2D'}</span>
        </button>
      </div>

      {/* Chip de Métricas de Ruta Mapbox */}
      {routeStats && (
        <div className="absolute top-4 right-4 z-20 bg-black/90 backdrop-blur-md border border-luxury-gold/50 rounded-2xl px-4 py-2 text-white shadow-2xl flex items-center gap-3">
          <div className="p-2 bg-luxury-gold/10 text-luxury-gold rounded-xl border border-luxury-gold/20">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {routeStats.summary || 'Ruta Óptima Mapbox'}
            </div>
            <div className="flex items-center gap-2 font-mono font-extrabold text-sm">
              <span className="text-white">{routeStats.distanceKm} km</span>
              <span className="text-gray-500">•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{routeStats.durationMin} min
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modo de Selección Activo */}
      {selectionMode !== 'none' && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 bg-black/95 backdrop-blur-md border border-luxury-gold px-4 py-2 rounded-2xl text-xs font-bold text-luxury-gold flex items-center gap-2 shadow-2xl animate-bounce">
          <MapPin className="w-4 h-4 text-luxury-gold" />
          <span>
            Haz clic en el mapa para fijar:{' '}
            <strong className="text-white uppercase font-mono">
              {selectionMode === 'pickup' ? 'Punto de Recogida (A)' : 'Punto de Destino (B)'}
            </strong>
          </span>
        </div>
      )}

      {/* TARJETA FLOTANTE VIP DE TELEMETRÍA DE VIAJE */}
      {activeCardData && (
        <div className="absolute bottom-6 left-6 z-20 max-w-sm w-full bg-executive-card/95 backdrop-blur-xl border border-luxury-gold/40 rounded-3xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-executive-border pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-extrabold text-white">Servicio VIP Rumbo Fino</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 font-bold">
                {activeCardData.status || 'EN TRÁNSITO'}
              </span>
              <button
                onClick={() => setIsCardMinimized(!isCardMinimized)}
                className="text-gray-400 hover:text-white"
              >
                {isCardMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isCardMinimized && (
            <div className="space-y-2.5 text-xs">
              <div className="space-y-1.5 bg-executive-dark/80 p-2.5 rounded-xl border border-executive-border">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                  <div className="truncate text-gray-200">{activeCardData.originAddress || 'Origen'}</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-luxury-gold mt-1 shrink-0" />
                  <div className="truncate text-gray-200">{activeCardData.destinationAddress || 'Destino'}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-gray-300">
                <div>
                  <span className="text-[10px] text-gray-500 block">Chofer Asignado:</span>
                  <span className="font-bold text-white">{activeCardData.driverName || 'Por Asignar'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Vehículo Flota:</span>
                  <span className="font-bold text-luxury-gold">{activeCardData.vehicleInfo || 'VIP'}</span>
                </div>
              </div>

              {activeCardData.totalFare && (
                <div className="pt-2 border-t border-executive-border flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Tarifa Estimada:</span>
                  <div className="text-right font-mono">
                    <span className="text-sm font-black text-emerald-400">
                      ${Number(activeCardData.totalFare).toFixed(2)} USD
                    </span>
                    {activeCardData.bcvFare && (
                      <span className="text-[10px] text-gray-400 block font-bold">
                        Bs. {Number(activeCardData.bcvFare).toLocaleString('es-VE')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sello Oficial Mapbox */}
      <div className="absolute bottom-2 right-2 z-10 text-[10px] text-gray-500 font-mono pointer-events-none bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
        Powered by Mapbox GL Vector SDK
      </div>
    </div>
  );
}

export default MapboxMap;
