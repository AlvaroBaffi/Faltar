import { Module } from '@nestjs/common';
import { DisciplinaController } from './disciplina.controller';
import { DisciplinaService } from './disciplina.service';
import { DisciplinaRepository } from '../../domain/disciplina/disciplina.repository';
import { PrismaDisciplinaRepository } from '../../infrastructure/repositories/prisma-disciplina.repository';

@Module({
  controllers: [DisciplinaController],
  providers: [
    DisciplinaService,
    {
      provide: DisciplinaRepository,
      useClass: PrismaDisciplinaRepository,
    },
  ],
  exports: [DisciplinaService],
})
export class DisciplinaModule {}
