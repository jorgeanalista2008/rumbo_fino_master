import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { VehicleEntity } from './vehicle.entity';

@Entity('drivers')
export class DriverEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'license_number', unique: true })
  licenseNumber: string;

  @Column({ name: 'license_category' })
  licenseCategory: string;

  @Column({ name: 'license_expiration', type: 'date' })
  licenseExpiration: Date;

  @Column({ name: 'rating_avg', type: 'numeric', precision: 3, scale: 2, default: 5.0 })
  ratingAvg: number;

  @Column({ name: 'total_rides', type: 'int', default: 0 })
  totalRides: number;

  @Column({ name: 'is_online', default: false })
  isOnline: boolean;

  @Column({ name: 'current_latitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  currentLatitude: number;

  @Column({ name: 'current_longitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  currentLongitude: number;

  @Column({ name: 'current_vehicle_id', nullable: true })
  currentVehicleId: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'current_vehicle_id' })
  currentVehicle: VehicleEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
