import { toast } from 'react-toastify';
import type { HidrantFeature } from '../../hooks/useHidrantData';
import { openInNativeMaps } from '../../utils/geoMaps';
import { ShareIcon, OsmIcon } from '../shared/Icons';

export function HydrantActions({
  feature,
  showRoute,
  setShowRoute,
  hasLocation,
  user,
}: {
  feature: HidrantFeature;
  showRoute?: boolean;
  setShowRoute?: (v: boolean) => void;
  hasLocation?: boolean;
  user: any;
}) {
  const poi = {
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
  };
  const osmId = feature.properties.osm_id;

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('node', feature.id);
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success('Enllaç copiat al porta-retalls');
    } catch (err) {
      toast.error("Error al copiar l'enllaç");
    }
  };

  const handleShowRoute = () => {
    if (!setShowRoute) return;
    if (!showRoute && !hasLocation) {
      toast.info('Cal activar el seguiment GPS per veure la ruta');
      return;
    }
    setShowRoute(!showRoute);
  };

  return (
    <div className="flex justify-center items-center gap-6 py-2 border-t border-soft">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleShare();
        }}
        title="Compartir ubicació"
        className="bg-transparent border-0 cursor-pointer p-0 flex items-center"
      >
        <ShareIcon />
      </button>

      {setShowRoute && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleShowRoute();
          }}
          title={showRoute ? 'Tanca ruta' : 'Mostra ruta'}
          className={`bg-transparent border-0 cursor-pointer text-[1.4rem] p-0 ${showRoute ? '' : 'grayscale'}`}
        >
          🛣️
        </button>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openInNativeMaps(poi.lat, poi.lng, 'Destinació');
        }}
        title="Obrir en navegador GPS"
        className="bg-transparent border-0 cursor-pointer text-[1.4rem] p-0"
      >
        🚕
      </button>

      {user?.role === 'admin' && osmId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://www.openstreetmap.org/node/${osmId}`, '_blank');
          }}
          title="Veure a OpenStreetMap"
          className="bg-transparent border-0 cursor-pointer p-0 flex items-center"
        >
          <OsmIcon />
        </button>
      )}
    </div>
  );
}