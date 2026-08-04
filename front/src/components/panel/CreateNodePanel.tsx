import type { LatLng } from 'leaflet';
import type { CreateType } from '../../types';
import { CreationSelector } from '../shared/CreationSelector';
import { NewNodeForm } from '../hidrants/NewNodeForm';
import { NovaIncidenciaForm } from '../incidents/NovaIncidenciaForm';

export function CreateNodePanel({
  form,
  position,
  setForm,
  onClose,
  setNewNodeLatLng,
  refreshHidrants,
  refreshIncidencies,
}: {
  form: Exclude<CreateType, null>;
  position: LatLng;
  setForm: (form: CreateType) => void;
  onClose: () => void;
  setNewNodeLatLng: (latlng: LatLng | null) => void;
  refreshHidrants: () => void;
  refreshIncidencies: () => void;
}) {
  if (form === 'selection') {
    return (
      <div className="p-3">
        <CreationSelector
          onSelectHydrant={() => setForm('hydrant')}
          onSelectIncidencia={() => setForm('incidencia')}
          onClose={onClose}
        />
      </div>
    );
  }

  if (form === 'hydrant') {
    return (
      <div className="p-3">
        <NewNodeForm
          lat={position.lat}
          lon={position.lng}
          onClose={onClose}
          setNewNodeLatLng={setNewNodeLatLng}
          refreshHidrants={refreshHidrants}
        />
      </div>
    );
  }

  return (
    <div className="p-3">
      <NovaIncidenciaForm
        lat={position.lat}
        lon={position.lng}
        onClose={() => {
          onClose();
          refreshIncidencies();
        }}
      />
    </div>
  );
}