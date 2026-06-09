import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import type { ReadingStatus } from '../entities/reading-record.entity';

export class PatchReadingRecordDto {
  @IsOptional()
  @IsEnum(['pendiente', 'leyendo', 'leido', 'dnf'])
  status?: ReadingStatus;

  @IsOptional()
  @IsDateString()
  started_on?: string;

  @IsOptional()
  @IsDateString()
  finished_on?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsEnum(['fisico', 'ebook', 'audio'])
  read_format?: 'fisico' | 'ebook' | 'audio';
}
