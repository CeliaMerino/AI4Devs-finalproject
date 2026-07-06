import { BadRequestException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  cleanGoodreadsIsbn,
  parseCsvRecordLine,
  parseGoodreadsCsv,
} from './goodreads-csv.parser';

const fixturePath = join(
  __dirname,
  '../../../test/fixtures/goodreads_library_export.csv',
);

describe('cleanGoodreadsIsbn', () => {
  it('strips Excel-style wrapper from ISBN13', () => {
    expect(cleanGoodreadsIsbn('="9780618640157"')).toBe('9780618640157');
  });

  it('returns null for empty values', () => {
    expect(cleanGoodreadsIsbn('')).toBeNull();
    expect(cleanGoodreadsIsbn('   ')).toBeNull();
  });
});

describe('parseCsvRecordLine', () => {
  it('parses quoted fields with commas inside', () => {
    expect(parseCsvRecordLine('"a","b,c","d"')).toEqual(['a', 'b,c', 'd']);
  });

  it('unescapes doubled quotes', () => {
    expect(parseCsvRecordLine('"say ""hi""",next')).toEqual(['say "hi"', 'next']);
  });
});

describe('parseGoodreadsCsv', () => {
  it('parses the fixture with edge cases', () => {
    const content = readFileSync(fixturePath, 'utf8');
    const result = parseGoodreadsCsv(content);

    expect(result.meta.total_rows).toBe(6);
    expect(result.meta.parsed_rows).toBe(6);
    expect(result.rows).toHaveLength(6);

    const hobbit = result.rows[0];
    expect(hobbit.title).toBe('The Hobbit');
    expect(hobbit.isbn).toBe('0618640150');
    expect(hobbit.isbn13).toBe('9780618640157');

    const dune = result.rows[1];
    expect(dune.date_read).toBe('2024/05/01');
    expect(dune.date_added).toBe('2024/06/20');

    const noIsbn = result.rows[3];
    expect(noIsbn.isbn).toBeNull();
    expect(noIsbn.isbn13).toBeNull();
    expect(noIsbn.binding).toBe('Kindle Edition');

    const finishedNoDate = result.rows[5];
    expect(finishedNoDate.exclusive_shelf).toBe('read');
    expect(finishedNoDate.date_read).toBe('');
    expect(finishedNoDate.read_count).toBe('2');
  });

  it('rejects empty files', () => {
    expect(() => parseGoodreadsCsv('')).toThrow(BadRequestException);
  });

  it('rejects missing required headers', () => {
    expect(() => parseGoodreadsCsv('"Title"\n"Only title"')).toThrow(
      BadRequestException,
    );
  });

  it('skips malformed rows and records warnings', () => {
    const content = `${readFileSync(fixturePath, 'utf8')}\n"broken","row"`;
    const result = parseGoodreadsCsv(content);
    expect(result.meta.parsed_rows).toBe(6);
    expect(result.meta.skipped_rows).toBe(1);
    expect(result.warnings[0]?.code).toBe('COLUMN_COUNT_MISMATCH');
  });
});
