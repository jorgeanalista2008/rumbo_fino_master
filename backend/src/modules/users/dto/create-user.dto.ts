import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRoleEnum, UserStatusEnum } from '../../../common/enums/roles.enum';

export class CreateUserDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString({ message: 'El número de teléfono es requerido' })
  @IsNotEmpty({ message: 'El número de teléfono no puede estar vacío' })
  phoneNumber: string;

  @IsString({ message: 'El nombre es requerido' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  firstName: string;

  @IsString({ message: 'El apellido es requerido' })
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  lastName: string;

  @IsEnum(UserRoleEnum, { message: 'El rol de usuario debe ser: SUPER_ADMIN, FLEET_ADMIN, DISPATCHER, DRIVER o PASSENGER' })
  @IsNotEmpty({ message: 'El perfil/rol es requerido' })
  role: UserRoleEnum;

  @IsOptional()
  @IsEnum(UserStatusEnum, { message: 'El estado debe ser válido' })
  status?: UserStatusEnum;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
