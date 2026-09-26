import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DriverBalanceEntity } from '../../core/database/entities/driver-balance.entity';
import { TransactionEntity } from '../../core/database/entities/transaction.entity';

@Injectable()
export class FinancialsService {
  constructor(
    @InjectRepository(DriverBalanceEntity)
    private readonly balanceRepository: Repository<DriverBalanceEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async getDriverBalance(driverId: string): Promise<DriverBalanceEntity> {
    const balance = await this.balanceRepository.findOne({ where: { driverId } });
    if (!balance) {
      throw new NotFoundException(`Estado de cuenta para el chofer ID '${driverId}' no encontrado`);
    }
    return balance;
  }

  async getAllDriverBalances(): Promise<DriverBalanceEntity[]> {
    return this.balanceRepository.find({
      relations: ['driver', 'driver.user'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getTransactions(
    driverId?: string,
    passengerId?: string,
    limit = 50,
  ): Promise<TransactionEntity[]> {
    const query = this.transactionRepository.createQueryBuilder('tx');

    if (driverId) {
      query.andWhere('tx.driver_id = :driverId', { driverId });
    }
    if (passengerId) {
      query.andWhere('tx.passenger_id = :passengerId', { passengerId });
    }

    return query.orderBy('tx.created_at', 'DESC').limit(limit).getMany();
  }

  async getAdminFinancialSummary() {
    const rawResult = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'totalVolume')
      .addSelect(
        "SUM(CASE WHEN tx.type = 'PLATFORM_COMMISSION' THEN tx.amount ELSE 0 END)",
        'totalPlatformCommission',
      )
      .addSelect(
        "SUM(CASE WHEN tx.type = 'RIDE_FARE' THEN tx.amount ELSE 0 END)",
        'totalGrossFares',
      )
      .getRawOne();

    return {
      totalVolume: Number(rawResult.totalVolume || 0),
      totalPlatformCommission: Number(rawResult.totalPlatformCommission || 0),
      totalGrossFares: Number(rawResult.totalGrossFares || 0),
    };
  }
}
