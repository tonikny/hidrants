export type ApiRequest = {
  method: string;
  query?: any;
  body?: any;
  headers?: any;
  params?: any;
  url?: string;
  user?: {
    id: string;
    username: string;
    adf_id: number | null;
    role: string;
  };
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
  send: (data: any) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
};

export type ApiHandler = (
  req: ApiRequest,
  res: ApiResponse
) => Promise<void> | void;

// --- Incidències ---

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
  nom_usuari?: string; // Camp virtual del join amb usuaris
  tipus_event: TipusEvent;
  dades: string; // JSON string
  creat_at: string;
}

// Estructures per al camp 'dades' dels events
export interface EventDataCreacio {
  titol: string;
  tipus: string;
  prioritat: IncidentPrioritat;
  lat: number;
  lon: number;
  precisio: IncidentPrecisio;
  comentari?: string;
}

export interface EventDataCanviEstat {
  anterior: IncidentEstat;
  nou: IncidentEstat;
}

export interface EventDataCanviTipus {
  anterior: string;
  nou: string;
}

export interface EventDataCanviUbicacio {
  anterior: { lat: number; lon: number; precisio: IncidentPrecisio };
  nova: { lat: number; lon: number; precisio: IncidentPrecisio };
}

export interface EventDataObservacio {
  observador?: string;
  comentari: string;
  orientacio?: number;
  distancia_m?: number;
}

export interface EventDataMultimedia {
  titol?: string;
  url: string;
  tipus: 'imatge' | 'video';
}
