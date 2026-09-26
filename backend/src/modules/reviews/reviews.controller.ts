import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../core/database/entities/user.entity';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Reviews')
@ApiBearerAuth('JWT-auth')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Enviar valoración de 1 a 5 estrellas y feedback sobre un viaje completado' })
  async createReview(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.reviewsService.createReview(user.id, dto);
    return ApiResponseDto.ok(review, 'Valoración enviada exitosamente');
  }

  @Get('target/:targetId')
  @ApiOperation({ summary: 'Consultar historial de valoraciones y comentarios recibidos por un usuario/chofer' })
  async getReviewsForTarget(@Param('targetId') targetId: string) {
    const reviews = await this.reviewsService.getReviewsForTarget(targetId);
    return ApiResponseDto.ok(reviews);
  }
}
