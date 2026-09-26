import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { RideEntity } from '../../../../core/database/entities/ride.entity';
import { RideLocationEntity } from '../../../../core/database/entities/ride-location.entity';
import { DriverEntity } from '../../../../core/database/entities/driver.entity';
import { DriverBalanceEntity } from '../../../../core/database/entities/driver-balance.entity';
import { TransactionEntity } from '../../../../core/database/entities/transaction.entity';
import { RideStatusEnum } from '../../../../common/enums/roles.enum';
import { RideStateMachine } from '../../domain/state-machine/ride-state.machine';
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
    private readonly ridesGateway: RidesGateway,
    private readonly redisService: RedisService,
  ) {}

  async createRide(dto: CreateRideDto): Promise<RideEntity> {
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
    const totalFare = Number(((baseFare + distanceFare + timeFare) * surgeMultiplier).toFixed(2));
    const platformFee = Number((totalFare * 0.15).toFixed(2));
    const driverNetEarnings = Number((totalFare - platformFee).toFixed(2));

    const ride = this.rideRepository.create({
      passengerId: dto.passengerId,
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
      status: RideStatusEnum.SOLICITADO,
      requestedAt: new Date(),
    });

    const savedRide = await this.rideRepository.save(ride);

    this.ridesGateway.emitStatusChange(savedRide.id, RideStatusEnum.SOLICITADO, savedRide);

    const nearbyDriverIds = await this.redisService.getNearbyDrivers(
      dto.originLat,
      dto.originLng,
      10,
    );

    if (nearbyDriverIds && nearbyDriverIds.length > 0) {
      this.ridesGateway.server.emit('ride:dispatch_offer', {
        rideId: savedRide.id,
        nearbyDrivers: nearbyDriverIds,
        originAddress: dto.originAddress,
        totalFare,
      });
    }

    return savedRide;
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

  async getActiveRides(): Promise<RideEntity[]> {
    return this.rideRepository.find({
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
  }

  async getAllRides(): Promise<RideEntity[]> {
    return this.rideRepository.find({
      relations: ['passenger', 'driver', 'driver.user', 'vehicle'],
      order: { requestedAt: 'DESC' },
    });
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
