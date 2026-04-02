import { IsNotEmpty, IsString, IsNumber, IsInt, IsArray, IsOptional, Min } from 'class-validator';

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
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  horas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentagemFalta?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diasSemana?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  faltasIniciais?: number;
}
