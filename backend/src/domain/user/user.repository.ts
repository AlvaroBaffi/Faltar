import { User } from './user.entity';

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract create(data: {
    nome: string;
    email: string;
    senha: string;
    universidade: string;
  }): Promise<User>;
  abstract update(
    id: string,
    data: Partial<{ nome: string; email: string; universidade: string; limiteFaltas: number }>,
  ): Promise<User>;
}
