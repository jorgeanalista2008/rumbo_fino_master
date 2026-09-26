import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesPermissionsService } from './roles-permissions.service';
import { SaveRolePermissionDto } from './dto/save-role-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRoleEnum } from '../../common/enums/roles.enum';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { UserEntity } from '../../core/database/entities/user.entity';

@ApiTags('Roles & Permissions')
@ApiBearerAuth('JWT-auth')
@Controller('roles-permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesPermissionsController {
  constructor(private readonly rolesPermissionsService: RolesPermissionsService) {}

  @Get('my-permissions')
  @ApiOperation({ summary: 'Obtener el menú permitido y permisos del usuario actualmente autenticado' })
  async getMyPermissions(@CurrentUser() user: UserEntity) {
    const permissions = await this.rolesPermissionsService.getUserPermissions(user.role);
    return ApiResponseDto.ok(permissions, 'Permisos de menú obtenidos');
  }

  @Get()
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar la matriz completa de roles, permisos y menús configurados' })
  async getAll() {
    const list = await this.rolesPermissionsService.getAll();
    return ApiResponseDto.ok(list);
  }

  @Get(':role')
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Consultar configuración de menú de un rol específico' })
  async getByRole(@Param('role') role: string) {
    const item = await this.rolesPermissionsService.getByRole(role);
    return ApiResponseDto.ok(item);
  }

  @Put(':role')
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar las rutas visibles en el menú y permisos para un rol' })
  async saveRole(
    @Param('role') role: string,
    @Body() dto: SaveRolePermissionDto,
  ) {
    const updated = await this.rolesPermissionsService.saveRolePermission(role, dto);
    return ApiResponseDto.ok(updated, `Permisos y menú para el rol '${role}' actualizados exitosamente`);
  }

  @Post('reset-defaults')
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Restaurar configuración de menús a valores oficiales por defecto' })
  async resetDefaults() {
    const resetList = await this.rolesPermissionsService.resetDefaults();
    return ApiResponseDto.ok(resetList, 'Permisos y menús restaurados a valores de fábrica');
  }
}
