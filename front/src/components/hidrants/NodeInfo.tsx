import { useState, useEffect } from 'react';
import type { HidrantFeature } from '../../hooks/useHidrantData';
import { useAuth } from '../../contexts/AuthContext';
import { useAdf } from '../../contexts/AdfContext';
import { useHydrantActions } from './useHydrantActions';
import { HydrantInfoView } from './HydrantInfoView';
import { HydrantEditForm } from './HydrantEditForm';

let deleteInFlight = false;

export const NodeInfo = ({
  feature,
  showRoute,
  setShowRoute,
  refreshHidrants,
  hasLocation,
  canEdit,
  editing,
  setEditing,
  className = '',
}: {
  feature: HidrantFeature;
  showRoute?: boolean;
  setShowRoute?: (value: boolean) => void;
  refreshHidrants?: () => Promise<void>;
  hasLocation?: boolean;
  canEdit: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  className?: string;
}) => {
  const { user } = useAuth();
  const { activeAdf } = useAdf();
  const props = feature.properties;
  const [data, setData] = useState(props.ui_fields);
  const [observacions, setObservacions] = useState(props.private_tags?.observacions || '');

  useEffect(() => {
    setData(props.ui_fields);
    setObservacions(props.private_tags?.observacions || '');
  }, [props.ui_fields, props.private_tags]);

  const { busy, save, quickStatus, remove } = useHydrantActions(feature, activeAdf, refreshHidrants);

  const handleSave = async () => {
    const ok = await save({
      uiFields: data,
      observacions,
      originalUiFields: props.ui_fields,
      originalObservacions: props.private_tags?.observacions || '',
    });
    if (ok) setEditing(false);
  };

  const handleQuickStatus = async (isOperative: boolean) => {
    const newData = await quickStatus(isOperative, data);
    if (newData) setData(newData);
  };

  useEffect(() => {
    const onDeleteRequest = async () => {
      if (deleteInFlight) return;
      deleteInFlight = true;
      try {
        await remove();
      } finally {
        deleteInFlight = false;
      }
    };
    window.addEventListener('node-delete-request', onDeleteRequest);
    return () => window.removeEventListener('node-delete-request', onDeleteRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature.id]);

  return (
    <div className={`${className} p-3 flex flex-col gap-3`}>
      {!editing ? (
        <HydrantInfoView
          feature={feature}
          user={user}
          canEdit={canEdit}
          showRoute={showRoute ?? false}
          setShowRoute={setShowRoute}
          hasLocation={hasLocation}
          onQuickStatus={handleQuickStatus}
        />
      ) : (
        <HydrantEditForm
          data={data}
          setData={setData}
          observacions={observacions}
          setObservacions={setObservacions}
          busy={busy}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
};