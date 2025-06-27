import { Popup } from 'react-leaflet';
import { useState } from 'react';
import { sendToTelegram } from '../sendToTelegram';
import { toast } from 'react-toastify';
import { OSMFeature } from '../hooks/useHidrantData';

type NodeFormProps = {
  feature: OSMFeature;
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

export const NodeWithForm = ({ feature }: NodeFormProps) => {
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

  const handleSend = async (feature: OSMFeature) => {
    try {
      await sendToTelegram({
        lat: feature.geometry.coordinates[0],
        lon: feature.geometry.coordinates[1],
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
