import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { S3 } from 'aws-sdk';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3 | null = null;
  private bucketName: string;
  private useS3 = false;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'rumbo-fino-documents';

    // Only configure S3 if explicit AWS/MinIO endpoint is provided and not in purely local mode
    if (process.env.USE_S3 === 'true') {
      try {
        this.s3 = new S3({
          endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
          accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
          s3ForcePathStyle: true,
          signatureVersion: 'v4',
        });
        this.useS3 = true;
      } catch (err: any) {
        this.logger.warn(`S3/MinIO no disponible, usando almacenamiento local: ${err.message}`);
        this.useS3 = false;
      }
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const ext = path.extname(fileName) || (mimeType.includes('pdf') ? '.pdf' : '.jpg');
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    // 1. Try S3 if configured
    if (this.useS3 && this.s3) {
      try {
        await this.s3
          .upload({
            Bucket: this.bucketName,
            Key: safeName,
            Body: fileBuffer,
            ContentType: mimeType,
            ACL: 'private',
          })
          .promise();

        return this.getSignedUrl(safeName);
      } catch (err: any) {
        this.logger.warn(`Fallo al subir a S3/MinIO (${err.message}). Guardando en disco local.`);
      }
    }

    // 2. Local Disk Storage (Reliable, instantaneous, and served statically)
    const uploadsFolder = path.join(process.cwd(), 'uploads', 'vehicles');
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder, { recursive: true });
    }

    const filePath = path.join(uploadsFolder, safeName);
    fs.writeFileSync(filePath, fileBuffer);

    const port = process.env.PORT || 3000;
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
    return `${baseUrl}/uploads/vehicles/${safeName}`;
  }

  async getSignedUrl(key: string): Promise<string> {
    if (this.s3) {
      return this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: 86400, // 24 hours validity
      });
    }
    const port = process.env.PORT || 3000;
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
    return `${baseUrl}/uploads/vehicles/${key}`;
  }
}
