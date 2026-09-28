import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { UserEntity } from '../../../../core/database/entities/user.entity';
import { VehicleEntity } from '../../../../core/database/entities/vehicle.entity';
import { RideEntity } from '../../../../core/database/entities/ride.entity';
import { RideLocationEntity } from '../../../../core/database/entities/ride-location.entity';
import { DriverEntity } from '../../../../core/database/entities/driver.entity';
import { DriverBalanceEntity } from '../../../../core/database/entities/driver-balance.entity';
import { TransactionEntity } from '../../../../core/database/entities/transaction.entity';
import { RideStatusEnum } from '../../../../common/enums/roles.enum';
import { RideStateMachine } from '../../domain/state-machine/ride-state.machine';
import { ReviewEntity } from '../../../../core/database/entities/review.entity';
import { ExchangeRateEntity } from '../../../../core/database/entities/exchange-rate.entity';
import { VehicleCategoryEnum } from '../../../../common/enums/roles.enum';
import { RidesGateway } from '../../presentation/rides.gateway';
import { RedisService } from '../../../../core/redis/redis.service';
import { CreateRideDto } from '../../dto/create-ride.dto';

export { CreateRideDto };

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(RideEntity)
    private readonly rideRepository: Repository<RideEntity>,
    @InjectRepository(RideLocationEntity)
    private readonly locationRepository: Repository<RideLocationEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
    @InjectRepository(DriverBalanceEntity)
    private readonly balanceRepository: Repository<DriverBalanceEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(ExchangeRateEntity)
    private readonly exchangeRateRepository: Repository<ExchangeRateEntity>,
    private readonly ridesGateway: RidesGateway,
    private readonly redisService: RedisService,
  ) {}

  async createRide(dto: CreateRideDto): Promise<any> {
    // 1. Resolve valid passenger
    let passengerId = dto.passengerId;
    if (passengerId) {
      const exists = await this.userRepository.findOne({ where: { id: passengerId } });
      if (!exists) passengerId = undefined;
    }

    if (!passengerId) {
      // Find first passenger user or super admin
      const passengerUser = await this.userRepository.findOne({
        where: { role: 'PASSENGER' as any },
      });
      if (passengerUser) {
        passengerId = passengerUser.id;
      } else {
        const anyUser = await this.userRepository.findOne({});
        passengerId = anyUser?.id || 'a1b2c3d4-e5f6-7890-abcd-1234567890ab';
      }
    }

    // 2. Resolve fares
    const baseFare = 5.0;
    const distanceKm = this.calculateDistanceKm(
      dto.originLat,
      dto.originLng,
      dto.destinationLat,
      dto.destinationLng,
    );
    const distanceFare = distanceKm * 1.5;
    const timeFare = 2.0;
    const surgeMultiplier = 1.0;
    const calculatedTotalFare = Number(((baseFare + distanceFare + timeFare) * surgeMultiplier).toFixed(2));
    const totalFare = Number(dto.totalFare && dto.totalFare > 0 ? dto.totalFare : calculatedTotalFare);
    const platformFee = Number((totalFare * 0.15).toFixed(2));
    const driverNetEarnings = Number((totalFare - platformFee).toFixed(2));

    // 3. Resolve Driver & Vehicle if pre-assigned
    let driverId = dto.driverId || undefined;
    let vehicleId = dto.vehicleId || undefined;
    let initialStatus = RideStatusEnum.SOLICITADO;

    if (driverId) {
      const driver = await this.driverRepository.findOne({ where: { id: driverId }, relations: ['currentVehicle'] });
      if (driver) {
        if (!vehicleId && driver.currentVehicleId) {
          vehicleId = driver.currentVehicleId;
        }
        initialStatus = RideStatusEnum.ASIGNADO;
      } else {
        driverId = undefined;
      }
    }

    const ride = this.rideRepository.create({
      passengerId,
      driverId,
      vehicleId,
      categoryRequested: dto.categoryRequested,
      originAddress: dto.originAddress,
      originLatitude: dto.originLat,
      originLongitude: dto.originLng,
      destinationAddress: dto.destinationAddress,
      destinationLatitude: dto.destinationLat,
      destinationLongitude: dto.destinationLng,
      distanceKm: Number(distanceKm.toFixed(2)),
      estimatedDurationMin: Math.ceil(distanceKm * 3),
      baseFare,
      distanceFare: Number(distanceFare.toFixed(2)),
      timeFare,
      surgeMultiplier,
      totalFare,
      platformFee,
      driverNetEarnings,
      paymentMethod: dto.paymentMethod,
      status: initialStatus,
      requestedAt: new Date(),
      acceptedAt: driverId ? new Date() : undefined,
    });

    const savedRide = await this.rideRepository.save(ride);

    // Fetch enriched ride
    const enriched = await this.getRideById(savedRide.id);

    this.ridesGateway.emitStatusChange(savedRide.id, initialStatus, enriched);

    return this.formatRideResponse(enriched);
  }

  async assignDriverToRide(rideId: string, driverId: string, vehicleId?: string): Promise<any> {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException(`Viaje con ID '${rideId}' no encontrado`);
    }

    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
      relations: ['currentVehicle'],
    });
    if (!driver) {
      throw new NotFoundException(`Chofer con ID '${driverId}' no encontrado`);
    }

    ride.driverId = driverId;
    ride.vehicleId = vehicleId || driver.currentVehicleId || ride.vehicleId;
    ride.status = RideStatusEnum.ASIGNADO;
    ride.acceptedAt = new Date();

    const updated = await this.rideRepository.save(ride);
    const enriched = await this.getRideById(updated.id);

    this.ridesGateway.emitStatusChange(rideId, RideStatusEnum.ASIGNADO, enriched);

    return this.formatRideResponse(enriched);
  }

  async updateRideStatus(
    rideId: string,
    targetStatus: RideStatusEnum,
    driverId?: string,
    cancellationReason?: string,
  ): Promise<RideEntity> {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException(`Viaje con ID '${rideId}' no encontrado`);
    }

    RideStateMachine.validateTransition(ride.status, targetStatus);

    ride.status = targetStatus;
    const now = new Date();

    if (driverId && !ride.driverId) {
      ride.driverId = driverId;
      const driver = await this.driverRepository.findOne({ where: { id: driverId } });
      if (driver && driver.currentVehicleId) {
        ride.vehicleId = driver.currentVehicleId;
      }
    }

    switch (targetStatus) {
      case RideStatusEnum.ASIGNADO:
        ride.acceptedAt = now;
        break;
      case RideStatusEnum.EN_CAMINO:
        break;
      case RideStatusEnum.ABORDAJE:
        ride.arrivedAt = now;
        break;
      case RideStatusEnum.EN_CURSO:
        ride.startedAt = now;
        break;
      case RideStatusEnum.FINALIZADO:
        ride.completedAt = now;
        await this.processFinancialSettlement(ride);
        break;
      case RideStatusEnum.CANCELADO:
        ride.cancelledAt = now;
        ride.cancellationReason = cancellationReason || 'Cancelado por el usuario o chofer';
        break;
    }

    const updatedRide = await this.rideRepository.save(ride);
    this.ridesGateway.emitStatusChange(rideId, targetStatus, updatedRide);

    return updatedRide;
  }

  async getActiveRides(): Promise<any[]> {
    const list = await this.rideRepository.find({
      where: {
        status: In([
          RideStatusEnum.SOLICITADO,
          RideStatusEnum.ASIGNADO,
          RideStatusEnum.EN_CAMINO,
          RideStatusEnum.ABORDAJE,
          RideStatusEnum.EN_CURSO,
        ]),
      },
      relations: ['passenger', 'driver', 'driver.user', 'vehicle'],
      order: { requestedAt: 'DESC' },
    });

    return list.map((r) => this.formatRideResponse(r));
  }

  async getAllRides(): Promise<any[]> {
    const list = await this.rideRepository.find({
      relations: ['passenger', 'driver', 'driver.user', 'vehicle'],
      order: { requestedAt: 'DESC' },
    });
    return list.map((r) => this.formatRideResponse(r));
  }

  private formatRideResponse(r: RideEntity): any {
    return {
      ...r,
      originLat: Number(r.originLatitude || 10.4806),
      originLng: Number(r.originLongitude || -66.8622),
      destinationLat: Number(r.destinationLatitude || 10.6031),
      destinationLng: Number(r.destinationLongitude || -66.9906),
      distanceKm: Number(r.distanceKm || 0),
      totalFare: Number(r.totalFare || 0),
      platformFee: Number(r.platformFee || 0),
      driverNetEarnings: Number(r.driverNetEarnings || 0),
    };
  }

  async getRideById(rideId: string): Promise<RideEntity> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId },
      relations: ['passenger', 'driver', 'driver.user', 'vehicle'],
    });
    if (!ride) {
      throw new NotFoundException(`Viaje con ID '${rideId}' no encontrado`);
    }
    return ride;
  }

  private async processFinancialSettlement(ride: RideEntity): Promise<void> {
    if (!ride.driverId) return;

    const txFare = this.transactionRepository.create({
      rideId: ride.id,
      driverId: ride.driverId,
      passengerId: ride.passengerId,
      type: 'RIDE_FARE',
      amount: ride.totalFare,
      currency: 'USD',
      status: 'COMPLETED',
      referenceCode: `FARE-${ride.id.substring(0, 8)}`,
    });
    await this.transactionRepository.save(txFare);

    const txCommission = this.transactionRepository.create({
      rideId: ride.id,
      driverId: ride.driverId,
      type: 'PLATFORM_COMMISSION',
      amount: ride.platformFee,
      currency: 'USD',
      status: 'COMPLETED',
      referenceCode: `COMM-${ride.id.substring(0, 8)}`,
    });
    await this.transactionRepository.save(txCommission);

    const balance = await this.balanceRepository.findOne({
      where: { driverId: ride.driverId },
    });
    if (balance) {
      balance.currentBalance = Number(
        (Number(balance.currentBalance) + Number(ride.driverNetEarnings)).toFixed(2),
      );
      balance.totalEarned = Number(
        (Number(balance.totalEarned) + Number(ride.driverNetEarnings)).toFixed(2),
      );
      balance.totalCommissionPaid = Number(
        (Number(balance.totalCommissionPaid) + Number(ride.platformFee)).toFixed(2),
      );
      await this.balanceRepository.save(balance);
    }
  }

  async getActiveRideForPassenger(passengerId: string): Promise<any | null> {
    const ride = await this.rideRepository.findOne({
      where: {
        passengerId,
        status: In([
          RideStatusEnum.SOLICITADO,
          RideStatusEnum.ASIGNADO,
          RideStatusEnum.EN_CAMINO,
          RideStatusEnum.ABORDAJE,
          RideStatusEnum.EN_CURSO,
        ]),
      },
      relations: ['passenger', 'driver', 'driver.user', 'vehicle'],
      order: { requestedAt: 'DESC' },
    });
    return ride ? this.formatRideResponse(ride) : null;
  }

  async getRideHistoryForPassenger(passengerId: string): Promise<any[]> {
    const list = await this.rideRepository.find({
      where: { passengerId },
      relations: ['passenger', 'driver', 'driver.user', 'vehicle'],
      order: { requestedAt: 'DESC' },
      take: 30,
    });
    return list.map((r) => this.formatRideResponse(r));
  }

  async estimateFareCategories(dto: {
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
  }): Promise<any> {
    const distanceKm = Math.max(
      0.5,
      Number(this.calculateDistanceKm(dto.originLat, dto.originLng, dto.destinationLat, dto.destinationLng).toFixed(2)),
    );
    const estimatedMinutes = Math.max(5, Math.ceil(distanceKm * 2.5 + 5));

    // Get current active BCV rate
    let bcvRate = 875.0;
    try {
      const activeRate = await this.exchangeRateRepository.findOne({
        where: { currencyPair: 'USD_VES', isActive: true },
        order: { effectiveDate: 'DESC' },
      });
      if (activeRate) {
        bcvRate = Number(activeRate.rate);
      }
    } catch (_) {}

    const tiers = [
      {
        id: VehicleCategoryEnum.EXECUTIVE_SEDAN,
        name: 'Sedán Ejecutivo',
        subtitle: 'Toyota Corolla / Camry / Mercedes Clase C',
        badge: 'PREMIUM',
        capacity: '4 Pasajeros',
        baseFareUsd: 8.0,
        perKmUsd: 1.2,
        minimumFareUsd: 10.0,
        icon: 'sedan',
      },
      {
        id: VehicleCategoryEnum.VIP_SUV,
        name: 'SUV Ejecutiva',
        subtitle: 'Toyota Fortuner / 4Runner / Tahoe',
        badge: 'VIP CONFORT',
        capacity: '5-6 Pasajeros',
        baseFareUsd: 15.0,
        perKmUsd: 1.8,
        minimumFareUsd: 18.0,
        icon: 'suv',
      },
      {
        id: VehicleCategoryEnum.PREMIUM_VAN,
        name: 'Van Ejecutiva',
        subtitle: 'Toyota HiAce VIP / Mercedes Sprinter',
        badge: 'GRUPO EJECUTIVO',
        capacity: '8-12 Pasajeros',
        baseFareUsd: 25.0,
        perKmUsd: 2.5,
        minimumFareUsd: 30.0,
        icon: 'van',
      },
      {
        id: VehicleCategoryEnum.LUXURY_ARMORED,
        name: 'Blindado VIP',
        subtitle: 'Blindaje Nivel IV/V con Chofer Escolta',
        badge: 'MÁXIMA SEGURIDAD',
        capacity: '4 Pasajeros',
        baseFareUsd: 50.0,
        perKmUsd: 4.0,
        minimumFareUsd: 60.0,
        icon: 'shield',
      },
    ];

    const estimates = tiers.map((tier) => {
      const rawUsd = tier.baseFareUsd + distanceKm * tier.perKmUsd;
      const fareUsd = Number(Math.max(tier.minimumFareUsd, rawUsd).toFixed(2));
      const fareVes = Number((fareUsd * bcvRate).toFixed(2));

      return {
        category: tier.id,
        name: tier.name,
        subtitle: tier.subtitle,
        badge: tier.badge,
        capacity: tier.capacity,
        icon: tier.icon,
        distanceKm,
        estimatedMinutes,
        fareUsd,
        fareVes,
        bcvRate,
      };
    });

    return {
      distanceKm,
      estimatedMinutes,
      bcvRate,
      categories: estimates,
    };
  }

  async rateRide(
    rideId: string,
    authorId: string,
    dto: {
      rating: number;
      comment?: string;
      cleanlinessRating?: number;
      punctualityRating?: number;
      comfortRating?: number;
    },
  ): Promise<any> {
    const ride = await this.rideRepository.findOne({ where: { id: rideId }, relations: ['driver'] });
    if (!ride) {
      throw new NotFoundException(`Viaje no encontrado`);
    }

    const review = this.reviewRepository.create({
      rideId,
      authorId,
      targetId: ride.driver?.userId || ride.driverId || authorId,
      rating: Math.min(5, Math.max(1, dto.rating)),
      comment: dto.comment,
      cleanlinessRating: dto.cleanlinessRating,
      punctualityRating: dto.punctualityRating,
      comfortRating: dto.comfortRating,
    });

    return await this.reviewRepository.save(review);
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
