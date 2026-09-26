import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@rumbofino.com',
    description: 'Correo electrónico registrado (Ej: admin@rumbofino.com, chofer1@rumbofino.com, pasajero1@rumbofino.com)',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({
    example: 'Admin123!',
    description: 'Contraseña del usuario (Ej: Admin123!, Driver123!, Passenger123!)',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}
