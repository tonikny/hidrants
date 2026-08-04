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
- `npm run docker:up`: aixeca tots els contenidors.
- `npm run docker:down`: atura contenidors.
- `npm run docker:deploy`: deploy complet (pull `--ff-only --autostash` + rebuild).
- `npm run db:setup`: reset + seed + import OSM + boundaries.
- `npm run update:boundaries`: actualitza límits ADF.

## MQTT / OwnTracks

El backend escolta `${MQTT_TOPIC_PREFIX}/#`. Per defecte: `owntracks/hidrants/#`.

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

## Qualitat de codi: ESLint, Husky i CI

- **ESLint** (flat config `eslint.config.mjs`, un per `front/` i `back/`): `npm run lint` i `npm run lint:fix` a la arrel o a cada paquet. Objectiu 0 errors, 0 warnings.
- **Husky + lint-staged** (hook de pre-commit): `.husky/pre-commit` corre `npx lint-staged` (ESLint amb `--fix` als fitxers staged). Evita saltar-te'l amb `--no-verify` sense justificació.
- **CI** (`.github/workflows/ci.yml`): es dispara en `push` a `main`/`develop` i en `pull_request`. Pipeline (Node 24): `npm ci` → `typecheck` → `lint` → `build`. És mínim: no fa tests ni desplega encara.

## Troubleshooting

- `getaddrinfo ENOTFOUND mosquitto`: backend local usa `mqtt://localhost:1883`, backend Docker usa `mqtt://mosquitto:1883`.
- `Not authorized`: contrasenyes `back/.env` i `dynamic-security.json` no coincideixen.
- `docker compose config` no cal `mosquitto/.env`: Mosquitto no en té (contreseny a `back/.env`).
