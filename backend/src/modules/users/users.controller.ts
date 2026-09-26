import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoleEnum, UserStatusEnum } from '../../common/enums/roles.enum';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN)
  @ApiOperation({ summary: 'Obtener métricas y desglose de usuarios por rol' })
  async getStats() {
    const stats = await this.usersService.getRoleStats();
    return ApiResponseDto.ok(stats, 'Estadísticas de usuarios obtenidas');
  }

  @Get()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Listar usuarios con filtros por perfil (Super Admin, Fleet Admin, Despachador, Chofer, Pasajero)' })
  @ApiQuery({ name: 'role', enum: UserRoleEnum, required: false })
  @ApiQuery({ name: 'status', enum: UserStatusEnum, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async findAll(
    @Query('role') role?: UserRoleEnum,
    @Query('status') status?: UserStatusEnum,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.usersService.findAll({ role, status, search, page, limit });
    return ApiResponseDto.ok(result);
  }

  @Get(':id')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Consultar detalles de un usuario por ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    return ApiResponseDto.ok(user);
  }

  @Post()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN)
  @ApiOperation({ summary: 'Crear nuevo usuario con perfil específico (Super Admin, Flota, Despacho, Chofer o Pasajero)' })
  async create(@Body() dto: CreateUserDto) {
    const newUser = await this.usersService.create(dto);
    return ApiResponseDto.ok(newUser, 'Usuario creado exitosamente');
  }

  @Patch(':id')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN)
  @ApiOperation({ summary: 'Actualizar datos de perfil de usuario' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.usersService.update(id, dto);
    return ApiResponseDto.ok(updated, 'Perfil de usuario actualizado exitosamente');
  }

  @Patch(':id/status')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN)
  @ApiOperation({ summary: 'Cambiar estado del usuario (ACTIVE, SUSPENDED, PENDING_APPROVAL, INACTIVE)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: UserStatusEnum,
  ) {
    const updated = await this.usersService.updateStatus(id, status);
    return ApiResponseDto.ok(updated, `Estado del usuario actualizado a ${status}`);
  }

  @Delete(':id')
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar usuario de la plataforma (Solo Super Admin)' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.usersService.delete(id);
    return ApiResponseDto.ok(result, result.message);
  }
}
