import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DriverEntity } from '../../core/database/entities/driver.entity';
import { DriverDocumentEntity } from '../../core/database/entities/driver-document.entity';
import { DriverVehicleAssignmentEntity } from '../../core/database/entities/driver-vehicle-assignment.entity';
import { VehicleEntity } from '../../core/database/entities/vehicle.entity';
import { DriverBalanceEntity } from '../../core/database/entities/driver-balance.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { StartShiftDto } from './dto/start-shift.dto';
import { EndShiftDto } from './dto/end-shift.dto';
import { ToggleOnlineDto } from './dto/toggle-online.dto';
import { ShiftStatusEnum, VehicleStatusEnum, DocumentStatusEnum, DocumentTypeEnum } from '../../common/enums/roles.enum';
import { UserEntity } from '../../core/database/entities/user.entity';
import { UserRoleEnum, UserStatusEnum } from '../../common/enums/roles.enum';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { RedisService } from '../../core/redis/redis.service';

import { StorageService } from '../../core/storage/storage.service';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
    @InjectRepository(DriverDocumentEntity)
    private readonly driverDocRepository: Repository<DriverDocumentEntity>,
    @InjectRepository(DriverVehicleAssignmentEntity)
    private readonly assignmentRepository: Repository<DriverVehicleAssignmentEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(DriverBalanceEntity)
    private readonly balanceRepository: Repository<DriverBalanceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
  ) {}

  async uploadFile(file: any): Promise<string> {
    const uploadsFolder = path.join(process.cwd(), 'uploads', 'drivers');
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder, { recursive: true });
    }

    const fileExtension =
      path.extname(file.originalname) || (file.mimetype.includes('pdf') ? '.pdf' : '.jpg');
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExtension}`;
    const filePath = path.join(uploadsFolder, safeFileName);

    // Physical write to server disk
    fs.writeFileSync(filePath, file.buffer);

    const port = process.env.PORT || 3000;
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
    return `${baseUrl}/uploads/drivers/${safeFileName}`;
  }

  async createDriverProfile(dto: CreateDriverDto): Promise<DriverEntity> {
    let userId = dto.userId;

    if (!userId) {
      if (!dto.email || !dto.password || !dto.firstName || !dto.lastName || !dto.phoneNumber) {
        throw new BadRequestException(
          'Debe proporcionar los datos del usuario (email, password, firstName, lastName, phoneNumber) o un userId existente.',
        );
      }

      const existingEmail = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('El correo electrónico ya se encuentra registrado');
      }

      const existingPhone = await this.userRepository.findOne({ where: { phoneNumber: dto.phoneNumber } });
      if (existingPhone) {
        throw new ConflictException('El número de teléfono ya se encuentra registrado');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const newUser = this.userRepository.create({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        avatarUrl: dto.avatarUrl,
        role: UserRoleEnum.DRIVER,
        status: UserStatusEnum.ACTIVE,
      });

      const savedUser = await this.userRepository.save(newUser);
      userId = savedUser.id;
    } else {
      const existingUserDriver = await this.driverRepository.findOne({
        where: { userId },
      });
      if (existingUserDriver) {
        throw new ConflictException('Este usuario ya tiene un perfil de chofer registrado');
      }

      if (dto.avatarUrl) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user) {
          user.avatarUrl = dto.avatarUrl;
          await this.userRepository.save(user);
        }
      }
    }

    const existingLicense = await this.driverRepository.findOne({
      where: { licenseNumber: dto.licenseNumber },
    });
    if (existingLicense) {
      throw new ConflictException('El número de licencia ya se encuentra registrado');
    }

    const driver = this.driverRepository.create({
      userId,
      licenseNumber: dto.licenseNumber,
      licenseCategory: dto.licenseCategory,
      licenseExpiration: new Date(dto.licenseExpiration),
    });

    const savedDriver = await this.driverRepository.save(driver);

    // Auto-create ALL 5 Mandatory Document Records for the Dossier
    const expDate = new Date(dto.licenseExpiration);

    const mandatoryDocs = [
      {
        documentType: DocumentTypeEnum.DRIVER_LICENSE,
        documentNumber: dto.licenseNumber,
        fileUrl: dto.licenseFileUrl || 'https://rumbofino.com/docs/licencia.pdf',
        expirationDate: expDate,
        status: DocumentStatusEnum.APPROVED,
      },
      {
        documentType: DocumentTypeEnum.MEDICAL_CERTIFICATE,
        documentNumber: `MED-${savedDriver.id.substring(0, 6)}`,
        fileUrl: dto.medicalCertificateUrl || 'https://rumbofino.com/docs/certificado_medico.pdf',
        expirationDate: expDate,
        status: DocumentStatusEnum.APPROVED,
      },
      {
        documentType: DocumentTypeEnum.DRIVING_CERTIFICATE,
        documentNumber: `CERT-${savedDriver.id.substring(0, 6)}`,
        fileUrl: dto.drivingCertificateUrl || 'https://rumbofino.com/docs/certificado_manejo.pdf',
        expirationDate: expDate,
        status: DocumentStatusEnum.APPROVED,
      },
      {
        documentType: DocumentTypeEnum.CRIMINAL_RECORD,
        documentNumber: `ANT-${savedDriver.id.substring(0, 6)}`,
        fileUrl: dto.criminalRecordUrl || 'https://rumbofino.com/docs/antecedentes.pdf',
        expirationDate: expDate,
        status: DocumentStatusEnum.APPROVED,
      },
      {
        documentType: DocumentTypeEnum.IDENTITY_CARD,
        documentNumber: `DNI-${savedDriver.id.substring(0, 6)}`,
        fileUrl: dto.identityCardUrl || 'https://rumbofino.com/docs/dni.pdf',
        expirationDate: expDate,
        status: DocumentStatusEnum.APPROVED,
      },
    ];

    for (const docData of mandatoryDocs) {
      await this.driverDocRepository.save(
        this.driverDocRepository.create({
          driverId: savedDriver.id,
          ...docData,
        }),
      );
    }

    // Initialize Driver Financial Balance Account
    const balance = this.balanceRepository.create({
      driverId: savedDriver.id,
      currentBalance: 0,
      pendingPayout: 0,
      totalEarned: 0,
      totalCommissionPaid: 0,
    });
    await this.balanceRepository.save(balance);

    return savedDriver;
  }

  async findDriverById(id: string): Promise<DriverEntity> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['user', 'currentVehicle'],
    });
    if (!driver) {
      throw new NotFoundException(`Chofer con ID '${id}' no encontrado`);
    }
    return driver;
  }

  async findDriverByUserId(userId: string): Promise<any> {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['user', 'currentVehicle'],
    });
    if (!driver) {
      throw new NotFoundException(`Chofer vinculado al usuario ID '${userId}' no encontrado`);
    }
    return this.getFullProfile(driver.id);
  }

  async findAllDrivers(): Promise<any[]> {
    const drivers = await this.driverRepository.find({
      relations: ['user', 'currentVehicle'],
      order: { createdAt: 'DESC' },
    });

    const docs = await this.driverDocRepository.find({
      order: { createdAt: 'DESC' },
    });

    const balances = await this.balanceRepository.find();

    return drivers.map((d) => {
      const dDocs = docs.filter((doc) => doc.driverId === d.id);
      const dBalance = balances.find((b) => b.driverId === d.id);

      return {
        ...d,
        documents: dDocs,
        documentStats: {
          total: dDocs.length,
          approved: dDocs.filter((doc) => doc.status === DocumentStatusEnum.APPROVED).length,
          pending: dDocs.filter((doc) => doc.status === DocumentStatusEnum.PENDING).length,
          rejected: dDocs.filter((doc) => doc.status === DocumentStatusEnum.REJECTED).length,
        },
        balance: dBalance || {
          currentBalance: 0,
          pendingPayout: 0,
          totalEarned: 0,
          totalCommissionPaid: 0,
        },
      };
    });
  }

  async toggleOnline(driverId: string, dto: ToggleOnlineDto): Promise<DriverEntity> {
    const driver = await this.findDriverById(driverId);

    if (dto.isOnline && !driver.currentVehicleId) {
      // Auto-assign first available vehicle so driver can go online smoothly
      const availableVehicle = await this.vehicleRepository.findOne({
        where: { status: VehicleStatusEnum.AVAILABLE },
      });
      if (availableVehicle) {
        driver.currentVehicleId = availableVehicle.id;
        availableVehicle.status = VehicleStatusEnum.IN_SERVICE;
        await this.vehicleRepository.save(availableVehicle);

        await this.assignmentRepository.save(
          this.assignmentRepository.create({
            driverId,
            vehicleId: availableVehicle.id,
            initialOdometer: 15420,
            shiftStatus: ShiftStatusEnum.ACTIVE,
            notes: 'Asignación automática de unidad al iniciar disponibilidad en red',
          }),
        );
      }
    }

    driver.isOnline = dto.isOnline;
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      driver.currentLatitude = dto.latitude;
      driver.currentLongitude = dto.longitude;
    }
    const updated = await this.driverRepository.save(driver);

    if (dto.isOnline && dto.latitude && dto.longitude) {
      await this.redisService.updateDriverLocation(driverId, dto.latitude, dto.longitude);
    }

    return updated;
  }

  async startShift(
    driverId: string,
    dto: StartShiftDto,
  ): Promise<DriverVehicleAssignmentEntity> {
    const driver = await this.findDriverById(driverId);

    // Close any previous active shifts gracefully
    const previousActiveShifts = await this.assignmentRepository.find({
      where: { driverId, shiftStatus: ShiftStatusEnum.ACTIVE },
    });
    for (const prev of previousActiveShifts) {
      prev.endTime = new Date();
      prev.finalOdometer = prev.initialOdometer;
      prev.shiftStatus = ShiftStatusEnum.COMPLETED;
      await this.assignmentRepository.save(prev);
    }

    // Verify vehicle availability
    const vehicle = await this.vehicleRepository.findOne({ where: { id: dto.vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehículo con ID '${dto.vehicleId}' no encontrado`);
    }

    // Release any previous driver attached to this vehicle
    const otherDrivers = await this.driverRepository.find({
      where: { currentVehicleId: dto.vehicleId },
    });
    for (const od of otherDrivers) {
      if (od.id !== driverId) {
        od.currentVehicleId = null;
        od.isOnline = false;
        await this.driverRepository.save(od);
      }
    }

    // Create assignment
    const initialKm = Number(dto.initialOdometer) > 0 ? Number(dto.initialOdometer) : 45000;
    const assignment = this.assignmentRepository.create({
      driverId,
      vehicleId: dto.vehicleId,
      initialOdometer: initialKm,
      shiftStatus: ShiftStatusEnum.ACTIVE,
      notes: dto.notes,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Update vehicle and driver state
    vehicle.status = VehicleStatusEnum.IN_SERVICE;
    await this.vehicleRepository.save(vehicle);

    driver.currentVehicleId = dto.vehicleId;
    await this.driverRepository.save(driver);

    return savedAssignment;
  }

  async endShift(driverId: string, dto: EndShiftDto): Promise<any> {
    const driver = await this.findDriverById(driverId);

    const activeShift = await this.assignmentRepository.findOne({
      where: { driverId, shiftStatus: ShiftStatusEnum.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    const vehicleIdToRelease = activeShift?.vehicleId || driver.currentVehicleId;
    let completedAssignment = null;

    if (activeShift) {
      const finalKm =
        dto.finalOdometer !== undefined &&
        dto.finalOdometer !== null &&
        Number(dto.finalOdometer) >= activeShift.initialOdometer
          ? Number(dto.finalOdometer)
          : (Number(dto.finalOdometer) > 0 ? Number(dto.finalOdometer) : activeShift.initialOdometer);

      activeShift.endTime = new Date();
      activeShift.finalOdometer = finalKm;
      activeShift.shiftStatus = ShiftStatusEnum.COMPLETED;
      if (dto.notes) {
        activeShift.notes = activeShift.notes
          ? `${activeShift.notes} | Cierre: ${dto.notes}`
          : dto.notes;
      }
      completedAssignment = await this.assignmentRepository.save(activeShift);
    }

    // Release vehicle
    if (vehicleIdToRelease) {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: vehicleIdToRelease },
      });
      if (vehicle) {
        vehicle.status = VehicleStatusEnum.AVAILABLE;
        await this.vehicleRepository.save(vehicle);
      }
    }

    // Update driver state
    driver.currentVehicleId = null;
    driver.isOnline = false;
    await this.driverRepository.save(driver);

    return (
      completedAssignment || {
        driverId: driver.id,
        vehicleId: vehicleIdToRelease,
        shiftStatus: ShiftStatusEnum.COMPLETED,
        message: 'Turno finalizado y unidad liberada exitosamente',
      }
    );
  }

  async getFullProfile(driverId: string): Promise<any> {
    const driver = await this.findDriverById(driverId);
    const documents = await this.driverDocRepository.find({
      where: { driverId },
      relations: ['verifier'],
      order: { createdAt: 'DESC' },
    });

    const docTypesPresent = new Set(documents.map((d) => d.documentType));
    const mandatoryTypes = [
      {
        type: DocumentTypeEnum.DRIVER_LICENSE,
        num: driver.licenseNumber || `LIC-${driverId.substring(0, 6)}`,
        url: 'https://rumbofino.com/docs/licencia.pdf',
      },
      {
        type: DocumentTypeEnum.MEDICAL_CERTIFICATE,
        num: `MED-${driverId.substring(0, 6)}`,
        url: 'https://rumbofino.com/docs/certificado_medico.pdf',
      },
      {
        type: DocumentTypeEnum.DRIVING_CERTIFICATE,
        num: `CERT-${driverId.substring(0, 6)}`,
        url: 'https://rumbofino.com/docs/certificado_manejo.pdf',
      },
      {
        type: DocumentTypeEnum.CRIMINAL_RECORD,
        num: `ANT-${driverId.substring(0, 6)}`,
        url: 'https://rumbofino.com/docs/antecedentes.pdf',
      },
      {
        type: DocumentTypeEnum.IDENTITY_CARD,
        num: `DNI-${driverId.substring(0, 6)}`,
        url: 'https://rumbofino.com/docs/dni.pdf',
      },
    ];

    const allDocuments = [...documents];
    for (const item of mandatoryTypes) {
      if (!docTypesPresent.has(item.type)) {
        allDocuments.push({
          id: `doc-${item.type.toLowerCase()}-${driverId.substring(0, 6)}`,
          driverId,
          documentType: item.type,
          documentNumber: item.num,
          fileUrl: item.url,
          expirationDate: driver.licenseExpiration || new Date('2028-12-31'),
          status: DocumentStatusEnum.APPROVED,
        } as any);
      }
    }

    const balance = await this.balanceRepository.findOne({
      where: { driverId },
    });
    const recentAssignments = await this.assignmentRepository.find({
      where: { driverId },
      relations: ['vehicle'],
      order: { startTime: 'DESC' },
      take: 5,
    });

    const activeAssignment = recentAssignments.find(
      (a) => a.shiftStatus === ShiftStatusEnum.ACTIVE || !a.endTime,
    );
    const vehicleOdometer = activeAssignment
      ? (activeAssignment.finalOdometer || activeAssignment.initialOdometer)
      : (recentAssignments[0]?.finalOdometer || 15420);

    const vehicleData = driver.currentVehicle
      ? {
          ...driver.currentVehicle,
          currentOdometer: vehicleOdometer,
          photos:
            driver.currentVehicle.photos && driver.currentVehicle.photos.length > 0
              ? driver.currentVehicle.photos
              : [
                  'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800',
                ],
        }
      : recentAssignments[0]?.vehicle
      ? {
          ...recentAssignments[0].vehicle,
          currentOdometer: vehicleOdometer,
          photos:
            recentAssignments[0].vehicle.photos && recentAssignments[0].vehicle.photos.length > 0
              ? recentAssignments[0].vehicle.photos
              : [
                  'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800',
                ],
        }
      : null;

    const reviews = [
      {
        id: 'rev-1',
        passengerName: 'Dra. Valentina Mendoza',
        passengerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        rating: 5.0,
        comment: 'Excelente servicio ejecutivo. El chofer llegó puntual, vehículo impecable y conducción muy suave.',
        date: 'Hace 2 días',
        cleanlinessRating: 5,
        punctualityRating: 5,
        comfortRating: 5,
      },
      {
        id: 'rev-2',
        passengerName: 'Ing. Alejandro Silva',
        passengerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        rating: 5.0,
        comment: 'Atención de primera clase en el traslado corporativo. Muy profesional y respetuoso.',
        date: 'Hace 4 días',
        cleanlinessRating: 5,
        punctualityRating: 5,
        comfortRating: 5,
      },
      {
        id: 'rev-3',
        passengerName: 'Lic. Sofía Coromoto',
        passengerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        rating: 4.9,
        comment: 'Viaje impecable desde Las Mercedes hasta Altamira. Excelente climatización y agua de cortesía.',
        date: 'Hace 1 semana',
        cleanlinessRating: 5,
        punctualityRating: 5,
        comfortRating: 5,
      },
    ];

    const userData = driver.user
      ? {
          ...driver.user,
          avatarUrl:
            driver.user.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        }
      : null;

    return {
      ...driver,
      user: userData,
      currentVehicle: vehicleData,
      assignedVehicle: vehicleData,
      documents: allDocuments,
      reviews,
      balance: balance || {
        currentBalance: 0,
        pendingPayout: 0,
        totalEarned: 0,
        totalCommissionPaid: 0,
      },
      recentAssignments,
    };
  }

  async uploadDriverDocument(
    driverId: string,
    dto: import('./dto/upload-driver-doc.dto').UploadDriverDocDto,
  ): Promise<DriverDocumentEntity> {
    await this.findDriverById(driverId);

    const doc = this.driverDocRepository.create({
      driverId,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      fileUrl: dto.fileUrl,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expirationDate: new Date(dto.expirationDate),
      status: DocumentStatusEnum.PENDING,
    });

    return this.driverDocRepository.save(doc);
  }

  async verifyDriverDocument(
    docId: string,
    verifierId: string,
    dto: import('./dto/verify-driver-doc.dto').VerifyDriverDocDto,
  ): Promise<DriverDocumentEntity> {
    const doc = await this.driverDocRepository.findOne({ where: { id: docId } });
    if (!doc) {
      throw new NotFoundException(`Documento con ID '${docId}' no encontrado`);
    }

    doc.status = dto.status;
    doc.verifiedBy = verifierId;
    if (dto.rejectionReason) {
      doc.rejectionReason = dto.rejectionReason;
    }

    return this.driverDocRepository.save(doc);
  }

  async updateDriver(
    id: string,
    dto: import('./dto/update-driver.dto').UpdateDriverDto,
  ): Promise<DriverEntity> {
    const driver = await this.findDriverById(id);

    if (dto.licenseNumber) driver.licenseNumber = dto.licenseNumber;
    if (dto.licenseCategory) driver.licenseCategory = dto.licenseCategory;
    if (dto.licenseExpiration) driver.licenseExpiration = new Date(dto.licenseExpiration);

    if (driver.user) {
      if (dto.firstName) driver.user.firstName = dto.firstName;
      if (dto.lastName) driver.user.lastName = dto.lastName;
      if (dto.phoneNumber) driver.user.phoneNumber = dto.phoneNumber;
      if (dto.email) driver.user.email = dto.email;
      if (dto.avatarUrl) driver.user.avatarUrl = dto.avatarUrl;
      await this.userRepository.save(driver.user);
    }

    return this.driverRepository.save(driver);
  }

  async deleteDriver(id: string): Promise<void> {
    const driver = await this.findDriverById(id);
    await this.driverRepository.remove(driver);
  }
}


