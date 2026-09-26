import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentTypeEnum } from '../../../common/enums/roles.enum';

export class UploadDriverDocDto {
  @ApiProperty({
    enum: DocumentTypeEnum,
    example: DocumentTypeEnum.DRIVER_LICENSE,
    description: 'Tipo de documento (DRIVER_LICENSE, CRIMINAL_RECORD, IDENTITY_CARD)',
  })
  @IsEnum(DocumentTypeEnum)
  documentType: DocumentTypeEnum;

  @ApiPropertyOptional({ example: 'LIC-A3C-998877', description: 'Número identificador del documento' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiProperty({ example: 'https://storage.rumbofino.com/docs/licencia_carlos.pdf', description: 'URL del archivo PDF o Imagen' })
  @IsString()
  @IsNotEmpty({ message: 'La URL del archivo es obligatoria' })
  fileUrl: string;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Fecha de expedición (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiProperty({ example: '2028-12-31', description: 'Fecha de vencimiento (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'La fecha de vencimiento es obligatoria' })
  expirationDate: string;
}
