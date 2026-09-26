import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRoleEnum, UserStatusEnum } from '../../../common/enums/roles.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRoleEnum, { message: 'El rol debe ser válido' })
  role?: UserRoleEnum;

  @IsOptional()
  @IsEnum(UserStatusEnum, { message: 'El estado debe ser válido' })
  status?: UserStatusEnum;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
