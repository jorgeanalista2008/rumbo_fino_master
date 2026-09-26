import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRoleEnum } from '../../../common/enums/roles.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'pasajero.vip@rumbofino.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({
    example: 'Passenger123!',
    description: 'Contraseña de acceso (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    example: '+18005559988',
    description: 'Número de teléfono de contacto',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número telefónico es obligatorio' })
  phoneNumber: string;

  @ApiProperty({
    example: 'Fernando',
    description: 'Nombre del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  firstName: string;

  @ApiProperty({
    example: 'Alonso',
    description: 'Apellido del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName: string;

  @ApiProperty({
    enum: UserRoleEnum,
    example: UserRoleEnum.PASSENGER,
    description: 'Rol en el sistema (PASSENGER, DRIVER, DISPATCHER, SUPER_ADMIN)',
    required: false,
  })
  @IsEnum(UserRoleEnum, { message: 'Rol de usuario no válido' })
  @IsOptional()
  role?: UserRoleEnum;
}
