'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lon: number, label: string) => void;
}

export default function MapPicker({ isOpen, onClose, onSelect }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const [selected, setSelected] = useState<{ lat: number; lon: number; label: string } | null>(null);

  const destroyMap = useCallback(() => {
    if (markerRef.current) {
      try { markerRef.current.remove(); } catch {}
      markerRef.current = null;
    }
    if (mapInstance.current) {
      try { mapInstance.current.remove(); } catch {}
      mapInstance.current = null;
    }
    initRef.current = false;
  }, []);

  useEffect(() => {
    if (!isOpen || !mapRef.current || initRef.current) return;
    initRef.current = true;

    let map: any = null;

    const init = async () => {
      const L = (await import('leaflet')).default;

      // Inject leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapRef.current || mapInstance.current) return;

      map = L.map(mapRef.current, {
        center: [30, 20],
        zoom: 3,
        zoomControl: true,
        preferCanvas: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const customIcon = L.divIcon({
        html: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="#18181B"/>
          <circle cx="12" cy="12" r="5" fill="white"/>
        </svg>`,
        iconSize: [24, 36],
        iconAnchor: [12, 36],
        className: '',
      });

      map.on('click', async (e: any) => {
        const lat = e.latlng.lat;
        const lng = ((e.latlng.lng % 360) + 540) % 360 - 180; // normalize to [-180, 180]

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        }

        let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        // Cancel previous geocoding request
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
            {
              headers: { 'Accept-Language': 'en' },
              signal: abortRef.current.signal,
            }
          );
          const data = await res.json();
          if (data.display_name) {
            const parts = data.display_name.split(', ');
            label = parts.slice(0, 3).join(', ');
          }
        } catch {
          // Aborted or failed — use coordinates as label
        }

        setSelected({ lat, lon: lng, label });
      });

      mapInstance.current = map;

      // Ensure proper sizing after render
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    };

    init();

    return () => {
      if (abortRef.current) abortRef.current.abort();
      destroyMap();
    };
  }, [isOpen, destroyMap]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      destroyMap();
    };
  }, [destroyMap]);

  // Reset selection when closing
  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      destroyMap();
    }
  }, [isOpen, destroyMap]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl h-[70vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Select Location</h3>
            <p className="text-sm text-zinc-500">Click on the map to place a marker</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <div className="text-sm text-zinc-600">
            {selected ? (
              <span>{selected.label} <span className="text-zinc-400">({selected.lat.toFixed(4)}, {selected.lon.toFixed(4)})</span></span>
            ) : (
              <span className="text-zinc-400">No location selected</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-zinc-600 hover:text-zinc-900 font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selected) {
                  onSelect(selected.lat, selected.lon, selected.label);
                  onClose();
                }
              }}
              disabled={!selected}
              className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
