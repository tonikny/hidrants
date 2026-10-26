# Guia de Deploy en Producció (DEPLOY.md)

Aquesta guia detalla el procés per fer el deploy de la Xarxa d'Hidrants ADF en un entorn de producció utilitzant Docker.

## 1. Requisits del Sistema

- **SO:** Debian 13 (Trixie) recomanat, o qualsevol distribució Linux compatible amb Docker.
- **Docker** i **Docker Compose**.
- **Node.js** i **npm** instal·lats al host (només per a la inicialització de dades).

## 2. Preparació del Servidor

Si utilitzes un servidor Debian 13 net, pots fer servir els scripts preparats:

1.  **Instal·lar Docker:**
    ```bash
    bash scripts/docker_setup_debian13.sh
    ```
2.  **Configurar Seguretat (CrowdSec, firewall):**
    ```bash
    bash scripts/security/setup-security.sh
    ```

## 3. Configuració del Projecte

1.  Clona el repositori al servidor:

    ```bash
    git clone <url-del-repositori> /opt/hidrants
    cd /opt/hidrants
    ```

2.  Configura les variables d'entorn del backend:

    ```bash
    cp back/.env.example back/.env
    nano back/.env
    ```

    **IMPORTANT:**
    - Canvia `JWT_SECRET` per una clau realment segura.
    - Revisa els ports (per defecte el backend escolta al 3033 internament).
    - Configura les claus de Telegram i GraphHopper si les tens.
    - Per a la sincronització push a OSM, configura `OSM_ACCESS_TOKEN` (token OAuth 2.0, veure secció OSM a continuació).

3.  Configura les variables d'entorn de Mosquitto:
    ```bash
    nano back/.env
    ```
    `MQTT_ADMIN_PASSWORD` i `MQTT_BACKEND_PASSWORD` (al mateix `back/.env`) les fa servir l'script de Dynamic Security. Mosquitto no necessita fitxer `.env` propi.

## 4. Inicialització de Dades (Host)

Per tal que el volum de Docker ja tingui les dades carregades, farem el setup inicial des del host:

