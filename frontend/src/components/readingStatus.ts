import type { ReadingStatus } from '../api/types';

export const READING_STATUS_OPTIONS: { value: ReadingStatus; label: string }[] =
  [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'leyendo', label: 'Leyendo' },
    { value: 'leido', label: 'Leído' },
    { value: 'dnf', label: 'DNF' },
  ];

export const READ_FORMAT_OPTIONS = [
  { value: 'fisico' as const, label: 'Físico' },
  { value: 'ebook' as const, label: 'Ebook' },
  { value: 'audio' as const, label: 'Audio' },
];
