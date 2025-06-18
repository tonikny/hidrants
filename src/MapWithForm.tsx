import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import { useState } from 'react';
import * as L from 'leaflet';

type Feature = GeoJSON.Feature<GeoJSON.Point, Record<string, any>>;

type NodeFormProps = {
  lat: number;
  lon: number;
  onClose: () => void;
};

// export const sendToTelegram = async (formData: {
//   lat: number;
//   lon: number;
//   tags: Record<string, string>;
// }) => {
//   const token = 'TEU_TOKEN'; // ⬅️ Canvia-ho pel teu token
//   const chatId = 'TEU_CHAT_ID'; // ⬅️ Canvia-ho pel teu chat ID

//   const text = `
// 🆕 Nova proposta o comentari OSM
// 📍 ${formData.lat.toFixed(5)}, ${formData.lon.toFixed(5)}
// 📝 Dades:
// ${Object.entries(formData.tags)
//   .map(([k, v]) => `- ${k}: ${v}`)
//   .join('\n')}
// `;

//   await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       chat_id: chatId,
//       text,
//     }),
//   });
// };

export const NodeForm = ({ lat, lon, onClose }: NodeFormProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // await sendToTelegram({
    //   lat,
    //   lon,
    //   tags: { message },
    // });

    const handleSend = async () => {
      try {
        const res = await fetch(
          'https://hidrants.vercel.app/api/sendToTelegram',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lat,
              lon,
              // tags: selectedFeature?.properties || {},
              message,
            }),
          }
        );

        if (!res.ok) throw new Error('Error enviant el missatge');

        alert('Missatge enviat!');
        setMessage(''); // buida el formulari
        onClose();
      } catch (err) {
        console.error('Error:', err);
        alert('Error enviant el missatge');
      }
    };
    await handleSend();
  };

  return (
    <div
      className="form-popup"
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: '#fff',
        padding: '1rem',
        zIndex: 1000,
      }}
    >
      <form onSubmit={handleSubmit}>
        <p>
          <strong>Nova proposta de node</strong>
        </p>
        <p>
          📍 {lat.toFixed(5)}, {lon.toFixed(5)}
        </p>
        <textarea
          placeholder="Comentari o descripció"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          style={{ width: '100%' }}
        />
        <br />
        <button type="submit">Enviar</button>
        <button type="button" onClick={onClose}>
          Cancel·la
        </button>
      </form>
    </div>
  );
};

export const NodePopup = ({ feature }: { feature: Feature }) => {
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    // await sendToTelegram({
    //   lat: feature.geometry.coordinates[1],
    //   lon: feature.geometry.coordinates[0],
    //   tags: {
    //     ...feature.properties,
    //     comment: message,
    //   },
    // });
    try {
      const res = await fetch(
        'https://hidrants.vercel.app/api/sendToTelegram',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: feature.geometry.coordinates[0],
            lon: feature.geometry.coordinates[1],
            //   tags: selectedFeature?.properties || {},
            message,
          }),
        }
      );

      if (!res.ok) throw new Error('Error enviant el missatge');

      alert('Missatge enviat!');
      setMessage(''); // buida el formulari
    } catch (err) {
      console.error('Error:', err);
      alert('Error enviant el missatge');
    }
  };

  return (
    <div>
      <strong>ID:</strong> {feature.id}
      <br />
      {Object.entries(feature.properties).map(([key, value]) => (
        <div key={key}>
          <strong>{key}:</strong> {value}
        </div>
      ))}
      <textarea
        placeholder="Comentari"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        style={{ width: '100%', marginTop: '0.5rem' }}
      />
      <button onClick={handleSend}>Enviar</button>
    </div>
  );
};

export const MapClickHandler = ({
  onClick,
}: {
  onClick: (latlng: L.LatLng) => void;
}) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
};

// export const MapWithForm = ({ features }: { features: Feature[] }) => {
//   const [clickedPosition, setClickedPosition] = useState<
//     [number, number] | null
//   >(null);

//   return (
//     <>
//       <MapContainer
//         center={[41.38, 2.17]}
//         zoom={13}
//         style={{ height: '100vh' }}
//       >
//         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

//         {features.map((feature) => {
//           const coords = feature.geometry.coordinates;
//           return (
//             <Marker key={feature.id} position={[coords[1], coords[0]]}>
//               <Popup>
//                 <NodePopup feature={feature} />
//               </Popup>
//             </Marker>
//           );
//         })}

//         <MapClickHandler
//           onClick={(latlng) => setClickedPosition([latlng.lat, latlng.lng])}
//         />
//       </MapContainer>

//       {clickedPosition && (
//         <NodeForm
//           lat={clickedPosition[0]}
//           lon={clickedPosition[1]}
//           onClose={() => setClickedPosition(null)}
//         />
//       )}
//     </>
//   );
// };
