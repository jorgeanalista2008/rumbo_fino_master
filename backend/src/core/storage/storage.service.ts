import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';

@Injectable()
export class StorageService {
  private s3: S3;
  private bucketName: string;

  constructor() {
    this.s3 = new S3({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
      s3ForcePathStyle: true, // Needed for MinIO compatibility
      signatureVersion: 'v4',
    });
    this.bucketName = process.env.S3_BUCKET_NAME || 'rumbo-fino-documents';
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const key = `${Date.now()}_${fileName}`;
    await this.s3
      .upload({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: 'private',
      })
      .promise();

    return this.getSignedUrl(key);
  }

  async getSignedUrl(key: string): Promise<string> {
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucketName,
      Key: key,
      Expires: 3600, // 1 hour validity
    });
  }
}
