import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleCategoryEnum } from '../../../common/enums/roles.enum';

export class CreateVehicleDto {
  @ApiProperty({ example: 'BMW', description: 'Marca del vehículo' })
  @IsString()
  @IsNotEmpty({ message: 'La marca del vehículo es obligatoria' })
  make: string;

  @ApiProperty({ example: '7 Series 740i Executive', description: 'Modelo del vehículo' })
  @IsString()
  @IsNotEmpty({ message: 'El modelo del vehículo es obligatorio' })
  model: string;

  @ApiProperty({ example: 2025, description: 'Año de fabricación' })
  @IsInt()
  @Min(2000, { message: 'El año del vehículo debe ser igual o superior a 2000' })
  @Max(2030)
  year: number;

  @ApiProperty({ example: 'Negro Zafiro Metalizado', description: 'Color del vehículo' })
  @IsString()
  @IsNotEmpty({ message: 'El color es obligatorio' })
  color: string;

  @ApiProperty({ example: 'EXC-888', description: 'Placa de rodaje única' })
  @IsString()
  @IsNotEmpty({ message: 'La placa de rodaje es obligatoria' })
  licensePlate: string;

  @ApiProperty({ example: 'WBA71CH080C098765', description: 'Número VIN único del vehículo' })
  @IsString()
  @IsNotEmpty({ message: 'El número VIN es obligatorio' })
  vin: string;

  @ApiProperty({ example: 4, description: 'Número de asientos para pasajeros VIP', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  seats?: number;

  @ApiProperty({
    enum: VehicleCategoryEnum,
    example: VehicleCategoryEnum.EXECUTIVE_SEDAN,
    description: 'Categoría ejecutiva del vehículo',
    required: false,
  })
  @IsEnum(VehicleCategoryEnum)
  @IsOptional()
  category?: VehicleCategoryEnum;

  @ApiProperty({ example: 'Automática 8G Steptronic', description: 'Transmisión', required: false })
  @IsString()
  @IsOptional()
  transmission?: string;

  @ApiProperty({ example: 'Gasolina Premium / Mild Hybrid', description: 'Tipo de combustible', required: false })
  @IsString()
  @IsOptional()
  fuelType?: string;

  @ApiProperty({ example: '3 Maletas Grandes + 2 de Mano', description: 'Capacidad de equipaje', required: false })
  @IsString()
  @IsOptional()
  luggageCapacity?: string;

  @ApiProperty({
    example: ['Wi-Fi 5G', 'Asientos Cuero Nappa', 'Climatizador Tri-Zona', 'Tomas 110V'],
    description: 'Comodidades y amenities VIP incluidas',
    required: false,
  })
  @IsArray()
  @IsOptional()
  amenities?: string[];

  @ApiProperty({
    example: ['https://...', 'https://...', 'https://...', 'https://...'],
    description: 'Galería de 4 fotos (Frontal, Lateral Izquierdo, Lateral Derecho, Posterior)',
    required: false,
  })
  @IsArray()
  @IsOptional()
  photos?: string[];
}
