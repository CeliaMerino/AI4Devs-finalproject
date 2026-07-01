import { IsEnum, IsOptional } from 'class-validator';
import type { AudienceType } from '../entities/book.entity';

export class PatchBookDto {
  @IsOptional()
  @IsEnum(['young_adult', 'new_adult', 'adult'])
  audience?: AudienceType | null;
}
