# Guia de Desenvolupament Local

## Instal·lació

```bash
cp back/.env.example back/.env
cp mosquitto/config/mosquitto.dev.conf.example mosquitto/config/mosquitto.conf
npm run install
npm run db:setup
npm run mqtt:sync-dynsec
```

**Nota:** `mqtt:sync-dynsec` genera `mosquitto/data/dynamic-security.json` llegint les contrasenyes MQTT de `back/.env` (`MQTT_ADMIN_PASSWORD`, `MQTT_BACKEND_PASSWORD`). Cal executar-ho abans de `npm run mqtt:up`.

Per backend local fora de Docker:

```env
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_TOPIC_PREFIX=owntracks/hidrants
OTRC_PORT=51823
```

Per backend dins Docker:

```env
MQTT_BROKER_URL=mqtt://mosquitto:1883
```

## Execució

Frontend + backend local:

```bash
npm run mqtt:up
npm run dev
```

Tot amb Docker:

```bash
npm run docker:up
npm run docker:logs
```

URLs:

- Frontend local: `http://localhost:3003`
- Backend local: `http://localhost:3033`
- Frontend Docker: `http://localhost:8080`
- Backend Docker: `http://localhost:3034`
- Mosquitto intern/dev: `mqtt://localhost:1883`

## Scripts

- `npm run mqtt:up`: aixeca només Mosquitto.
- `npm run mqtt:cleanup`: alinea `mqtt_users.mqtt_username` amb el nom d'usuari actual i esborra clients DynSec orfes. Dry-run per defecte; aplica els canvis amb `npm run mqtt:cleanup -- --apply` (`back/src/scripts/cleanupMqtt.ts`).
- `npm run docker:up`: aixeca tots els contenidors.
- `npm run docker:down`: atura contenidors.
- `npm run docker:deploy`: deploy complet (pull `--ff-only --autostash` + rebuild).
- `npm run db:setup`: reset + seed + import OSM + boundaries.
- `npm run update:boundaries`: actualitza límits ADF.

## MQTT / OwnTracks

El backend escolta `${MQTT_TOPIC_PREFIX}/#`. Per defecte: `owntracks/hidrants/#`.

**Identitat MQTT aplanada**: l'ACL de Mosquitto DynSec no admet usernames MQTT amb `/`. Per això la identitat OwnTracks (client DynSec `owntracks-device` i topics) substitueix les `/` per `_`: `278/GI/011` → `278_GI_011` (conversió amb `mqttNameFor()` a `back/src/services/mqtt.ts`). `/api/tracking/positions` la reverteix per mostrar l'username real a la UI. Si queden clients antics orfes, neteja amb `npm run mqtt:cleanup -- --apply`.

OwnTracks rep `.otrc` des de la UI. En producció ha d'apuntar a:

```env
OTRC_HOST=<DOMINI>
OTRC_PORT=51823
OTRC_TLS=true
```

En desenvolupament el broker escolta sense TLS al port 51823 (publicat a `0.0.0.0` a `docker-compose.yml`). El `.otrc` ha d'apuntar a la IP LAN de la màquina dev amb `OTRC_TLS=false`:

```env
OTRC_HOST=<IP_LAN_DEV>
OTRC_PORT=51823
OTRC_TLS=false
```

En producció, el 51823 usa TLS. El listener del mateix port a dev és pla (sense TLS).

Prova manual amb credencials DynSec vàlides:

```bash
docker compose exec mosquitto mosquitto_pub -h localhost -u <usuari> -P <password> -t 'owntracks/hidrants/<usuari>/phone' -m '{"_type":"location","lat":41.5,"lon":1.8,"tst":1721667688,"acc":10,"batt":80}'
```

## Notificacions Telegram per ADF

