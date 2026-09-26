import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab', description: 'ID de usuario existente (opcional si se proveen los campos de usuario)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'carlos.mendoza@rumbofino.com', description: 'Correo electrónico para la cuenta del nuevo chofer' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string;

  @ApiPropertyOptional({ example: 'Chofer123!', description: 'Contraseña de acceso' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @ApiPropertyOptional({ example: 'Carlos', description: 'Nombre del chofer' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Mendoza', description: 'Apellido del chofer' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+51987654321', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'https://rumbofino.com/avatars/carlos.jpg', description: 'URL de la fotografía del chofer' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ example: 'LIC-A3C-998877', description: 'Número de licencia de conducir profesional' })
  @IsString()
  @IsNotEmpty({ message: 'El número de licencia es obligatorio' })
  licenseNumber: string;

  @ApiProperty({ example: 'A-IIIc Executive', description: 'Categoría de la licencia' })
  @IsString()
  @IsNotEmpty({ message: 'La categoría de licencia es obligatoria' })
  licenseCategory: string;

  @ApiProperty({ example: '2028-12-31', description: 'Fecha de vencimiento de la licencia (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'La fecha de expiración de licencia es obligatoria (YYYY-MM-DD)' })
  licenseExpiration: string;

  @ApiPropertyOptional({ example: 'https://rumbofino.com/docs/licencia.pdf', description: 'URL del archivo PDF de la Licencia' })
  @IsOptional()
  @IsString()
  licenseFileUrl?: string;

  @ApiPropertyOptional({ example: 'https://rumbofino.com/docs/certificado_medico.pdf', description: 'URL del archivo PDF del Certificado Médico' })
  @IsOptional()
  @IsString()
  medicalCertificateUrl?: string;

  @ApiPropertyOptional({ example: 'https://rumbofino.com/docs/certificado_manejo.pdf', description: 'URL del archivo PDF del Certificado de Saber Conducir' })
  @IsOptional()
  @IsString()
  drivingCertificateUrl?: string;

  @ApiPropertyOptional({ example: 'https://rumbofino.com/docs/antecedentes.pdf', description: 'URL del archivo PDF de Antecedentes Penales' })
  @IsOptional()
  @IsString()
  criminalRecordUrl?: string;

  @ApiPropertyOptional({ example: 'https://rumbofino.com/docs/dni.pdf', description: 'URL del archivo PDF de DNI' })
  @IsOptional()
  @IsString()
  identityCardUrl?: string;
}
