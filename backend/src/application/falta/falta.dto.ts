import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateFaltaDto {
  @IsNotEmpty()
  @IsString()
  disciplinaId: string;

  @IsNotEmpty()
  @IsDateString()
  data: string;
}
