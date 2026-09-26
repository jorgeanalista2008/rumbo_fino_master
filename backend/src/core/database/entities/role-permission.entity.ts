import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('role_permissions')
export class RolePermissionEntity {
  @PrimaryColumn({ length: 50 })
  role: string;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'allowed_routes', type: 'jsonb', default: () => "'[]'::jsonb" })
  allowedRoutes: string[];

  @Column({ name: 'is_system', type: 'boolean', default: true })
  isSystem: boolean;

  @Column({ name: 'can_create', type: 'boolean', default: true })
  canCreate: boolean;

  @Column({ name: 'can_edit', type: 'boolean', default: true })
  canEdit: boolean;

  @Column({ name: 'can_delete', type: 'boolean', default: false })
  canDelete: boolean;

  @Column({ name: 'can_export', type: 'boolean', default: true })
  canExport: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
