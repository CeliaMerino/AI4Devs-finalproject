import { BadRequestException } from '@nestjs/common';
import { StatsService } from './stats.service';
import type { FormatCountDto } from './dto/monthly-stats-response.dto';

describe('StatsService (pure helpers)', () => {
  describe('monthBounds', () => {
    it('computes inclusive start and exclusive next-month end', () => {
      expect(StatsService.monthBounds(2026, 6)).toEqual({
        periodStart: '2026-06-01',
        periodEnd: '2026-07-01',
      });
    });

    it('rolls December into the next year', () => {
      expect(StatsService.monthBounds(2026, 12)).toEqual({
        periodStart: '2026-12-01',
        periodEnd: '2027-01-01',
      });
    });

    it('zero-pads single-digit months', () => {
      expect(StatsService.monthBounds(2026, 1)).toEqual({
        periodStart: '2026-01-01',
        periodEnd: '2026-02-01',
      });
    });
  });

  describe('yearBounds', () => {
    it('computes inclusive start and exclusive next-year end', () => {
      expect(StatsService.yearBounds(2026)).toEqual({
        periodStart: '2026-01-01',
        periodEnd: '2027-01-01',
      });
    });
  });

  describe('validate', () => {
    it('accepts a valid year and month', () => {
      expect(() => StatsService.validate(2026, 6)).not.toThrow();
    });

    it('rejects a year outside 1970-2100', () => {
      expect(() => StatsService.validate(1800, 6)).toThrow(BadRequestException);
      expect(() => StatsService.validate(2200, 6)).toThrow(BadRequestException);
    });

    it('rejects a month outside 1-12', () => {
      expect(() => StatsService.validate(2026, 0)).toThrow(BadRequestException);
      expect(() => StatsService.validate(2026, 13)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('toInt', () => {
    it('parses numeric strings from raw query results', () => {
      expect(StatsService.toInt('4')).toBe(4);
    });

    it('returns 0 for null/undefined', () => {
      expect(StatsService.toInt(null)).toBe(0);
      expect(StatsService.toInt(undefined)).toBe(0);
    });
  });

  describe('roundAverage', () => {
    it('rounds to two decimals', () => {
      expect(StatsService.roundAverage('4.333333')).toBe(4.33);
      expect(StatsService.roundAverage(4.5)).toBe(4.5);
    });

    it('returns null when there is no average', () => {
      expect(StatsService.roundAverage(null)).toBeNull();
      expect(StatsService.roundAverage(undefined)).toBeNull();
    });
  });

  describe('pickPredominantFormat', () => {
    it('selects the highest non-unknown count', () => {
      const distribution: FormatCountDto[] = [
        { format: 'fisico', count: 3 },
        { format: 'ebook', count: 1 },
        { format: 'unknown', count: 2 },
      ];
      expect(StatsService.pickPredominantFormat(distribution)).toBe('fisico');
    });

    it('breaks ties by enum order fisico > ebook > audio', () => {
      const distribution: FormatCountDto[] = [
        { format: 'audio', count: 2 },
        { format: 'ebook', count: 2 },
        { format: 'fisico', count: 2 },
      ];
      expect(StatsService.pickPredominantFormat(distribution)).toBe('fisico');
    });

    it('returns null when only unknown formats are present', () => {
      const distribution: FormatCountDto[] = [{ format: 'unknown', count: 5 }];
      expect(StatsService.pickPredominantFormat(distribution)).toBeNull();
    });

    it('returns null for an empty distribution', () => {
      expect(StatsService.pickPredominantFormat([])).toBeNull();
    });
  });
});
