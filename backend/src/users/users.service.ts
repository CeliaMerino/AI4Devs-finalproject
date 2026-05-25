import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findOrCreateByEmail(email: string): Promise<User> {
    const normalized = email.trim().toLowerCase();
    let user = await this.usersRepo.findOne({ where: { email: normalized } });
    if (!user) {
      user = this.usersRepo.create({ email: normalized, passwordHash: null });
      user = await this.usersRepo.save(user);
    }
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }
}
