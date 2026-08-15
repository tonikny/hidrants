import { useState, useEffect } from "react";
import type { HidrantFeature } from "../../hooks/useHidrantData";
import { useAuth } from "../../contexts/AuthContext";
import { useAdf } from "../../contexts/AdfContext";
import { useHydrantActions } from "./useHydrantActions";
import { HydrantInfoView } from "./HydrantInfoView";
import { HydrantEditForm } from "./HydrantEditForm";
import { confirmDiscardChanges, setFormDirty } from "../../utils/formDirty";

export const NodeInfo = ({
  feature,
  showRoute,
  setShowRoute,
  refreshHidrants,
  hasLocation,
  canEdit,
  editing,
  setEditing,
  className = "",
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
  const [observacions, setObservacions] = useState(props.private_tags?.observacions || "");

  // Sincronitzar l'estat del formulari quan feature canvia (actualització des del backend)
  /* eslint-disable react-hooks/set-state-in-effect -- actualització necessària quan canvien les dades del backend */
  useEffect(() => {
    setData(props.ui_fields);
    setObservacions(props.private_tags?.observacions || "");
  }, [props.ui_fields, props.private_tags?.observacions]);

  const isAdmin = user?.role === "admin";
  const canDelete = canEdit && (user?.permissions ?? []).includes("delete_hydrant");

  const { busy, save, quickStatus, remove } = useHydrantActions(
    feature,
    activeAdf,
    refreshHidrants,
  );

  const handleSave = async () => {
    const ok = await save({
      uiFields: data,
      observacions,
      originalUiFields: props.ui_fields,
      originalObservacions: props.private_tags?.observacions || "",
    });
    if (ok) {
      setEditing(false);
    }
  };

  const handleQuickStatus = async (isOperative: boolean) => {
    const newData = await quickStatus(isOperative, data);
    if (newData) {
      setData(newData);
    }
  };

  const handleCancelEdit = () => {
    if (confirmDiscardChanges()) {
      setEditing(false);
    }
  };

  useEffect(() => {
    if (!editing) {
      setFormDirty(false);
      return;
    }
    const hasChanges =
      JSON.stringify(data) !== JSON.stringify(props.ui_fields) ||
      observacions !== (props.private_tags?.observacions || "");
    setFormDirty(hasChanges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, data, observacions]);

  useEffect(
    () => () => {
      setFormDirty(false);
    },
    [],
  );

  return (
    <div className={`${className} p-3 flex flex-col gap-3`}>
      {!editing ? (
        <HydrantInfoView
          feature={feature}
          canEdit={canEdit}
          isAdmin={isAdmin}
          showRoute={showRoute ?? false}
          setShowRoute={setShowRoute}
          hasLocation={hasLocation}
          onQuickStatus={(v) => {
            void handleQuickStatus(v);
          }}
          refreshHidrants={refreshHidrants}
        />
      ) : (
        <HydrantEditForm
          data={data}
          setData={setData}
          observacions={observacions}
          setObservacions={setObservacions}
          busy={busy}
          onSave={() => {
            void handleSave();
          }}
          onCancel={handleCancelEdit}
          onDelete={
            canDelete
              ? () => {
                  void remove();
                }
              : undefined
          }
        />
      )}
    </div>
  );
};
