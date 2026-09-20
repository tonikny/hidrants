// Self-test sense xarxa: valida la lògica pura de vinculació Telegram.
// Executa amb `npm run telegram:selftest`.
import assert from "node:assert/strict";
import { sha256hex } from "../services/telegramService.js";
import { extractCode } from "../routes/telegramWebhook.js";
import { logger } from '../utils/logger.js';

const log = logger.child({ module: 'telegram', operation: 'selftest' });

try {
  // sha256 estable i determinista
  assert.equal(
    sha256hex("hola"),
    "b221d9dbb083a7f33428d7c2a3c3198ae925614d70210e28716ccaa7cd4ddb79",
  );

  // invariància: el mateix codi sempre fa el mateix hash
  assert.equal(sha256hex("abc"), sha256hex("abc"));
  assert.notEqual(sha256hex("abc"), sha256hex("abd"));

  // extractCode: codi directe (cas startgroup en grup)
  assert.equal(extractCode("Ab3-xY_9"), "Ab3-xY_9");

  // extractCode: /start amb codi
  assert.equal(extractCode("/start Ab3-xY_9"), "Ab3-xY_9");
  assert.equal(extractCode("/start@mi_bot Ab3-xY_9"), "Ab3-xY_9");

  // extractCode: sense codi
  assert.equal(extractCode("/start"), "");

  // extractCode: espais marginals
  assert.equal(extractCode("  codi  "), "codi");

  log.info("✅ Self-test Telegram: totes les comprovacions passen.");
} catch (err) {
  log.error({ err }, "❌ Self-test Telegram falla");
  process.exit(1);
}