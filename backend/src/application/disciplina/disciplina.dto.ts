import { IsNotEmpty, IsString, IsNumber, IsArray, Min } from 'class-validator';

export class CreateDisciplinaDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNumber()
  @Min(1)
  horas: number;

  @IsNumber()
  @Min(0)
  porcentagemFalta: number;

  @IsArray()
  @IsString({ each: true })
  diasSemana: string[];
}

export class UpdateDisciplinaDto {
  @IsString()
  nome?: string;

  @IsNumber()
  @Min(1)
  horas?: number;

  @IsNumber()
  @Min(0)
  porcentagemFalta?: number;

  @IsArray()
  @IsString({ each: true })
  diasSemana?: string[];
}