Cada ADF pot tenir el seu bot de Telegram i un grup on rep els avisos (incidències, alts i edicions d'hidrants). Es configura des de la pestanya **Configuració → Notificacions de Telegram**: el backend registra el bot (token xifrat a la DB), genera un deep link `startgroup` d'un sol ús (15 min) i el webhook completa la vinculació quan el bot s'afegeix al grup.

El backend rep les actualitzacions de Telegram a:

```
POST /api/telegram/webhook/:secret
```

### Dev local: cal un túnel

Telegram exigeix que el webhook sigui **HTTPS amb un certificat de confiança** (rebutja self-signed i IPs privades). Un nip.io amb cert `mkcert` NO serveix. La manera més senzilla és un túnel de Cloudflare (cert vàlid, sense registre):

```bash
npx -y cloudflared tunnel --url http://localhost:3033
```

Copia la URL que genera (`https://xxx.trycloudflare.com`) a `back/.env` i reinicia el backend:

```env
WEBHOOK_PUBLIC_URL=https://xxx.trycloudflare.com
```

Comprova que Telegram hi arriba:

```bash
curl https://xxx.trycloudflare.com/api/telegram/webhook/prova
# {"ok":false}
```

**Avís:** la URL del túnel _quick_ de Cloudflare canvia a cada execució. Per una URL estable, crea un túnel amb nom (`cloudflared tunnel create`) o fes servir un certificat de veritat al teu host.

**Com es construeix la URL del webhook:** si `WEBHOOK_PUBLIC_URL` està definit, s'usa tal qual. Si no, es deriva del `Host` de la petició de registre (per tant, en producció cal entrar per un domini públic, on ja funciona). Si en dev accedeixes per `localhost:5173` sense la variable, el backend generaria una URL LAN no accessible per Telegram.

Self-test de la lògica de vinculació (sense xarxa):

```bash
npm run telegram:selftest
```

## Sincronització amb OSM

El projecte suporta sincronització bidireccional amb OpenStreetMap: descarregar hidrants existents (pull) i publicar canvislocals (push).

### Configuració

Per al push sync, cal afegir a `back/.env`:

```env
OSM_ACCESS_TOKEN=el_teu_token_oauth2_aqui
#OSM_API_URL=https://api.openstreetmap.org/api/0.6
```

El token OAuth 2.0 d'OSM no expira. Registrar l'aplicació a: https://www.openstreetmap.org/oauth2/applications (scope: `write_api`). Sense aquesta variable, el push sync retornarà error. La pull sync funciona sense token (usa Overpass API pública).

### Pull sync (importació)

```bash
npm run db:import-osm
# o via API: POST /api/hidrants/sync?adf=<ID>
```

Descarrega hidrants des d'OpenStreetMap via Overpass API per a les relacions de l'ADF activa.

**Comportament segons l'estat local:**

| Estat local      | Pull sync normal                             | Pull sync amb `force=true` |
| ---------------- | -------------------------------------------- | -------------------------- |
| `SYNCED`         | Actualitza des d'OSM                         | Actualitza des d'OSM       |
| `PENDING_CREATE` | No toca (es manté)                           | Sobreescriu → SYNCED       |
| `PENDING_UPDATE` | No toca si local és més nou; sinó → CONFLICT | Sobreescriu → SYNCED       |
| `PENDING_DELETE` | No toca                                      | Torna d'OSM → SYNCED       |
| `CONFLICT`       | No toca                                      | Sobreescriu → SYNCED       |
| `ERROR`          | No toca                                      | Sobreescriu → SYNCED       |
| `REVIEW`         | No toca                                      | Sobreescriu → SYNCED       |

**Paràmetre force:**

```bash
# Pull sync normal (respecta canvis locals)
POST /api/hidrants/sync?adf=<ID>
Body: {}

# Pull sync amb force (sobreescriu tot)
POST /api/hidrants/sync?adf=<ID>
Body: { "force": true }
```

### Push sync (publicació)

```bash
npm run db:export-osm
# o via API: POST /api/osm/push-sync
```

Publica els canvis pendents (`PENDING_CREATE`, `PENDING_UPDATE`, `PENDING_DELETE`) cap a OSM. Gestiona:

- **Conflictes de versió (409)**: intenta resolució automàtica, sinó marca `CONFLICT`.
- **Errors**: marca `ERROR` amb detalls.

**Push selectiu:**

```bash
# Pujar només hidrants seleccionats
POST /api/osm/push-selected
Body: { "ids": ["abc123", "def456"] }
```

**Descartar canvis:**

```bash
# Descartar canvis seleccionats
POST /api/osm/discard-selected
Body: { "ids": ["abc123", "def456"] }
```

Els `PENDING_CREATE` s'esborren de la BD; la resta es marca com a `SYNCED`.

**Baixar un node individual d'OSM:**

```bash
# Aplicar versió d'OSM a un hidrant (sobreescriu locals)
POST /api/osm/pull-hydrant
Body: { "id": "abc123" }
```

### UI del panell de sincronització

`OsmSyncPanel.tsx` mostra un panell unificat amb:

- **Capçalera**: botó "Baixar d'OSM" (pull sync normal, respecta locals)
- **Seccions col·lapsables** per estat (tancades per defecte, amb comptador)
- **Checkboxes** individuals + "Sel·leccionar tot" per secció
- **Accions per lot**: "Pujar seleccionats" / "Descartar seleccionats"
- **Accions individuals** amb confirmació:
  - ↑ Pujar a OSM / Confirmar esborrat / Reintentar
  - ↓ Baixar d'OSM (CONFIRMAT: sobreescriu locals)
  - ✕ Descartar (CONFIRMAT: esborra o reverteix)
- **Selecció al mapa**: clic al nom del node → cercle + info panell
- **Refresc automàtic**: després de qualsevolacció, la capa d'hidrants es refresca

Events utilitzats:

- `select-hydrant-by-id` → selecciona hidrant al mapa (cercle + panell info)
- `refresh-hidrants` → refresca la capa d'hidrants

### Exportació .osc

```bash
GET /api/osm/conflicts/osc
```

Genera un fitxer de canvi (OSM XML) compatible amb JOSM per importar manualment a OSM.

### Validació de dades

Abans de pujar a OSM, el backend valida els tags de cada hidrant mitjançant `back/src/services/osmDataValidator.ts`.

**Regles de validació:**

| Camp        | Tag OSM                 | Valors permesos             |
| ----------- | ----------------------- | --------------------------- |
| Tipus       | `fire_hydrant:type`     | `pillar`, `underground`     |
| Posició     | `fire_hydrant:position` | `lane`, `sidewalk`, `green` |
| Acoblaments | `couplings`             | `1`, `2`, `3`, `4`          |
| Diàmetres   | `couplings:diameters`   | `45`, `70`, `100`           |
| Pressió     | `fire_hydrant:pressure` | Número vàlid                |
| Data        | `survey:date`           | Format `YYYY-MM-DD`         |

**Detecció addicional:**

- Text tot en majuscules (≥3 caràcters) → warning.
- Tags > 255 caràcters → error.
- Tags buits → s'eliminen automàticament.

**Resultats:**

- **Error** → hidrant marcada com a `ERROR`, no es puja a OSM.
- **Warning** → hidrant marcada com a `REVIEW`, es mostra a la UI perquè l'admin revisi.

### Estats de sincronització

| Estat            | Significat                                 |
| ---------------- | ------------------------------------------ |
| `SYNCED`         | Sincronitzat amb OSM                       |
| `PENDING_CREATE` | Nou local, pendent de crear a OSM          |
| `PENDING_UPDATE` | Modificat localment, pendent d'actualitzar |
| `PENDING_DELETE` | Marcat per esborrar                        |
| `CONFLICT`       | Conflicte de versió amb OSM                |
| `ERROR`          | Error durant la sincronització             |
| `REVIEW`         | Dades amb warnings, pendent de revisió     |

### Endpoints API

| Endpoint                     | Method | Descripció                                |
| ---------------------------- | ------ | ----------------------------------------- |
| `/api/osm/status`            | GET    | Estat del token i comptador de conflictes |
| `/api/osm/pending?adf=ID`    | GET    | Llista canvis pendents amb detalls        |
| `/api/osm/push-sync`         | POST   | Push sync global                          |
| `/api/osm/push-selected`     | POST   | Push selectiu per IDs                     |
| `/api/osm/discard-selected`  | POST   | Descarta/esborra seleccionats             |
| `/api/osm/conflicts`         | GET    | Llistat de conflictes amb detalls         |
| `/api/osm/conflicts/osc`     | GET    | Fitxer .osc per JOSM                      |
| `/api/osm/conflicts/resolve` | POST   | Resoldre conflicte                        |
| `/api/osm/reviews`           | GET    | Hidrants amb warnings                     |
| `/api/osm/pull-hydrant`      | POST   | Baixar node individual d'OSM              |
| `/api/hidrants/sync?adf=ID`  | POST   | Pull sync (accepta `{ force }`)           |
| `/api/hidrants/stats`        | GET    | Stats per ADF                             |
| `/api/osm/conflicts/osc`     | GET    | Descarregar .osc amb conflictes           |
| `/api/osm/conflicts/resolve` | POST   | Resoldre un conflicte després de JOSM     |
| `/api/osm/reviews`           | GET    | Hidrants amb warnings per revisar         |

### Fitxers clau

- `back/src/services/osmSync.ts` — Pull sync (Overpass API).
- `back/src/services/osmPushSync.ts` — Push sync (API OSM).
- `back/src/services/osmDataValidator.ts` — Validació de tags.
- `back/src/services/osmConflictResolver.ts` — Resolució automàtica de conflictes.
- `back/src/routes/osm.ts` — Endpoints API.
- `front/src/components/osm/OsmConflictList.tsx` — UI conflictes.
- `front/src/components/osm/OsmReviewList.tsx` — UI revisions pendents.

## Qualitat de codi: ESLint, Husky i CI

- **ESLint** (flat config `eslint.config.mjs`, un per `front/` i `back/`): `npm run lint` i `npm run lint:fix` a la arrel o a cada paquet. Objectiu 0 errors, 0 warnings.
- **Husky + lint-staged** (hook de pre-commit): `.husky/pre-commit` corre `npx lint-staged` (ESLint amb `--fix` als fitxers staged). Evita saltar-te'l amb `--no-verify` sense justificació.
- **CI** (`.github/workflows/ci.yml`): es dispara en `push` a `main`/`develop` i en `pull_request`. Pipeline (Node 24): `npm ci` → `typecheck` → `lint` → `build`. És mínim: no fa tests ni desplega encara.

## Troubleshooting

- `getaddrinfo ENOTFOUND mosquitto`: backend local usa `mqtt://localhost:1883`, backend Docker usa `mqtt://mosquitto:1883`.
- `Not authorized`: contrasenyes `back/.env` i `dynamic-security.json` no coincideixen.
- `docker compose config` no cal `mosquitto/.env`: Mosquitto no en té (contreseny a `back/.env`).
