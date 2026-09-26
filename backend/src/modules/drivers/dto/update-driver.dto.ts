import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDriverDto {
  @ApiPropertyOptional({ example: 'LIC-A3C-998877', description: 'Número de licencia de conducir profesional' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'A-IIIc Executive', description: 'Categoría de la licencia' })
  @IsOptional()
  @IsString()
  licenseCategory?: string;

  @ApiPropertyOptional({ example: '2028-12-31', description: 'Fecha de vencimiento de la licencia (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  licenseExpiration?: string;

  @ApiPropertyOptional({ example: 'Carlos', description: 'Nombre' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Mendoza', description: 'Apellido' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+51987654321', description: 'Teléfono' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'carlos.mendoza@rumbofino.com', description: 'Correo electrónico' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://rumbofino.com/avatars/carlos.jpg', description: 'Fotografía de perfil' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
