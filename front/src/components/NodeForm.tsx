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

  const handleUpdateSurveyDate = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/hidrants/${feature.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          osm_tags: { ...props, 'survey:date': today }
        }),
      });

      if (!response.ok) throw new Error('Error actualitzant dades');
      
      toast.success(`Revisió registrada: ${today}`);
      // Donat que estem usant estats locals, caldria refrescar la llista
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
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
        
        <button 
          onClick={handleUpdateSurveyDate}
          style={{ 
            background: '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            padding: '4px',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          ✅ Registra revisió avui
        </button>
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
