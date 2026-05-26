export type HydrantUiFields = {
  position: string;
  type: string;
  couplings: string;
  diameters: string;
  pressure: string;
  street: string;
  num: string;
  urbanitzacio: string;
  surveyDate: string;
  estat: string;
};

export type HydrantOsmTags = {
  emergency?: string;
  'disused:emergency'?: string;
  'fire_hydrant:type': string;
  'fire_hydrant:position': string;
  couplings: string;
  'couplings:diameters': string;
  'fire_hydrant:pressure': string;
  'addr:street': string;
  'addr:housenumber': string;
  'addr:neighbourhood': string;
  'survey:date': string;
} & Record<string, string>;

function fromOsmCouplings(value: string): string {
  return value
    .split(';')
    .map((v) => v.trim())
    .map((v) => v.replace(/mm/i, '').trim())
    .map(Number)
    .filter(Number.isFinite)
    .join(';');
}

function toOsmCouplings(diameters: string): string {
  return diameters
    .split(';')
    .map((d) => `${d} mm`)
    .join('; ');
}

const posicioHidrants = (key: string) => {
  switch (key) {
    case 'lane':
      return 'Calçada';
    case 'sidewalk':
      return 'Vorera';
    case 'green':
      return 'Verd';
    default:
      return 'Desconegut';
  }
};

const tipusHidrants = (key: string) => {
  switch (key) {
    case 'underground':
      return 'Subterrani';
    case 'pillar':
      return 'Columna';
    default:
      return 'Desconegut';
  }
};

const estatHidrants = (props: Record<string, string | undefined>) => {
  if (props['emergency'] === 'fire_hydrant') return 'Operatiu';
  if (props['disused:emergency'] === 'fire_hydrant') return 'Fora de servei';
  return 'Desconegut';
};

export function osm2Ui(osmTags: HydrantOsmTags): HydrantUiFields {
  const uiFields: HydrantUiFields = {
    position: posicioHidrants(osmTags['fire_hydrant:position']) || '',
    type: tipusHidrants(osmTags['fire_hydrant:type']),
    couplings: osmTags['couplings'] || '',
    diameters: fromOsmCouplings(osmTags['couplings:diameters'] || ''),
    pressure: osmTags['fire_hydrant:pressure'] || '',
    street: osmTags['addr:street'] || '',
    num: osmTags['addr:housenumber'] || '',
    urbanitzacio: osmTags['addr:neighbourhood'] || '',
    surveyDate: osmTags['survey:date'] || '',
    estat: estatHidrants(osmTags),
  };
  return uiFields;
}

export function ui2Osm(uiFields: HydrantUiFields): HydrantOsmTags {
  const osmTags: HydrantOsmTags = {
    emergency: uiFields.estat === 'Operatiu' ? 'fire_hydrant' : '',
    'disused:emergency': uiFields.estat !== 'Operatiu' ? 'fire_hydrant' : '',
    'fire_hydrant:position': uiFields.position,
    'fire_hydrant:type': uiFields.type || '',
    couplings: uiFields.couplings || '',
    'couplings:diameters': toOsmCouplings(uiFields.diameters || ''),
    'fire_hydrant:pressure': uiFields.pressure || '',
    'addr:street': uiFields.street || '',
    'addr:housenumber': uiFields.num || '',
    'addr:neighbourhood': uiFields.urbanitzacio || '',
    'survey:date': uiFields.surveyDate || '',
  };
  if (uiFields.estat === 'Operatiu') {
    osmTags['emergency'] = 'fire_hydrant';
    delete osmTags['disused:emergency'];
  } else {
    osmTags['disused:emergency'] = 'fire_hydrant';
    delete osmTags['emergency'];
  }

  return osmTags;
}
