#!/bin/sh
# Crear roles i clients de Dynamic Security
# Idempotent: es pot reexecutar tants cops com calgui.
# S'executa amb mosquitto EN MARXA (després de init-dynsec.sh + docker compose start).
# Ús: docker compose exec mosquitto /bin/sh /mosquitto/config/create-dynsec-roles.sh
set -e

CONFIG_FILE="/mosquitto/data/dynamic-security.json"
ADMIN_USER="${MQTT_ADMIN_USER:-admin}"
ADMIN_PASS="${MQTT_ADMIN_PASSWORD}"
BACKEND_USER="${MQTT_BACKEND_USERNAME:-backend}"
BACKEND_PASS="${MQTT_BACKEND_PASSWORD}"
TOPIC_PREFIX="${MQTT_TOPIC_PREFIX:-owntracks/hidrants}"

# Rol owntracks-device
mosquitto_ctrl -u "$ADMIN_USER" -P "$ADMIN_PASS" dynsec createRole owntracks-device || true
mosquitto_ctrl -u "$ADMIN_USER" -P "$ADMIN_PASS" dynsec addRoleACL owntracks-device \
  publishClientSend "${TOPIC_PREFIX}/%u/#" true || true

# Rol backend-reader
mosquitto_ctrl -u "$ADMIN_USER" -P "$ADMIN_PASS" dynsec createRole backend-reader || true
mosquitto_ctrl -u "$ADMIN_USER" -P "$ADMIN_PASS" dynsec addRoleACL backend-reader \
  subscribePattern "${TOPIC_PREFIX}/#" true || true
mosquitto_ctrl -u "$ADMIN_USER" -P "$ADMIN_PASS" dynsec addRoleACL backend-reader \
  publishClientSend "\$CONTROL/dynamic-security/v1" true || true
mosquitto_ctrl -u "$ADMIN_USER" -P "$ADMIN_PASS" dynsec addRoleACL backend-reader \
  publishClientReceive "\$CONTROL/dynamic-security/v1/#" true || true
mosquitto_ctrl -u "$ADMIN_USER" -P "$ADMIN_PASS" dynsec addRoleACL backend-reader \
  subscribePattern "\$CONTROL/dynamic-security/v1/#" true || true

# Client backend
mosquitto_ctrl -u "$ADMIN_USER" -P "$ADMIN_PASS" dynsec createClient \
  "$BACKEND_USER" "$BACKEND_PASS" backend-reader || true
mosquitto_ctrl -u "$ADMIN_USER" -P "$ADMIN_PASS" dynsec setClientPassword \
  "$BACKEND_USER" "$BACKEND_PASS" || true
