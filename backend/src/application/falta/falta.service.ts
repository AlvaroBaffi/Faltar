import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

const NUMERO_PARA_DIA: Record<number, string> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
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

  private calcBudget(
    disciplina: { diasSemana: string[]; faltasIniciais: number },
    faltasRegistradas: number,
    limiteFaltas: number,
  ) {
    const aulasPorSemana = disciplina.diasSemana.length;
    const totalAulasSemestre = aulasPorSemana * 20;
    const faltasMaximas = Math.floor((limiteFaltas / 100) * totalAulasSemestre);
    const faltasUsadas = faltasRegistradas + (disciplina.faltasIniciais ?? 0);
    return { faltasMaximas, faltasUsadas, faltasRestantes: Math.max(0, faltasMaximas - faltasUsadas), totalAulasSemestre };
  }

  async create(userId: string, dto: CreateFaltaDto) {
    const disciplina = await this.disciplinaRepository.findById(dto.disciplinaId);
    if (!disciplina) throw new NotFoundException('Disciplina não encontrada');
    if (disciplina.userId !== userId) throw new ForbiddenException();

    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const limiteFaltas = user.limiteFaltas ?? 25;

    const todasFaltas = await this.faltaRepository.findByUserId(userId);
    const disciplinas = await this.disciplinaRepository.findByUserId(userId);

    // Verificar budget da disciplina alvo (Caso 2)
    const faltasDaDisc = todasFaltas.filter((f) => f.disciplinaId === dto.disciplinaId);
    const budget = this.calcBudget(disciplina, faltasDaDisc.length, limiteFaltas);
    if (budget.faltasRestantes <= 0) {
      throw new BadRequestException(`Limite de faltas atingido em "${disciplina.nome}"`);
    }

    // Caso 5: verificar se alguma outra disciplina do mesmo dia já atingiu o limite
    const dataFalta = new Date(dto.data);
    const diaDaSemana = NUMERO_PARA_DIA[dataFalta.getDay()];
    const disciplinasNoDia = disciplinas.filter(
      (d) => d.id !== disciplina.id && d.diasSemana.includes(diaDaSemana),
    );

    for (const outra of disciplinasNoDia) {
      const faltasOutra = todasFaltas.filter((f) => f.disciplinaId === outra.id);
      const budgetOutra = this.calcBudget(outra, faltasOutra.length, limiteFaltas);
      if (budgetOutra.faltasRestantes <= 0) {
        throw new BadRequestException(
          `Não pode faltar neste dia: "${outra.nome}" já atingiu o limite de faltas`,
        );
      }
    }

    return this.faltaRepository.create({
      userId,
      disciplinaId: dto.disciplinaId,
      data: dataFalta,
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
   * Calcula os dias que o aluno pode faltar para cada disciplina,
   * aplicando os 5 casos de decisão (incluindo bloqueio cruzado por dia).
   */
  async calcularDiasDisponiveis(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const limiteFaltas = user.limiteFaltas ?? 25;
    const disciplinas = await this.disciplinaRepository.findByUserId(userId);
    const todasFaltas = await this.faltaRepository.findByUserId(userId);

    // Pré-calcular budget de cada disciplina
    const budgets = new Map<string, { faltasMaximas: number; faltasUsadas: number; faltasRestantes: number; totalAulasSemestre: number }>();
    const faltasPorDisc = new Map<string, typeof todasFaltas>();

    for (const disc of disciplinas) {
      const faltasDisc = todasFaltas.filter((f) => f.disciplinaId === disc.id);
      faltasPorDisc.set(disc.id, faltasDisc);
      budgets.set(disc.id, this.calcBudget(disc, faltasDisc.length, limiteFaltas));
    }

    // Mapear quais disciplinas estão em cada dia da semana
    const discsPorDia = new Map<string, typeof disciplinas>();
    for (const disc of disciplinas) {
      for (const dia of disc.diasSemana) {
        const key = dia.toLowerCase();
        if (!discsPorDia.has(key)) discsPorDia.set(key, []);
        discsPorDia.get(key)!.push(disc);
      }
    }

    // Verificar se um dia da semana está bloqueado (caso 5):
    // se QUALQUER disciplina nesse dia atingiu o limite, o dia inteiro está bloqueado
    const diaBloqueado = new Map<string, boolean>();
    for (const [dia, discs] of discsPorDia.entries()) {
      const bloqueado = discs.some((d) => budgets.get(d.id)!.faltasRestantes <= 0);
      diaBloqueado.set(dia, bloqueado);
    }

    const resultado: Record<
      string,
      {
        disciplinaNome: string;
        faltasUsadas: number;
        faltasMaximas: number;
        faltasRestantes: number;
        porcentagemAtual: number;
        diasPermitidos: string[];
        diasSemana: string[];
        atingiuLimite: boolean;
        bloqueadaPorOutra: boolean;
        podeFaltarHoje: boolean;
      }
    > = {};

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split('T')[0];
    const hojeDia = NUMERO_PARA_DIA[hoje.getDay()];

    for (const disciplina of disciplinas) {
      const budget = budgets.get(disciplina.id)!;
      const faltasDaDisciplina = faltasPorDisc.get(disciplina.id)!;
      const porcentagemAtual = budget.totalAulasSemestre > 0 ? (budget.faltasUsadas / budget.totalAulasSemestre) * 100 : 0;

      const atingiuLimite = budget.faltasRestantes <= 0;

      // Verifica se está bloqueada por outra disciplina no mesmo dia
      const bloqueadaPorOutra = !atingiuLimite && disciplina.diasSemana.some((dia) => {
        const outrasNoDia = (discsPorDia.get(dia.toLowerCase()) ?? []).filter((d) => d.id !== disciplina.id);
        return outrasNoDia.some((d) => budgets.get(d.id)!.faltasRestantes <= 0);
      });

      // podeFaltarHoje: disciplina tem aula hoje E o dia não está bloqueado E não faltou hoje ainda
      const temAulaHoje = disciplina.diasSemana.map((d) => d.toLowerCase()).includes(hojeDia);
      const jaFaltouHoje = faltasDaDisciplina.some(
        (f) => new Date(f.data).toISOString().split('T')[0] === hojeStr,
      );
      const hojeEstaBloqueado = diaBloqueado.get(hojeDia) ?? false;
      const podeFaltarHoje = temAulaHoje && !jaFaltouHoje && !hojeEstaBloqueado;

      // Gera diasPermitidos aplicando caso 5
      const diasPermitidos: string[] = [];
      if (budget.faltasRestantes > 0) {
        const diasDaSemanaNumeros = disciplina.diasSemana
          .map((d) => DIAS_MAP[d.toLowerCase()] ?? -1)
          .filter((d) => d >= 0);

        let diasAdicionados = 0;
        for (let i = 1; i <= 112 && diasAdicionados < budget.faltasRestantes; i++) {
          const dia = new Date(hoje);
          dia.setDate(dia.getDate() + i);
          if (!diasDaSemanaNumeros.includes(dia.getDay())) continue;

          const nomeDia = NUMERO_PARA_DIA[dia.getDay()];
          // Caso 5: se esse dia da semana está bloqueado, pular
          if (diaBloqueado.get(nomeDia)) continue;

          const diaStr = dia.toISOString().split('T')[0];
          const jaFaltou = faltasDaDisciplina.some(
            (f) => new Date(f.data).toISOString().split('T')[0] === diaStr,
          );
          if (!jaFaltou) {
            diasPermitidos.push(diaStr);
            diasAdicionados++;
          }
        }
      }

      resultado[disciplina.id] = {
        disciplinaNome: disciplina.nome,
        faltasUsadas: budget.faltasUsadas,
        faltasMaximas: budget.faltasMaximas,
        faltasRestantes: budget.faltasRestantes,
        porcentagemAtual: Math.round(porcentagemAtual * 100) / 100,
        diasPermitidos,
        diasSemana: disciplina.diasSemana,
        atingiuLimite,
        bloqueadaPorOutra,
        podeFaltarHoje,
      };
    }

    return resultado;
  }

  /**
   * Algoritmo greedy de otimização: calcula a sequência ótima de dias para faltar,
   * maximizando o total de dias faltados sem ultrapassar o limite de nenhuma disciplina.
   */
  async calcularOtimizacao(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const limiteFaltas = user.limiteFaltas ?? 25;
    const disciplinas = await this.disciplinaRepository.findByUserId(userId);
    const todasFaltas = await this.faltaRepository.findByUserId(userId);

    // Budget restante de cada disciplina
    const budgetRestante = new Map<string, number>();
    const nomeDisc = new Map<string, string>();
    for (const disc of disciplinas) {
      const faltasDisc = todasFaltas.filter((f) => f.disciplinaId === disc.id);
      const budget = this.calcBudget(disc, faltasDisc.length, limiteFaltas);
      budgetRestante.set(disc.id, budget.faltasRestantes);
      nomeDisc.set(disc.id, disc.nome);
    }

    // Identificar slots: cada dia da semana com aulas é um "tipo de slot"
    // slot = { diaDaSemana, disciplinaIds[] }
    const slotsPorDia = new Map<string, string[]>();
    for (const disc of disciplinas) {
      for (const dia of disc.diasSemana) {
        const key = dia.toLowerCase();
        if (!slotsPorDia.has(key)) slotsPorDia.set(key, []);
        if (!slotsPorDia.get(key)!.includes(disc.id)) {
          slotsPorDia.get(key)!.push(disc.id);
        }
      }
    }

    // Gerar dias futuros concretos (próximas 16 semanas), agrupados por slot
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diasFuturosPorSlot = new Map<string, string[]>(); // diaDaSemana -> datas[]

    for (const [diaSemana] of slotsPorDia.entries()) {
      const numDia = DIAS_MAP[diaSemana];
      if (numDia === undefined) continue;
      const datas: string[] = [];
      for (let i = 1; i <= 112; i++) {
        const d = new Date(hoje);
        d.setDate(d.getDate() + i);
        if (d.getDay() === numDia) {
          datas.push(d.toISOString().split('T')[0]);
        }
      }
      diasFuturosPorSlot.set(diaSemana, datas);
    }

    // Contar em quantos slots cada disciplina aparece (para custo de oportunidade)
    const aparicoesPorDisc = new Map<string, number>();
    for (const disc of disciplinas) {
      aparicoesPorDisc.set(disc.id, disc.diasSemana.length);
    }

    // Greedy: priorizar slots onde a disciplina mais restrita aparece em menos outros slots
    // Computa prioridade de cada slot e ordena
    interface SlotInfo {
      diaSemana: string;
      discIds: string[];
      teto: number;
      prioridade: number;
    }

    const computeSlots = (): SlotInfo[] => {
      const slots: SlotInfo[] = [];
      for (const [diaSemana, discIds] of slotsPorDia.entries()) {
        const teto = Math.min(...discIds.map((id) => budgetRestante.get(id) ?? 0));
        if (teto <= 0) continue;

        // Prioridade: teto / max(aparições da disciplina mais restrita)
        const maxAparicoes = Math.max(...discIds.map((id) => aparicoesPorDisc.get(id) ?? 1));
        const prioridade = teto / maxAparicoes;

        slots.push({ diaSemana, discIds, teto, prioridade });
      }
      // Maior prioridade primeiro (slots mais restritos e menos compartilhados)
      slots.sort((a, b) => b.prioridade - a.prioridade);
      return slots;
    };

    // Alocar faltas greedily
    const diasRecomendados: { data: string; diaSemana: string; disciplinas: string[] }[] = [];
    let totalFaltas = 0;

    let iteracoes = 0;
    const maxIteracoes = 500;
    while (iteracoes++ < maxIteracoes) {
      const slots = computeSlots();
      if (slots.length === 0) break;

      let alocou = false;
      for (const slot of slots) {
        const datasDisp = diasFuturosPorSlot.get(slot.diaSemana) ?? [];
        // Pegar próxima data não usada
        const dataIdx = datasDisp.findIndex(
          (d) => !diasRecomendados.some((r) => r.data === d),
        );
        if (dataIdx === -1) continue;

        const data = datasDisp[dataIdx];

        // Decrementar budget de todas as disciplinas do slot
        for (const discId of slot.discIds) {
          budgetRestante.set(discId, (budgetRestante.get(discId) ?? 0) - 1);
        }

        diasRecomendados.push({
          data,
          diaSemana: slot.diaSemana,
          disciplinas: slot.discIds.map((id) => nomeDisc.get(id) ?? id),
        });
        totalFaltas++;
        alocou = true;
        break; // Recompute priorities after each allocation
      }

      if (!alocou) break;
    }

    // Ordenar por data
    diasRecomendados.sort((a, b) => a.data.localeCompare(b.data));

    return {
      totalDiasFaltaveis: totalFaltas,
      diasRecomendados,
    };
  }
}
