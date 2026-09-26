import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleOnlineDto {
  @ApiProperty({ example: true, description: 'true para ponerse En Línea, false para Desconectarse' })
  @IsBoolean()
  isOnline: boolean;

  @ApiProperty({ example: -12.046374, description: 'Latitud GPS actual', required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: -77.042793, description: 'Longitud GPS actual', required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
