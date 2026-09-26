import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignVehicleDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab', description: 'ID del vehículo disponible a asignar' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 45200, description: 'Kilometraje / Odómetro inicial al momento de iniciar turno' })
  @IsNumber()
  @Min(0, { message: 'El odómetro inicial debe ser un número positivo' })
  initialOdometer: number;

  @ApiPropertyOptional({ example: 'Turno mañana asignado desde central de despacho.', description: 'Observaciones iniciales' })
  @IsOptional()
  @IsString()
  notes?: string;
}
