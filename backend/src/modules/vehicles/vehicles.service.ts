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
    private readonly storageService: StorageService,
  ) {}

  async createVehicle(dto: CreateVehicleDto): Promise<VehicleEntity> {
    const existingPlate = await this.vehicleRepository.findOne({
      where: { licensePlate: dto.licensePlate },
    });
    if (existingPlate) {
      throw new ConflictException('La placa de rodaje ya está registrada en el sistema');
    }

    const existingVin = await this.vehicleRepository.findOne({
      where: { vin: dto.vin },
    });
    if (existingVin) {
      throw new ConflictException('El número VIN ya está registrado en el sistema');
    }

    const vehicle = this.vehicleRepository.create(dto);
    return this.vehicleRepository.save(vehicle);
  }

  async findAllVehicles(): Promise<VehicleEntity[]> {
    return this.vehicleRepository.find({
      order: { createdAt: 'DESC' },
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
      documentNumber: dto.documentNumber,
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
    }

    return this.vehicleDocRepository.save(doc);
  }
}
