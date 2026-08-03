import { toast } from 'react-toastify';
import type { Incidencia } from '../../types';
import { openInNativeMaps } from '../../utils/geoMaps';

export function IncidenciaActions({
  incidencia,
  showRoute,
  setShowRoute,
  hasLocation,
  onEdit,
}: {
  incidencia: Incidencia;
  showRoute: boolean;
  setShowRoute: (show: boolean) => void;
  hasLocation?: boolean;
  onEdit: () => void;
}) {
  const handleRoute = () => {
    if (!showRoute && !hasLocation) {
      toast.info('Cal activar el seguiment GPS per veure la ruta');
      return;
    }
    setShowRoute(!showRoute);
  };

  return (
    <div className="flex justify-center items-center gap-[30px] mt-[10px] py-[5px]">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        }}
        title="Actualitzar / Comentar"
        className="bg-transparent border-0 cursor-pointer text-[1.5rem] p-0"
      >
        ✏️
      </button>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleRoute();
        }}
        title={showRoute ? 'Treure Ruta' : 'Com anar-hi'}
        className={`bg-transparent border-0 cursor-pointer text-[1.5rem] p-0 ${(showRoute || hasLocation) ? '' : 'grayscale opacity-50'}`}
      >
        🛣️
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openInNativeMaps(incidencia.lat, incidencia.lon, incidencia.titol);
        }}
        title="Obrir en navegador GPS"
        className="bg-transparent border-0 cursor-pointer text-[1.5rem] p-0"
      >
        🚕
      </button>
    </div>
  );
}