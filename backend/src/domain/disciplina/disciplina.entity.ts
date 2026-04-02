export class Disciplina {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly horas: number,
    public readonly porcentagemFalta: number,
    public readonly diasSemana: string[],
    public readonly userId: string,
  ) {}
}
