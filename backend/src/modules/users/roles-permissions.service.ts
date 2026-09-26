import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermissionEntity } from '../../core/database/entities/role-permission.entity';
import { SaveRolePermissionDto } from './dto/save-role-permission.dto';
import { RidesGateway } from '../rides/presentation/rides.gateway';

const DEFAULT_ROLE_PRESETS: Partial<RolePermissionEntity>[] = [
  {
    role: 'SUPER_ADMIN',
    displayName: 'Super Admin',
    description: 'Control total del sistema, auditoría financiera, configuración global y administración de roles.',
    allowedRoutes: [
      '/dashboard',
      '/dashboard/vehicles',
      '/dashboard/drivers',
      '/dashboard/dispatch',
      '/dashboard/financials',
      '/dashboard/exchange-rates',
      '/dashboard/users',
      '/dashboard/roles-permissions',
    ],
    isSystem: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
  },
  {
    role: 'FLEET_ADMIN',
    displayName: 'Administrador de la Flota',
    description: 'Gestión completa de vehículos, expedientes documentales, mantenimiento y asignación de unidades.',
    allowedRoutes: [
      '/dashboard',
      '/dashboard/vehicles',
      '/dashboard/drivers',
    ],
    isSystem: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
  },
  {
    role: 'DISPATCHER',
    displayName: 'Despachador Central',
    description: 'Centro de comando, telemetría y despacho de viajes en vivo, asignación de choferes y protocolo SOS.',
    allowedRoutes: [
      '/dashboard',
      '/dashboard/dispatch',
      '/dashboard/drivers',
      '/dashboard/vehicles',
    ],
    isSystem: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
  },
  {
    role: 'DRIVER',
    displayName: 'Chofer VIP',
    description: 'Conductor en red, control de turnos, odómetro, estado de cuenta y calificación.',
    allowedRoutes: [
      '/dashboard/drivers',
    ],
    isSystem: true,
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: false,
  },
  {
    role: 'PASSENGER',
    displayName: 'Cliente / Pasajero',
    description: 'Solicitante de viajes ejecutivos, seguimiento de ruta y métodos de pago.',
    allowedRoutes: [
      '/dashboard/dispatch',
    ],
    isSystem: true,
    canCreate: true,
    canEdit: false,
    canDelete: false,
    canExport: false,
  },
];

@Injectable()
export class RolesPermissionsService {
  private readonly logger = new Logger(RolesPermissionsService.name);

  constructor(
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,
    @Inject(forwardRef(() => RidesGateway))
    private readonly ridesGateway: RidesGateway,
  ) {}

  async getAll(): Promise<RolePermissionEntity[]> {
    const list = await this.rolePermissionRepository.find({
      order: { role: 'ASC' },
    });
    if (list.length === 0) {
      await this.resetDefaults();
      return this.rolePermissionRepository.find({ order: { role: 'ASC' } });
    }
    return list;
  }

  async getByRole(role: string): Promise<RolePermissionEntity> {
    const item = await this.rolePermissionRepository.findOne({ where: { role } });
    if (!item) {
      // Return default template or throw
      const fallback = DEFAULT_ROLE_PRESETS.find((p) => p.role === role);
      if (fallback) {
        const entity = this.rolePermissionRepository.create(fallback);
        return this.rolePermissionRepository.save(entity);
      }
      throw new NotFoundException(`Perfil de rol '${role}' no encontrado`);
    }
    return item;
  }

  async getUserPermissions(role: string): Promise<RolePermissionEntity> {
    try {
      return await this.getByRole(role);
    } catch {
      // Super admin fallback
      if (role === 'SUPER_ADMIN') {
        return {
          role: 'SUPER_ADMIN',
          displayName: 'Super Admin',
          description: 'Control total',
          allowedRoutes: [
            '/dashboard',
            '/dashboard/vehicles',
            '/dashboard/drivers',
            '/dashboard/dispatch',
            '/dashboard/financials',
            '/dashboard/exchange-rates',
            '/dashboard/users',
            '/dashboard/roles-permissions',
          ],
          isSystem: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return {
        role,
        displayName: role,
        description: '',
        allowedRoutes: ['/dashboard'],
        isSystem: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async saveRolePermission(role: string, dto: SaveRolePermissionDto): Promise<RolePermissionEntity> {
    let entity = await this.rolePermissionRepository.findOne({ where: { role } });

    if (!entity) {
      entity = this.rolePermissionRepository.create({
        role: role.toUpperCase(),
        displayName: dto.displayName,
        description: dto.description || '',
        allowedRoutes: dto.allowedRoutes || [],
        isSystem: false,
        canCreate: dto.canCreate ?? true,
        canEdit: dto.canEdit ?? true,
        canDelete: dto.canDelete ?? false,
        canExport: dto.canExport ?? true,
      });
    } else {
      entity.displayName = dto.displayName;
      if (dto.description !== undefined) entity.description = dto.description;
      entity.allowedRoutes = dto.allowedRoutes || [];
      if (dto.canCreate !== undefined) entity.canCreate = dto.canCreate;
      if (dto.canEdit !== undefined) entity.canEdit = dto.canEdit;
      if (dto.canDelete !== undefined) entity.canDelete = dto.canDelete;
      if (dto.canExport !== undefined) entity.canExport = dto.canExport;
    }

    const saved = await this.rolePermissionRepository.save(entity);

    // Broadcast permission update in real-time
    try {
      this.ridesGateway.server.emit('system:roles_permissions_updated', {
        role: saved.role,
        allowedRoutes: saved.allowedRoutes,
        updatedAt: new Date().toISOString(),
      });
      this.logger.log(`Permisos y menú para '${saved.role}' actualizados y emitidos en vivo`);
    } catch (wsErr) {
      this.logger.warn(`No se pudo emitir evento WebSocket de permisos: ${wsErr}`);
    }

    return saved;
  }

  async deleteRole(role: string): Promise<void> {
    const item = await this.rolePermissionRepository.findOne({ where: { role } });
    if (!item) {
      throw new NotFoundException(`El perfil de rol '${role}' no existe`);
    }
    if (item.isSystem || DEFAULT_ROLE_PRESETS.some((p) => p.role === role)) {
      throw new BadRequestException(`No se pueden eliminar los roles base predeterminados del sistema`);
    }
    await this.rolePermissionRepository.remove(item);
    this.logger.log(`Rol personalizado '${role}' eliminado exitosamente`);
  }

  async resetDefaults(): Promise<RolePermissionEntity[]> {
    for (const preset of DEFAULT_ROLE_PRESETS) {
      await this.rolePermissionRepository.save(
        this.rolePermissionRepository.create(preset),
      );
    }
    this.logger.log('Restaurados permisos de menú por defecto para todos los roles');
    return this.getAll();
  }
}
