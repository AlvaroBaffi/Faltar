import { Disciplina } from './disciplina.entity';

export abstract class DisciplinaRepository {
  abstract findByUserId(userId: string): Promise<Disciplina[]>;
  abstract findById(id: string): Promise<Disciplina | null>;
  abstract create(data: {
    nome: string;
    horas: number;
    porcentagemFalta: number;
    diasSemana: string[];
    userId: string;
  }): Promise<Disciplina>;
  abstract update(
    id: string,
    data: Partial<{ nome: string; horas: number; porcentagemFalta: number; diasSemana: string[] }>,
  ): Promise<Disciplina>;
  abstract delete(id: string): Promise<void>;
}
