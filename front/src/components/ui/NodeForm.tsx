import { Popup } from 'react-leaflet';
import { useState } from 'react';
import { sendToTelegram } from '../../utils/sendToTelegram';
import { toast } from 'react-toastify';
import { HidrantFeature } from '../../hooks/useHidrantData';
import { openInNativeMaps } from '../../utils/geoMaps';
import { useAuth } from '../../contexts/AuthContext';
import { useAdf } from '../../contexts/AdfContext';
import {
  inputStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from '../../styles/uiStyles';
import {
  getHydrantDisplayData,
  HydrantUiFields,
} from '../../utils/osmConversion';
import { HydrantFormFields } from './HydrantFormFields';
import { ShareIcon, OsmIcon } from './Icons';

type NodeFormProps = {
  feature: HidrantFeature;
  showRoute: boolean;
  setShowRoute: (value: boolean) => void;
  refreshHidrants?: () => Promise<void>;
  hasLocation?: boolean;
};

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
          }),
        }
      );

      if (!response.ok) throw new Error('Error actualitzant dades');

      toast.success('Hidrant actualitzat');
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

  return (
    <Popup>
      <div style={{ minWidth: '220px' }}>
        {!isEditing ? (
          <>
            {displayData.map(({ label, value }) => (
              <div key={label}>
                <strong>{label}: </strong>
                {value}
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                marginTop: '0.8rem',
              }}
            >
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickStatusUpdate(true);
                    }}
                    style={{
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    ✅ Operatiu (Avui)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickStatusUpdate(false);
                    }}
                    style={{
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
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
                    style={{
                      ...primaryButtonStyle,
                      padding: '6px',
                      fontSize: '0.75rem',
                      marginTop: '2px',
                    }}
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
                      style={{
                        ...primaryButtonStyle,
                        backgroundColor: '#c0392b',
                        padding: '6px',
                        fontSize: '0.75rem',
                        marginTop: '2px',
                      }}
                    >
                      🗑️ Esborrar hidrant
                    </button>
                  )}
                </>
              )}

              {/* Icones d'acció centrades */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '20px',
                  marginTop: '10px',
                  padding: '5px 0',
                }}
              >
                {/* Compartir */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  title="Compartir ubicació"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                  }}
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
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.4rem',
                    padding: '0',
                    filter: showRoute ? 'none' : 'grayscale(100%)',
                  }}
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
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.4rem',
                    padding: '0',
                  }}
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
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <OsmIcon />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            <HydrantFormFields
              data={data}
              onChange={setData}
              showSurveyDateAndStatus={true}
            />

            <div style={{ display: 'flex', gap: '5px', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                style={{
                  ...primaryButtonStyle,
                  flex: 1,
                  padding: '6px',
                  fontSize: '0.75rem',
                }}
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
                style={{
                  ...secondaryButtonStyle,
                  flex: 1,
                  padding: '6px',
                  fontSize: '0.75rem',
                }}
              >
                Cancel·lar
              </button>
            </div>
          </div>
        )}
        <hr style={{ margin: '0.5rem 0', border: '1px solid #ccc' }} />
        <textarea
          placeholder="Enviar informació sobre aquest hidrant ..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          style={{
            ...inputStyle,
            width: '100%',
            marginTop: '0.2rem',
            padding: '4px',
            fontSize: '0.75rem',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSend();
          }}
          style={{
            ...primaryButtonStyle,
            width: '100%',
            marginTop: '0.5rem',
            padding: '6px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          Notificar <span style={{ fontSize: '1rem' }}>➤</span>
        </button>
      </div>
    </Popup>
  );
};
