import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EndShiftDto {
  @ApiProperty({ example: 15580, description: 'Kilometraje final marcado en el odómetro al cerrar turno' })
  @IsInt()
  @Min(0, { message: 'El kilometraje final debe ser un número positivo' })
  finalOdometer: number;

  @ApiProperty({ example: 'Cierre de turno sin incidentes, vehículo entregado limpio y tanque lleno', description: 'Notas opcionales de cierre', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
