import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DisciplinaRepository } from '../../domain/disciplina/disciplina.repository';
import { CreateDisciplinaDto, UpdateDisciplinaDto } from './disciplina.dto';

@Injectable()
export class DisciplinaService {
  constructor(private readonly disciplinaRepository: DisciplinaRepository) {}

  async findByUser(userId: string) {
    return this.disciplinaRepository.findByUserId(userId);
  }

  async findById(id: string, userId: string) {
    const disciplina = await this.disciplinaRepository.findById(id);
    if (!disciplina) throw new NotFoundException('Disciplina não encontrada');
    if (disciplina.userId !== userId) throw new ForbiddenException();
    return disciplina;
  }

  async create(userId: string, dto: CreateDisciplinaDto) {
    return this.disciplinaRepository.create({ ...dto, userId });
  }

  async update(id: string, userId: string, dto: UpdateDisciplinaDto) {
    const disciplina = await this.disciplinaRepository.findById(id);
    if (!disciplina) throw new NotFoundException('Disciplina não encontrada');
    if (disciplina.userId !== userId) throw new ForbiddenException();
    return this.disciplinaRepository.update(id, dto);
  }

  async delete(id: string, userId: string) {
    const disciplina = await this.disciplinaRepository.findById(id);
    if (!disciplina) throw new NotFoundException('Disciplina não encontrada');
    if (disciplina.userId !== userId) throw new ForbiddenException();
    return this.disciplinaRepository.delete(id);
  }
}
