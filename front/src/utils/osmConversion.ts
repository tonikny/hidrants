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

export interface HydrantImage {
  url: string;
  thumbnail: string;
  type: 'image' | 'panoramax';
}

export function getHydrantImages(osmTags: Record<string, string>): HydrantImage[] {
  if (!osmTags) return [];
  const images: HydrantImage[] = [];

  Object.keys(osmTags).forEach((key) => {
    const value = osmTags[key];
    if (!value) return;

    if (key === 'image' || key.match(/^image:\d+$/)) {
      if (value.startsWith('http')) {
        images.push({
          url: value,
          thumbnail: value,
          type: 'image',
        });
      }
    } else if (key === 'panoramax' || key.match(/^panoramax:\d+$/)) {
      const uuid = value.trim();
      // Si és un UUID (no URL)
      if (uuid && !uuid.startsWith('http')) {
        images.push({
          url: `https://api.panoramax.xyz/api/pictures/${uuid}/hd.jpg`,
          thumbnail: `https://api.panoramax.xyz/api/pictures/${uuid}/sd.jpg`,
          type: 'panoramax',
        });
      } else if (uuid.startsWith('http')) {
        // Si ja és una URL, la tractem com a image
        images.push({
          url: uuid,
          thumbnail: uuid,
          type: 'image',
        });
      }
    }
  });

  return images;
}
