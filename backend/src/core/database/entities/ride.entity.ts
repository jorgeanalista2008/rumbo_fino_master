import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { DriverEntity } from './driver.entity';
import { VehicleEntity } from './vehicle.entity';
import { RideStatusEnum, VehicleCategoryEnum } from '../../../common/enums/roles.enum';

@Entity('rides')
export class RideEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'passenger_id' })
  passengerId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'passenger_id' })
  passenger: UserEntity;

  @Column({ name: 'driver_id', nullable: true })
  driverId: string;

  @ManyToOne(() => DriverEntity, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: DriverEntity;

  @Column({ name: 'vehicle_id', nullable: true })
  vehicleId: string;

  @ManyToOne(() => VehicleEntity, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleEntity;

  @Column({
    type: 'enum',
    enum: RideStatusEnum,
    default: RideStatusEnum.SOLICITADO,
  })
  status: RideStatusEnum;

  @Column({
    name: 'category_requested',
    type: 'enum',
    enum: VehicleCategoryEnum,
  })
  categoryRequested: VehicleCategoryEnum;

  @Column({ name: 'origin_address' })
  originAddress: string;

  @Column({ name: 'origin_latitude', type: 'numeric', precision: 10, scale: 7, default: 0 })
  originLatitude: number;

  @Column({ name: 'origin_longitude', type: 'numeric', precision: 10, scale: 7, default: 0 })
  originLongitude: number;

  @Column({ name: 'destination_address' })
  destinationAddress: string;

  @Column({ name: 'destination_latitude', type: 'numeric', precision: 10, scale: 7, default: 0 })
  destinationLatitude: number;

  @Column({ name: 'destination_longitude', type: 'numeric', precision: 10, scale: 7, default: 0 })
  destinationLongitude: number;

  @Column({ name: 'distance_km', type: 'numeric', precision: 8, scale: 2, default: 0 })
  distanceKm: number;

  @Column({ name: 'estimated_duration_min', type: 'int', default: 0 })
  estimatedDurationMin: number;

  @Column({ name: 'base_fare', type: 'numeric', precision: 10, scale: 2 })
  baseFare: number;

  @Column({ name: 'distance_fare', type: 'numeric', precision: 10, scale: 2 })
  distanceFare: number;

  @Column({ name: 'time_fare', type: 'numeric', precision: 10, scale: 2 })
  timeFare: number;

  @Column({ name: 'surge_multiplier', type: 'numeric', precision: 3, scale: 2, default: 1.0 })
  surgeMultiplier: number;

  @Column({ name: 'total_fare', type: 'numeric', precision: 10, scale: 2 })
  totalFare: number;

  @Column({ name: 'platform_fee', type: 'numeric', precision: 10, scale: 2 })
  platformFee: number;

  @Column({ name: 'driver_net_earnings', type: 'numeric', precision: 10, scale: 2 })
  driverNetEarnings: number;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ name: 'requested_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  requestedAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date;

  @Column({ name: 'arrived_at', type: 'timestamptz', nullable: true })
  arrivedAt: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancellation_reason', nullable: true })
  cancellationReason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
