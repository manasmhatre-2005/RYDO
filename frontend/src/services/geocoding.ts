import { apiClient } from '../api/client';

export interface LocationDetails {
  placeName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  subAddress?: string;
  iconType?: 'airport' | 'station' | 'building' | 'commercial' | 'hotel' | 'transit' | 'default';
}

/**
 * Determine suitable location icon category based on name and OSM properties
 */
export function getLocationIconType(name: string, category = ''): LocationDetails['iconType'] {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (
    n.includes('airport') ||
    n.includes('aerodrome') ||
    n.includes('terminal') ||
    n.includes('csmia') ||
    n.includes('sfo') ||
    c.includes('aeroway')
  ) {
    return 'airport';
  }
  if (
    n.includes('station') ||
    n.includes('railway') ||
    n.includes('train') ||
    n.includes('metro') ||
    n.includes('terminus') ||
    n.includes('csmt') ||
    n.includes('junction')
  ) {
    return 'station';
  }
  if (
    n.includes('hotel') ||
    n.includes('resort') ||
    n.includes('taj') ||
    n.includes('marriott') ||
    n.includes('hyatt') ||
    n.includes('oberoi')
  ) {
    return 'hotel';
  }
  if (
    n.includes('mall') ||
    n.includes('market') ||
    n.includes('plaza') ||
    n.includes('bazaar') ||
    c.includes('shop')
  ) {
    return 'commercial';
  }
  if (
    n.includes('tower') ||
    n.includes('complex') ||
    n.includes('center') ||
    n.includes('bkc') ||
    n.includes('park') ||
    c.includes('building')
  ) {
    return 'building';
  }
  if (n.includes('bus') || n.includes('stand') || n.includes('depot')) {
    return 'transit';
  }
  return 'default';
}

/**
 * Forward Geocoding: Searches for locations matching a text query
 */
export async function searchLocations(query: string): Promise<LocationDetails[]> {
  const q = query.trim();
  if (!q || q.length < 2) {
    return [];
  }

  // 1. Primary: RYDO Backend Geocoding Endpoint
  try {
    const res = await apiClient.get<LocationDetails[]>('/rides/geocode/search', {
      params: { q, limit: 6 },
      timeout: 4500,
    });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    console.warn('[RYDO Geocoding] Backend search fallback triggered:', err);
  }

  // 2. Secondary Fallback: Direct Photon API
  try {
    const resp = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`
    );
    if (resp.ok) {
      const data = await resp.json();
      const features: any[] = data.features || [];
      return features.map((f: any) => {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates || [0, 0];
        const name = p.name || p.street || p.city || 'Location';
        const street = p.street || '';
        const locality = p.locality || p.district || '';
        const city = p.city || p.county || '';
        const state = p.state || '';
        const country = p.country || '';
        const postcode = p.postcode || '';

        const subParts: string[] = [];
        if (street && !name.includes(street)) subParts.push(street);
        if (locality && !name.includes(locality)) subParts.push(locality);
        if (city && !name.includes(city)) subParts.push(city);
        if (state && !name.includes(state)) subParts.push(state);
        if (country && !subParts.includes(country)) subParts.push(country);

        const subAddress = subParts.join(', ') || city || state;
        const formattedAddress = subAddress ? `${name}, ${subAddress}` : name;

        return {
          placeName: name,
          formattedAddress,
          subAddress,
          latitude: Number(coords[1].toFixed(6)),
          longitude: Number(coords[0].toFixed(6)),
          city,
          state,
          country,
          postalCode: postcode,
          iconType: getLocationIconType(name, p.osm_key),
        };
      });
    }
  } catch (err) {
    console.error('[RYDO Geocoding] Direct search error:', err);
  }

  return [];
}

/**
 * Reverse Geocoding: Converts GPS coordinates into a formatted place name and address
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationDetails> {
  // 1. Primary: RYDO Backend Reverse Geocoding Endpoint
  try {
    const res = await apiClient.get<LocationDetails>('/rides/geocode/reverse', {
      params: { lat: latitude, lng: longitude },
      timeout: 4500,
    });
    if (res.data && res.data.placeName) {
      return res.data;
    }
  } catch (err) {
    console.warn('[RYDO Geocoding] Backend reverse geocode fallback triggered:', err);
  }

  // 2. Secondary Fallback: Direct Photon Reverse API
  try {
    const resp = await fetch(
      `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`
    );
    if (resp.ok) {
      const data = await resp.json();
      const features: any[] = data.features || [];
      if (features.length > 0) {
        const p = features[0].properties || {};
        const name = p.name || p.street || p.city || 'Custom Pin';
        const street = p.street || '';
        const locality = p.locality || p.district || '';
        const city = p.city || p.county || '';
        const state = p.state || '';
        const country = p.country || '';
        const postcode = p.postcode || '';

        const subParts: string[] = [];
        if (street && !name.includes(street)) subParts.push(street);
        if (locality && !name.includes(locality)) subParts.push(locality);
        if (city && !name.includes(city)) subParts.push(city);
        if (state && !name.includes(state)) subParts.push(state);

        const subAddress = subParts.join(', ') || city || state;
        const formattedAddress = subAddress ? `${name}, ${subAddress}` : name;

        return {
          placeName: name,
          formattedAddress,
          subAddress,
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
          city,
          state,
          country,
          postalCode: postcode,
          iconType: getLocationIconType(name, p.osm_key),
        };
      }
    }
  } catch (err) {
    console.error('[RYDO Geocoding] Direct reverse geocode error:', err);
  }

  // Final graceful fallback
  const fallbackLabel = `Point (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  return {
    placeName: fallbackLabel,
    formattedAddress: fallbackLabel,
    subAddress: 'Pinned coordinate',
    latitude,
    longitude,
    city: '',
    state: '',
    country: '',
    postalCode: '',
    iconType: 'default',
  };
}
