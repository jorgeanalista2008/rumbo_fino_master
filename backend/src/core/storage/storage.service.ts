import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadedFileEntity } from '../database/entities/uploaded-file.entity';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @InjectRepository(UploadedFileEntity)
    private readonly fileRepository: Repository<UploadedFileEntity>,
  ) {}

  private getBaseUrl(): string {
    if (process.env.BACKEND_URL) {
      return process.env.BACKEND_URL.replace(/\/+$/, '');
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'https://rumbo-fino-master.vercel.app';
  }

  /**
   * Guarda un archivo binario de forma persistente en Supabase PostgreSQL.
   * Totalmente compatible con entornos Serverless (Vercel) sin depender de disco local.
   */
  async saveFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const safeName = fileName || `file_${Date.now()}`;
    const safeMime = mimeType || 'application/octet-stream';

    const fileRecord = this.fileRepository.create({
      fileName: safeName,
      mimeType: safeMime,
      fileSize: fileBuffer.length,
      data: fileBuffer,
    });

    const saved = await this.fileRepository.save(fileRecord);
    this.logger.log(`✅ Archivo almacenado en PostgreSQL: ${saved.id} (${saved.fileName}, ${saved.fileSize} bytes)`);

    return `${this.getBaseUrl()}/api/v1/storage/files/${saved.id}`;
  }

  /**
   * Alias retrocompatible para servicios existentes (e.g. VehiclesService).
   */
  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    return this.saveFile(fileBuffer, fileName, mimeType);
  }

  /**
   * Recupera el archivo binario y metadatos por su ID UUID.
   */
  async getFile(id: string): Promise<UploadedFileEntity> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`Archivo con ID ${id} no encontrado.`);
    }
    return file;
  }
}
