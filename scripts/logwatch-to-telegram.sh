#!/bin/bash
# ------------------------------------------------------------------------------
# HIDRANTS - Logwatch to Telegram script
# ------------------------------------------------------------------------------

# Ruta al fitxer .env del backend per obtenir els tokens
ENV_FILE="/var/www/hidrants/back/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: No s'ha trobat el fitxer $ENV_FILE"
    exit 1
fi

# Extracció de tokens (eliminant espais i possibles cometes)
TOKEN=$(grep "^TELEGRAM_BOT_TOKEN" "$ENV_FILE" | cut -d'=' -f2 | xargs)
CHAT_ID=$(grep "^TELEGRAM_CHAT_ID" "$ENV_FILE" | cut -d'=' -f2 | xargs)

if [ -z "$TOKEN" ] || [ -z "$CHAT_ID" ]; then
    echo "❌ Error: No s'han trobat els tokens de Telegram al .env"
    exit 1
fi

# Generació del resum de Logwatch (detall baix per no excedir límit de Telegram)
# Range 'yesterday' per a execució diària
REPORT=$(/usr/sbin/logwatch --detail Low --range yesterday --output stdout)

# Encapçalament
HOSTNAME=$(hostname)
DATE=$(date +"%Y-%m-%d")
HEADER="📊 *Informe de Seguretat ($DATE)* @ $HOSTNAME"$'\n\n'

# Enviament a Telegram (limitat a 4000 caràcters per seguretat)
FULL_MESSAGE="${HEADER}${REPORT}"
CAPPED_MESSAGE=$(echo "$FULL_MESSAGE" | head -c 4000)

curl -s -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
    -d chat_id="$CHAT_ID" \
    -d parse_mode="Markdown" \
    -d text="$CAPPED_MESSAGE" > /dev/null

echo "✅ Informe enviat a Telegram."
