import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UserEntity } from '../../core/database/entities/user.entity';
import { DriverEntity } from '../../core/database/entities/driver.entity';
import { DriverBalanceEntity } from '../../core/database/entities/driver-balance.entity';
import { UserRoleEnum, UserStatusEnum } from '../../common/enums/roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
    @InjectRepository(DriverBalanceEntity)
    private readonly driverBalanceRepository: Repository<DriverBalanceEntity>,
  ) {}

  async findAll(query: {
    role?: UserRoleEnum;
    status?: UserStatusEnum;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 50;
    const skip = (page - 1) * limit;

    const qb = this.userRepository.createQueryBuilder('user');

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.status) {
      qb.andWhere('user.status = :status', { status: query.status });
    }

    if (query.search) {
      const s = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.firstName) LIKE :s OR LOWER(user.lastName) LIKE :s OR LOWER(user.email) LIKE :s OR LOWER(user.phoneNumber) LIKE :s)',
        { s },
      );
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();

    const sanitizedUsers = users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    return {
      items: sanitizedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async getRoleStats() {
    const rawCounts = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const stats: Record<string, number> = {
      TOTAL: 0,
      SUPER_ADMIN: 0,
      FLEET_ADMIN: 0,
      DISPATCHER: 0,
      DRIVER: 0,
      PASSENGER: 0,
    };

    rawCounts.forEach((r) => {
      const count = parseInt(r.count, 10);
      stats[r.role] = count;
      stats.TOTAL += count;
    });

    return stats;
  }

  async create(dto: CreateUserDto) {
    const existingEmail = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException(`El correo electrónico '${dto.email}' ya se encuentra registrado`);
    }

    const existingPhone = await this.userRepository.findOne({
      where: { phoneNumber: dto.phoneNumber },
    });
    if (existingPhone) {
      throw new ConflictException(`El número telefónico '${dto.phoneNumber}' ya se encuentra registrado`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const newUser = this.userRepository.create({
      email: dto.email,
      passwordHash,
      phoneNumber: dto.phoneNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      status: dto.status || UserStatusEnum.ACTIVE,
      avatarUrl: dto.avatarUrl,
    });

    const savedUser = await this.userRepository.save(newUser);

    // If creating a user with DRIVER role, initialize DriverEntity and DriverBalanceEntity if not existing
    if (dto.role === UserRoleEnum.DRIVER) {
      const licenseNum = `LIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const driver = this.driverRepository.create({
        userId: savedUser.id,
        licenseNumber: licenseNum,
        licenseCategory: '5ta VIP',
        licenseExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        ratingAvg: 5.0,
        totalRides: 0,
        isOnline: false,
      });
      const savedDriver = await this.driverRepository.save(driver);

      const balance = this.driverBalanceRepository.create({
        driverId: savedDriver.id,
        currentBalance: 0,
        pendingPayout: 0,
        totalEarned: 0,
      });
      await this.driverBalanceRepository.save(balance);
    }

    const { passwordHash: _, ...userWithoutPass } = savedUser;
    return userWithoutPass;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException(`El correo '${dto.email}' ya pertenece a otro usuario`);
      }
      user.email = dto.email;
    }

    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      const existingPhone = await this.userRepository.findOne({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existingPhone && existingPhone.id !== id) {
        throw new ConflictException(`El teléfono '${dto.phoneNumber}' ya pertenece a otro usuario`);
      }
      user.phoneNumber = dto.phoneNumber;
    }

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.role) user.role = dto.role;
    if (dto.status) user.status = dto.status;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    if (dto.password && dto.password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(dto.password, salt);
    }

    const updatedUser = await this.userRepository.save(user);
    const { passwordHash: _, ...rest } = updatedUser;
    return rest;
  }

  async updateStatus(id: string, status: UserStatusEnum) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }

    user.status = status;
    const updated = await this.userRepository.save(user);
    const { passwordHash: _, ...rest } = updated;
    return rest;
  }

  async delete(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }

    await this.userRepository.remove(user);
    return { success: true, message: `Usuario '${user.firstName} ${user.lastName}' eliminado correctamente` };
  }
}
