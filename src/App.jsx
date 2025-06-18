import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import osm2geojson from 'osm2geojson-lite'
import { useEffect, useState } from 'react'

// 👇 Icona bàsica per evitar errors amb les icones per defecte
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function App() {
  const [features, setFeatures] = useState([])

  useEffect(() => {
    const query = `
      [out:json][timeout:60];
      area(3600345695)->.searchArea;
      (
      node(area.searchArea)["emergency"="fire_hydrant"];
      node(area.searchArea)["disused:emergency"="fire_hydrant"];
      );
      out center tags;
    `
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    })
      .then(res => res.json())
      .then(data => {
        const geojson = osm2geojson(data)
        setFeatures(geojson.features)
      })
  }, [])

  return (
    <MapContainer center={[41.5474, 1.7954]} zoom={15} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {features.map((feature, i) => {
        const coords = feature.geometry.coordinates
        const tags = feature.properties.tags || {}

        // Si és un node (punt), el renderitzem
        if (feature.geometry.type === 'Point') {
          return (
            <Marker key={i} position={[coords[1], coords[0]]}>
              <Popup>
                <strong>ID:</strong> {feature.id}<br />
                {Object.entries(tags).map(([key, value]) => (
                  <div key={key}><strong>{key}:</strong> {value}</div>
                ))}
              </Popup>
            </Marker>
          )
        }

        return null
      })}
    </MapContainer>
  )
}
