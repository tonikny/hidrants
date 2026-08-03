# MQTT Deployment Guide — Producció

Només cobreix MQTT/OwnTracks. Backend, frontend i DB ja funcionen.

---

## 1. Requisits

- Domini `<DOMINI>` amb registre A
- Certificats Let's Encrypt: `certbot certonly --standalone -d <DOMINI>`
- Port 51823 obert (tallafocs + NAT)
- Docker + Docker Compose + Python 3

---

## 2. Configuració

### `mosquitto/config/mosquitto.conf`

Copiar el template de producció:

```bash
cp mosquitto/config/mosquitto.conf.example mosquitto/config/mosquitto.conf
```

El fitxer conté:

```ini
listener 1883 0.0.0.0
listener 51823 0.0.0.0
certfile /mosquitto/certs/fullchain.pem
keyfile /mosquitto/certs/privkey.pem
persistence true
persistence_location /mosquitto/data/
log_dest stdout
allow_anonymous false
plugin /usr/lib/mosquitto_dynamic_security.so
plugin_opt_config_file /mosquitto/data/dynamic-security.json
```

**Nota:** per a desenvolupament local, usa `mosquitto.dev.conf.example` (sense TLS). Veure `DEV.md`.

### `mosquitto/.env`

No existeix. Mosquitto no consumeix variables d'entorn en runtime (els hashes viuen a `mosquitto/data/dynamic-security.json`). Les contrasenyes venen només de `back/.env` (`MQTT_ADMIN_PASSWORD`, `MQTT_BACKEND_PASSWORD`, `MQTT_TOPIC_PREFIX`).

Usernames opcionals: `MQTT_ADMIN_USERNAME` i `MQTT_BACKEND_USERNAME` (per defecte `admin` i `backend`).

### `docker-compose.yml`

```yaml
mosquitto:
  image: eclipse-mosquitto:2
  volumes:
    - ./mosquitto/config:/mosquitto/config:ro
    - ./mosquitto/data:/mosquitto/data
    - ./mosquitto/certs:/mosquitto/certs:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro # backup
  healthcheck:
    test: ['CMD', 'pidof', 'mosquitto']
    interval: 60s
    start_period: 10s
```

---

## 3. Certificats TLS

Copiar al `mosquitto/certs/` i fixar permisos:

```bash
sudo cp /etc/letsencrypt/live/<DOMINI>/{fullchain,privkey}.pem mosquitto/certs/
sudo chmod 644 mosquitto/certs/fullchain.pem
sudo chmod 600 mosquitto/certs/privkey.pem
sudo chown 1883:1883 mosquitto/certs/privkey.pem
```

### Deploy hook (renovació automàtica)

`scripts/copy-mosquitto-certs.sh` (versionat) copia i reinicia Mosquitto quan certbot renova. Llegeix el domini de `OTRC_HOST` a `back/.env` (no hi ha hostname hardcodejat al repo).

Instal·lar:

```bash
sudo chmod +x scripts/copy-mosquitto-certs.sh
sudo ln -s "$(pwd)/scripts/copy-mosquitto-certs.sh" \
  /etc/letsencrypt/renewal-hooks/deploy/copy-mosquitto-certs.sh
```

---

## 4. Dynamic Security

### Important: format del JSON

El format del `dynamic-security.json` és EXACTE. Basat en el que genera `mosquitto_ctrl dynsec init`:

- Client: `{"username": X, "encoded_password": HASH, "roles": [...]}` — **NO** `{"client": {...}}`
- Camp hash: `encoded_password` — **NO** `password`
- Els rols dins clients: `[{"rolename": Y}]` — sense `priority`
- ACLs: `[{"acltype": "...", "topic": "...", "allow": true}]` — sense `priority`

### Generar amb `scripts/init-dynsec.py`

Versionat directe al repo. El contenidor Mosquitto escriu `mosquitto/data/` com a **root** (uid 0), així que cal accés compartit entre el contenidor i l'usuari de deploy (sense sudo a l'usuari). Un sol cop al servidor:

