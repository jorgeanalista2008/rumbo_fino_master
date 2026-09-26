import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VehicleEntity } from './vehicle.entity';
import { UserEntity } from './user.entity';
import { DocumentTypeEnum, DocumentStatusEnum } from '../../../common/enums/roles.enum';

@Entity('vehicle_documents')
export class VehicleDocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleEntity;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: DocumentTypeEnum,
  })
  documentType: DocumentTypeEnum;

  @Column({ name: 'document_number', nullable: true })
  documentNumber: string;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'issue_date', type: 'date', nullable: true })
  issueDate: Date;

  @Column({ name: 'expiration_date', type: 'date' })
  expirationDate: Date;

  @Column({
    type: 'enum',
    enum: DocumentStatusEnum,
    default: DocumentStatusEnum.PENDING,
  })
  status: DocumentStatusEnum;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier: UserEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
