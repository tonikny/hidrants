import { useEffect } from 'react'
import L from 'leaflet'
import osm2geojson from 'osm2geojson-lite'

function App() {
  useEffect(() => {
    const map = L.map('map').setView([41.3851, 2.1734], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    const query = `
      [out:json][timeout:25];
      (
        node["leisure"="park"](around:3000,41.3851,2.1734);
        way["leisure"="park"](around:3000,41.3851,2.1734);
        relation["leisure"="park"](around:3000,41.3851,2.1734);
      );
      out body;
      >;
      out skel qt;
    `

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    })
      .then(r => r.json())
      .then(data => {
        const geojson = osm2geojson(data)
        L.geoJSON(geojson).addTo(map)
      })
  }, [])

  return <div id="map" />
}

export default App
