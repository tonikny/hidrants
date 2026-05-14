import slug from 'slug';

export type Municipi = {
  slug: string;
  osmRelation: string;
};

export const MUNICIPIS: Municipi[] = [
  {
    slug: slug('els Hostalets de Pierola'),
    osmRelation: 'R345695',
  },
  {
    slug: slug('Piera'),
    osmRelation: 'R345699',
  },
];
