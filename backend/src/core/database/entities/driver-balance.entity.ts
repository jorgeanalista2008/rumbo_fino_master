import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { DriverEntity } from './driver.entity';

@Entity('driver_balances')
export class DriverBalanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'driver_id', unique: true })
  driverId: string;

  @OneToOne(() => DriverEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver: DriverEntity;

  @Column({ name: 'current_balance', type: 'numeric', precision: 12, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ name: 'pending_payout', type: 'numeric', precision: 12, scale: 2, default: 0 })
  pendingPayout: number;

  @Column({ name: 'total_earned', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalEarned: number;

  @Column({ name: 'total_commission_paid', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalCommissionPaid: number;

  @Column({ name: 'last_settlement_at', type: 'timestamptz', nullable: true })
  lastSettlementAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
