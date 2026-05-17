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

  const id = String(feature.id).split('/')[1];
  const props = feature.properties;

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
  return (
    <Popup>
      <strong>Id:</strong> {id}
      <br />
      {Object.entries(translatedTags).map(([key, value]) => (
        <div key={key}>
          <strong>{key}: </strong>
          {typeof value === 'string' || typeof value === 'number'
            ? value
            : JSON.stringify(value)}
        </div>
      ))}
      <strong>Info: </strong>
      <a href={`https://www.openstreetmap.org/node/${id}`}>Veure en OSM</a>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={handleShowRoute}
          // style={{
          //   background: '#3498db',
          //   color: 'white',
          //   border: 'none',
          //   borderRadius: '6px',
          //   padding: '5px 10px',
          // }}
        >
          {showRoute ? 'Tanca la ruta' : 'Veure ruta'}
        </button>
        <button
          onClick={handleOpenMaps}
          // style={{
          //   background: '#3498db',
          //   color: 'white',
          //   border: 'none',
          //   borderRadius: '6px',
          //   padding: '5px 10px',
          // }}
        >
          Obrir a l’app de mapes
        </button>
      </div>
      <textarea
        placeholder="Comentari"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        style={{ width: '100%', marginTop: '0.5rem' }}
      />
      <button onClick={() => handleSend(feature)}>Enviar</button>
    </Popup>
  );
};
