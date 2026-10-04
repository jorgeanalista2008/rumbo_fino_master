'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type {
  MarkerItem,
  MapOverlayCardData,
  MapboxMapProps,
} from './MapboxMap';

export type { MarkerItem, MapOverlayCardData };
export interface OpenStreetMapProps extends MapboxMapProps {}

// Carga 100% en cliente sin SSR para WebGL Mapbox GL
const DynamicMapboxMap = dynamic(() => import('./MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] bg-executive-dark flex items-center justify-center border border-executive-border rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-luxury-gold border-t-transparent animate-spin" />
        <span className="text-xs font-bold text-gray-400 font-mono">
          Cargando Mapa Ejecutivo Mapbox GL HD...
        </span>
      </div>
    </div>
  ),
});

export function OpenStreetMap(props: OpenStreetMapProps) {
  return <DynamicMapboxMap {...props} />;
}

export default OpenStreetMap;
