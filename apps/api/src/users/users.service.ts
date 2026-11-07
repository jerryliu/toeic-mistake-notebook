import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async ensureTestUser(seed: {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<User> {
    const existing = await this.findByEmail(seed.email);
    if (existing) {
      return existing;
    }
    const user = this.usersRepo.create({
      id: seed.id,
      email: seed.email,
      passwordHash: seed.passwordHash,
      displayName: seed.displayName,
      provider: 'local',
    });
    return this.usersRepo.save(user);
  }
}
