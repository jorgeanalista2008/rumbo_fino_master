import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEntity } from '../../core/database/entities/driver.entity';
import { DriverDocumentEntity } from '../../core/database/entities/driver-document.entity';
import { DriverVehicleAssignmentEntity } from '../../core/database/entities/driver-vehicle-assignment.entity';
import { VehicleEntity } from '../../core/database/entities/vehicle.entity';
import { DriverBalanceEntity } from '../../core/database/entities/driver-balance.entity';
import { UserEntity } from '../../core/database/entities/user.entity';
import { ReviewEntity } from '../../core/database/entities/review.entity';
import { StorageModule } from '../../core/storage/storage.module';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DriverEntity,
      DriverDocumentEntity,
      DriverVehicleAssignmentEntity,
      VehicleEntity,
      DriverBalanceEntity,
      UserEntity,
      ReviewEntity,
    ]),
    StorageModule,
  ],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
