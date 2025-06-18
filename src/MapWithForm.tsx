// import { Popup, useMapEvents } from 'react-leaflet';
// import { useState } from 'react';
// import * as L from 'leaflet';
// import { sendToTelegram } from './sendToTelegram';
// import { Feature, Point } from 'geojson';

// // type Feature = GeoJSON.Feature<GeoJSON.Point, Record<string, any>>;

// type NodeFormProps = {
//   lat: number;
//   lon: number;
//   onClose: () => void;
// };

// export const NewNodeForm = ({ lat, lon, onClose }: NodeFormProps) => {
//   const [message, setMessage] = useState('');

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       await sendToTelegram({ lat, lon, message });
//       alert('Missatge enviat!');
//       setMessage('');
//       onClose();
//     } catch (err) {
//       console.log(err);
//       alert('Error enviant el missatge');
//     }
//   };
//   return (
//     <div
//       className="form-popup"
//       style={{
//         position: 'absolute',
//         top: 20,
//         left: 20,
//         background: '#fff',
//         padding: '1rem',
//         zIndex: 1000,
//       }}
//     >
//       <form onSubmit={handleSubmit}>
//         <p>
//           <strong>Nova proposta de node</strong>
//         </p>
//         <p>
//           📍 {lat.toFixed(5)}, {lon.toFixed(5)}
//         </p>
//         <textarea
//           placeholder="Comentari o descripció"
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           rows={4}
//           style={{ width: '100%' }}
//         />
//         <br />
//         <button type="submit">Enviar</button>
//         <button type="button" onClick={onClose}>
//           Cancel·la
//         </button>
//       </form>
//     </div>
//   );
// };

// // export const NodePopup = ({ feature }: { feature: Feature }) => {
// //   const [message, setMessage] = useState('');

// //   const handleSend = async () => {
// //     try {
// //       await sendToTelegram({
// //         lat: feature.geometry.coordinates[0],
// //         lon: feature.geometry.coordinates[1],
// //         tags: feature.properties,
// //         message,
// //       });
// //       alert('Missatge enviat!');
// //       setMessage('');
// //     } catch (err) {
// //       console.log(err);
// //       alert('Error enviant el missatge');
// //     }
// //   };import {
//   MapClickHandler,
//   NewNodeForm,
//   NodeWithForm,
//   OSMFeature,
// } from './MapWithForm';

// //   return (
// //     <div>
// //       <strong>ID:</strong> {feature.id}
// //       <br />
// //       {Object.entries(feature.properties).map(([key, value]) => (
// //         <div key={key}>
// //           <strong>{key}:</strong> {value}
// //         </div>
// //       ))}
// //       <textarea
// //         placeholder="Comentari"
// //         value={message}
// //         onChange={(e) => setMessage(e.target.value)}
// //         rows={2}
// //         style={{ width: '100%', marginTop: '0.5rem' }}
// //       />
// //       <button onClick={handleSend}>Enviar</button>
// //     </div>
// //   );
// // };

// export interface OSMFeature extends Feature {
//   id: string;
//   properties: Record<string, string>;

//   geometry: Point;
// }

// const posicioHidrants = (key: string) => {
//   switch (key) {
//     case 'lane':
//       return 'Calçada';
//     case 'sidewalk':
//       return 'Vorera';
//     case 'green':
//       return 'Verd';
//     default:
//       return 'Desconegut';
//   }
// };
// const tipusHidrants = (key: string) => {
//   switch (key) {
//     case 'underground':
//       return 'Subterrani';
//     case 'pillar':
//       return 'Columna';
//     default:
//       return 'Desconegut';
//   }
// };
// const estatHidrants = (props: Record<string, string>) => {
//   if (props['emergency'] === 'fire_hydrant') return 'Operatiu';
//   if (props['disused:emergency'] === 'fire_hydrant') return 'Fora de servei';
//   return 'Desconegut';
// };

// const diametreHidrant = 'Diametre';

// export const NodeWithForm = ({ feature }: { feature: OSMFeature }) => {
//   const [message, setMessage] = useState('');

//   const props = feature.properties;
//   const translatedTags = {
//     'Data de revisió': props['survey:date'],
//     Estat: estatHidrants(props),
//     Tipus: tipusHidrants(props['fire_hydrant:type']),
//     Posició: posicioHidrants(props['fire_hydrant:position']),
//     Diametre: props['fire_hydrant:diameter'] ?? 'Desconegut',
//     Adreça: `${props['addr:street']} ${props['addr:housenumber'] ?? ''} (${
//       props['addr:neighbourhood'] ?? ''
//     })`,
//   };

//   const handleSend = async (feature: OSMFeature) => {
//     try {
//       await sendToTelegram({
//         lat: feature.geometry.coordinates[0],
//         lon: feature.geometry.coordinates[1],
//         tags: feature?.properties,
//         message,
//       });

//       alert('Missatge enviat!');
//       setMessage('');
//     } catch (err) {
//       console.log(err);
//       alert('Error enviant el missatge');
//     }
//   };
//   return (
//     <Popup>
//       <strong>Id:</strong> {feature.id}
//       <br />
//       {Object.entries(translatedTags).map(([key, value]) => (
//         <div key={key}>
//           <strong>{key}:</strong>
//           {typeof value === 'string' || typeof value === 'number'
//             ? value
//             : JSON.stringify(value)}
//         </div>
//       ))}
//       <strong>Info: </strong>
//       <a href={`https://www.openstreetmap.org/node/${feature.id}`}>
//         Veure en OSM
//       </a>
//       <textarea
//         placeholder="Comentari"
//         value={message}
//         onChange={(e) => setMessage(e.target.value)}
//         rows={2}
//         style={{ width: '100%', marginTop: '0.5rem' }}
//       />
//       <button onClick={() => handleSend(feature)}>Enviar</button>
//     </Popup>
//   );
// };
// export const MapClickHandler = ({
//   onClick,
// }: {
//   onClick: (latlng: L.LatLng) => void;
// }) => {
//   useMapEvents({
//     click(e) {
//       onClick(e.latlng);
//     },
//   });
//   return null;
// };
