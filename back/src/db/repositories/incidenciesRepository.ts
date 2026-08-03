import { db } from '../index.js';
import { incidencies, incidencia_events, users } from '../schema.js';
import { eq, and, ne, sql, desc } from 'drizzle-orm';
import { Incidencia, IncidenciaEvent } from '../../types.js';

export const IncidenciesRepository = {
  findAll(adfId?: number, includeClosed: boolean = false): Incidencia[] {
    let query = db.select().from(incidencies);
    const conditions = [];

    if (adfId !== undefined) {
      conditions.push(eq(incidencies.adf_id, adfId));
    }

    if (!includeClosed) {
      conditions.push(ne(incidencies.estat, 'TANCAT'));
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    return query.orderBy(desc(incidencies.actualitzat_at)).all() as Incidencia[];
  },

  findById(id: string): Incidencia | undefined {
    return db.select().from(incidencies).where(eq(incidencies.id, id)).get() as Incidencia | undefined;
  },

  getEvents(incidenciaId: string): IncidenciaEvent[] {
    const rows = db.select({
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
      tx.insert(incidencies).values({
        id: incidencia.id,
        titol: incidencia.titol,
        tipus: incidencia.tipus,
        estat: incidencia.estat,
        prioritat: incidencia.prioritat,
        adf_id: incidencia.adf_id,
        lat: incidencia.lat,
        lon: incidencia.lon,
        precisio: incidencia.precisio,
        creat_at: incidencia.creat_at,
        actualitzat_at: incidencia.actualitzat_at
      }).run();
      
      tx.insert(incidencia_events).values({
        id: event.id,
        incidencia_id: event.incidencia_id,
        usuari_id: event.usuari_id,
        tipus_event: event.tipus_event,
        dades: event.dades,
        creat_at: event.creat_at
      }).run();
    });
  },

  /**
   * Afegeix un esdeveniment a una incidència existent i actualitza l'estat denormalitzat de la incidència.
   */
  addEvent(event: IncidenciaEvent, updates?: Partial<Omit<Incidencia, 'id' | 'creat_at'>>): void {
    db.transaction((tx) => {
      tx.insert(incidencia_events).values({
        id: event.id,
        incidencia_id: event.incidencia_id,
        usuari_id: event.usuari_id,
        tipus_event: event.tipus_event,
        dades: event.dades,
        creat_at: event.creat_at
      }).run();
      
      const incidenciaUpdate: any = {
        ...updates,
        actualitzat_at: sql`CURRENT_TIMESTAMP`
      };

      tx.update(incidencies)
        .set(incidenciaUpdate)
        .where(eq(incidencies.id, event.incidencia_id))
        .run();
    });
  }
};
