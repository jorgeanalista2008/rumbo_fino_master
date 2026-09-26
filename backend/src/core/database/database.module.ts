import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserEntity } from './entities/user.entity';
import { VehicleEntity } from './entities/vehicle.entity';
import { VehicleDocumentEntity } from './entities/vehicle-document.entity';
import { DriverEntity } from './entities/driver.entity';
import { DriverDocumentEntity } from './entities/driver-document.entity';
import { RideEntity } from './entities/ride.entity';
import { RideLocationEntity } from './entities/ride-location.entity';
import { DriverVehicleAssignmentEntity } from './entities/driver-vehicle-assignment.entity';
import { DriverBalanceEntity } from './entities/driver-balance.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { ReviewEntity } from './entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'Jf18759339'),
        database: configService.get<string>('DB_NAME', 'rumbo_fino'),
        entities: [
          UserEntity,
          VehicleEntity,
          VehicleDocumentEntity,
          DriverEntity,
          DriverDocumentEntity,
          RideEntity,
          RideLocationEntity,
          DriverVehicleAssignmentEntity,
          DriverBalanceEntity,
          TransactionEntity,
          ReviewEntity,
        ],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
