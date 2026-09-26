import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { RideEntity } from './ride.entity';
import { UserEntity } from './user.entity';

@Entity('reviews')
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ride_id', unique: true })
  rideId: string;

  @OneToOne(() => RideEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ride_id' })
  ride: RideEntity;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;

  @Column({ name: 'target_id' })
  targetId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'target_id' })
  target: UserEntity;

  @Column({ type: 'int' })
  rating: number;

  @Column({ name: 'cleanliness_rating', type: 'int', nullable: true })
  cleanlinessRating: number;

  @Column({ name: 'punctuality_rating', type: 'int', nullable: true })
  punctualityRating: number;

  @Column({ name: 'comfort_rating', type: 'int', nullable: true })
  comfortRating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
