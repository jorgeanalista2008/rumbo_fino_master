import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DriverEntity } from './driver.entity';
import { VehicleEntity } from './vehicle.entity';

@Entity('driver_vehicle_assignments')
export class DriverVehicleAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'driver_id' })
  driverId: string;

  @ManyToOne(() => DriverEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver: DriverEntity;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleEntity;

  @Column({ name: 'start_time', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz', nullable: true })
  endTime: Date;

  @Column({ name: 'initial_odometer', type: 'int' })
  initialOdometer: number;

  @Column({ name: 'final_odometer', type: 'int', nullable: true })
  finalOdometer: number;

  @Column({ name: 'shift_status', default: 'ACTIVE' })
  shiftStatus: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
