import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VehicleEntity } from '../../core/database/entities/vehicle.entity';
import { VehicleDocumentEntity } from '../../core/database/entities/vehicle-document.entity';
import { DriverEntity } from '../../core/database/entities/driver.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UploadVehicleDocDto } from './dto/upload-vehicle-doc.dto';
import { VerifyDocDto } from './dto/verify-doc.dto';
import { VehicleStatusEnum, DocumentStatusEnum } from '../../common/enums/roles.enum';
import { StorageService } from '../../core/storage/storage.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(VehicleDocumentEntity)
    private readonly vehicleDocRepository: Repository<VehicleDocumentEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
    private readonly storageService: StorageService,
  ) {}

  async createVehicle(dto: CreateVehicleDto): Promise<VehicleEntity> {
    const existingPlate = await this.vehicleRepository.findOne({
      where: { licensePlate: dto.licensePlate.trim().toUpperCase() },
    });
    if (existingPlate) {
      throw new ConflictException('La placa de rodaje ya está registrada en el sistema');
    }

    const existingVin = await this.vehicleRepository.findOne({
      where: { vin: dto.vin.trim().toUpperCase() },
    });
    if (existingVin) {
      throw new ConflictException('El número VIN ya está registrado en el sistema');
    }

    const vehicle = this.vehicleRepository.create({
      ...dto,
      licensePlate: dto.licensePlate.trim().toUpperCase(),
      vin: dto.vin.trim().toUpperCase(),
    });
    return this.vehicleRepository.save(vehicle);
  }

  async findAllVehicles(): Promise<any[]> {
    const vehicles = await this.vehicleRepository.find({
      order: { createdAt: 'DESC' },
    });

    const docs = await this.vehicleDocRepository.find({
      order: { createdAt: 'DESC' },
    });

    const drivers = await this.driverRepository.find({
      relations: ['user'],
    });

    return vehicles.map((v) => {
      const vDocs = docs.filter((d) => d.vehicleId === v.id);
      const assignedDriver = drivers.find((dr) => dr.currentVehicleId === v.id);

      return {
        ...v,
        documents: vDocs,
        documentStats: {
          total: vDocs.length,
          approved: vDocs.filter((d) => d.status === DocumentStatusEnum.APPROVED).length,
          pending: vDocs.filter((d) => d.status === DocumentStatusEnum.PENDING).length,
          rejected: vDocs.filter((d) => d.status === DocumentStatusEnum.REJECTED).length,
        },
        assignedDriver: assignedDriver
          ? {
              id: assignedDriver.id,
              name: `${assignedDriver.user?.firstName || ''} ${assignedDriver.user?.lastName || ''}`.trim(),
              phone: assignedDriver.user?.phoneNumber,
              email: assignedDriver.user?.email,
              avatarUrl: assignedDriver.user?.avatarUrl,
              isOnline: assignedDriver.isOnline,
            }
          : null,
      };
    });
  }

  async findAvailableVehicles(): Promise<VehicleEntity[]> {
    return this.vehicleRepository.find({
      where: { status: VehicleStatusEnum.AVAILABLE },
      order: { make: 'ASC', model: 'ASC' },
    });
  }

  async findDispatchReadyVehicles(): Promise<VehicleEntity[]> {
    return this.vehicleRepository.find({
      where: [
        { status: VehicleStatusEnum.AVAILABLE },
        { status: VehicleStatusEnum.IN_SERVICE },
      ],
      order: { make: 'ASC', model: 'ASC' },
    });
  }

  async findVehicleById(id: string): Promise<VehicleEntity> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehículo con ID '${id}' no encontrado`);
    }
    return vehicle;
  }

  async updateVehicleStatus(id: string, status: VehicleStatusEnum): Promise<VehicleEntity> {
    const vehicle = await this.findVehicleById(id);
    vehicle.status = status;
    return this.vehicleRepository.save(vehicle);
  }

  async uploadDocument(
    vehicleId: string,
    dto: UploadVehicleDocDto,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<VehicleDocumentEntity> {
    await this.findVehicleById(vehicleId);

    const fileUrl = await this.storageService.uploadFile(fileBuffer, fileName, mimeType);

    const doc = this.vehicleDocRepository.create({
      vehicleId,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber || null,
      expirationDate: new Date(dto.expirationDate),
      fileUrl,
      status: DocumentStatusEnum.PENDING,
    });

    return this.vehicleDocRepository.save(doc);
  }

  async getVehicleDocuments(vehicleId: string): Promise<VehicleDocumentEntity[]> {
    await this.findVehicleById(vehicleId);
    return this.vehicleDocRepository.find({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
    });
  }

  async verifyDocument(
    docId: string,
    dto: VerifyDocDto,
    verifierUserId: string,
  ): Promise<VehicleDocumentEntity> {
    const doc = await this.vehicleDocRepository.findOne({ where: { id: docId } });
    if (!doc) {
      throw new NotFoundException(`Documento con ID '${docId}' no encontrado`);
    }

    doc.status = dto.status;
    doc.verifiedBy = verifierUserId;
    if (dto.status === DocumentStatusEnum.REJECTED) {
      if (!dto.rejectionReason) {
        throw new BadRequestException('Debe proporcionar un motivo de rechazo');
      }
      doc.rejectionReason = dto.rejectionReason;
    } else {
      doc.rejectionReason = null;
    }

    return this.vehicleDocRepository.save(doc);
  }
}
