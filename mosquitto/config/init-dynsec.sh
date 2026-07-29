#!/bin/sh
# Inicialitzar Dynamic Security (UN SOL COP)
# Crea el fitxer dynamic-security.json amb l'usuari admin.
# Requereix que mosquitto estigui aturat (docker compose stop mosquitto).
# Ús: docker compose run --rm mosquitto /bin/sh /mosquitto/config/init-dynsec.sh
set -e

CONFIG_FILE="/mosquitto/data/dynamic-security.json"
ADMIN_USER="${MQTT_ADMIN_USER:-admin}"
ADMIN_PASS="${MQTT_ADMIN_PASSWORD}"

rm -f "$CONFIG_FILE"

/usr/sbin/mosquitto -c /mosquitto/config/mosquitto.conf -d
sleep 2

mosquitto_ctrl dynsec init "$CONFIG_FILE" "$ADMIN_USER" "$ADMIN_PASS"

killall mosquitto 2>/dev/null || true
