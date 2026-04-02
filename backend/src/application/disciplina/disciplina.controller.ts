import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DisciplinaService } from './disciplina.service';
import { CreateDisciplinaDto, UpdateDisciplinaDto } from './disciplina.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('disciplinas')
export class DisciplinaController {
  constructor(private readonly disciplinaService: DisciplinaService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.disciplinaService.findByUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.disciplinaService.findById(id, req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateDisciplinaDto) {
    return this.disciplinaService.create(req.user.userId, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateDisciplinaDto) {
    return this.disciplinaService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.disciplinaService.delete(id, req.user.userId);
  }
}
