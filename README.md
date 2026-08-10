# Xarxa d'Hidrants ADF

_Gestió d'hidrants d'incendis per a les ADF (Agrupacions de Defensa Forestal)_

## Descripció

Aquesta aplicació permet a les ADFs gestionar i visualitzar la xarxa d'hidrants del seu territori. És una eina pensada per tenir el control de les dades de forma independent, facilitant la revisió i el manteniment dels punts d'aigua, el seguiment d'incidències i la localització de les unitats en temps real.

## Característiques

- **Arquitectura SPA**: Aplicació de pàgina única, amb suport per a múltiples ADFs, cadascuna amb un o diversos municipis assignats.
- **Dades geogràfiques per ADF**: Les fronteres (GeoJSON), l'BBOX i el center es desen directament a la taula `adfs`, sense dependre de municipis individuals.
- **Sincronització amb OSM**: Importació automàtica de dades des d'OpenStreetMap.
- **Gestió d'incidències**: Registre i seguiment d'incidències associades als hidrants.
- **Tracking en temps real (MQTT/OwnTracks)**: Recepció d'ubicacions GPS de les unitats per conèixer-ne la posició sobre el mapa.
- **Notificacions Telegram per ADF**: Cada ADF pot tenir el seu bot i un grup de Telegram on rep automàticament els avisos (incidències, altes i edicions d'hidrants). Configuració guiada des de la pestanya **Configuració → Notificacions de Telegram**: token xifrat, deep link `startgroup` d'un sol ús i avís de prova directament al grup.
- **Seguretat**: Sessions amb JWT i control d'accés per rols; el backend és resilient i funciona encara que Mosquitto no estigui disponible.
- **Mapa interactiu**: Basat en Leaflet amb suport per a:
  - Visualització de límits territorials.
  - Creació i edició d'hidrants locals.
  - Vista d'imatges des d'URLs incloses a OSM.
  - Llista detallada d'hidrants i cerca ràpida.
  - Càlcul de rutes a hidrants mitjançant GraphHopper.
  - URLs compartibles per a la localització exacta de cada hidrant.
- **Exportació OSM**: Possibilitat d'exportar els canvis realitzats en format OSM per actualitzar la cartografia pública.
- **Backups automàtics**: Sistema complet de còpies de seguretat de la base de dades amb rotació (diària, setmanal, mensual i semestral).

## Stack Tecnològic

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Leaflet, React Leaflet.
- **Backend**: Fastify 5, TypeScript, Drizzle ORM, Zod.
- **Base de dades**: SQLite (Better-SQLite3).
- **Messaging**: Eclipse Mosquitto 2 (MQTT) + OwnTracks.
- **Infraestructura**: Docker, Docker Compose, Nginx, GraphHopper.

## Instal·lació i Ús

### Entorn de Desenvolupament

Per desenvolupar localment cal configurar les variables d'entorn del backend i de Mosquitto, inicialitzar la base de dades i aixecar el broker MQTT. Per a tot el procés pas a pas, consulta [docs/DEV.md](docs/DEV.md).

### Deploy amb Docker

Per a producció, el projecte s'orquestra amb Docker Compose (frontend servit per Nginx, backend i broker Mosquitto). El desplegament automatitzat actualitza el codi, les dependències i la base de dades. La guia completa, inclosa la configuració MQTT amb certificats i els backups automàtics, es troba a [docs/DEPLOY.md](docs/DEPLOY.md).

---

_Projecte creat per Toni, ADF 278 Els Hostalets de Pierola._
