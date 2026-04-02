import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { FaltaRepository } from '../../domain/falta/falta.repository';
import { DisciplinaRepository } from '../../domain/disciplina/disciplina.repository';
import { UserRepository } from '../../domain/user/user.repository';
import { CreateFaltaDto } from './falta.dto';

const DIAS_MAP: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

@Injectable()
export class FaltaService {
  constructor(
    private readonly faltaRepository: FaltaRepository,
    private readonly disciplinaRepository: DisciplinaRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async findByUser(userId: string) {
    return this.faltaRepository.findByUserId(userId);
  }

  async create(userId: string, dto: CreateFaltaDto) {
    const disciplina = await this.disciplinaRepository.findById(dto.disciplinaId);
    if (!disciplina) throw new NotFoundException('Disciplina não encontrada');
    if (disciplina.userId !== userId) throw new ForbiddenException();

    return this.faltaRepository.create({
      userId,
      disciplinaId: dto.disciplinaId,
      data: new Date(dto.data),
    });
  }

  async delete(id: string, userId: string) {
    const faltas = await this.faltaRepository.findByUserId(userId);
    const falta = faltas.find((f) => f.id === id);
    if (!falta) throw new NotFoundException('Falta não encontrada');
    if (falta.userId !== userId) throw new ForbiddenException();
    return this.faltaRepository.delete(id);
  }

  /**
   * Calcula os dias que o aluno pode faltar para cada disciplina.
   * Retorna um mapa de disciplinaId -> { diasPermitidos: Date[], faltasUsadas, faltasMaximas }
   */
  async calcularDiasDisponiveis(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const limiteFaltas = user.limiteFaltas ?? 25; // padrão 25%
    const disciplinas = await this.disciplinaRepository.findByUserId(userId);
    const todasFaltas = await this.faltaRepository.findByUserId(userId);

    const resultado: Record<
      string,
      {
        disciplinaNome: string;
        faltasUsadas: number;
        faltasMaximas: number;
        porcentagemAtual: number;
        diasPermitidos: string[];
        diasSemana: string[];
      }
    > = {};

    for (const disciplina of disciplinas) {
      const faltasDaDisciplina = todasFaltas.filter((f) => f.disciplinaId === disciplina.id);
      const faltasUsadas = faltasDaDisciplina.length;

      // Calcula total de aulas no semestre (aprox 20 semanas)
      const aulasPorSemana = disciplina.diasSemana.length;
      const totalAulasSemestre = aulasPorSemana * 20;

      // Máximo de faltas permitidas
      const faltasMaximas = Math.floor((limiteFaltas / 100) * totalAulasSemestre);
      const faltasRestantes = Math.max(0, faltasMaximas - faltasUsadas);
      const porcentagemAtual = totalAulasSemestre > 0 ? (faltasUsadas / totalAulasSemestre) * 100 : 0;

      // Gera os próximos dias disponíveis para faltar (próximas 16 semanas)
      const diasPermitidos: string[] = [];
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (faltasRestantes > 0) {
        const diasDaSemanaNumeros = disciplina.diasSemana.map((d) => DIAS_MAP[d.toLowerCase()] ?? -1).filter((d) => d >= 0);

        let diasAdicionados = 0;
        for (let i = 1; i <= 112 && diasAdicionados < faltasRestantes; i++) {
          const dia = new Date(hoje);
          dia.setDate(dia.getDate() + i);
          if (diasDaSemanaNumeros.includes(dia.getDay())) {
            // Verifica se já faltou neste dia
            const jaFaltou = faltasDaDisciplina.some(
              (f) => new Date(f.data).toISOString().split('T')[0] === dia.toISOString().split('T')[0],
            );
            if (!jaFaltou) {
              diasPermitidos.push(dia.toISOString().split('T')[0]);
              diasAdicionados++;
            }
          }
        }
      }

      resultado[disciplina.id] = {
        disciplinaNome: disciplina.nome,
        faltasUsadas,
        faltasMaximas,
        porcentagemAtual: Math.round(porcentagemAtual * 100) / 100,
        diasPermitidos,
        diasSemana: disciplina.diasSemana,
      };
    }

    return resultado;
  }
}
