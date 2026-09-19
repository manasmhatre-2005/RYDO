import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapProps {
  pickup?: { lat: number; lng: number; address?: string } | null;
  dropoff?: { lat: number; lng: number; address?: string } | null;
  driverLocation?: { lat: number; lng: number; bearing?: number } | null;
  nearbyDrivers?: Array<{ id: number; lat: number; lng: number; vehicle_type?: string }>;
  routePoints?: Array<{ lat: number; lng: number }>;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  selectionMode?: 'pickup' | 'dropoff' | null;
  isSearching?: boolean;
  className?: string;
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export const LiveMap: React.FC<MapProps> = ({
  pickup,
  dropoff,
  driverLocation,
  nearbyDrivers = [],
  routePoints = [],
  onLocationSelect,
  selectionMode,
  isSearching = false,
  className = "h-[460px] w-full rounded-3xl overflow-hidden border border-slate-200/80 shadow-luxury"
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const radarMarkerRef = useRef<L.Marker | null>(null);
  const nearbyMarkersRef = useRef<L.Marker[]>([]);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const currentDriverCoords = useRef<{ lat: number; lng: number; bearing: number }>({
    lat: driverLocation?.lat || 19.0760,
    lng: driverLocation?.lng || 72.8777,
    bearing: 0,
  });
  const animationFrameRef = useRef<number | null>(null);

  // 1. Initialize Map with CartoDB Positron Light Tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = pickup?.lat || 19.0760;
    const initialLng = pickup?.lng || 72.8777;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    // High-End Light Luxury CartoDB Positron Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onLocationSelect) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 2. Update Pickup Marker & Radar
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
    if (radarMarkerRef.current) {
      map.removeLayer(radarMarkerRef.current);
      radarMarkerRef.current = null;
    }

    if (pickup) {
      const pickupIcon = L.divIcon({
        className: 'custom-pickup-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-white border-2 border-electric-500 shadow-luxury flex items-center justify-center">
              <div class="w-3 h-3 rounded-full bg-electric-500 animate-pulse"></div>
            </div>
            <div class="absolute -bottom-1 w-2.5 h-2.5 bg-electric-500 rotate-45"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<b>Pickup Location</b><br/>${pickup.address || 'Selected Spot'}`);
      
      pickupMarkerRef.current = marker;

      if (isSearching) {
        const radarIcon = L.divIcon({
          className: 'custom-radar-icon',
          html: `<div class="radar-ring w-28 h-28 -ml-14 -mt-14 pointer-events-none"></div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const radarMarker = L.marker([pickup.lat, pickup.lng], { icon: radarIcon, interactive: false }).addTo(map);
        radarMarkerRef.current = radarMarker;
      }
    }
  }, [pickup, isSearching]);

  // 3. Update Dropoff Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (dropoffMarkerRef.current) {
      map.removeLayer(dropoffMarkerRef.current);
      dropoffMarkerRef.current = null;
    }

    if (dropoff) {
      const dropoffIcon = L.divIcon({
        className: 'custom-dropoff-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-white border-2 border-rose-500 shadow-luxury flex items-center justify-center">
              <div class="w-3 h-3 rounded-full bg-rose-500"></div>
            </div>
            <div class="absolute -bottom-1 w-2.5 h-2.5 bg-rose-500 rotate-45"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([dropoff.lat, dropoff.lng], { icon: dropoffIcon })
        .addTo(map)
        .bindPopup(`<b>Destination</b><br/>${dropoff.address || 'Selected Spot'}`);
      
      dropoffMarkerRef.current = marker;
    }
  }, [dropoff]);

  // 4. Smooth LERP Driver Vehicle Movement
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !driverLocation) {
      if (driverMarkerRef.current && map) {
        map.removeLayer(driverMarkerRef.current);
        driverMarkerRef.current = null;
      }
      return;
    }

    const targetLat = driverLocation.lat;
    const targetLng = driverLocation.lng;

    if (!driverMarkerRef.current) {
      currentDriverCoords.current = {
        lat: targetLat,
        lng: targetLng,
        bearing: driverLocation.bearing || 0
      };

      const driverIcon = L.divIcon({
        className: 'smooth-driver-marker',
        html: `
          <div id="rydo-driver-car" class="relative flex items-center justify-center transform transition-transform duration-300" style="transform: rotate(${currentDriverCoords.current.bearing}deg);">
            <div class="absolute w-12 h-12 rounded-full bg-electric-500/20 blur-[6px]"></div>
            <div class="w-10 h-10 rounded-2xl bg-white border-2 border-electric-500 shadow-luxury flex items-center justify-center">
              <svg class="w-5 h-5 text-electric-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/>
                <circle cx="7.5" cy="14.5" r="1.5"/>
                <circle cx="16.5" cy="14.5" r="1.5"/>
              </svg>
            </div>
            <div class="absolute -top-2 w-3 h-2 bg-gradient-to-t from-electric-500/80 to-transparent rounded-t-full"></div>
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const marker = L.marker([targetLat, targetLng], { icon: driverIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<b>RYDO Vehicle</b><br/>En Route`);
      driverMarkerRef.current = marker;
      return;
    }

    const startLat = currentDriverCoords.current.lat;
    const startLng = currentDriverCoords.current.lng;
    
    if (Math.abs(startLat - targetLat) > 0.00001 || Math.abs(startLng - targetLng) > 0.00001) {
      const newBearing = calculateBearing(startLat, startLng, targetLat, targetLng);
      currentDriverCoords.current.bearing = newBearing;

      const carElem = document.getElementById('rydo-driver-car');
      if (carElem) {
        carElem.style.transform = `rotate(${newBearing}deg)`;
      }

      const duration = 750;
      const startTime = performance.now();

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const animateStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        const ease = 1 - (1 - progress) * (1 - progress);
        const curLat = startLat + (targetLat - startLat) * ease;
        const curLng = startLng + (targetLng - startLng) * ease;

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([curLat, curLng]);
        }

        if (progress < 1.0) {
          animationFrameRef.current = requestAnimationFrame(animateStep);
        } else {
          currentDriverCoords.current.lat = targetLat;
          currentDriverCoords.current.lng = targetLng;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateStep);
    }
  }, [driverLocation?.lat, driverLocation?.lng]);

  // 5. Nearby Drivers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    nearbyMarkersRef.current.forEach((m) => map.removeLayer(m));
    nearbyMarkersRef.current = [];

    nearbyDrivers.forEach((d) => {
      const icon = L.divIcon({
        className: 'nearby-car-marker',
        html: `
          <div class="w-6 h-6 rounded-full bg-white border border-electric-400 shadow-md flex items-center justify-center hover:scale-110 transition">
            <div class="w-2 h-2 rounded-full bg-electric-500"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([d.lat, d.lng], { icon }).addTo(map);
      nearbyMarkersRef.current.push(marker);
    });
  }, [nearbyDrivers]);

  // 6. Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (pickup && dropoff) {
      let latlngs: [number, number][] = [];
      if (routePoints && routePoints.length > 0) {
        latlngs = routePoints.map((p) => [p.lat, p.lng]);
      } else {
        const midLat = (pickup.lat + dropoff.lat) / 2 + 0.002;
        const midLng = (pickup.lng + dropoff.lng) / 2 - 0.002;
        latlngs = [
          [pickup.lat, pickup.lng],
          [midLat, midLng],
          [dropoff.lat, dropoff.lng],
        ];
      }

      const polyline = L.polyline(latlngs, {
        color: '#0284c7', // Rich Electric Blue
        weight: 4.5,
        opacity: 0.95,
        dashArray: '8, 8',
      }).addTo(map);

      routePolylineRef.current = polyline;

      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ]);
      if (driverLocation) {
        bounds.extend([driverLocation.lat, driverLocation.lng]);
      }
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 14);
    }
  }, [pickup, dropoff, routePoints, driverLocation?.lat, driverLocation?.lng]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className={className} />

      {selectionMode && (
        <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-electric-500 text-navy-900 px-4 py-2 rounded-2xl text-xs font-bold shadow-luxury flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-electric-500 animate-ping" />
          <span>Click map to select {selectionMode === 'pickup' ? 'Pickup Location' : 'Destination'}</span>
        </div>
      )}
    </div>
  );
};
