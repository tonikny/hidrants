# Xarxa d'Hidrants ADF

_Gestió d'hidrants d'incendis per a les ADF (Agrupacions de Defensa Forestal)_

## Descripció

Aquesta aplicació permet a les ADFs gestionar i visualitzar la xarxa d'hidrants del seu territori. És una eina pensada per tenir el control de les dades de forma independent, facilitant la revisió i el manteniment dels punts d'aigua.

## Característiques

- **Arquitectura SPA**: Aplicació de pàgina única.
- **Gestió per ADF**: Suport per a múltiples ADFs, cadascuna amb un o diversos municipis assignats.
- **Sincronització amb OSM**: Importació automàtica de dades des d'OpenStreetMap.
- **Seguretat**: Sessions amb JWT i control d'accés per rols.
- **Mapa interactiu**: Basat en Leaflet amb suport per a:
  - Visualització de limits territorials.
  - Creació i edició d'hidrants locals.
  - Vista d'imatges des d'urls incloses a OSM
  - Llista detallada d'hidrants i cerca ràpida.
  - Càlcul de rutes a hidrants mitjançant GraphHopper.
  - Enviament de notificacions i alertes a Telegram.
  - URLs compartibles per a la localització exacta de cada hidrant.
- **Exportació OSM**: Possibilitat d'exportar els canvis realitzats en format OSM per actualitzar la cartografia pública.

## Stack Tecnològic

- **Frontend**: React 19, TypeScript, Leaflet, Vite.
- **Backend**: Fastify, TypeScript, Drizzle ORM.
- **Base de dades**: SQLite (Better-SQLite3).
- **Infraestructura**: Docker, Docker Compose, Nginx.

## Scripts de Gestió

L'aplicació inclou scripts per gestionar la base de dades fàcilment des de l'arrel:

- `npm run db:setup`: Reset complet, creació d'ADFs/usuaris i importació des d'OSM.
- `npm run db:reset`: Buida completament la base de dades (usuaris i hidrants).
- `npm run db:reset-hidrants`: Esborra només els hidrants i els torna a baixar d'OSM.
- `npm run db:seed`: Crea les ADFs inicials i els usuaris administradors.
- `npm run db:import-osm`: Sincronitza els hidrants des d'OSM per a totes les ADFs.
- `npm run db:export-osm`: Genera un fitxer amb els canvis realitzats per a la seva exportació a OSM.
- `npm run update:boundaries`: Descarrega i desa les fronteres geogràfiques a la base de dades.

## Instal·lació i Ús

### Entorn de Desenvolupament

```bash
npm install
npm run dev
```

### Deploy amb Docker

Per a un desplegament automatitzat que inclou l'actualització del codi, de les dependències i de la base de dades:

```bash
npm run docker:deploy
```

---

_Projecte creat per Toni, ADF 278 Els Hostalets de Pierola._
