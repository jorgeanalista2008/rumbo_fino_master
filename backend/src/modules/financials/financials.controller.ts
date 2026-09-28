import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialsService } from './financials.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRoleEnum } from '../../common/enums/roles.enum';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { UserEntity } from '../../core/database/entities/user.entity';

@ApiTags('Financials')
@ApiBearerAuth('JWT-auth')
@Controller('financials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Get('summary')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.AUDITOR)
  @ApiOperation({ summary: 'Obtener reporte de recaudación financiera global y comisiones (Super Admin / Fleet Admin / Auditor)' })
  async getAdminSummary() {
    const summary = await this.financialsService.getAdminFinancialSummary();
    return ApiResponseDto.ok(summary, 'Resumen financiero global');
  }

  @Get('balances')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FLEET_ADMIN, UserRoleEnum.DISPATCHER, UserRoleEnum.AUDITOR)
  @ApiOperation({ summary: 'Consultar saldos y billeteras de todos los choferes' })
  async getAllBalances() {
    const list = await this.financialsService.getAllDriverBalances();
    return ApiResponseDto.ok(list);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Consultar historial de transacciones (tarifas, comisiones y pagos)' })
  async getTransactions(
    @CurrentUser() user: UserEntity,
    @Query('driverId') driverId?: string,
    @Query('passengerId') passengerId?: string,
  ) {
    const targetPassengerId = user.role === UserRoleEnum.PASSENGER ? user.id : passengerId;
    const list = await this.financialsService.getTransactions(driverId, targetPassengerId);
    return ApiResponseDto.ok(list);
  }

  // ==========================================
  // BCV EXCHANGE RATE ROUTES
  // ==========================================

  @Get('exchange-rates/current')
  @ApiOperation({ summary: 'Obtener la tasa oficial BCV activa en tiempo real' })
  async getCurrentExchangeRate(@Query('pair') pair?: string) {
    const currentRate = await this.financialsService.getCurrentExchangeRate(pair || 'USD_VES');
    return ApiResponseDto.ok(currentRate, 'Tasa oficial activa BCV obtenida exitosamente');
  }

  @Get('exchange-rates/history')
  @ApiOperation({ summary: 'Obtener el historial de tasas y auditoría cambiaria' })
  async getExchangeRateHistory(
    @Query('pair') pair?: string,
    @Query('limit') limit?: number,
  ) {
    const history = await this.financialsService.getExchangeRateHistory(
      pair || 'USD_VES',
      limit ? Number(limit) : 50,
    );
    return ApiResponseDto.ok(history, 'Historial de tasas BCV obtenido');
  }

  @Post('exchange-rates')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Actualizar o registrar una nueva tasa oficial BCV y transmitir a la red' })
  async updateExchangeRate(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateExchangeRateDto,
  ) {
    const adminName = user ? `${user.firstName} ${user.lastName}` : 'Administrador Central';
    const result = await this.financialsService.createOrUpdateExchangeRate({
      ...dto,
      adminName: dto.adminName || adminName,
    });
    return ApiResponseDto.ok(result, 'Tasa oficial BCV actualizada y transmitida a toda la red con éxito');
  }

  @Post('exchange-rates/sync-bcv')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.DISPATCHER)
  @ApiOperation({ summary: 'Sincronizar tasa en vivo con el Banco Central de Venezuela (BCV)' })
  async syncOfficialBcv() {
    const syncResult = await this.financialsService.syncOfficialBcv();
    return ApiResponseDto.ok(syncResult, syncResult.message);
  }
}
