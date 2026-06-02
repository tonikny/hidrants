import { db } from '../index.js';
import { incidencies, incidencia_events, users } from '../schema.js';
import { eq, and, ne, sql, desc } from 'drizzle-orm';
import { Incident, IncidentEvent } from '../../types.js';

export const IncidenciesRepository = {
  findAll(adfId?: number, includeClosed: boolean = false): Incident[] {
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

    return query.orderBy(desc(incidencies.actualitzat_at)).all() as Incident[];
  },

  findById(id: string): Incident | undefined {
    return db.select().from(incidencies).where(eq(incidencies.id, id)).get() as Incident | undefined;
  },

  getEvents(incidenciaId: string): IncidentEvent[] {
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
      
    return rows as IncidentEvent[];
  },

  /**
   * Crea una incidència i el seu esdeveniment inicial de creació en una transacció.
   */
  createIncident(incident: Incident, event: IncidentEvent): void {
    db.transaction((tx) => {
      tx.insert(incidencies).values({
        id: incident.id,
        titol: incident.titol,
        tipus: incident.tipus,
        estat: incident.estat,
        prioritat: incident.prioritat,
        adf_id: incident.adf_id,
        lat: incident.lat,
        lon: incident.lon,
        precisio: incident.precisio,
        creat_at: incident.creat_at,
        actualitzat_at: incident.actualitzat_at
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
  addEvent(event: IncidentEvent, updates?: Partial<Omit<Incident, 'id' | 'creat_at'>>): void {
    db.transaction((tx) => {
      tx.insert(incidencia_events).values({
        id: event.id,
        incidencia_id: event.incidencia_id,
        usuari_id: event.usuari_id,
        tipus_event: event.tipus_event,
        dades: event.dades,
        creat_at: event.creat_at
      }).run();
      
      const incidentUpdate: any = {
        ...updates,
        actualitzat_at: sql`CURRENT_TIMESTAMP`
      };

      tx.update(incidencies)
        .set(incidentUpdate)
        .where(eq(incidencies.id, event.incidencia_id))
        .run();
    });
  }
};
