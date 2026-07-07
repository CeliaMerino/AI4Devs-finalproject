import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DEFAULT_AUDIENCE_NAMES } from './audiences.constants';
import { AudiencesService } from './audiences.service';
import { Audience } from './entities/audience.entity';

describe('AudiencesService', () => {
  let service: AudiencesService;
  let repo: {
    count: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      count: jest.fn(),
      find: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    const module = await Test.createTestingModule({
      providers: [
        AudiencesService,
        { provide: getRepositoryToken(Audience), useValue: repo },
      ],
    }).compile();

    service = module.get(AudiencesService);
  });

  it('seeds default audiences for a new user', async () => {
    repo.count.mockResolvedValue(0);

    const result = await service.seedDefaultsForUser('user-1');

    expect(repo.create).toHaveBeenCalledTimes(DEFAULT_AUDIENCE_NAMES.length);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(DEFAULT_AUDIENCE_NAMES.length);
    expect(result.map((row) => row.name)).toEqual([...DEFAULT_AUDIENCE_NAMES]);
    expect(result.every((row) => row.isDefault)).toBe(true);
  });

  it('does not seed again when audiences already exist', async () => {
    const existing = [{ id: 'a1', userId: 'user-1', name: 'Adulto' }] as Audience[];
    repo.count.mockResolvedValue(1);
    repo.find.mockResolvedValue(existing);

    const result = await service.seedDefaultsForUser('user-1');

    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });
});
