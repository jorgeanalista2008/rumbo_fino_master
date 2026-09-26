import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SaveRolePermissionDto {
  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsString()
  role: string;

  @IsNotEmpty({ message: 'El nombre visible es requerido' })
  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray({ message: 'Las rutas permitidas deben ser un arreglo de strings' })
  allowedRoutes: string[];

  @IsOptional()
  @IsBoolean()
  canCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;

  @IsOptional()
  @IsBoolean()
  canExport?: boolean;
}
