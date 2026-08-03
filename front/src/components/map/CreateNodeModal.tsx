import { useState } from 'react';
import type { LatLng } from 'leaflet';
import { Modal } from '../shared/Modal';
import { CreationSelector } from '../shared/CreationSelector';
import { NewNodeForm } from '../hidrants/NewNodeForm';
import { NovaIncidenciaForm } from '../incidents/NovaIncidenciaForm';

export type CreateForm = 'selection' | 'hydrant' | 'incidencia' | null;

export function CreateNodeModal({
  activeForm,
  position,
  user,
  onClose,
  setNewNodeLatLng,
  refreshHidrants,
  refreshIncidencies,
}: {
  activeForm: CreateForm;
  position: LatLng;
  user: any;
  onClose: () => void;
  setNewNodeLatLng: (latlng: LatLng | null) => void;
  refreshHidrants: () => void;
  refreshIncidencies: () => void;
}) {
  const [form, setForm] = useState<CreateForm>(activeForm);

  if (!activeForm || !position || !user) return null;

  const title =
    form === 'selection'
      ? '📍 Selecciona una acció'
      : form === 'hydrant'
        ? '📍 Nou hidrant'
        : '⚠️ Nova incidència';

  return (
    <Modal title={title} onClose={onClose} nonBlocking={true}>
      {form === 'selection' && (
        <CreationSelector
          onSelectHydrant={() => setForm('hydrant')}
          onSelectIncidencia={() => setForm('incidencia')}
          onClose={onClose}
        />
      )}
      {form === 'hydrant' && (
        <NewNodeForm
          lat={position.lat}
          lon={position.lng}
          onClose={onClose}
          setNewNodeLatLng={setNewNodeLatLng}
          refreshHidrants={refreshHidrants}
        />
      )}
      {form === 'incidencia' && (
        <NovaIncidenciaForm
          lat={position.lat}
          lon={position.lng}
          onClose={() => {
            onClose();
            refreshIncidencies();
          }}
        />
      )}
    </Modal>
  );
}