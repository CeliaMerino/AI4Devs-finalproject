import { readFileSync } from 'fs';
import { join } from 'path';
import { parseGoodreadsCsv } from './goodreads-csv.parser';
import {
  mapBindingToReadFormat,
  mapExclusiveShelfToStatus,
  mapGoodreadsRating,
  mapGoodreadsRow,
  parseGoodreadsDate,
} from './goodreads-row.mapper';

const minFixturePath = join(
  __dirname,
  '../../../test/fixtures/goodreads_library_export.min.csv',
);

describe('parseGoodreadsDate', () => {
  it('converts Goodreads dates to ISO', () => {
    expect(parseGoodreadsDate('2024/06/15')).toBe('2024-06-15');
    expect(parseGoodreadsDate('2024/5/1')).toBe('2024-05-01');
  });

  it('returns null for empty or invalid values', () => {
    expect(parseGoodreadsDate('')).toBeNull();
    expect(parseGoodreadsDate('not-a-date')).toBeNull();
  });
});

describe('mapExclusiveShelfToStatus', () => {
  it('maps Goodreads shelves to reading status', () => {
    expect(mapExclusiveShelfToStatus('read')).toBe('leido');
    expect(mapExclusiveShelfToStatus('to-read')).toBe('pendiente');
    expect(mapExclusiveShelfToStatus('currently-reading')).toBe('leyendo');
    expect(mapExclusiveShelfToStatus('dnf')).toBeNull();
  });
});

describe('mapBindingToReadFormat', () => {
  it('maps physical bindings to fisico', () => {
    expect(mapBindingToReadFormat('Hardcover')).toBe('fisico');
    expect(mapBindingToReadFormat('Mass Market Paperback')).toBe('fisico');
    expect(mapBindingToReadFormat('Tapa blanda')).toBe('fisico');
  });

  it('maps digital and audio bindings', () => {
    expect(mapBindingToReadFormat('Kindle Edition')).toBe('ebook');
    expect(mapBindingToReadFormat('Audible Audio')).toBe('audio');
  });

  it('returns null for unknown bindings', () => {
    expect(mapBindingToReadFormat('Unknown')).toBeNull();
    expect(mapBindingToReadFormat('Unknown Binding')).toBeNull();
    expect(mapBindingToReadFormat('')).toBeNull();
  });
});

describe('mapGoodreadsRating', () => {
  it('maps 1-5 and treats 0 as unrated', () => {
    expect(mapGoodreadsRating('5')).toBe(5);
    expect(mapGoodreadsRating('0')).toBeNull();
    expect(mapGoodreadsRating('')).toBeNull();
  });
});

describe('mapGoodreadsRow', () => {
  const parsed = parseGoodreadsCsv(readFileSync(minFixturePath, 'utf8'));

  it('maps The Hobbit with started and finished dates', () => {
    const hobbit = parsed.mapped_rows.find((row) => row.book.title === 'The Hobbit');
    expect(hobbit).toMatchObject({
      book: {
        title: 'The Hobbit',
        authors: 'J.R.R. Tolkien',
        isbn10: '0618640150',
        isbn13: '9780618640157',
        page_count: 320,
        publication_year: 1937,
        data_source: 'goodreads',
        external_provider_id: '1001',
      },
      reading_record: {
        status: 'leido',
        rating: 5,
        read_format: 'fisico',
        started_on: '2024-01-10',
        finished_on: '2024-06-15',
      },
    });
  });

  it('clears started_on when Date Added is after Date Read', () => {
    const dune = parsed.mapped_rows.find((row) => row.book.title === 'Dune');
    expect(dune?.reading_record).toMatchObject({
      status: 'leido',
      started_on: null,
      finished_on: '2024-05-01',
      read_format: 'fisico',
      rating: 4,
    });
  });

  it('omits empty-title rows with a mapping warning', () => {
    expect(parsed.mapped_rows).toHaveLength(5);
    expect(parsed.mapping_warnings).toContainEqual(
      expect.objectContaining({
        row_number: 4,
        code: 'MISSING_TITLE',
      }),
    );
  });

  it('maps Kindle and currently-reading rows', () => {
    const noIsbn = parsed.mapped_rows.find((row) => row.book.title === 'No ISBN Book');
    expect(noIsbn?.reading_record.read_format).toBe('ebook');

    const readingNow = parsed.mapped_rows.find(
      (row) => row.book.title === 'Reading Now',
    );
    expect(readingNow?.reading_record).toMatchObject({
      status: 'leyendo',
      started_on: '2024-07-01',
      finished_on: null,
      read_format: 'fisico',
      rating: null,
    });
  });

  it('imports read books without finish date as leido', () => {
    const finishedNoDate = parsed.mapped_rows.find(
      (row) => row.book.title === 'Finished No Date',
    );
    expect(finishedNoDate?.reading_record).toMatchObject({
      status: 'leido',
      finished_on: null,
      started_on: '2023-12-01',
      rating: 2,
      read_format: 'fisico',
    });
  });

  it('returns a warning when mapping a single empty-title row', () => {
    const row = parsed.rows.find((item) => item.title.trim() === '');
    expect(row).toBeDefined();
    const result = mapGoodreadsRow(row!);
    expect(result.mapped).toBeNull();
    expect(result.warning?.code).toBe('MISSING_TITLE');
  });
});
