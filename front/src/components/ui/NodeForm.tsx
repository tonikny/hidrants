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

type NodeFormProps = {
  feature: HidrantFeature;
  showRoute: boolean;
  setShowRoute: (value: boolean) => void;
};

export const NodeWithForm = ({
  feature,
  showRoute,
  setShowRoute,
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
      });

      toast.success('Missatge enviat!');
      setMessage('');
    } catch (err) {
      toast.error('Error enviant el missatge');
    }
  };

  const handleShowRoute = () => {
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

      toast.success('Canvis desats correctament');
      setIsEditing(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error('No s’han pogut desar els canvis');
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
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Error en l’actualització ràpida');
    }
  };

  return (
    <Popup>
      <div style={{ minWidth: '220px' }}>
        <strong>Id:</strong> {osmId || feature.id}
        <br />
        {!isEditing ? (
          <>
            {displayData.map(({ label, value }) => (
              <div key={label}>
                <strong>{label}: </strong>
                {value}
              </div>
            ))}
            {osmId && (
              <>
                <strong>Info: </strong>
                <a
                  href={`https://www.openstreetmap.org/node/${osmId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Veure en OSM
                </a>
              </>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                marginTop: '0.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '5px',
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowRoute();
                  }}
                  style={{
                    ...secondaryButtonStyle,
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '6px',
                  }}
                >
                  {showRoute ? 'Tanca ruta' : 'Ruta'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenMaps();
                  }}
                  style={{
                    ...secondaryButtonStyle,
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '6px',
                  }}
                >
                  Mapes
                </button>
              </div>

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
                    }}
                  >
                    ✏️ Editar dades
                  </button>
                </>
              )}
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
          placeholder="Comentaris ..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          style={{
            ...inputStyle,
            width: '100%',
            marginTop: '0.2rem',
            padding: '4px',
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
