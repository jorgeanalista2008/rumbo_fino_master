import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverBalanceEntity } from '../../core/database/entities/driver-balance.entity';
import { TransactionEntity } from '../../core/database/entities/transaction.entity';
import { FinancialsService } from './financials.service';
import { FinancialsController } from './financials.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DriverBalanceEntity, TransactionEntity])],
  controllers: [FinancialsController],
  providers: [FinancialsService],
  exports: [FinancialsService],
})
export class FinancialsModule {}
