export type CanonicalGenre =
  | 'Fantasía'
  | 'Thriller'
  | 'Ciencia ficción'
  | 'Romance'
  | 'Histórica'
  | 'Ficción'
  | 'No ficción';

export const GENRE_NORMALIZATION_MAP: Record<CanonicalGenre, string[]> = {
  'Fantasía': [
    'fantasy',
    'fantasy fiction',
    'high fantasy',
    'epic fantasy',
    'magic',
    'sword and sorcery',
    'fantasia',
  ],
  Thriller: [
    'thriller',
    'suspense',
    'crime fiction',
    'mystery thriller',
    'psychological thriller',
    'detective',
    'misterio',
  ],
  'Ciencia ficción': [
    'science fiction',
    'sci-fi',
    'scifi',
    'dystopia',
    'space opera',
    'cyberpunk',
    'ciencia ficcion',
    'ciencia ficción',
  ],
  Romance: ['romance', 'love stories', 'romantic fiction', 'amor'],
  'Histórica': [
    'historical fiction',
    'historical',
    'historical novel',
    'historical',
    'historia ficcion',
  ],
  'Ficción': ['fiction', 'literary fiction', 'novel', 'novela'],
  'No ficción': [
    'non-fiction',
    'nonfiction',
    'biography',
    'memoir',
    'essay',
    'self-help',
    'history',
    'science',
  ],
};
