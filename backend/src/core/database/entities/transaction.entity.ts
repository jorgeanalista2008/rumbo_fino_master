import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RideEntity } from './ride.entity';
import { DriverEntity } from './driver.entity';
import { UserEntity } from './user.entity';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ride_id', nullable: true })
  rideId: string;

  @ManyToOne(() => RideEntity, { nullable: true })
  @JoinColumn({ name: 'ride_id' })
  ride: RideEntity;

  @Column({ name: 'driver_id', nullable: true })
  driverId: string;

  @ManyToOne(() => DriverEntity, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: DriverEntity;

  @Column({ name: 'passenger_id', nullable: true })
  passengerId: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'passenger_id' })
  passenger: UserEntity;

  @Column()
  type: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 'COMPLETED' })
  status: string;

  @Column({ name: 'reference_code', nullable: true })
  referenceCode: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
