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

const POSITION_MAP: Record<string, string> = {
  lane: 'Calçada',
  sidewalk: 'Vorera',
  green: 'Verd',
};

const TYPE_MAP: Record<string, string> = {
  underground: 'Subterrani',
  pillar: 'Columna',
};

export function getHydrantDisplayData(uiFields: HydrantUiFields) {
  if (!uiFields) return [];

  return [
    { label: 'Data de revisió', value: uiFields.surveyDate || 'Desconeguda' },
    { label: 'Estat', value: uiFields.estat },
    {
      label: 'Tipus',
      value: TYPE_MAP[uiFields.type] || uiFields.type || 'Desconegut',
    },
    {
      label: 'Posició',
      value:
        POSITION_MAP[uiFields.position] || uiFields.position || 'Desconeguda',
    },
    { label: 'Acoblaments', value: uiFields.couplings || 'Desconegut' },
    {
      label: 'Diàmetres',
      value: uiFields.diameters
        ? uiFields.diameters.split(';').join(', ') + ' mm'
        : 'Desconegut',
    },
    {
      label: 'Pressió',
      value: uiFields.pressure ? `${uiFields.pressure} bar` : 'Desconeguda',
    },
    {
      label: 'Adreça',
      value: `${uiFields.street ?? ''} ${uiFields.num ?? ''} ${
        uiFields.barri ? '(' + uiFields.barri + ')' : ''
      }`.trim() || 'No disponible',
    },
  ];
}
