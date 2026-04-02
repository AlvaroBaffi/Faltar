import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UserRepository } from '../../domain/user/user.repository';
import { User } from '../../domain/user/user.entity';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return new User(user.id, user.nome, user.email, user.senha, user.universidade, user.limiteFaltas);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return new User(user.id, user.nome, user.email, user.senha, user.universidade, user.limiteFaltas);
  }

  async create(data: { nome: string; email: string; senha: string; universidade: string }): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return new User(user.id, user.nome, user.email, user.senha, user.universidade, user.limiteFaltas);
  }

  async update(id: string, data: Partial<{ nome: string; email: string; universidade: string; limiteFaltas: number }>): Promise<User> {
    const user = await this.prisma.user.update({ where: { id }, data });
    return new User(user.id, user.nome, user.email, user.senha, user.universidade, user.limiteFaltas);
  }
}
