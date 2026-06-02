export type IncidentEstat = 'OBERT' | 'EN_PROGRES' | 'RESOLT' | 'TANCAT';
export type IncidentPrioritat = 'BAIXA' | 'MITJANA' | 'ALTA';
export type IncidentPrecisio = 'DESCONEGUDA' | 'MUNICIPI' | 'AREA' | 'EXACTA';

export interface Incident {
  id: string;
  titol: string;
  tipus: string;
  estat: IncidentEstat;
  prioritat: IncidentPrioritat;
  adf_id: number | null;
  lat: number;
  lon: number;
  precisio: IncidentPrecisio;
  creat_at: string;
  actualitzat_at: string;
}

export type TipusEvent = 
  | 'CREACIO' 
  | 'CANVI_ESTAT' 
  | 'CANVI_TIPUS'
  | 'CANVI_PRIORITAT'
  | 'OBSERVACIO' 
  | 'CANVI_UBICACIO' 
  | 'MULTIMEDIA' 
  | 'ASSIGNACIO';

export interface IncidentEvent {
  id: string;
  incidencia_id: string;
  usuari_id: string | null;
  nom_usuari?: string;
  tipus_event: TipusEvent;
  dades: any; // Ja ve parsejat del backend
  creat_at: string;
}

export interface IncidentFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: Incident;
}
