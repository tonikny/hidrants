export type HydrantUiFields = {
  position: string;
  type: string;
  couplings: string;
  diameters: string;
  pressure: string;
  street: string;
  num: string;
  barri: string;
  surveyDate: string;
  estat: string;
};

export type HydrantOsmTags = Record<string, string>;

function fromOsmCouplings(value: string): string {
  if (!value) return '';
  return value
    .split(';')
    .map((v) => v.trim())
    .map((v) => v.replace(/mm/i, '').trim())
    .filter((v) => v !== '')
    .join(';');
}

function toOsmCouplings(diameters: string): string {
  if (!diameters) return '';
  return diameters
    .split(';')
    .filter((d) => d.trim() !== '')
    .map((d) => `${d.trim()} mm`)
    .join('; ');
}

export function osm2Ui(osmTags: HydrantOsmTags): HydrantUiFields {
  const isOperative = osmTags['emergency'] === 'fire_hydrant';
  const isOutOfService = osmTags['disused:emergency'] === 'fire_hydrant';

  return {
    position: osmTags['fire_hydrant:position'] || '',
    type: osmTags['fire_hydrant:type'] || '',
    couplings: osmTags['couplings'] || '',
    diameters: fromOsmCouplings(osmTags['couplings:diameters'] || ''),
    pressure: osmTags['fire_hydrant:pressure'] || '',
    street: osmTags['addr:street'] || '',
    num: osmTags['addr:housenumber'] || '',
    barri: osmTags['addr:neighbourhood'] || '',
    surveyDate: osmTags['survey:date'] || '',
    estat: isOperative ? 'Operatiu' : isOutOfService ? 'Fora de servei' : 'Desconegut',
  };
}

export function ui2Osm(uiFields: HydrantUiFields): HydrantOsmTags {
  const osmTags: any = {
    'fire_hydrant:position': uiFields.position,
    'fire_hydrant:type': uiFields.type,
    couplings: uiFields.couplings,
    'couplings:diameters': toOsmCouplings(uiFields.diameters),
    'fire_hydrant:pressure': uiFields.pressure,
    'addr:street': uiFields.street,
    'addr:housenumber': uiFields.num,
    'addr:neighbourhood': uiFields.barri,
  };

  if (uiFields.surveyDate) {
    osmTags['survey:date'] = uiFields.surveyDate;
  }

  if (uiFields.estat === 'Operatiu') {
    osmTags['emergency'] = 'fire_hydrant';
    // No afegim disused:emergency per evitar tags buits
  } else if (uiFields.estat === 'Fora de servei') {
    osmTags['disused:emergency'] = 'fire_hydrant';
    // No afegim emergency per evitar tags buits
  } else {
    // Si és desconegut, el marquem com a hidrant genèric
    osmTags['emergency'] = 'fire_hydrant';
    // No afegim disused:emergency per evitar tags buits
  }

  // Filtre centralitzat: Eliminem tots els tags amb valor buit, null o undefined
  return Object.fromEntries(
    Object.entries(osmTags).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
  ) as HydrantOsmTags;
}
