import { Popup } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { sendToTelegram } from '../../utils/sendToTelegram';
import { toast } from 'react-toastify';
import { HidrantFeature } from '../../hooks/useHidrantData';
import { openInNativeMaps } from '../../utils/geoMaps';
import { useAuth } from '../../contexts/AuthContext';
import { useAdf } from '../../contexts/AdfContext';
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../styles/uiStyles';
import {
  getHydrantDisplayData,
  getHydrantImages,
  HydrantUiFields,
} from '../../utils/osmConversion';
import { HydrantFormFields } from './HydrantFormFields';
import { HydrantImages } from './HydrantImages';
import { ShareIcon, OsmIcon } from './Icons';

type NodeFormProps = {
  feature: HidrantFeature;
  showRoute: boolean;
  setShowRoute: (value: boolean) => void;
  refreshHidrants?: () => Promise<void>;
  hasLocation?: boolean;
};

function calculateChanges(
  original: HydrantUiFields,
  modified: HydrantUiFields,
  originalObservacions: string,
  modifiedObservacions: string
) {
  const changes: any = {};
  const originalValues: any = {};

  for (const key in modified) {
    const k = key as keyof HydrantUiFields;
    if (original[k] !== modified[k]) {
      changes[k] = modified[k];
      originalValues[k] = original[k];
    }
  }

  if (originalObservacions !== modifiedObservacions) {
    changes.observacions = modifiedObservacions;
    originalValues.observacions = originalObservacions;
  }

  return { changes, originalValues };
}

