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
    let list = await this.rideRepository.find({
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

    if (list.length === 0) {
      // Create seed demo active rides with real drivers & vehicles if available
      const drivers = await this.driverRepository.find({ relations: ['user', 'currentVehicle'] });
      if (drivers.length > 0) {
        const d1 = drivers[0];
        const d2 = drivers.length > 1 ? drivers[1] : drivers[0];

        const ride1 = this.rideRepository.create({
          passengerId: d1.userId,
          driverId: d1.id,
          vehicleId: d1.currentVehicleId || undefined,
          status: RideStatusEnum.EN_CURSO,
          categoryRequested: 'EXECUTIVE_SEDAN' as any,
          originAddress: 'Centro Financiero Las Mercedes, Caracas',
          originLatitude: 10.4806,
          originLongitude: -66.8622,
          destinationAddress: 'Aeropuerto Internacional Simón Bolívar de Maiquetía (CCS)',
          destinationLatitude: 10.6031,
          destinationLongitude: -66.9906,
          distanceKm: 28.4,
          estimatedDurationMin: 45,
          baseFare: 5.0,
          distanceFare: 42.6,
          timeFare: 7.4,
          surgeMultiplier: 1.0,
          totalFare: 55.0,
          platformFee: 8.25,
          driverNetEarnings: 46.75,
          paymentMethod: 'PAGO_MOVIL',
          requestedAt: new Date(),
          acceptedAt: new Date(),
          startedAt: new Date(),
        });
        await this.rideRepository.save(ride1);

        const ride2 = this.rideRepository.create({
          passengerId: d2.userId,
          driverId: d2.id,
          vehicleId: d2.currentVehicleId || undefined,
          status: RideStatusEnum.EN_CAMINO,
          categoryRequested: 'VIP_SUV' as any,
          originAddress: 'Hotel Eurobuilding & Suites, Caracas',
          originLatitude: 10.4725,
          originLongitude: -66.8552,
          destinationAddress: 'Altamira Village & Business Center, Chacao',
          destinationLatitude: 10.4965,
          destinationLongitude: -66.8521,
          distanceKm: 5.2,
          estimatedDurationMin: 15,
          baseFare: 5.0,
          distanceFare: 15.0,
          timeFare: 4.0,
          surgeMultiplier: 1.0,
          totalFare: 24.0,
          platformFee: 3.6,
          driverNetEarnings: 20.4,
          paymentMethod: 'CREDIT_CARD',
          requestedAt: new Date(),
          acceptedAt: new Date(),
        });
        await this.rideRepository.save(ride2);

        list = await this.rideRepository.find({
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
    }

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
