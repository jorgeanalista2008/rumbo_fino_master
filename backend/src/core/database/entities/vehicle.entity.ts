import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleCategoryEnum, VehicleStatusEnum } from '../../../common/enums/roles.enum';

@Entity('vehicles')
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column()
  color: string;

  @Column({ name: 'license_plate', unique: true })
  licensePlate: string;

  @Column({ unique: true })
  vin: string;

  @Column({ type: 'int', default: 4 })
  seats: number;

  @Column({
    type: 'enum',
    enum: VehicleCategoryEnum,
    default: VehicleCategoryEnum.EXECUTIVE_SEDAN,
  })
  category: VehicleCategoryEnum;

  @Column({
    type: 'enum',
    enum: VehicleStatusEnum,
    default: VehicleStatusEnum.AVAILABLE,
  })
  status: VehicleStatusEnum;

  @Column({ name: 'transmission', nullable: true, default: 'Automática 9G-Tronic' })
  transmission: string;

  @Column({ name: 'fuel_type', nullable: true, default: 'Gasolina Premium' })
  fuelType: string;

  @Column({ name: 'luggage_capacity', nullable: true, default: '3 Maletas Grandes + 2 de Mano' })
  luggageCapacity: string;

  @Column({ type: 'jsonb', nullable: true, default: ['Wi-Fi 5G', 'Asientos Cuero Nappa', 'Climatizador Tri-Zona', 'Cargadores USB-C / 110V', 'Agua Evian'] })
  amenities: string[];

  @Column({ type: 'jsonb', default: [] })
  photos: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
