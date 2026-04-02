import { Falta } from './falta.entity';

export abstract class FaltaRepository {
  abstract findByUserAndDisciplina(userId: string, disciplinaId: string): Promise<Falta[]>;
  abstract findByUserId(userId: string): Promise<Falta[]>;
  abstract create(data: { userId: string; disciplinaId: string; data: Date }): Promise<Falta>;
  abstract delete(id: string): Promise<void>;
  abstract countByUserAndDisciplina(userId: string, disciplinaId: string): Promise<number>;
}
