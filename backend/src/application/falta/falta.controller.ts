import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FaltaService } from './falta.service';
import { CreateFaltaDto } from './falta.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('faltas')
export class FaltaController {
  constructor(private readonly faltaService: FaltaService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.faltaService.findByUser(req.user.userId);
  }

  @Get('calcular')
  calcular(@Request() req: any) {
    return this.faltaService.calcularDiasDisponiveis(req.user.userId);
  }

  @Get('otimizar')
  otimizar(@Request() req: any) {
    return this.faltaService.calcularOtimizacao(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateFaltaDto) {
    return this.faltaService.create(req.user.userId, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.faltaService.delete(id, req.user.userId);
  }
}
