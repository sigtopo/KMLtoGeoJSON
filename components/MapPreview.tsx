
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapPreviewProps {
  geoJson: string;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ geoJson }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Remove old layer if exists
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    try {
      const data = JSON.parse(geoJson);
      geoJsonLayerRef.current = L.geoJSON(data, {
        style: {
          color: '#f97316', // Orange-500
          weight: 3,
          opacity: 0.8
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(`<strong>${feature.properties.name}</strong><br/>${feature.properties.description || ''}`);
          }
        }
      }).addTo(map);

      // Fit bounds to the features
      const bounds = geoJsonLayerRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch (e) {
      console.error("Error rendering GeoJSON on map:", e);
    }

    return () => {
      // Cleanup is handled by tracking refs
    };
  }, [geoJson]);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner h-[400px] w-full z-0">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};
