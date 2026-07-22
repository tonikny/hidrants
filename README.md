# Xarxa d'Hidrants ADF

_Gestió d'hidrants d'incendis per a les ADF (Agrupacions de Defensa Forestal)_

## Descripció

Aquesta aplicació permet a les ADFs gestionar i visualitzar la xarxa d'hidrants del seu territori. És una eina pensada per tenir el control de les dades de forma independent, facilitant la revisió i el manteniment dels punts d'aigua.

## Característiques

- **Arquitectura SPA**: Aplicació de pàgina única.
- **Gestió per ADF**: Suport per a múltiples ADFs, cadascuna amb un o diversos municipis assignats.
- **Sincronització amb OSM**: Importació automàtica de dades des d'OpenStreetMap.
- **Tracking en temps real**: Integració amb OwnTracks mitjançant MQTT per seguiment d'ubicacions.
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
- **MQTT**: Eclipse Mosquitto per tracking amb OwnTracks.
- **Infraestructura**: Docker, Docker Compose, Nginx.

## Scripts de Gestió

L'aplicació inclou scripts per gestionar la base de dades i els serveis fàcilment des de l'arrel:

### Base de Dades
- `npm run db:setup`: Reset complet, creació d'ADFs/usuaris i importació des d'OSM.
- `npm run db:reset`: Buida completament la base de dades (usuaris i hidrants).
- `npm run db:reset-hidrants`: Esborra només els hidrants i els torna a baixar d'OSM.
- `npm run db:seed`: Crea les ADFs inicials i els usuaris administradors.
- `npm run db:import-osm`: Sincronitza els hidrants des d'OSM (totes les ADFs o una d'específica: `npm run db:import-osm -- ID_ADF`).
- `npm run db:export-osm`: Genera fitxer OSM per a JOSM amb canvis locals (totes les ADFs o una d'específica: `npm run db:export-osm -- ID_ADF`).
- `npm run update:boundaries`: Descarrega i desa les fronteres geogràfiques (totes les ADFs o una d'específica: `npm run update:boundaries -- ID_ADF`).

### MQTT
- `npm run mqtt:up`: Aixeca el broker Mosquitto amb Docker (port 1883 per desenvolupament).

### Docker
- `npm run docker:up`: Aixeca tots els serveis (backend, frontend, mosquitto).
- `npm run docker:down`: Atura tots els serveis.
- `npm run docker:logs`: Mostra els logs en temps real.
- `npm run docker:deploy`: Desplegament complet (git pull + build + reinici).


## Instal·lació i Ús

### Entorn de Desenvolupament

Consulta la [Guia de Desenvolupament (DEV.md)](./DEV.md) per instruccions detallades.

**Resum ràpid:**

```bash
# Instal·lar dependències
npm install

# Configurar variables d'entorn
cp back/.env.example back/.env
# Edita back/.env amb els teus valors

# Inicialitzar base de dades
npm run db:setup

# Aixecar MQTT (opcional)
npm run mqtt:up

# Executar en desenvolupament
npm run dev
```

- **Frontend**: `http://localhost:3003`
- **Backend**: `http://localhost:3033`
- **Mosquitto MQTT**: `mqtt://localhost:1883`

### Deploy amb Docker

Per a un desplegament automatitzat que inclou l'actualització del codi, de les dependències i de la base de dades:

```bash
npm run docker:deploy
```

Consulta la [Guia de Deploy (DEPLOY.md)](./DEPLOY.md) per més detalls sobre producció.

---

_Projecte creat per Toni, ADF 278 Els Hostalets de Pierola._
