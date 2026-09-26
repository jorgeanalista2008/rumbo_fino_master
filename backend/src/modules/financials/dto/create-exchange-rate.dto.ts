import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExchangeRateDto {
  @IsNotEmpty({ message: 'El valor de la tasa es requerido' })
  @IsNumber({}, { message: 'La tasa debe ser un número válido' })
  @Min(0.0001, { message: 'La tasa debe ser mayor a 0' })
  rate: number;

  @IsOptional()
  @IsString()
  currencyPair?: string; // default USD_VES

  @IsOptional()
  @IsString()
  source?: string; // 'BCV', 'PARALELO', 'MANUAL', 'BANCO_CENTRAL'

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  adminName?: string;

  @IsOptional()
  effectiveDate?: string | Date;
}
