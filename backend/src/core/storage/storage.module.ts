import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { UploadedFileEntity } from '../database/entities/uploaded-file.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UploadedFileEntity])],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
