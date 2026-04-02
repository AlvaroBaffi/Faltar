import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { DisciplinaRepository } from '../../domain/disciplina/disciplina.repository';
import { Disciplina } from '../../domain/disciplina/disciplina.entity';

@Injectable()
export class PrismaDisciplinaRepository extends DisciplinaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByUserId(userId: string): Promise<Disciplina[]> {
    const disciplinas = await this.prisma.disciplina.findMany({ where: { userId } });
    return disciplinas.map(
      (d) => new Disciplina(d.id, d.nome, d.horas, d.porcentagemFalta, JSON.parse(d.diasSemana), d.userId, d.faltasIniciais ?? 0),
    );
  }

  async findById(id: string): Promise<Disciplina | null> {
    const d = await this.prisma.disciplina.findUnique({ where: { id } });
    if (!d) return null;
    return new Disciplina(d.id, d.nome, d.horas, d.porcentagemFalta, JSON.parse(d.diasSemana), d.userId, d.faltasIniciais ?? 0);
  }

  async create(data: {
    nome: string;
    horas: number;
    porcentagemFalta: number;
    diasSemana: string[];
    userId: string;
    faltasIniciais?: number;
  }): Promise<Disciplina> {
    const d = await this.prisma.disciplina.create({
      data: { ...data, diasSemana: JSON.stringify(data.diasSemana), faltasIniciais: data.faltasIniciais ?? 0 },
    });
    return new Disciplina(d.id, d.nome, d.horas, d.porcentagemFalta, JSON.parse(d.diasSemana), d.userId, d.faltasIniciais ?? 0);
  }

  async update(
    id: string,
    data: Partial<{ nome: string; horas: number; porcentagemFalta: number; diasSemana: string[]; faltasIniciais: number }>,
  ): Promise<Disciplina> {
    const updateData: any = { ...data };
    if (data.diasSemana) {
      updateData.diasSemana = JSON.stringify(data.diasSemana);
    }
    const d = await this.prisma.disciplina.update({ where: { id }, data: updateData });
    return new Disciplina(d.id, d.nome, d.horas, d.porcentagemFalta, JSON.parse(d.diasSemana), d.userId, d.faltasIniciais ?? 0);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.disciplina.delete({ where: { id } });
  }
}
