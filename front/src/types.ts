export type CreateType = 'selection' | 'hydrant' | 'incidencia' | null;

export type IncidenciaEstat = 'OBERT' | 'EN_PROGRES' | 'RESOLT' | 'TANCAT';
export type IncidenciaPrioritat = 'BAIXA' | 'MITJANA' | 'ALTA';
export type IncidenciaPrecisio = 'DESCONEGUDA' | 'MUNICIPI' | 'AREA' | 'EXACTA';

export interface Incidencia {
  id: string;
  titol: string;
  tipus: string;
  estat: IncidenciaEstat;
  prioritat: IncidenciaPrioritat;
  adf_id: number | null;
  lat: number;
  lon: number;
  precisio: IncidenciaPrecisio;
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

export interface IncidenciaEvent {
  id: string;
  incidencia_id: string;
  usuari_id: string | null;
  nom_usuari?: string;
  tipus_event: TipusEvent;
  dades: any; // Ja ve parsejat del backend
  creat_at: string;
}

export interface IncidenciaFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: Incidencia;
}
