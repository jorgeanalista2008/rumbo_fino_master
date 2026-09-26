import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleCategoryEnum } from '../../../common/enums/roles.enum';

export class CreateRideDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab', description: 'ID del pasajero VIP' })
  @IsOptional()
  @IsString()
  passengerId?: string;

  @ApiPropertyOptional({ example: 'Dr. Alejandro Rossi', description: 'Nombre completo del pasajero' })
  @IsOptional()
  @IsString()
  passengerName?: string;

  @ApiPropertyOptional({ example: '+58 412 987 6543', description: 'Teléfono del pasajero' })
  @IsOptional()
  @IsString()
  passengerPhone?: string;

  @ApiPropertyOptional({ example: 'drv-uuid', description: 'ID del chofer asignado de inmediato' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ example: 'veh-uuid', description: 'ID del vehículo asignado' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiProperty({
    enum: VehicleCategoryEnum,
    example: VehicleCategoryEnum.EXECUTIVE_SEDAN,
    description: 'Categoría de vehículo solicitada (EXECUTIVE_SEDAN, VIP_SUV, PREMIUM_VAN, LUXURY_ARMORED)',
  })
  @IsEnum(VehicleCategoryEnum)
  categoryRequested: VehicleCategoryEnum;

  @ApiProperty({ example: 'Centro Financiero Las Mercedes, Caracas', description: 'Dirección física de recojo' })
  @IsString()
  @IsNotEmpty()
  originAddress: string;

  @ApiProperty({ example: 10.4806, description: 'Coordenada Latitud de origen' })
  @IsNumber()
  originLat: number;

  @ApiProperty({ example: -66.8622, description: 'Coordenada Longitud de origen' })
  @IsNumber()
  originLng: number;

  @ApiProperty({ example: 'Aeropuerto Internacional Simón Bolívar de Maiquetía (CCS)', description: 'Dirección física de destino' })
  @IsString()
  @IsNotEmpty()
  destinationAddress: string;

  @ApiProperty({ example: 10.6031, description: 'Coordenada Latitud de destino' })
  @IsNumber()
  destinationLat: number;

  @ApiProperty({ example: -66.9906, description: 'Coordenada Longitud de destino' })
  @IsNumber()
  destinationLng: number;

  @ApiProperty({ example: 'PAGO_MOVIL', description: 'Método de pago (PAGO_MOVIL, CREDIT_CARD, CORPORATE_VOUCHER, CASH, WALLET)' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 55.0, description: 'Tarifa total calculada (opcional)' })
  @IsOptional()
  @IsNumber()
  totalFare?: number;
}

export type CreateRideRequestDto = CreateRideDto;
