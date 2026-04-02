import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FaltaRepository } from '../../domain/falta/falta.repository';
import { Falta } from '../../domain/falta/falta.entity';

@Injectable()
export class PrismaFaltaRepository extends FaltaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByUserAndDisciplina(userId: string, disciplinaId: string): Promise<Falta[]> {
    const faltas = await this.prisma.falta.findMany({
      where: { userId, disciplinaId },
      orderBy: { data: 'desc' },
    });
    return faltas.map((f) => new Falta(f.id, f.userId, f.disciplinaId, f.data));
  }

  async findByUserId(userId: string): Promise<Falta[]> {
    const faltas = await this.prisma.falta.findMany({
      where: { userId },
      orderBy: { data: 'desc' },
    });
    return faltas.map((f) => new Falta(f.id, f.userId, f.disciplinaId, f.data));
  }

  async create(data: { userId: string; disciplinaId: string; data: Date }): Promise<Falta> {
    const f = await this.prisma.falta.create({ data });
    return new Falta(f.id, f.userId, f.disciplinaId, f.data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.falta.delete({ where: { id } });
  }

  async countByUserAndDisciplina(userId: string, disciplinaId: string): Promise<number> {
    return this.prisma.falta.count({ where: { userId, disciplinaId } });
  }
}
