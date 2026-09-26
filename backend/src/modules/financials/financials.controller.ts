import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialsService } from './financials.service';
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
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obtener reporte de recaudación financiera global y comisiones (Super Admin)' })
  async getAdminSummary() {
    const summary = await this.financialsService.getAdminFinancialSummary();
    return ApiResponseDto.ok(summary, 'Resumen financiero global');
  }

  @Get('balances')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.DISPATCHER)
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
}
