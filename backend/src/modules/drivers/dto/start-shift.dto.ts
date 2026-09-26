import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartShiftDto {
  @ApiProperty({ example: 'f8d32b1a-9c4e-4123-8899-001122334455', description: 'ID del vehículo que utilizará en el turno' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 15400, description: 'Kilometraje registrado en el odómetro al iniciar el turno' })
  @IsInt()
  @Min(0, { message: 'El kilometraje inicial debe ser un número positivo' })
  initialOdometer: number;

  @ApiProperty({ example: 'Turno ejecutivo de mañana con vehículo en impecables condiciones', description: 'Notas opcionales de entrega', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
