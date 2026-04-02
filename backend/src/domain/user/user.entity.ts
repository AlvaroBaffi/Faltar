export class User {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly email: string,
    public readonly senha: string,
    public readonly universidade: string,
    public readonly limiteFaltas: number | null,
  ) {}
}
