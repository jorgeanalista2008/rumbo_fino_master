import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentTypeEnum } from '../../../common/enums/roles.enum';

export class UploadVehicleDocDto {
  @ApiProperty({
    enum: DocumentTypeEnum,
    example: DocumentTypeEnum.SOAT_INSURANCE,
    description: 'Tipo de documento (SOAT_INSURANCE, TECHNICAL_INSPECTION, VEHICLE_TITLE)',
  })
  @IsEnum(DocumentTypeEnum, { message: 'Tipo de documento no válido' })
  documentType: DocumentTypeEnum;

  @ApiProperty({ example: 'SOAT-2026-998811', description: 'Número de folio o correlativo del documento', required: false })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiProperty({ example: '2026-12-31', description: 'Fecha de vencimiento (Formato: YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'La fecha de vencimiento es obligatoria (YYYY-MM-DD)' })
  expirationDate: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Archivo PDF o Fotografía en alta resolución' })
  file?: any;
}
