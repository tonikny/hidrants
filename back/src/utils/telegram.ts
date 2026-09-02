import { config } from "./config.js";
import { logger } from "./logger.js";

const log = logger.child({ module: "telegram", operation: "send" });

export async function sendTelegramMessage(text: string) {
  const TELEGRAM_BOT_TOKEN = config.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = config.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    log.warn("Telegram bot token or chat ID not configured");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        link_preview_options: {
          is_disabled: false,
          prefer_large_media: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error({ status: response.status, errorText }, "Telegram API error");
    }
  } catch (error) {
    log.error({ err: error }, "Error enviant missatge a Telegram");
  }
}
