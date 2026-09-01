/**
 * Validació bàsica de dades d'hidrants abans de pujar a OSM.
 *
 * Estratègia:
 * - Select fields: validar contra la llista de valors permesos
 * - Text lliure: detectar majuscules evidents (tot el text en majuscules)
 * - Numèrics: validar que és un número
 * - Dates: validar format ISO (YYYY-MM-DD)
 * - Longitud: màxim 255 caràcters per clau i valor
 *
 * No bloqueja la pujada — retorna warnings perquè l'admin revisi.
 */

export type ValidationIssue = {
  tag: string;
  level: "warning" | "error";
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

import { logInfo, logWarn, logError } from "../utils/logger.js";

// --- Valors permesos per als camps select ---

const VALID_TYPES = ["", "pillar", "underground"];
const VALID_POSITIONS = ["", "lane", "sidewalk", "green"];
const VALID_COUPLINGS = ["", "1", "2", "3", "4"];
const VALID_DIAMETERS = ["", "45", "70", "100"];
const VALID_PRESSURE = /^-?\d+(\.\d+)?$/;
const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Tags que gestionem des de l'UI — els altres (venguts d'OSM) no es validen
const MANAGED_TAGS = new Set([
  "fire_hydrant:type",
  "fire_hydrant:position",
  "couplings",
  "couplings:diameters",
  "fire_hydrant:pressure",
  "survey:date",
  "addr:street",
  "addr:housenumber",
  "addr:neighbourhood",
  "emergency",
  "disused:emergency",
]);

/**
 * Comprovar si un text és tot majuscules (almenys 2 caràcters).
 * Ex: "CARRER GRAN" → true, "Carrer" → false, "A" → false
 */
function isAllCaps(text: string): boolean {
  if (text.length < 2) {
    return false;
  }
  return text === text.toUpperCase() && text !== text.toLowerCase();
}

/**
 * Validar un tag gestionat per l'UI.
 */
function validateManagedTag(tag: string, value: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  switch (tag) {
    case "fire_hydrant:type":
      if (!VALID_TYPES.includes(value)) {
        issues.push({
          tag,
          level: "error",
          message: `"${value}" no és un tipus vàlid. Valors permesos: pillar, underground`,
        });
      }
      break;

    case "fire_hydrant:position":
      if (!VALID_POSITIONS.includes(value)) {
        issues.push({
          tag,
          level: "error",
          message: `"${value}" no és una posició vàlida. Valors permesos: lane, sidewalk, green`,
        });
      }
      break;

    case "couplings":
      if (!VALID_COUPLINGS.includes(value)) {
        issues.push({
          tag,
          level: "error",
          message: `"${value}" no és un nombre d'acoblaments vàlid. Valors permesos: 1, 2, 3, 4`,
        });
      }
      break;

    case "couplings:diameters": {
      // Pot tenir múltiples valors separats per ";" — ex: "70 mm; 100 mm"
      const parts = value.split(";").map((s) => s.replace(/mm/gi, "").trim());
      for (const part of parts) {
        if (part && !VALID_DIAMETERS.includes(part)) {
          issues.push({
            tag,
            level: "warning",
            message: `Diàmetre "${part}" no és un valor estàndard. Valors habituals: 45, 70, 100`,
          });
        }
      }
      break;
    }

    case "fire_hydrant:pressure":
      if (value && !VALID_PRESSURE.test(value)) {
        issues.push({
          tag,
          level: "error",
          message: `"${value}" no és un número vàlid de pressió`,
        });
      }
      break;

    case "survey:date":
      if (value && !VALID_DATE.test(value)) {
        issues.push({
          tag,
          level: "error",
          message: `"${value}" no té el format de data ISO (YYYY-MM-DD)`,
        });
      }
      break;

    case "addr:street":
    case "addr:neighbourhood":
      if (isAllCaps(value)) {
        issues.push({
          tag,
          level: "warning",
          message: `"${value}" està tot en majuscules`,
        });
      }
      break;
  }

  return issues;
}

/**
 * Validar tots els tags d'un hidrant abans de pujar-lo a OSM.
 */
export function validateHydrantTags(tags: Record<string, string>): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const [tag, value] of Object.entries(tags)) {
    // Validar longitud de clau
    if (tag.length > 255) {
      issues.push({
        tag,
        level: "error",
        message: `La clau del tag "${tag.slice(0, 20)}..." supera els 255 caràcters`,
      });
      continue;
    }

    // Validar longitud de valor
    if (value.length > 255) {
      issues.push({
        tag,
        level: "error",
        message: `El valor del tag "${tag}" supera els 255 caràcters`,
      });
      continue;
    }

    // Si és un tag gestionat per l'UI, validar contra la llista de valors
    if (MANAGED_TAGS.has(tag)) {
      issues.push(...validateManagedTag(tag, value));
    }

    // Per a qualsevol tag de text: detectar majuscules evidents
    if (value.length >= 3 && isAllCaps(value)) {
      issues.push({
        tag,
        level: "warning",
        message: `"${value}" està tot en majuscules`,
      });
    }
  }

  const hasErrors = issues.some((i) => i.level === "error");

  // Logging per a depuració
  const errorCount = issues.filter((i) => i.level === "error").length;
  const warningCount = issues.filter((i) => i.level === "warning").length;

  if (errorCount > 0) {
    logError("OSM_VALIDATOR", `Validació fallida: ${errorCount} errors, ${warningCount} warnings`);
  } else if (warningCount > 0) {
    logWarn("OSM_VALIDATOR", `Validació amb warnings: ${warningCount} warnings`);
  } else {
    logInfo("OSM_VALIDATOR", "Validació correcta");
  }

  return {
    valid: !hasErrors,
    issues,
  };
}
