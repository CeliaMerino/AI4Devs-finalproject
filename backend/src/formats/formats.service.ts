import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DEFAULT_FORMAT_NAMES,
  LEGACY_NAME_BY_READ_FORMAT,
} from './formats.constants';
import { Format } from './entities/format.entity';

@Injectable()
export class FormatsService {
  constructor(
    @InjectRepository(Format)
    private readonly formatsRepo: Repository<Format>,
  ) {}

  async hasFormats(userId: string): Promise<boolean> {
    const count = await this.formatsRepo.count({ where: { userId } });
    return count > 0;
  }

  async seedDefaultsForUser(userId: string): Promise<Format[]> {
    if (await this.hasFormats(userId)) {
      return this.formatsRepo.find({ where: { userId }, order: { name: 'ASC' } });
    }

    const rows = DEFAULT_FORMAT_NAMES.map((name) =>
      this.formatsRepo.create({
        userId,
        name,
        isDefault: true,
      }),
    );

    return this.formatsRepo.save(rows);
  }

  async resolveFormatIdByLegacySlug(
    userId: string,
    legacySlug: string | null | undefined,
  ): Promise<string | null> {
    if (legacySlug === undefined || legacySlug === null) {
      return null;
    }

    await this.seedDefaultsForUser(userId);

    const formatName = LEGACY_NAME_BY_READ_FORMAT[legacySlug];
    if (!formatName) {
      return null;
    }

    const format = await this.formatsRepo
      .createQueryBuilder('format')
      .where('format.user_id = :userId', { userId })
      .andWhere('LOWER(format.name) = LOWER(:name)', { name: formatName })
      .getOne();

    return format?.id ?? null;
  }
}
