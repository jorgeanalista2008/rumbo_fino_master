import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleCategoryEnum } from '../../../common/enums/roles.enum';

export class CreateRideDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab', description: 'ID del pasajero VIP' })
  @IsUUID()
  passengerId: string;

  @ApiProperty({
    enum: VehicleCategoryEnum,
    example: VehicleCategoryEnum.EXECUTIVE_SEDAN,
    description: 'Categoría de vehículo solicitada (EXECUTIVE_SEDAN, VIP_SUV, PREMIUM_VAN, LUXURY_ARMORED)',
  })
  @IsEnum(VehicleCategoryEnum)
  categoryRequested: VehicleCategoryEnum;

  @ApiProperty({ example: 'Hotel Marriott, Av. Larco 1300, Miraflores', description: 'Dirección física de recojo' })
  @IsString()
  @IsNotEmpty()
  originAddress: string;

  @ApiProperty({ example: -12.1315, description: 'Coordenada Latitud de origen' })
  @IsNumber()
  originLat: number;

  @ApiProperty({ example: -77.0305, description: 'Coordenada Longitud de origen' })
  @IsNumber()
  originLng: number;

  @ApiProperty({ example: 'Aeropuerto Internacional Jorge Chávez (Terminal VIP)', description: 'Dirección física de destino' })
  @IsString()
  @IsNotEmpty()
  destinationAddress: string;

  @ApiProperty({ example: -12.0219, description: 'Coordenada Latitud de destino' })
  @IsNumber()
  destinationLat: number;

  @ApiProperty({ example: -77.1143, description: 'Coordenada Longitud de destino' })
  @IsNumber()
  destinationLng: number;

  @ApiProperty({ example: 'CREDIT_CARD', description: 'Método de pago (CREDIT_CARD, CORPORATE_VOUCHER, CASH, WALLET)' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;
}

export type CreateRideRequestDto = CreateRideDto;
