import { config } from '../config.js';

export async function sendTelegramMessage(text: string) {
  const TELEGRAM_BOT_TOKEN = config.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = config.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️ Telegram bot token or chat ID not configured.');
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Telegram error:', errorText);
    }
  } catch (error) {
    console.error('❌ Error enviant a Telegram:', error);
  }
}
