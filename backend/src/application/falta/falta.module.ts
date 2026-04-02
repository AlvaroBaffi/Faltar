import { Module } from '@nestjs/common';
import { FaltaController } from './falta.controller';
import { FaltaService } from './falta.service';
import { FaltaRepository } from '../../domain/falta/falta.repository';
import { PrismaFaltaRepository } from '../../infrastructure/repositories/prisma-falta.repository';
import { DisciplinaRepository } from '../../domain/disciplina/disciplina.repository';
import { PrismaDisciplinaRepository } from '../../infrastructure/repositories/prisma-disciplina.repository';
import { UserRepository } from '../../domain/user/user.repository';
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma-user.repository';

@Module({
  controllers: [FaltaController],
  providers: [
    FaltaService,
    {
      provide: FaltaRepository,
      useClass: PrismaFaltaRepository,
    },
    {
      provide: DisciplinaRepository,
      useClass: PrismaDisciplinaRepository,
    },
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
})
export class FaltaModule {}
