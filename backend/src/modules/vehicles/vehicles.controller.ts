import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UploadVehicleDocDto } from './dto/upload-vehicle-doc.dto';
import { VerifyDocDto } from './dto/verify-doc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRoleEnum, VehicleStatusEnum } from '../../common/enums/roles.enum';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { UserEntity } from '../../core/database/entities/user.entity';

@ApiTags('Vehicles')
@ApiBearerAuth('JWT-auth')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Registrar nuevo vehículo en la flota (Admin/Despachador)' })
  async createVehicle(@Body() dto: CreateVehicleDto) {
    const vehicle = await this.vehiclesService.createVehicle(dto);
    return ApiResponseDto.ok(vehicle, 'Vehículo registrado exitosamente');
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los vehículos de la flota' })
  async findAllVehicles() {
    const list = await this.vehiclesService.findAllVehicles();
    return ApiResponseDto.ok(list);
  }

  @Get('available')
  @ApiOperation({ summary: 'Listar vehículos disponibles en la flota para asignación de turnos' })
  async findAvailableVehicles() {
    const list = await this.vehiclesService.findAvailableVehicles();
    return ApiResponseDto.ok(list);
  }

  @Get('dispatch-ready')
  @ApiOperation({ summary: 'Listar vehículos registrados, aprobados y habilitados para despacho en línea' })
  async findDispatchReadyVehicles() {
    const list = await this.vehiclesService.findDispatchReadyVehicles();
    return ApiResponseDto.ok(list);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un vehículo por ID' })
  async findVehicleById(@Param('id') id: string) {
    const vehicle = await this.vehiclesService.findVehicleById(id);
    return ApiResponseDto.ok(vehicle);
  }

  @Patch(':id/status')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Actualizar estado operativo del vehículo (AVAILABLE, IN_SERVICE, MAINTENANCE)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: VehicleStatusEnum,
  ) {
    const vehicle = await this.vehiclesService.updateVehicleStatus(id, status);
    return ApiResponseDto.ok(vehicle, `Estado del vehículo actualizado a ${status}`);
  }

  @Post(':id/documents')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.DISPATCHER, UserRoleEnum.DRIVER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir documento PDF o fotografía al expediente digital del vehículo' })
  async uploadDocument(
    @Param('id') vehicleId: string,
    @Body() dto: UploadVehicleDocDto,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Debe adjuntar un archivo (PDF o Imagen)');
    }

    const doc = await this.vehiclesService.uploadDocument(
      vehicleId,
      dto,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return ApiResponseDto.ok(doc, 'Documento cargado exitosamente para revisión');
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Consultar expediente de documentos de un vehículo' })
  async getDocuments(@Param('id') vehicleId: string) {
    const docs = await this.vehiclesService.getVehicleDocuments(vehicleId);
    return ApiResponseDto.ok(docs);
  }

  @Patch('documents/:docId/verify')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Aprobar o rechazar un documento del expediente del vehículo (Admin/Despachador)' })
  async verifyDocument(
    @Param('docId') docId: string,
    @Body() dto: VerifyDocDto,
    @CurrentUser() user: UserEntity,
  ) {
    const verifiedDoc = await this.vehiclesService.verifyDocument(docId, dto, user.id);
    return ApiResponseDto.ok(verifiedDoc, `Documento verificado: ${dto.status}`);
  }

  @Post(':id/release-driver')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Liberar conductor asignado a este vehículo y retornar unidad a disponible' })
  async releaseDriverFromVehicle(
    @Param('id') vehicleId: string,
    @Body() body: { finalOdometer?: number; notes?: string },
  ) {
    const res = await this.vehiclesService.releaseDriverFromVehicle(
      vehicleId,
      body?.finalOdometer,
      body?.notes,
    );
    return ApiResponseDto.ok(res, 'Conductor desasignado y vehículo liberado exitosamente');
  }
}
