import { Controller, Post, Body, Param, Patch, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RidesService, CreateRideDto } from '../application/services/rides.service';
import { RideStatusEnum, UserRoleEnum } from '../../../common/enums/roles.enum';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserEntity } from '../../../core/database/entities/user.entity';

@ApiTags('Rides')
@ApiBearerAuth('JWT-auth')
@Controller('rides')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  @Roles(UserRoleEnum.PASSENGER, UserRoleEnum.DISPATCHER, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN)
  @ApiOperation({ summary: 'Solicitar un nuevo viaje ejecutivo (Pasajero/Despachador)' })
  async createRide(@Body() dto: CreateRideDto, @CurrentUser() user: UserEntity) {
    if (!dto.passengerId && user?.role === UserRoleEnum.PASSENGER) {
      dto.passengerId = user.id;
    }
    const result = await this.ridesService.createRide(dto);
    return ApiResponseDto.ok(result, 'Viaje solicitado exitosamente');
  }

  @Post('estimate')
  @Roles(UserRoleEnum.PASSENGER, UserRoleEnum.DISPATCHER, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Estimar tarifas en USD y VES para todas las categorías de flota VIP' })
  async estimateFare(
    @Body()
    dto: {
      originLat: number;
      originLng: number;
      destinationLat: number;
      destinationLng: number;
    },
  ) {
    const result = await this.ridesService.estimateFareCategories(dto);
    return ApiResponseDto.ok(result, 'Cotización de tarifas generada');
  }

  @Get('passenger/active')
  @Roles(UserRoleEnum.PASSENGER, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Consultar el viaje activo actual del pasajero autenticado' })
  async getPassengerActiveRide(@CurrentUser() user: UserEntity) {
    const result = await this.ridesService.getActiveRideForPassenger(user.id);
    return ApiResponseDto.ok(result);
  }

  @Get('passenger/history')
  @Roles(UserRoleEnum.PASSENGER, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Consultar historial de viajes del pasajero autenticado' })
  async getPassengerRideHistory(@CurrentUser() user: UserEntity) {
    const result = await this.ridesService.getRideHistoryForPassenger(user.id);
    return ApiResponseDto.ok(result);
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
  @Roles(UserRoleEnum.PASSENGER, UserRoleEnum.DRIVER, UserRoleEnum.DISPATCHER, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN)
  @ApiOperation({ summary: 'Transicionar estado del viaje (ASIGNADO, EN_CAMINO, ABORDAJE, EN_CURSO, FINALIZADO, CANCELADO)' })
  async updateStatus(
    @Param('id') rideId: string,
    @Body('status') status: RideStatusEnum,
    @Body('driverId') driverId?: string,
    @Body('cancellationReason') cancellationReason?: string,
  ) {
    const result = await this.ridesService.updateRideStatus(rideId, status, driverId, cancellationReason);
    return ApiResponseDto.ok(result, `Estado del viaje actualizado a ${status}`);
  }

  @Post(':id/rate')
  @Roles(UserRoleEnum.PASSENGER, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Calificar chofer y experiencia de viaje' })
  async rateRide(
    @Param('id') rideId: string,
    @CurrentUser() user: UserEntity,
    @Body()
    dto: {
      rating: number;
      comment?: string;
      cleanlinessRating?: number;
      punctualityRating?: number;
      comfortRating?: number;
    },
  ) {
    const result = await this.ridesService.rateRide(rideId, user.id, dto);
    return ApiResponseDto.ok(result, 'Calificación registrada exitosamente');
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

