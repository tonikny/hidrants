import { v4 as uuidv4 } from 'uuid';
import { IncidenciesRepository } from '../db/repositories/incidenciesRepository.js';
import { Incident, IncidentEvent, TipusEvent, IncidentEstat, IncidentPrioritat, IncidentPrecisio } from '../types.js';
import { NotFoundError } from '../errors.js';
import { sendTelegramMessage } from '../utils/telegram.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const IncidenciesService = {
  getIncidencies(adfId?: number, includeClosed: boolean = false) {
    return IncidenciesRepository.findAll(adfId, includeClosed);
  },

  getIncidenciesGeoJson(adfId?: number, includeClosed: boolean = false) {
    const rows = IncidenciesRepository.findAll(adfId, includeClosed);
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
    clientBaseUrl?: string;
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
    const appUrl = data.clientBaseUrl ? `${data.clientBaseUrl}/?adf=${incident.adf_id}&node=${incident.id}` : null;
    
    const msg = `⚠️ <b>NOVA INCIDÈNCIA</b>
${emojiPrioritat} <b>${escapeHtml(incident.titol)}</b>
🏷️ Tipus: ${escapeHtml(incident.tipus)}
${appUrl ? `📍 <a href="${appUrl}">Veure a l'aplicació</a>` : ''}
📍 Ubicació: <code>${incident.lat}, ${incident.lon}</code> (${incident.precisio})
💬 Comentari: ${escapeHtml(data.comentari || '(cap)')}
👤 Creat per: ${escapeHtml(nomUsuari)}
`;
    sendTelegramMessage(msg);

    return incident;
  },

  addEvent(incidenciaId: string, usuariId: string, nomUsuari: string, tipusEvent: TipusEvent, dades: any, clientBaseUrl?: string) {
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
    
    const appUrl = clientBaseUrl ? `${clientBaseUrl}/?adf=${incident.adf_id}&node=${incidenciaId}` : null;
    const linkHtml = appUrl ? `\n📍 <a href="${appUrl}">Veure a l'aplicació</a>` : '';

    if (tipusEvent === 'CANVI_ESTAT' && dades.nou) {
      updates.estat = dades.nou as IncidentEstat;
      msgTelegram = `🔄 <b>CANVI D'ESTAT</b>
📌 Incidència: ${escapeHtml(incident.titol)}
📉 Estat: ${escapeHtml(dades.anterior)} ➡️ <b>${escapeHtml(dades.nou)}</b>
👤 Per: ${escapeHtml(displayUser)}${linkHtml}`;
    } else if (tipusEvent === 'CANVI_TIPUS' && dades.nou) {
      updates.tipus = dades.nou as string;
      msgTelegram = `🏷️ <b>CANVI DE TIPUS</b>
📌 Incidència: ${escapeHtml(incident.titol)}
🆕 Tipus: ${escapeHtml(dades.anterior)} ➡️ <b>${escapeHtml(dades.nou)}</b>
👤 Per: ${escapeHtml(displayUser)}${linkHtml}`;
    } else if (tipusEvent === 'CANVI_PRIORITAT' && dades.nou) {
      updates.prioritat = dades.nou as IncidentPrioritat;
    } else if (tipusEvent === 'CANVI_UBICACIO' && dades.nova) {
      updates.lat = dades.nova.lat;
      updates.lon = dades.nova.lon;
      updates.precisio = dades.nova.precisio;
      msgTelegram = `📍 <b>CANVI D'UBICACIÓ</b>
📌 Incidència: ${escapeHtml(incident.titol)}
🆕 Nova posició: <code>${updates.lat}, ${updates.lon}</code>
👤 Per: ${escapeHtml(displayUser)}${linkHtml}`;
    } else if (tipusEvent === 'OBSERVACIO') {
      msgTelegram = `💬 <b>NOVA OBSERVACIÓ</b>
📌 Incidència: ${escapeHtml(incident.titol)}
📝 ${escapeHtml(dades.comentari)}
👤 Per: ${escapeHtml(displayUser)}${linkHtml}`;
    }

    IncidenciesRepository.addEvent(event, updates);

    if (msgTelegram) {
      sendTelegramMessage(msgTelegram);
    }

    return event;
  }
};