1.  Instal·la dependències mínimes (des de l'arrel, amb workspaces):

    ```bash
    npm ci
    ```

2.  Executa el setup de la base de dades i importació d'OSM:
    ```bash
    npm run db:setup
    npm run update:boundaries
    ```
    Això crearà el fitxer `back/data/hidrants.db` amb tota la informació inicial.

## 5. Deploy amb Docker Compose

1.  **Construir les imatges:**

    ```bash
    npm run docker:build
    ```

    Les imatges s'instal·len amb el `package-lock.json` de l'arrel (`npm ci -w back` / `-w front`), així que porten exactament les versions provades en local. Per això el context de build és **l'arrel del repositori** (`context: .` a `docker-compose.yml`) i hi ha un `.dockerignore` a l'arrel: si afegeixes un paquet, actualitza el lock (`npm install`) i fes commit dels dos fitxers, o el build fallarà amb un error de lock desincronitzat.

2.  **Aixecar els serveis:**
    ```bash
    npm run docker:up
    ```

L'aplicació estarà disponible a:

- **Frontend:** `http://localhost:8080` (mapejat al port 80 intern del contenidor).
- **Backend:** `http://localhost:3034` (mapejat al port 3033 intern del contenidor).

## 6. MQTT / OwnTracks (Mosquitto)

Ports del broker:

- `1883`: intern/dev, només al host (`127.0.0.1`).
- `51823`: TLS públic per OwnTracks (cal obrir-lo a firewall/NAT).

Configuració: copiar `mosquitto/config/mosquitto.conf.example` → `mosquitto.conf` (amb certs `fullchain.pem`/`privkey.pem` dins el contenidor). Per a desenvolupament local, usa `mosquitto.dev.conf.example` (sense TLS).

Backend: per defecte connecta a `mqtt://mosquitto:1883`. El fitxer `.otrc` que genera la UI apunta a `OTRC_HOST`, `OTRC_PORT=51823`, `OTRC_TLS=true`.

Guia completa de MQTT (certs + renovació automàtica, Dynamic Security, `npm run mqtt:sync-dynsec`/`mqtt:regen-dynsec`, accés compartit a `mosquitto/data`, backup i troubleshooting): `docs/MQTT_DEPLOY.md`.

## 6b. Sincronització amb OSM (push sync)

Per publicar canvislocals cap a OpenStreetMap, cal configurar el token OAuth 2.0:

1. Registra una aplicació a https://www.openstreetmap.org/oauth2/applications
2. Scope necessari: `write_api`
3. Afegeix a `back/.env`:

```env
OSM_ACCESS_TOKEN=el_teu_token_oauth2_aqui
#OSM_API_URL=https://api.openstreetmap.org/api/0.6
```

El token OAuth 2.0 d'OSM no expira. Sense aquesta variable, el push sync (`POST /api/osm/push-sync`) retornarà error. La pull sync (`GET /api/osm/sync`) funciona sense token (usa Overpass API pública).

## 7. Manteniment i Actualitzacions

### Actualitzar l'aplicació

Per actualitzar a l'última versió de Git i reconstruir els contenidors:

```bash
npm run docker:deploy
```

Cal que `node` i `npm` siguin al `PATH` (amb fnm: `eval "$(fnm env)"`, que el hook de shell fa sol en entrar al directori).

L'script (`scripts/deploy/update.sh`) fa, en aquest ordre i aturant-se al primer error:

1. Comprovacions prèvies: `back/.env` present, Docker i `docker compose` operatius, branca amb upstream, i avís si `back/.env` no té alguna clau de `back/.env.example`.
2. **Còpia de seguretat prèvia** de `back/data/` a `backups/pre-deploy/` (es conserven les 5 últimes). Atura el backend uns segons perquè la còpia sigui coherent.
3. `git pull --ff-only`. Si hi ha canvis locals, **s'atura** i t'ho diu; per forçar-ho, `--allow-dirty` (fa servir `--autostash`).
4. Neteja de `back/node_modules` i `front/node_modules` heretats del layout antic (`--prefix`), que podrien ombrejar les dependències noves.
5. `npm ci` amb el `package-lock.json` de l'arrel (reproducible; falla si el lock no quadra amb els `package.json`).
6. `docker compose build`. Si el build falla, **els contenidors en marxa no es toquen**.
7. `docker compose up -d` (les migracions s'apliquen en arrencar el contenidor).
8. Espera del healthcheck del backend (fins a 180 s) i del frontend, i comprovació HTTP de `127.0.0.1:3034/api/adfs` i `127.0.0.1:8080`.
9. `npm run update:boundaries` (Overpass/Nominatim). **No bloqueja**: si OSM no respon, avisa i el desplegament es dóna per bo.
10. `docker image prune -f` només si tot ha anat bé.

Opcions:

```bash
npm run docker:deploy -- --dry-run        # mostra les passes sense executar res
npm run docker:deploy -- --yes            # sense confirmació
npm run docker:deploy -- --allow-dirty    # permet canvis locals (autostash)
npm run docker:deploy -- --skip-backup    # no recomanat
npm run docker:deploy -- --no-boundaries  # omet update:boundaries
```

`update:boundaries` s'executa per defecte i és **best-effort**: depèn de l'API pública d'Overpass/Nominatim, així que un error o un temps d'espera esgostat només deixa un avís i les fronteres anteriors. Es llança després dels healthchecks, de manera que mai no impedeix que la nova versió quedi en marxa; per reintentar-lo, `npm run update:boundaries`.

**Si alguna passa falla**, l'script mostra els logs del servei afectat i el commit anterior. Per revertir:

```bash
git reset --hard <commit-anterior>
docker compose up -d --build
# Si les migracions ja s'havien aplicat, restaura també la BD:
./scripts/backup/restore.sh daily   # o el fitxer de backups/pre-deploy/
```

Les migracions són només cap endavant: tornar a una versió anterior del codi amb la BD migrada dóna errors, així que el rollback sempre ha d'incloure la restauració de la base de dades.

### Backups Automàtics de la Base de Dades

El projecte inclou un sistema complet de backups automàtics amb rotació. Els backups es guarden al directori `./backups/` amb diferents períodes de retenció:

- **Diari**: Es manté el backup del dia anterior
- **Setmanal**: Es manté el backup de fa una setmana
- **Mensual**: Es manté el backup de fa un mes
- **Semestral**: Es manté el backup de fa sis mesos

#### Configurar Backups Automàtics

1. **Instal·lar els cron jobs** (només cal fer-ho una vegada):

   ```bash
   cd /opt/hidrants
   ./scripts/backup/setup-cron.sh install
   ```

   Això configurarà els següents backups automàtics:
   - Diari: Cada dia a les 3:00 AM
   - Setmanal: Cada diumenge a les 3:30 AM
   - Mensual: Cada dia 1 del mes a les 4:00 AM
   - Semestral: 1 de gener i 1 de juliol a les 4:30 AM

2. **Verificar l'estat dels backups**:

   ```bash
   ./scripts/backup/check-backups.sh
   ```

3. **Verificar que els cron jobs estan actius**:
   ```bash
   ./scripts/backup/setup-cron.sh status
   ```

#### Fer un Backup Manual

Per fer un backup manual en qualsevol moment:

```bash
# Backup diari
./scripts/backup/backup.sh daily

# Backup setmanal
./scripts/backup/backup.sh weekly

# Backup mensual
./scripts/backup/backup.sh monthly

# Backup semestral
./scripts/backup/backup.sh semester
```

#### Restaurar un Backup

Per restaurar un backup existent:

```bash
# Restaurar l'últim backup diari
./scripts/backup/restore.sh daily

# Restaurar l'últim backup setmanal
./scripts/backup/restore.sh weekly

# Restaurar l'últim backup mensual
./scripts/backup/restore.sh monthly

# Restaurar l'últim backup semestral
./scripts/backup/restore.sh semester
```

**IMPORTANT**: El script de restauració:

- Aturarà temporalment el contenidor backend
- Farà una còpia de seguretat de les dades actuals abans de restaurar
- Et demanarà confirmació abans de procedir
- Reiniciarà el contenidor automàticament

#### Desinstal·lar els Backups Automàtics

Si necessites desactivar els backups automàtics:

```bash
./scripts/backup/setup-cron.sh uninstall
```

#### Notificacions per Telegram

Si has configurat les variables `TELEGRAM_BOT_TOKEN` i `TELEGRAM_CHAT_ID` al fitxer `back/.env`, rebràs notificacions automàtiques quan:

- Un backup es completa correctament
- Un backup falla
- Hi ha problemes amb el sistema de backups

#### Logs de Backups

Els logs de tots els backups automàtics es guarden a:

```
./backups/backup.log
```

Per veure els últims logs:

```bash
tail -f ./backups/backup.log
```

### Neteja i Re-importació

Si vols forçar una neteja total dels hidrants i tornar-los a baixar d'OSM (per exemple, per desfer canvis locals erronis):

```bash
npm run db:reset-hidrants
```

### Logs

Per veure què està passant als contenidors:

```bash
npm run docker:logs
```

## 8. Publicació a Internet

Per defecte, l'aplicació està configurada per escoltar a `127.0.0.1` per seguretat. Per publicar-la:

1.  **Opció A:** Utilitzar un Reverse Proxy (Nginx, Traefik) al host que apunti a `localhost:8080`.
2.  **Opció B:** Modificar `docker-compose.yml` per obrir el port 80 directament: `0.0.0.0:80:80`.

## 9. Notificacions Telegram per ADF (webhooks)

Cada ADF pot usar el seu bot de Telegram amb un grup propi (configuració des de la UI: **Configuració → Notificacions de Telegram**). El backend necessita rebre actualitzacions de Telegram a `POST /api/telegram/webhook/:secret`.

**En producció no cal configuració addicional:**

- La URL del webhook es deriva del `Host` de la petició de registre → el domini que exposa l'app (Nginx amb cert Let's Encrypt) és l'URL que Telegram cridarà. Assegura que el reverse proxy reenvia `/api/telegram/webhook/*` al backend (el mateix `/api` que ja es proxya).
- El domini ha de ser **públicament accessible** des d'Internet: Telegram rebutja IPs privades i certificats self-signed.
- El token del bot es guarda **xifrat** a la DB (`ENCRYPTION_SECRET`) i mai surt del backend; el webhook només es confirma per secret aleatori per bot.

**Si el domini públic difereix del `Host` intern** (per exemple un load balancer), força la URL amb:

```env
WEBHOOK_PUBLIC_URL=https://el_teu_domini_public
```

Self-test (host):

```bash
npm run telegram:selftest
```
