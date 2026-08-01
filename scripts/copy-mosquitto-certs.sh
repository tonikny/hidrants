#!/bin/sh
set -e

SCRIPT_DIR=$(dirname "$0")
PROJECT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
CERTS_DIR="$PROJECT_DIR/mosquitto/certs"

DOMAIN=$(awk -F= '/^OTRC_HOST=/{print $2}' "$PROJECT_DIR/back/.env" | tr -d '\r')
if [ -z "$DOMAIN" ]; then
    echo "ERROR: no trobo OTRC_HOST a back/.env" >&2
    exit 1
fi

mkdir -p "$CERTS_DIR"
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERTS_DIR/fullchain.pem"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CERTS_DIR/privkey.pem"

chmod 644 "$CERTS_DIR/fullchain.pem"
chmod 600 "$CERTS_DIR/privkey.pem"
chown 1883:1883 "$CERTS_DIR/privkey.pem"

cd "$PROJECT_DIR" && docker compose restart mosquitto
