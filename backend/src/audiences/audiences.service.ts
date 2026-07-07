import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_AUDIENCE_NAMES } from './audiences.constants';
import { Audience } from './entities/audience.entity';

@Injectable()
export class AudiencesService {
  constructor(
    @InjectRepository(Audience)
    private readonly audiencesRepo: Repository<Audience>,
  ) {}

  async hasAudiences(userId: string): Promise<boolean> {
    const count = await this.audiencesRepo.count({ where: { userId } });
    return count > 0;
  }

  async seedDefaultsForUser(userId: string): Promise<Audience[]> {
    if (await this.hasAudiences(userId)) {
      return this.audiencesRepo.find({ where: { userId }, order: { name: 'ASC' } });
    }

    const rows = DEFAULT_AUDIENCE_NAMES.map((name) =>
      this.audiencesRepo.create({
        userId,
        name,
        isDefault: true,
      }),
    );

    return this.audiencesRepo.save(rows);
  }
}
