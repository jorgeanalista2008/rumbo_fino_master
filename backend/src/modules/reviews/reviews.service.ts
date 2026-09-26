import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ReviewEntity } from '../../core/database/entities/review.entity';
import { DriverEntity } from '../../core/database/entities/driver.entity';
import { RideEntity } from '../../core/database/entities/ride.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
    @InjectRepository(RideEntity)
    private readonly rideRepository: Repository<RideEntity>,
  ) {}

  async createReview(authorId: string, dto: CreateReviewDto): Promise<ReviewEntity> {
    const existing = await this.reviewRepository.findOne({
      where: { rideId: dto.rideId },
    });
    if (existing) {
      throw new ConflictException('Ya existe una valoración registrada para este viaje');
    }

    const ride = await this.rideRepository.findOne({ where: { id: dto.rideId } });
    if (!ride) {
      throw new NotFoundException(`Viaje con ID '${dto.rideId}' no encontrado`);
    }

    const review = this.reviewRepository.create({
      rideId: dto.rideId,
      authorId,
      targetId: dto.targetId,
      rating: dto.rating,
      cleanlinessRating: dto.cleanlinessRating,
      punctualityRating: dto.punctualityRating,
      comfortRating: dto.comfortRating,
      comment: dto.comment,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Recalculate ratingAvg if target user is a driver
    await this.recalculateDriverRating(dto.targetId);

    return savedReview;
  }

  async getReviewsForTarget(targetId: string): Promise<ReviewEntity[]> {
    return this.reviewRepository.find({
      where: { targetId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  private async recalculateDriverRating(targetUserId: string): Promise<void> {
    const driver = await this.driverRepository.findOne({
      where: { userId: targetUserId },
    });
    if (!driver) return;

    const rawResult = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.target_id = :targetUserId', { targetUserId })
      .getRawOne();

    if (rawResult && rawResult.avgRating) {
      driver.ratingAvg = Number(Number(rawResult.avgRating).toFixed(2));
      driver.totalRides = Number(rawResult.count || driver.totalRides);
      await this.driverRepository.save(driver);
    }
  }
}
