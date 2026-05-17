# Mapa d'hidrants d'un municipi

_Toni, ADF 278 Els Hostalets de Pierola_

## Descripció

- És un projecte personal que vol ser útil per les ADFs i complementar a l'aplicació ControlAdf.
- És una eina per que les ADFs tinguin el control de les seves dades sense intermediaris.

## Característiques

- Typescript
- Frontend amb React
- Leaflet amb mapes OSM
- Backend amb Fastify / Pm2
- Nginx per reverse proxy
- Markers per a hidrants amb popup d'informació
- Enviament per Telegram de comentaris o nous hidrants
- Pantalla completa
- Ubicació actual

## Raodmap / TODO

- Cache Nginx (mapa / consultes overpass)
- Deploy automàtic
- Bd dades locals
- Rutes a poi (arreglar)
- Dades (mapa/objectes) offline al client
- Incidències
- Usuaris/autentificació
- Canvi població
- Menú inferior
  - canvi població
  - filtre poi
  - botons actuals
  - altres pàgines
- Rutes amb graphhopper
- Notificacions (Knock?)

## Requisits

- NodeJS (no gaire antic)
- Nginx

## Us

- Clonar repositori
- Des del directori de l'aplicació: `npm run dev` o `npm run deploy`

## Col·laboracions

- Si vols participar en el desenvolupament només ho has de dir.