export const NodeWithForm = ({
  feature,
  showRoute,
  setShowRoute,
  refreshHidrants,
  hasLocation,
}: NodeFormProps) => {
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const { activeAdf } = useAdf();

  const props = feature.properties;
  const [data, setData] = useState<HydrantUiFields>(props.ui_fields);
  const [observacions, setObservacions] = useState(props.private_tags?.observacions || '');

  useEffect(() => {
    setData(props.ui_fields);
    setObservacions(props.private_tags?.observacions || '');
  }, [props.ui_fields, props.private_tags]);

  const canEdit =
    user &&
    (user.role === 'admin' ||
      (user.role === 'editor' && user.adf_id === activeAdf?.id));

  const osmId = props.osm_id;
  const displayData = getHydrantDisplayData(data);

  const poi = {
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
  };

  const handleSend = async () => {
    try {
      await sendToTelegram({
        lat: poi.lat,
        lon: poi.lng,
        tags: props,
        message,
        adf_id: activeAdf?.id,
        isEdit: false,
      });

      toast.success('Notificació enviada');
      setMessage('');
    } catch (err) {
      toast.error('Error enviant la notificació');
    }
  };

  const handleShowRoute = () => {
    if (!showRoute && !hasLocation) {
      toast.info('Cal activar el seguiment GPS per veure la ruta');
      return;
    }
    setShowRoute(!showRoute);
  };

  const handleOpenMaps = () => {
    openInNativeMaps(poi.lat, poi.lng, 'Destinació');
  };

  const handleSave = async () => {
    if (!activeAdf) return;
    try {
      const response = await fetch(
        `/api/hidrants/${feature.id}?adf=${activeAdf.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ui_fields: data,
            private_tags: {
              ...props.private_tags,
              observacions: observacions.trim() || undefined,
            },
          }),
        }
      );

      if (!response.ok) throw new Error('Error actualitzant dades');

      toast.success('Hidrant actualitzat');

      const { changes, originalValues } = calculateChanges(
        props.ui_fields,
        data,
        props.private_tags?.observacions || '',
        observacions.trim()
      );

      await sendToTelegram({
        lat: poi.lat,
        lon: poi.lng,
        tags: {
          ...props,
          ui_fields: data,
          private_tags: {
            ...props.private_tags,
            observacions: observacions.trim() || undefined,
          },
        },
        originalData: originalValues,
        changes: changes,
        adf_id: activeAdf.id,
        isEdit: true,
      });

      setIsEditing(false);
      if (refreshHidrants) {
        await refreshHidrants();
      } else {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error en actualitzar l'hidrant");
    }
  };

  const handleQuickStatusUpdate = async (isOperative: boolean) => {
    if (!activeAdf) return;
    const statusText = isOperative ? 'OPERATIU' : 'FORA DE SERVEI';
    if (
      !window.confirm(
        `Vols marcar aquest hidrant com a ${statusText} amb data d'avui?`
      )
    ) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const newData: HydrantUiFields = {
        ...data,
        surveyDate: today,
        estat: isOperative ? 'Operatiu' : 'Fora de servei',
      };

      const response = await fetch(
        `/api/hidrants/${feature.id}?adf=${activeAdf.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ui_fields: newData }),
        }
      );

      if (!response.ok) throw new Error('Error actualitzant');
      toast.success(`Hidrant actualitzat a ${statusText}`);

      const originalValues: any = {
        estat: props.ui_fields.estat,
        surveyDate: props.ui_fields.surveyDate,
      };

      const changes: any = {
        estat: isOperative ? 'Operatiu' : 'Fora de servei',
        surveyDate: today,
      };

      await sendToTelegram({
        lat: poi.lat,
        lon: poi.lng,
        tags: {
          ...props,
          ui_fields: newData,
        },
        originalData: originalValues,
        changes: changes,
        adf_id: activeAdf.id,
        isEdit: true,
      });

      setData(newData);
      if (refreshHidrants) {
        await refreshHidrants();
      } else {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      toast.error('Error en l’actualització ràpida');
    }
  };

  const handleDelete = async () => {
    if (!activeAdf) return;
    if (!window.confirm('Estàs segur que vols esborrar aquest hidrant?'))
      return;

    try {
      const response = await fetch(
        `/api/hidrants/${feature.id}?adf=${activeAdf.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error("Error esborrant l'hidrant");

      toast.success('Hidrant esborrat');

      // Netegem el paràmetre de la URL si era el d'aquest hidrant
      const url = new URL(window.location.href);
      if (url.searchParams.get('node') === feature.id) {
        url.searchParams.delete('node');
        window.history.replaceState({}, '', url.toString());
      }

      if (refreshHidrants) {
        await refreshHidrants();
      } else {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error en esborrar l'hidrant");
    }
  };

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

  const formatSyncStatus = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return '🟢 Sincronitzat';
      case 'PENDING_CREATE':
        return '🟡 Pendent de crear (local)';
      case 'PENDING_UPDATE':
        return '🔵 Pendent d\'actualitzar';
      case 'PENDING_DELETE':
        return '🔴 Pendent d\'esborrar';
      default:
        return status;
    }
  };

  return (
    <Popup>
      <div className="min-w-[280px]">
        {!isEditing ? (
          <>
            <div className="flex gap-[10px] items-start">
              <div className="flex-1">
                {displayData.map(({ label, value }) => (
                  <div key={label} className="text-[0.85rem] mb-[2px]">
                    <strong>{label}: </strong>
                    {value}
                  </div>
                ))}
                {user?.role === 'admin' && (
                  <div className="text-[0.75rem] text-muted mt-2 border-t border-dotted border-border pt-[4px]">
                    <strong>Sync:</strong> {formatSyncStatus(props.sync_status)}
                  </div>
                )}
                {props.private_tags?.observacions && (
                  <div className="text-[0.85rem] mt-2 border-t border-soft pt-2">
                    <strong>Observacions:</strong><br/>
                    <span className="whitespace-pre-wrap">{props.private_tags.observacions}</span>
                  </div>
                )}
              </div>
              <HydrantImages images={getHydrantImages(props.osm_tags)} />
            </div>

            <div className="flex flex-col gap-[5px] mt-3">
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickStatusUpdate(true);
                    }}
                    className="bg-[#27ae60] text-white border-0 rounded p-[6px] text-[0.75rem] cursor-pointer font-semibold"
                  >
                    ✅ Operatiu (Avui)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickStatusUpdate(false);
                    }}
                    className="bg-[#e74c3c] text-white border-0 rounded p-[6px] text-[0.75rem] cursor-pointer font-semibold"
                  >
                    ❌ Fora de servei (Avui)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className={`${primaryButtonClass} p-[6px] text-[0.75rem] mt-[2px]`}
                  >
                    ✏️ Editar dades
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className={`${primaryButtonClass} bg-[#c0392b] p-[6px] text-[0.75rem] mt-[2px]`}
                    >
                      🗑️ Esborrar hidrant
                    </button>
                  )}
                </>
              )}

              {/* Icones d'acció centrades */}
              <div className="flex justify-center items-center gap-5 mt-[10px] py-[5px]">
                {/* Compartir */}
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

                {/* Ruta */}
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

                {/* Mapes Externs */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenMaps();
                  }}
                  title="Obrir en navegador GPS"
                  className="bg-transparent border-0 cursor-pointer text-[1.4rem] p-0"
                >
                  🚕
                </button>

                {/* OpenStreetMap (Només Admin) */}
                {user?.role === 'admin' && osmId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `https://www.openstreetmap.org/node/${osmId}`,
                        '_blank'
                      );
                    }}
                    title="Veure a OpenStreetMap"
                    className="bg-transparent border-0 cursor-pointer p-0 flex items-center"
                  >
                    <OsmIcon />
                  </button>
                )}
              </div>
            </div>

            {/* Formulari de notificació (només en mode visualització) */}
            <hr className="my-2 border-t border-border" />
            <textarea
              placeholder="Enviar informació sobre aquest hidrant ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className={`${inputClass} w-full mt-[0.2rem] p-[4px]! text-[0.75rem] font-inherit`}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSend();
              }}
              className={`${primaryButtonClass} w-full mt-2 p-[6px] text-[0.75rem] flex items-center justify-center gap-2`}
            >
              Notificar <span className="text-[1rem]">➤</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            <HydrantFormFields
              data={data}
              onChange={setData}
              showSurveyDateAndStatus={true}
            />

            <label className="text-[0.75rem] italic flex flex-col gap-[4px]">
              Observacions:
              <textarea
                value={observacions}
                onChange={(e) => setObservacions(e.target.value)}
                rows={3}
                className={`${inputClass} w-full resize-y text-[0.75rem] p-[4px]!`}
                placeholder="Observacions internes de l'hidrant..."
              />
            </label>

            <div className="flex gap-[5px] mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className={`${primaryButtonClass} flex-1 p-[6px] text-[0.75rem]`}
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
                className={`${secondaryButtonClass} flex-1 p-[6px] text-[0.75rem]`}
              >
                Cancel·lar
              </button>
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
};
