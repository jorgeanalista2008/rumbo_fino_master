import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../core/database/entities/user.entity';
import { DriverEntity } from '../../core/database/entities/driver.entity';
import { DriverBalanceEntity } from '../../core/database/entities/driver-balance.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, DriverEntity, DriverBalanceEntity])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
