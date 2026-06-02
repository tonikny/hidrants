import { v4 as uuidv4 } from 'uuid';
import { IncidenciesRepository } from '../db/repositories/incidenciesRepository.js';
import { Incident, IncidentEvent, TipusEvent, IncidentEstat, IncidentPrioritat, IncidentPrecisio } from '../types.js';
import { NotFoundError } from '../errors.js';
import { sendTelegramMessage } from '../utils/telegram.js';

export const IncidenciesService = {
  getIncidencies(adfId?: number) {
    return IncidenciesRepository.findAll(adfId);
  },

  getIncidenciesGeoJson(adfId?: number) {
    const rows = IncidenciesRepository.findAll(adfId);
    const features = rows.map(row => ({
      type: 'Feature',
      id: row.id,
      geometry: {
        type: 'Point',
        coordinates: [row.lon, row.lat]
      },
      properties: {
        ...row
      }
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  },

  getIncidentById(id: string) {
    const incident = IncidenciesRepository.findById(id);
    if (!incident) throw new NotFoundError('Incidència no trobada');
    
    const events = IncidenciesRepository.getEvents(id);
    // Parsear JSON de dades per a cada event
    const parsedEvents = events.map(e => ({
      ...e,
      dades: JSON.parse(e.dades || '{}')
    }));

    return {
      ...incident,
      events: parsedEvents
    };
  },

  createIncident(data: {
    titol: string;
    tipus: string;
    prioritat?: IncidentPrioritat;
    lat: number;
    lon: number;
    precisio?: IncidentPrecisio;
    adf_id: number;
    usuari_id: string;
    nom_usuari?: string;
    comentari?: string;
  }) {
    const incidentId = uuidv4();
    const eventId = uuidv4();
    const timestamp = new Date().toISOString();
    const nomUsuari = data.nom_usuari || data.usuari_id;

    const incident: Incident = {
      id: incidentId,
      titol: data.titol,
      tipus: data.tipus,
      estat: 'OBERT',
      prioritat: data.prioritat || 'MITJANA',
      adf_id: data.adf_id,
      lat: data.lat,
      lon: data.lon,
      precisio: data.precisio || 'EXACTA',
      creat_at: timestamp,
      actualitzat_at: timestamp
    };

    const event: IncidentEvent = {
      id: eventId,
      incidencia_id: incidentId,
      usuari_id: data.usuari_id,
      tipus_event: 'CREACIO',
      dades: JSON.stringify({
        titol: data.titol,
        tipus: data.tipus,
        prioritat: incident.prioritat,
        lat: data.lat,
        lon: data.lon,
        precisio: incident.precisio,
        comentari: data.comentari
      }),
      creat_at: timestamp
    };

    IncidenciesRepository.createIncident(incident, event);

    // Notificació Telegram
    const emojiPrioritat = incident.prioritat === 'ALTA' ? '🔴' : incident.prioritat === 'MITJANA' ? '🟠' : '🟡';
    const msg = `⚠️ <b>NOVA INCIDÈNCIA</b>
${emojiPrioritat} <b>${incident.titol}</b>
🏷️ Tipus: ${incident.tipus}
📍 Ubicació: <code>${incident.lat}, ${incident.lon}</code> (${incident.precisio})
💬 Comentari: ${data.comentari || '(cap)'}
👤 Creat per: ${nomUsuari}
`;
    sendTelegramMessage(msg);

    return incident;
  },

  addEvent(incidenciaId: string, usuariId: string, nomUsuari: string, tipusEvent: TipusEvent, dades: any) {
    const incident = IncidenciesRepository.findById(incidenciaId);
    if (!incident) throw new NotFoundError('Incidència no trobada');

    const eventId = uuidv4();
    const timestamp = new Date().toISOString();
    const displayUser = nomUsuari || usuariId;

    const event: IncidentEvent = {
      id: eventId,
      incidencia_id: incidenciaId,
      usuari_id: usuariId,
      tipus_event: tipusEvent,
      dades: JSON.stringify(dades),
      creat_at: timestamp
    };

    const updates: Partial<Incident> = {};
    let msgTelegram = '';

    if (tipusEvent === 'CANVI_ESTAT' && dades.nou) {
      updates.estat = dades.nou as IncidentEstat;
      msgTelegram = `🔄 <b>CANVI D'ESTAT</b>
📌 Incidència: ${incident.titol}
📉 Estat: ${dades.anterior} ➡️ <b>${dades.nou}</b>
👤 Per: ${displayUser}`;
    } else if (tipusEvent === 'CANVI_TIPUS' && dades.nou) {
      updates.tipus = dades.nou as string;
      msgTelegram = `🏷️ <b>CANVI DE TIPUS</b>
📌 Incidència: ${incident.titol}
🆕 Tipus: ${dades.anterior} ➡️ <b>${dades.nou}</b>
👤 Per: ${displayUser}`;
    } else if (tipusEvent === 'CANVI_PRIORITAT' && dades.nou) {
      updates.prioritat = dades.nou as IncidentPrioritat;
    } else if (tipusEvent === 'CANVI_UBICACIO' && dades.nova) {
      updates.lat = dades.nova.lat;
      updates.lon = dades.nova.lon;
      updates.precisio = dades.nova.precisio;
      msgTelegram = `📍 <b>CANVI D'UBICACIÓ</b>
📌 Incidència: ${incident.titol}
🆕 Nova posició: <code>${updates.lat}, ${updates.lon}</code>
👤 Per: ${displayUser}`;
    } else if (tipusEvent === 'OBSERVACIO') {
      msgTelegram = `💬 <b>NOVA OBSERVACIÓ</b>
📌 Incidència: ${incident.titol}
📝 ${dades.comentari}
👤 Per: ${displayUser}`;
    }

    IncidenciesRepository.addEvent(event, updates);

    if (msgTelegram) {
      sendTelegramMessage(msgTelegram);
    }

    return event;
  }
};
