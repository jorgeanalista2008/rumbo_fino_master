import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewEntity } from '../../core/database/entities/review.entity';
import { DriverEntity } from '../../core/database/entities/driver.entity';
import { RideEntity } from '../../core/database/entities/ride.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewEntity, DriverEntity, RideEntity])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
