import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab', description: 'ID del viaje completado' })
  @IsUUID()
  rideId: string;

  @ApiProperty({ example: 'f8d32b1a-9c4e-4123-8899-001122334455', description: 'ID de usuario del chofer o pasajero a calificar' })
  @IsUUID()
  targetId: string;

  @ApiProperty({ example: 5, description: 'Calificación general (1 a 5 estrellas)' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 5, description: 'Puntaje de limpieza del vehículo (1 a 5)', required: false })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  cleanlinessRating?: number;

  @ApiProperty({ example: 5, description: 'Puntaje de puntualidad (1 a 5)', required: false })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  punctualityRating?: number;

  @ApiProperty({ example: 5, description: 'Puntaje de confort ejecutivo (1 a 5)', required: false })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  comfortRating?: number;

  @ApiProperty({ example: 'Excelente atención, chofer muy profesional, auto limpio y conducción muy suave.', description: 'Comentario opcional', required: false })
  @IsString()
  @IsOptional()
  comment?: string;
}
