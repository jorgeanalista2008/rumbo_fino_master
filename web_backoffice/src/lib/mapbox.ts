export const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  (typeof window !== 'undefined'
    ? window.atob('cGsuZXlKMUlqb2lhbTl5WjJWaGJtRnNhWE4wWVRJd01EZ2lMQ0poSWpvaVkyMTFiMm8yY0dJNE1EQjVaek13YjJ4eWQzUTVOWFY1YWlKOS5LXy1DUVBaRDdsVmY5YkJISVM2dWVn')
    : Buffer.from(
        'cGsuZXlKMUlqb2lhbTl5WjJWaGJtRnNhWE4wWVRJd01EZ2lMQ0poSWpvaVkyMTFiMm8yY0dJNE1EQjVaek13YjJ4eWQzUTVOWFY1YWlKOS5LXy1DUVBaRDdsVmY5YkJISVM2dWVn',
        'base64'
      ).toString('utf-8'));

export const MAPBOX_STYLES = {
  DARK_VIP: 'mapbox://styles/mapbox/dark-v11',
  NAVIGATION_NIGHT: 'mapbox://styles/mapbox/navigation-night-v1',
  SATELLITE_VIP: 'mapbox://styles/mapbox/satellite-streets-v12',
  STREETS: 'mapbox://styles/mapbox/streets-v12',
};

export interface RouteGeometry {
  coordinates: Array<[number, number]>; // [lng, lat]
  distanceKm: number;
  durationMinutes: number;
  summary?: string;
}

/**
 * Consulta la API oficial de Mapbox Directions v5 para calcular la ruta exacta
 * @param origin [lng, lat]
 * @param destination [lng, lat]
 */
export async function fetchMapboxRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<RouteGeometry | null> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox Directions HTTP ${res.status}`);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    return {
      coordinates: route.geometry.coordinates,
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationMinutes: Math.round(route.duration / 60),
      summary: route.legs?.[0]?.summary || 'Ruta Ejecutiva',
    };
  } catch (err) {
    console.warn('Error fetching Mapbox route directions:', err);
    return null;
  }
}

/**
 * Realiza geocodificación inversa con Mapbox v5
 * @param lng Longitud
 * @param lat Latitud
 */
export async function reverseGeocodeMapbox(lng: number, lat: number): Promise<string | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?language=es&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return null;
  } catch {
    return null;
  }
}
