import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../core/database/entities/user.entity';
import { DriverEntity } from '../../core/database/entities/driver.entity';
import { DriverBalanceEntity } from '../../core/database/entities/driver-balance.entity';
import { RolePermissionEntity } from '../../core/database/entities/role-permission.entity';
import { RidesModule } from '../rides/rides.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesPermissionsService } from './roles-permissions.service';
import { RolesPermissionsController } from './roles-permissions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      DriverEntity,
      DriverBalanceEntity,
      RolePermissionEntity,
    ]),
    forwardRef(() => RidesModule),
  ],
  controllers: [UsersController, RolesPermissionsController],
  providers: [UsersService, RolesPermissionsService],
  exports: [UsersService, RolesPermissionsService],
})
export class UsersModule {}
