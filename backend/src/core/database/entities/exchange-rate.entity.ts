import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'currency_pair', length: 20, default: 'USD_VES' })
  @Index()
  currencyPair: string;

  @Column({ type: 'numeric', precision: 12, scale: 4 })
  rate: number;

  @Column({ length: 50, default: 'BCV' })
  source: string;

  @Column({ name: 'effective_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  effectiveDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'admin_name', length: 100, default: 'Administrador VIP' })
  adminName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
