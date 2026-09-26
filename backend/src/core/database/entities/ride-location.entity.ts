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

@Entity('ride_locations')
export class RideLocationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'ride_id' })
  rideId: string;

  @ManyToOne(() => RideEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ride_id' })
  ride: RideEntity;

  @Column({ name: 'driver_id' })
  driverId: string;

  @ManyToOne(() => DriverEntity)
  @JoinColumn({ name: 'driver_id' })
  driver: DriverEntity;

  @Column({ type: 'numeric', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  speed: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  heading: number;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}
