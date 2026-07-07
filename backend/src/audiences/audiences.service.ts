import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_AUDIENCE_NAMES } from './audiences.constants';
import { AudienceResponseDto, toAudienceResponse } from './dto/audience-response.dto';
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

  async listForUser(userId: string): Promise<AudienceResponseDto[]> {
    const rows = await this.audiencesRepo.find({
      where: { userId },
      order: { name: 'ASC' },
    });
    return rows.map(toAudienceResponse);
  }

  async createForUser(userId: string, name: string): Promise<AudienceResponseDto> {
    const duplicate = await this.audiencesRepo
      .createQueryBuilder('audience')
      .where('audience.user_id = :userId', { userId })
      .andWhere('LOWER(audience.name) = LOWER(:name)', { name })
      .getOne();

    if (duplicate) {
      throw new ConflictException({
        statusCode: 409,
        message: 'An audience with this name already exists',
        code: 'AUDIENCE_DUPLICATE',
      });
    }

    const audience = await this.audiencesRepo.save(
      this.audiencesRepo.create({
        userId,
        name,
        isDefault: false,
      }),
    );

    return toAudienceResponse(audience);
  }

  async findOwnedById(userId: string, audienceId: string): Promise<Audience | null> {
    return this.audiencesRepo.findOne({
      where: { id: audienceId, userId },
    });
  }

  async deleteForUser(userId: string, audienceId: string): Promise<void> {
    const audience = await this.audiencesRepo.findOne({
      where: { id: audienceId, userId },
    });

    if (!audience) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Audience not found',
        code: 'AUDIENCE_NOT_FOUND',
      });
    }

    await this.audiencesRepo.remove(audience);
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
