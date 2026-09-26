import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideEntity } from '../../core/database/entities/ride.entity';
import { RideLocationEntity } from '../../core/database/entities/ride-location.entity';
import { DriverEntity } from '../../core/database/entities/driver.entity';
import { DriverBalanceEntity } from '../../core/database/entities/driver-balance.entity';
import { TransactionEntity } from '../../core/database/entities/transaction.entity';
import { RidesController } from './presentation/rides.controller';
import { RidesService } from './application/services/rides.service';
import { RidesGateway } from './presentation/rides.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RideEntity,
      RideLocationEntity,
      DriverEntity,
      DriverBalanceEntity,
      TransactionEntity,
    ]),
  ],
  controllers: [RidesController],
  providers: [RidesService, RidesGateway],
  exports: [RidesService],
})
export class RidesModule {}
