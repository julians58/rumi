import '../../lib/leaflet-setup';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/es';

export interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  price?: string;
  link?: string;
}

interface PropertyMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  fitBounds?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

// Default center: Bogota, Colombia
const DEFAULT_CENTER: [number, number] = [4.65, -74.05];
const DEFAULT_ZOOM = 12;

/**
 * Internal component that auto-fits map bounds to show all markers.
 */
function FitBoundsHelper({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;

    if (markers.length === 1) {
      map.setView(markers[0].position, 15);
    } else {
      const bounds = L.latLngBounds(markers.map((m) => m.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, markers]);

  return null;
}

/**
 * Internal component that captures map click events.
 */
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Reusable map component for property visualization.
 *
 * Modes:
 * - Single marker (detail page): center + zoom on one property
 * - Multi marker (list page): fitBounds to show all properties
 * - Interactive (create page): onMapClick to place a pin
 */
export function PropertyMap({
  markers,
  center,
  zoom,
  height = '300px',
  fitBounds = false,
  onMapClick,
}: PropertyMapProps) {
  const mapCenter = center || (markers.length === 1 ? markers[0].position : DEFAULT_CENTER);
  const mapZoom = zoom ?? (markers.length === 1 ? 15 : DEFAULT_ZOOM);

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ height, width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {fitBounds && <FitBoundsHelper markers={markers} />}

      {onMapClick && <MapClickHandler onClick={onMapClick} />}

      {markers.map((marker) => (
        <Marker key={marker.id} position={marker.position}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-rumi-text">{marker.title}</p>
              {marker.price && (
                <p className="text-rumi-primary font-medium mt-1">{marker.price}</p>
              )}
              {marker.link && (
                <Link
                  to={marker.link}
                  className="text-rumi-accent text-xs font-medium mt-1 inline-block hover:underline"
                >
                  {t.map.seeDetails} &rarr;
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default PropertyMap;
