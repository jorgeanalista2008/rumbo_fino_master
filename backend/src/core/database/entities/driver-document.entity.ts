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
import { UserEntity } from './user.entity';
import { DocumentTypeEnum, DocumentStatusEnum } from '../../../common/enums/roles.enum';

@Entity('driver_documents')
export class DriverDocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'driver_id' })
  driverId: string;

  @ManyToOne(() => DriverEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver: DriverEntity;

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
