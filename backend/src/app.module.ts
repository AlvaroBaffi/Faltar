import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './application/auth/auth.module';
import { DisciplinaModule } from './application/disciplina/disciplina.module';
import { FaltaModule } from './application/falta/falta.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DisciplinaModule,
    FaltaModule,
  ],
})
export class AppModule {}
