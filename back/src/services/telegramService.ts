// Servei Telegram per ADF: registra bots, gestiona webhooks i envia notificacions.
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { telegramBots } from "../db/schema.js";
import { decrypt } from "../utils/crypto.js";

const API = "https://api.telegram.org";

export const TELEGRAM_ESTATS = [
  "NO_CONFIGURAT",
  "BOT_CONFIGURAT",
  "GRUP_PENDENT",
  "CONFIGURAT",
  "DESACTIVAT",
] as const;
export type TelegramEstat = (typeof TELEGRAM_ESTATS)[number];

export type TelegramBotRow = typeof telegramBots.$inferSelect;

export function sha256hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Puja la informació del bot a Telegram (getMe) i valida el token. */
export interface BotInfo {
  id: number;
  username: string;
  first_name: string;
  can_join_groups?: boolean;
}

async function callBot(token: string, method: string, body?: Record<string, unknown>) {
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({ ok: false }))) as {
    ok: boolean;
    result?: unknown;
    description?: string;
    error_code?: number;
  };
  if (!res.ok || data.ok !== true) {
    throw new Error(data.description || `Telegram ${method} (${res.status})`);
  }
  return data.result as Record<string, never>;
}

export async function getMe(token: string): Promise<BotInfo> {
  const r = (await callBot(token, "getMe")) as unknown as BotInfo;
  if (!r?.id || !r?.username) {
    throw new Error("El token no correspon a cap bot vàlid");
  }
  return r;
}

export async function setWebhook(
  token: string,
  url: string,
  allowedUpdates: string[] = ["message", "my_chat_member"],
) {
  await callBot(token, "setWebhook", {
    url,
    allowed_updates: allowedUpdates,
    drop_pending_updates: true,
  });
}

export async function deleteWebhook(token: string) {
  await callBot(token, "deleteWebhook", {});
}

export async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  extra?: Record<string, unknown>,
) {
  await callBot(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: false, prefer_large_media: true },
    ...extra,
  });
}

/** Envia una notificació a l'ADF si té un bot configurat i vinculat a un grup. */
export async function sendToAdf(adfId: number, text: string) {
  const row = db
    .select()
    .from(telegramBots)
    .where(and(eq(telegramBots.adf_id, adfId), eq(telegramBots.estat, "CONFIGURAT")))
    .get();
  if (!row || row.chat_id === null) {
    return;
  }
  const token = row.token_enc ? decrypt(row.token_enc) : null;
  if (!token) {
    console.warn(`[TG] No es pot desxifrar el token del bot de l'ADF ${adfId}`);
    return;
  }
  try {
    await sendMessage(token, row.chat_id, text);
  } catch (err) {
    console.error(`[TG] Error enviant notificació a l'ADF ${adfId}:`, err);
  }
}