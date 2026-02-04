
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default marker icons in production builds
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPreviewProps {
  geoJson: string;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ geoJson }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([0, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clean up previous layers
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    try {
      const data = JSON.parse(geoJson);
      
      // Validation of GeoJSON structure
      if (!data.type || (!data.features && data.type !== 'Feature')) {
        console.warn("Received data is not standard GeoJSON");
      }

      geoJsonLayerRef.current = L.geoJSON(data, {
        style: {
          color: '#f97316',
          weight: 4,
          opacity: 0.8,
          fillColor: '#fdba74',
          fillOpacity: 0.4
        },
        onEachFeature: (feature, layer) => {
          let popupContent = '<div class="p-1">';
          if (feature.properties) {
            if (feature.properties.name) popupContent += `<h4 class="font-bold border-b mb-1">${feature.properties.name}</h4>`;
            if (feature.properties.description) popupContent += `<p class="text-sm">${feature.properties.description}</p>`;
            
            // Show extra properties if available
            const extras = Object.entries(feature.properties)
              .filter(([key]) => !['name', 'description'].includes(key))
              .map(([key, val]) => `<div class="text-[10px] text-gray-500"><strong>${key}:</strong> ${val}</div>`)
              .join('');
            if (extras) popupContent += `<div class="mt-2 border-t pt-1">${extras}</div>`;
          }
          popupContent += '</div>';
          layer.bindPopup(popupContent);
        }
      }).addTo(map);

      // Adjust map view to fit features
      const bounds = geoJsonLayerRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    } catch (e) {
      console.error("Leaflet rendering error:", e);
    }

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [geoJson]);

  return (
    <div className="relative group">
      <div 
        ref={mapContainerRef} 
        className="rounded-2xl overflow-hidden border border-gray-200 shadow-md h-[450px] w-full z-0 bg-gray-100"
      />
      <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-gray-500 z-[1000] border border-gray-200 pointer-events-none">
        Verify your KML/KMZ data visually
      </div>
    </div>
  );
};
