export class Falta {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly disciplinaId: string,
    public readonly data: Date,
  ) {}
}
