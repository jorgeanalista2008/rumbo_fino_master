import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverBalanceEntity } from '../../core/database/entities/driver-balance.entity';
import { TransactionEntity } from '../../core/database/entities/transaction.entity';
import { ExchangeRateEntity } from '../../core/database/entities/exchange-rate.entity';
import { RidesModule } from '../rides/rides.module';
import { FinancialsService } from './financials.service';
import { FinancialsController } from './financials.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverBalanceEntity, TransactionEntity, ExchangeRateEntity]),
    forwardRef(() => RidesModule),
  ],
  controllers: [FinancialsController],
  providers: [FinancialsService],
  exports: [FinancialsService],
})
export class FinancialsModule {}
