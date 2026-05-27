import { Popup } from 'react-leaflet';
import { useState, useEffect } from 'react';
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
  selectStyle,
} from '../../styles/uiStyles';
import { HydrantOsmTags, osm2Ui, ui2Osm } from '../../utils/osmConversion';

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
  const uiData = osm2Ui(props);
  // console.log('props', props);

  // console.log('uiData', uiData);

  // Estat per l'edició
  const [data, setData] = useState(uiData);

  const canEdit =
    user &&
    (user.role === 'admin' ||
      (user.role === 'editor' && user.adf_id === activeAdf?.id));

  let displayId = String(feature.id);
  let osmId = props.osm_id;

  if (displayId.includes('/')) {
    displayId = displayId.split('/')[1];
  } else if (displayId.startsWith('osm-')) {
    displayId = displayId.replace('osm-', '');
  }

  const translatedTags = {
    'Data de revisió': props['survey:date'],
    Estat: data.estat,
    Tipus: data.type,
    Posició: data.position,
    Acoblaments: data.couplings || 'Desconegut',
    Diàmetres: Number(data.diameters) || 'Desconegut',
    Pressió: data.pressure || 'Desconeguda',
    Adreça: `${data.street ?? ''} ${data.num ?? ''} ${
      data.urbanitzacio ? '(' + data.urbanitzacio + ')' : ''
    }`,
  };

  const poi = {
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
  };

  const handleSend = async (feature: HidrantFeature) => {
    console.log('feature', feature.properties.osm_id);

    try {
      await sendToTelegram({
        lat: poi.lat,
        lon: poi.lng,
        tags: feature?.properties,
        message,
      });

      toast.success('Missatge enviat!');
      setMessage('');
    } catch (err) {
      console.log(err);
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
      const {
        id: _id,
        osm_id: _osm_id,
        private_tags: _private_tags,
        sync_status: _sync_status,
        updated_at: _updated_at,
        ...osmTags
      } = props;

      const newTags: HydrantOsmTags = {
        ...osmTags,
        ...ui2Osm(data),
      };
      console.log('newTags', newTags);

      const response = await fetch(
        `/api/hidrants/${feature.id}?adf=${activeAdf.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            osm_tags: newTags,
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
      const {
        id: _id,
        osm_id: _osm_id,
        private_tags: _private_tags,
        sync_status: _sync_status,
        updated_at: _updated_at,
        ...newTags
      } = props;

      newTags['survey:date'] = today;
      if (isOperative) {
        newTags['emergency'] = 'fire_hydrant';
        delete newTags['disused:emergency'];
      } else {
        newTags['disused:emergency'] = 'fire_hydrant';
        delete newTags['emergency'];
      }

      const response = await fetch(
        `/api/hidrants/${feature.id}?adf=${activeAdf.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ osm_tags: newTags }),
        }
      );

      if (!response.ok) throw new Error('Error actualitzant');
      toast.success(`Hidrant actualitzat a ${statusText}`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Error en l’actualització ràpida');
    }
  };

  return (
    <Popup>
      <div style={{ minWidth: '220px' }}>
        <strong>Id:</strong> {displayId}
        <br />
        {!isEditing ? (
          <>
            {Object.entries(translatedTags).map(([key, value]) => (
              <div key={key}>
                <strong>{key}: </strong>
                {typeof value === 'string' || typeof value === 'number'
                  ? value
                  : JSON.stringify(value)}
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{ flex: 1, fontSize: '0.75rem' }}>
                Estat:
                <select
                  value={data.estat === 'Operatiu' ? 'true' : 'false'}
                  // onChange={(e) => setEditOperative(e.target.value === 'true')}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      estat: e.target.value ? 'Operatiu' : 'Fora de servei',
                    }))
                  }
                  style={selectStyle}
                >
                  <option value="true">Operatiu</option>
                  <option value="false">Fora de servei</option>
                </select>
              </label>
              <label style={{ flex: 1, fontSize: '0.75rem' }}>
                Data revisió:
                <input
                  type="date"
                  value={data.surveyDate}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, surveyDate: e.target.value }))
                  }
                  style={{ ...inputStyle, padding: '2px' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{ flex: 1, fontSize: '0.75rem' }}>
                Tipus:
                <select
                  value={data.type}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  style={selectStyle}
                >
                  <option value=""></option>
                  <option value="Columna">Columna</option>
                  <option value="Subterrani">Subterrani</option>
                </select>
              </label>
              <label style={{ flex: 1, fontSize: '0.75rem' }}>
                Posició:
                <select
                  value={data.position}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, position: e.target.value }))
                  }
                  style={selectStyle}
                >
                  <option value=""></option>
                  <option value="Calçada">Calçada</option>
                  <option value="Vorera">Vorera</option>
                  <option value="Verd">Verd</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{ flex: 1, fontSize: '0.75rem' }}>
                Acoblaments:
                <select
                  value={data.couplings}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, couplings: e.target.value }))
                  }
                  style={selectStyle}
                >
                  <option value=""></option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </label>
              <label style={{ flex: 1, fontSize: '0.75rem' }}>
                Pressió (bar):
                <input
                  type="number"
                  value={data.pressure}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, pressure: e.target.value }))
                  }
                  style={inputStyle}
                />
              </label>
            </div>

            {Number(data.couplings) > 0 && (
              <label style={{ fontSize: '0.75rem' }}>
                Diàmetres (mm):
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.3rem',
                    marginTop: '0.2rem',
                  }}
                >
                  {Array.from({ length: Number(data.couplings) }, (_, i) => (
                    <select
                      key={i}
                      value={data.diameters.split(';')[i]}
                      onChange={(e) => {
                        const nd = [...data.diameters];
                        nd[i] = e.target.value;
                        setData((prev) => ({
                          ...prev,
                          diameters: nd.join(';'),
                        }));
                        setData((prev) => ({
                          ...prev,
                          diameters: e.target.value,
                        }));
                      }}
                      style={{ ...selectStyle, flex: '1 1 30%' }}
                    >
                      <option value=""></option>
                      <option value="45">45</option>
                      <option value="70">70</option>
                      <option value="100">100</option>
                    </select>
                  ))}
                </div>
              </label>
            )}
            <label style={{ fontSize: '0.75rem' }}>
              Carrer:
              <input
                type="text"
                value={data.street}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, street: e.target.value }))
                }
                style={inputStyle}
              />
            </label>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{ flex: 1, fontSize: '0.75rem' }}>
                Núm:
                <input
                  type="text"
                  value={data.num}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, num: e.target.value }))
                  }
                  style={inputStyle}
                />
              </label>
              <label style={{ flex: 2, fontSize: '0.75rem' }}>
                Urb:
                <input
                  type="text"
                  value={data.urbanitzacio}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      urbanitzacio: e.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </label>
            </div>

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
            handleSend(feature);
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
