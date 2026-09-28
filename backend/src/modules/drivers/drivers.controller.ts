import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { StartShiftDto } from './dto/start-shift.dto';
import { EndShiftDto } from './dto/end-shift.dto';
import { ToggleOnlineDto } from './dto/toggle-online.dto';
import { UploadDriverDocDto } from './dto/upload-driver-doc.dto';
import { VerifyDriverDocDto } from './dto/verify-driver-doc.dto';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRoleEnum } from '../../common/enums/roles.enum';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { UserEntity } from '../../core/database/entities/user.entity';

@ApiTags('Drivers')
@ApiBearerAuth('JWT-auth')
@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('upload-file')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER, UserRoleEnum.DRIVER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir archivo físico (Fotografía JPG/PNG o Expediente PDF) desde el navegador' })
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Debe seleccionar un archivo (Imagen o PDF)');
    }
    const fileUrl = await this.driversService.uploadFile(file);
    return ApiResponseDto.ok({ fileUrl }, 'Archivo cargado exitosamente');
  }

  @Post()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Crear perfil de chofer ejecutivo vinculado a un usuario (Admin/Despachador)' })
  async createDriverProfile(@Body() dto: CreateDriverDto) {
    const driver = await this.driversService.createDriverProfile(dto);
    return ApiResponseDto.ok(driver, 'Perfil de chofer registrado exitosamente');
  }

  @Get()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER, UserRoleEnum.AUDITOR)
  @ApiOperation({ summary: 'Listar todos los choferes registrados' })
  async findAllDrivers() {
    const drivers = await this.driversService.findAllDrivers();
    return ApiResponseDto.ok(drivers);
  }

  @Get('me')
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Obtener mi perfil de chofer autenticado' })
  async getMyDriverProfile(@CurrentUser() user: UserEntity) {
    const driver = await this.driversService.findDriverByUserId(user.id);
    return ApiResponseDto.ok(driver);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un chofer por ID' })
  async findDriverById(@Param('id') id: string) {
    const driver = await this.driversService.findDriverById(id);
    return ApiResponseDto.ok(driver);
  }

  @Patch('online')
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Cambiar estado de disponibilidad (En Línea / Desconectado) e informar GPS' })
  async toggleOnline(
    @CurrentUser() user: UserEntity,
    @Body() dto: ToggleOnlineDto,
  ) {
    const driver = await this.driversService.findDriverByUserId(user.id);
    const updated = await this.driversService.toggleOnline(driver.id, dto);
    return ApiResponseDto.ok(
      updated,
      `Estado de disponibilidad actualizado: ${updated.isOnline ? 'EN LÍNEA' : 'DESCONECTADO'}`,
    );
  }

  @Post('shifts/start')
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Iniciar turno de conducción asignando vehículo con odómetro inicial' })
  async startShift(
    @CurrentUser() user: UserEntity,
    @Body() dto: StartShiftDto,
  ) {
    const driver = await this.driversService.findDriverByUserId(user.id);
    const shift = await this.driversService.startShift(driver.id, dto);
    return ApiResponseDto.ok(shift, 'Turno iniciado exitosamente. Vehículo asignado.');
  }

  @Post('shifts/end')
  @Roles(UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Finalizar turno de conducción registrando odómetro final y liberando vehículo' })
  async endShift(
    @CurrentUser() user: UserEntity,
    @Body() dto: EndShiftDto,
  ) {
    const driver = await this.driversService.findDriverByUserId(user.id);
    const shift = await this.driversService.endShift(driver.id, dto);
    return ApiResponseDto.ok(shift, 'Turno finalizado exitosamente. Vehículo liberado.');
  }

  @Get(':id/full-profile')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER, UserRoleEnum.AUDITOR, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Obtener la ficha completa del chofer (Perfil, Expedientes digitalizados, Reputación y Balance)' })
  async getFullProfile(@Param('id') id: string) {
    const fullProfile = await this.driversService.getFullProfile(id);
    return ApiResponseDto.ok(fullProfile);
  }

  @Post(':id/documents')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER, UserRoleEnum.DRIVER)
  @ApiOperation({ summary: 'Registrar/Subir documento o expediente al perfil del chofer (Licencia, Antecedentes, DNI)' })
  async uploadDriverDocument(
    @Param('id') id: string,
    @Body() dto: UploadDriverDocDto,
  ) {
    const doc = await this.driversService.uploadDriverDocument(id, dto);
    return ApiResponseDto.ok(doc, 'Documento registrado exitosamente en el expediente');
  }

  @Patch('documents/:docId/verify')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Verificar y Aprobar/Rechazar un documento de chofer (Admin/Despachador)' })
  async verifyDriverDocument(
    @Param('docId') docId: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: VerifyDriverDocDto,
  ) {
    const doc = await this.driversService.verifyDriverDocument(docId, user.id, dto);
    return ApiResponseDto.ok(
      doc,
      `Documento ${doc.status === 'APPROVED' ? 'APROBADO' : 'RECHAZADO'} correctamente`,
    );
  }

  @Post(':id/assign-vehicle')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Asignar un vehículo a un chofer desde la consola de administración/despacho' })
  async assignVehicleByAdmin(
    @Param('id') id: string,
    @Body() dto: AssignVehicleDto,
  ) {
    const shift = await this.driversService.startShift(id, dto);
    return ApiResponseDto.ok(shift, 'Vehículo asignado e inicio de turno registrado exitosamente.');
  }

  @Post(':id/end-shift-admin')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Cerrar turno de un chofer y liberar vehículo desde la consola de administración' })
  async endShiftByAdmin(
    @Param('id') id: string,
    @Body() dto: EndShiftDto,
  ) {
    const shift = await this.driversService.endShift(id, dto);
    return ApiResponseDto.ok(shift, 'Turno cerrado y vehículo liberado exitosamente por administración.');
  }

  @Patch(':id')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Actualizar perfil de chofer (licencia, datos personales o teléfono)' })
  async updateDriver(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    const updated = await this.driversService.updateDriver(id, dto);
    return ApiResponseDto.ok(updated, 'Perfil de chofer actualizado exitosamente.');
  }

  @Delete(':id')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN)
  @ApiOperation({ summary: 'Eliminar o desactivar un perfil de chofer' })
  async deleteDriver(@Param('id') id: string) {
    await this.driversService.deleteDriver(id);
    return ApiResponseDto.ok(null, 'Perfil de chofer eliminado exitosamente.');
  }
}


