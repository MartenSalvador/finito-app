import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { X, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix para íconos por defecto de Leaflet en entornos Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas por defecto (Delmenhorst / norte de Alemania)
const CENTER_DEFAULTS = [53.0526, 8.6293];
const MENDOZA_DEFAULTS = [-32.8895, -68.8458];
// Nivel de zoom más abierto que 11 para ver mejor la ciudad y alrededores
const DEFAULT_ZOOM = 10;

function MapSyncView({ containerRef, center, zoom = DEFAULT_ZOOM }) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(center) || center.length !== 2) return;

    const syncMap = () => {
      map.invalidateSize({ animate: false });
      map.setView(center, zoom, { animate: false });
    };

    syncMap();

    // Espera a que termine la animación de entrada del modal (0.28s)
    const afterAnimTimer = setTimeout(syncMap, 320);

    let observer;
    if (containerRef?.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        map.invalidateSize({ animate: false });
        map.setView(center, zoom, { animate: false });
      });
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(afterAnimTimer);
      if (observer) observer.disconnect();
    };
  }, [containerRef, center, zoom, map]);

  return null;
}

export default function MapModal({ puzzles = [], currentUser, onClose, onSelectPuzzle, t }) {
  const mapContainerRef = useRef(null);

  const hasValidUserCoords =
    currentUser &&
    Number.isFinite(Number(currentUser.lat)) &&
    Number.isFinite(Number(currentUser.lon));

  const isMendozaCity =
    typeof currentUser?.city === 'string' &&
    currentUser.city.toLowerCase().includes('mendoza');

  const userCenter = hasValidUserCoords
    ? [Number(currentUser.lat), Number(currentUser.lon)]
    : isMendozaCity
      ? MENDOZA_DEFAULTS
      : CENTER_DEFAULTS;

  // Evita que marcadores en idénticas coordenadas se tapen por completo
  const coordCountMap = new Map();

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[#18181B]/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E5E0F5] rounded-3xl max-w-2xl w-full h-137.5 flex flex-col relative shadow-2xl overflow-hidden animate-modal-pop"
      >
        {/* Cabecera del modal */}
        <div className="p-4 border-b border-[#E5E0F5] flex items-center justify-between bg-[#F5F3FF]">
          <h3 className="font-extrabold text-sm text-[#18181B] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#5B3DF5]" />{' '}
            {t?.mapTitle || 'Mapa de Rompecabezas Cercanos'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t?.closeModal || 'Cerrar'}
            className="text-[#6B7280] hover:text-[#18181B] bg-white hover:bg-[#EBE7FF] border border-[#E5E0F5] p-2 rounded-full transition-all duration-200 active:scale-90 text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenedor del Mapa */}
        <div ref={mapContainerRef} className="flex-1 w-full relative z-0 bg-[#F5F3FF]">
          <MapContainer
            center={userCenter}
            zoom={DEFAULT_ZOOM}
            minZoom={4}
            maxZoom={17}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <MapSyncView containerRef={mapContainerRef} center={userCenter} zoom={DEFAULT_ZOOM} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {puzzles.map((puzzle) => {
              const rawLat = Number.isFinite(Number(puzzle.lat))
                ? Number(puzzle.lat)
                : userCenter[0];
              const rawLng = Number.isFinite(Number(puzzle.lon))
                ? Number(puzzle.lon)
                : userCenter[1];

              const coordKey = `${rawLat.toFixed(4)},${rawLng.toFixed(4)}`;
              const indexAtCoord = coordCountMap.get(coordKey) || 0;
              coordCountMap.set(coordKey, indexAtCoord + 1);

              // Pequeño desplazamiento circular si hay más de un puzzle en la misma coordenada
              const angle = indexAtCoord * 1.1;
              const spread = indexAtCoord === 0 ? 0 : 0.0022;
              const lat = rawLat + Math.sin(angle) * spread;
              const lng = rawLng + Math.cos(angle) * spread;

              const previewImg = puzzle.images?.[0] || puzzle.image;
              const distanceText =
                puzzle.computedDistanceKm !== undefined
                  ? ` (${puzzle.computedDistanceKm} km)`
                  : puzzle.distanceKm !== undefined
                    ? ` (${puzzle.distanceKm} km)`
                    : '';

              return (
                <Marker key={puzzle.id} position={[lat, lng]}>
                  <Popup>
                    <div className="text-[#18181B] p-1 space-y-1.5 max-w-44">
                      {previewImg && (
                        <img
                          src={previewImg}
                          alt={puzzle.title}
                          className="w-full h-20 object-cover rounded-xl border border-[#E5E0F5] bg-[#F5F3FF] transition-transform duration-300 hover:scale-[1.02]"
                        />
                      )}
                      <div>
                        <strong className="block text-xs font-extrabold leading-tight line-clamp-1 text-[#18181B]">
                          {puzzle.title}
                        </strong>
                        <span className="inline-block mt-1 bg-[#FFD43B] text-[#18181B] text-[10px] font-extrabold px-2 py-0.5 rounded-full tabular-nums">
                          {puzzle.pieces} {t?.pieces || 'piezas'}
                        </span>
                        <span className="text-[10px] text-[#6B7280] font-medium block mt-0.5 tabular-nums">
                          {puzzle.city}
                          {distanceText}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPuzzle && onSelectPuzzle(puzzle);
                          onClose && onClose();
                        }}
                        className="mt-1 bg-[#5B3DF5] hover:bg-[#482BD9] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl w-full transition-all duration-200 active:scale-95 shadow-2xs"
                      >
                        {t?.viewDetail || 'Ver detalle'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}