```bash
sudo groupadd --force mosquitto
sudo usermod -a -G mosquitto deployuser
sudo chown -R root:mosquitto mosquitto/data
sudo chmod 2770 mosquitto/data
sudo chmod 660 mosquitto/data/dynamic-security.json mosquitto/data/mosquitto.db
sudo setfacl -d -m g:mosquitto:rw mosquitto/data
sudo setfacl -m g:mosquitto:rw mosquitto/data/dynamic-security.json mosquitto/data/mosquitto.db
```

- **Owner `root`**: perquè el contenidor corre com a root. Verifica-ho amb `docker compose exec mosquitto id -u` (esperat `0`). Si el teu contenidor corregués com a uid 1883, usa `1883:mosquitto` en lloc de `root:mosquitto`.
- **`deployuser`** (grup `mosquitto`) → rw. **`sudo setfacl -d`** = default ACL: quan Mosquitto reescrigui els fitxers, conserven accés d'escriptura per al grup (si no, el proper `sync` tornaria a fallar per permisos).
- **setgid (2770)** → fitxers nous hereten el grup `mosquitto`.

Després, amb sessió nova o `newgrp mosquitto`, l'usuari `deployuser` pot executar els scripts. El grup `mosquitto` no dona cap privilegi extra (no sudo, no root): només accés a fitxers amb aquest grup, que és només `mosquitto/data/`.

El script carrega les contrasenyes directament des de `back/.env` (llegit byte a byte, sense shell, per evitar expansió de caràcters `, !, \`). Docker Compose tampoc expandeix, així el hash generat coincideix amb el que el backend envia.

#### Regeneració completa (destructiu)

Esborra tots els clients d'usuari MQTT. Demana confirmació. Només cal si es vol re-partir de zero:

```bash
npm run mqtt:regen-dynsec
```

#### Sincronització (no destructiu)

Actualitza `admin` i `backend` amb les contrasenyes de `back/.env` i neteja el rol obsolet `backend-reader`, **conservant** els clients d'usuari. Recomanat per canviar contrasenyes o fer el renoom `backend-reader` → `backend-service`:

```bash
npm run mqtt:sync-dynsec
```

Després de qualsevol de les dues, verifica:

```bash
docker compose logs mosquitto   # Comprovar "Opening TLS listening socket on port 51823"
```

---

## 5. Com funciona `createMqttUser` (backend → DynSec)

El backend connecta com `backend` i envia comandaments JSON a `$CONTROL/dynamic-security/v1`:

```json
{
  "commands": [
    {
      "command": "createClient",
      "username": "adf278",
      "password": "4061a25e...",
      "roles": [{ "rolename": "owntracks-device" }]
    }
  ]
}
```

**No cal**: docker exec, mosquitto_ctrl, ni mount del socket Docker.

---

## 6. Backup

```bash
docker compose exec mosquitto sh -c "cat /mosquitto/data/dynamic-security.json" \
  > "/var/backups/hidrants/mosquitto/dynamic-security.$(date +%Y%m%d).json"
cp mosquitto/data/mosquitto.db "/var/backups/hidrants/mosquitto/mosquitto.$(date +%Y%m%d).db"
```

---

## 7. Resolució de problemes

| Error                                                      | Causa                                                         | Solució                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `Permission denied` al generar JSON                        | fitxer propietat del contenidor (root) i deployuser sense grup | Configurar accés compartit (secció 4): grup `mosquitto` + `chown root:mosquitto` + `chmod 2770/660` + default ACL |
| `Not authorized` amb `mosquitto_sub -u backend`            | Password mismatch o format JSON incorrecte                    | Regenerar amb `init-dynsec.py` + Python directe                  |
| `Not authorized` al healthcheck (antic)                    | `$SYS/#` amb DynSec és impredicible                           | Usar `pidof mosquitto` (ja configurat)                           |
| Backend no connecta (`Connection refused: Not authorized`) | Password diferent entre `back/.env` i `dynamic-security.json` | Carregar des de `back/.env` amb Python directe, regenerar        |
| `mosquitto_passwd` retorna error                           | Password passat per argument de shell té caràcters especials  | Usar `cat > /tmp/pw && mosquitto_passwd -U` (el script ja ho fa) |
