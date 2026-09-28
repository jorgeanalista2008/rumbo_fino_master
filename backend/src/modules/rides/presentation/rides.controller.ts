import { Controller, Post, Body, Param, Patch, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RidesService, CreateRideDto } from '../application/services/rides.service';
import { RideStatusEnum, UserRoleEnum } from '../../../common/enums/roles.enum';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Rides')
@ApiBearerAuth('JWT-auth')
@Controller('rides')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  @Roles(UserRoleEnum.PASSENGER, UserRoleEnum.DISPATCHER, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN)
  @ApiOperation({ summary: 'Solicitar un nuevo viaje ejecutivo (Pasajero/Despachador)' })
  async createRide(@Body() dto: CreateRideDto) {
    const result = await this.ridesService.createRide(dto);
    return ApiResponseDto.ok(result, 'Viaje solicitado exitosamente');
  }

  @Get('active')
  @Roles(UserRoleEnum.DISPATCHER, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DRIVER, UserRoleEnum.AUDITOR)
  @ApiOperation({ summary: 'Obtener todos los viajes activos para la consola de monitoreo en tiempo real' })
  async getActiveRides() {
    const result = await this.ridesService.getActiveRides();
    return ApiResponseDto.ok(result);
  }

  @Get()
  @Roles(UserRoleEnum.DISPATCHER, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.AUDITOR)
  @ApiOperation({ summary: 'Listar historial completo de viajes' })
  async getAllRides() {
    const result = await this.ridesService.getAllRides();
    return ApiResponseDto.ok(result);
  }

  @Patch(':id/status')
  @Roles(UserRoleEnum.DRIVER, UserRoleEnum.DISPATCHER, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN)
  @ApiOperation({ summary: 'Transicionar estado del viaje (ASIGNADO, EN_CAMINO, ABORDAJE, EN_CURSO, FINALIZADO, CANCELADO)' })
  async updateStatus(
    @Param('id') rideId: string,
    @Body('status') status: RideStatusEnum,
    @Body('driverId') driverId?: string,
  ) {
    const result = await this.ridesService.updateRideStatus(rideId, status, driverId);
    return ApiResponseDto.ok(result, `Estado del viaje actualizado a ${status}`);
  }

  @Post(':id/assign-driver')
  @Roles(UserRoleEnum.DISPATCHER, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN)
  @ApiOperation({ summary: 'Asignar chofer y vehículo a un viaje solicitado' })
  async assignDriver(
    @Param('id') rideId: string,
    @Body('driverId') driverId: string,
    @Body('vehicleId') vehicleId?: string,
  ) {
    const result = await this.ridesService.assignDriverToRide(rideId, driverId, vehicleId);
    return ApiResponseDto.ok(result, 'Chofer asignado exitosamente al viaje');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalle y estado actual de un viaje' })
  async getRide(@Param('id') rideId: string) {
    const result = await this.ridesService.getRideById(rideId);
    return ApiResponseDto.ok(result);
  }
}
