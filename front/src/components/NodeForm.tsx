import { Popup } from 'react-leaflet';
import { useState } from 'react';
import { sendToTelegram } from '../utils/sendToTelegram';
import { toast } from 'react-toastify';
import { OSMFeature } from '../hooks/useHidrantData';
import { openInNativeMaps } from '../utils/geoMaps';

type NodeFormProps = {
  feature: OSMFeature;
  showRoute: boolean;
  setShowRoute: (value: boolean) => void;
};

const posicioHidrants = (key: string) => {
  switch (key) {
    case 'lane':
      return 'Calçada';
    case 'sidewalk':
      return 'Vorera';
    case 'green':
      return 'Verd';
    default:
      return 'Desconegut';
  }
};
const tipusHidrants = (key: string) => {
  switch (key) {
    case 'underground':
      return 'Subterrani';
    case 'pillar':
      return 'Columna';
    default:
      return 'Desconegut';
  }
};
const estatHidrants = (props: Record<string, string>) => {
  if (props['emergency'] === 'fire_hydrant') return 'Operatiu';
  if (props['disused:emergency'] === 'fire_hydrant') return 'Fora de servei';
  return 'Desconegut';
};

const diametreHidrant = 'Diametre';

export const NodeWithForm = ({
  feature,
  showRoute,
  setShowRoute,
}: NodeFormProps) => {
  const [message, setMessage] = useState('');

  const props = feature.properties;
  
  // ✅ Lògica per extreure l'ID de visualització:
  // Si ve d'OSM pot ser "node/12345" o "osm-12345". Volem mostrar només "12345".
  let displayId = String(feature.id);
  let osmId = props.osm_id;

  if (displayId.includes('/')) {
    displayId = displayId.split('/')[1];
  } else if (displayId.startsWith('osm-')) {
    displayId = displayId.replace('osm-', '');
  }

  // ✅ Traduim les etiquetes d'OSM a noms llegibles en català.
  const translatedTags = {
    'Data de revisió': props['survey:date'],
    Estat: estatHidrants(props),
    Tipus: tipusHidrants(props['fire_hydrant:type']),
    Posició: posicioHidrants(props['fire_hydrant:position']),
    Diametre: props['fire_hydrant:diameter'] ?? 'Desconegut',
    Adreça: `${props['addr:street'] ?? ''} ${props['addr:housenumber'] ?? ''} ${
      props['addr:neighbourhood'] ? '(' + props['addr:neighbourhood'] + ')' : ''
    }`,
  };

  const poi = {
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
  };

  const handleSend = async (feature: OSMFeature) => {
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

  const handleUpdateSurveyDate = async (isOperative: boolean) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Filtrem camps interns de properties per quedar-nos només amb els tags d'OSM
      const {
        id: _id,
        osm_id: _osm_id,
        private_tags: _private_tags,
        sync_status: _sync_status,
        updated_at: _updated_at,
        ...osmTags
      } = props;

      const newTags: Record<string, string> = { ...osmTags, 'survey:date': today };
      
      if (isOperative) {
        newTags['emergency'] = 'fire_hydrant';
        delete newTags['disused:emergency'];
      } else {
        newTags['disused:emergency'] = 'fire_hydrant';
        delete newTags['emergency'];
      }

      const response = await fetch(`/api/hidrants/${feature.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          osm_tags: newTags
        }),
      });

      if (!response.ok) throw new Error('Error actualitzant dades');
      
      const statusText = isOperative ? 'Operatiu' : 'Fora de servei';
      toast.success(`Revisió registrada (${statusText}): ${today}`);
      
      // Refresquem per veure els canvis (el color de la icona canvia segons l'estat)
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast.error('No s’ha pogut registrar la revisió');
    }
  };

  return (
    <Popup>
      <strong>Id:</strong> {displayId}
      <br />
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
          <button onClick={handleShowRoute} style={{ flex: 1, fontSize: '0.7rem' }}>
            {showRoute ? 'Tanca ruta' : 'Ruta'}
          </button>
          <button onClick={handleOpenMaps} style={{ flex: 1, fontSize: '0.7rem' }}>
            Mapes
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button 
            onClick={() => handleUpdateSurveyDate(true)}
            style={{ 
              background: '#27ae60', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              padding: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            ✅ Operatiu (Revisat avui)
          </button>
          <button 
            onClick={() => handleUpdateSurveyDate(false)}
            style={{ 
              background: '#e74c3c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              padding: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            ❌ Fora de servei (Revisat avui)
          </button>
        </div>
      </div>

      <textarea
        placeholder="Comentari per Telegram"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        style={{ width: '100%', marginTop: '0.5rem' }}
      />
      <button onClick={() => handleSend(feature)}>Enviar</button>
    </Popup>
  );
};
