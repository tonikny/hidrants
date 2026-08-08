import { db } from "../index.js";
import { incidencies, incidencia_events, users } from "../schema.js";
import { eq, and, ne, sql, desc, inArray, or, type SQL } from "drizzle-orm";
import type { Incidencia, IncidenciaEvent } from "../../types.js";

export type Viewer = { role: string; adf_id: number | null } | null;

/** Condició SQL de visibilitat per al visor: públic només veu PUBLICA; loguejat veu
 *  PUBLICA + TOTES_ADFS + ADF_PRIVADA de la seva ADF; admin ho veu tot. */
export function visibilityCondition(viewer: Viewer): SQL | null | undefined {
  if (!viewer) {
    return eq(incidencies.visibilitat, "PUBLICA");
  }
  if (viewer.role === "admin") {
    return null;
  }
  if (viewer.adf_id === null) {
    return inArray(incidencies.visibilitat, ["PUBLICA", "TOTES_ADFS"]);
  }
  return or(
    inArray(incidencies.visibilitat, ["PUBLICA", "TOTES_ADFS"]),
    and(eq(incidencies.visibilitat, "ADF_PRIVADA"), eq(incidencies.adf_id, viewer.adf_id)),
  );
}

/** Comprova si el visor pot accedir a una incidència concreta. */
export function canView(incidencia: Incidencia, viewer: Viewer): boolean {
  if (!viewer) {
    return incidencia.visibilitat === "PUBLICA";
  }
  if (viewer.role === "admin") {
    return true;
  }
  if (incidencia.visibilitat === "PUBLICA" || incidencia.visibilitat === "TOTES_ADFS") {
    return true;
  }
  return viewer.adf_id !== null && incidencia.adf_id === viewer.adf_id;
}

export const IncidenciesRepository = {
  findAll(adfId?: number, includeClosed: boolean = false, viewer: Viewer = null): Incidencia[] {
    const conditions: SQL[] = [];

    const visCond = visibilityCondition(viewer);
    if (visCond) {
      conditions.push(visCond);
    }

    if (adfId !== undefined) {
      conditions.push(eq(incidencies.adf_id, adfId));
    }

    if (!includeClosed) {
      conditions.push(ne(incidencies.estat, "TANCAT"));
    }

    const query =
      conditions.length > 0
        ? db
            .select()
            .from(incidencies)
            .where(and(...conditions))
        : db.select().from(incidencies);

    return query.orderBy(desc(incidencies.actualitzat_at)).all() as Incidencia[];
  },

  findById(id: string): Incidencia | undefined {
    return db.select().from(incidencies).where(eq(incidencies.id, id)).get() as
      Incidencia | undefined;
  },

  getEvents(incidenciaId: string): IncidenciaEvent[] {
    const rows = db
      .select({
        id: incidencia_events.id,
        incidencia_id: incidencia_events.incidencia_id,
        usuari_id: incidencia_events.usuari_id,
        nom_usuari: users.username,
        tipus_event: incidencia_events.tipus_event,
        dades: incidencia_events.dades,
        creat_at: incidencia_events.creat_at,
      })
      .from(incidencia_events)
      .leftJoin(users, eq(incidencia_events.usuari_id, users.id))
      .where(eq(incidencia_events.incidencia_id, incidenciaId))
      .orderBy(desc(incidencia_events.creat_at))
      .all();

    return rows as IncidenciaEvent[];
  },

  /**
   * Crea una incidència i el seu esdeveniment inicial de creació en una transacció.
   */
  createIncidencia(incidencia: Incidencia, event: IncidenciaEvent): void {
    db.transaction((tx) => {
      tx.insert(incidencies)
        .values({
          id: incidencia.id,
          titol: incidencia.titol,
          tipus: incidencia.tipus,
          estat: incidencia.estat,
          prioritat: incidencia.prioritat,
          adf_id: incidencia.adf_id,
          lat: incidencia.lat,
          lon: incidencia.lon,
          precisio: incidencia.precisio,
          visibilitat: incidencia.visibilitat,
          creat_at: incidencia.creat_at,
          actualitzat_at: incidencia.actualitzat_at,
        })
        .run();

      tx.insert(incidencia_events)
        .values({
          id: event.id,
          incidencia_id: event.incidencia_id,
          usuari_id: event.usuari_id,
          tipus_event: event.tipus_event,
          dades: event.dades,
          creat_at: event.creat_at,
        })
        .run();
    });
  },

  /**
   * Afegeix un esdeveniment a una incidència existent i actualitza l'estat denormalitzat de la incidència.
   */
  addEvent(event: IncidenciaEvent, updates?: Partial<Omit<Incidencia, "id" | "creat_at">>): void {
    db.transaction((tx) => {
      tx.insert(incidencia_events)
        .values({
          id: event.id,
          incidencia_id: event.incidencia_id,
          usuari_id: event.usuari_id,
          tipus_event: event.tipus_event,
          dades: event.dades,
          creat_at: event.creat_at,
        })
        .run();

      tx.update(incidencies)
        .set({
          ...updates,
          actualitzat_at: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(incidencies.id, event.incidencia_id))
        .run();
    });
  },
};
