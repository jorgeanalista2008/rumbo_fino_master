import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatusEnum } from '../../../common/enums/roles.enum';

export class VerifyDriverDocDto {
  @ApiProperty({
    enum: DocumentStatusEnum,
    example: DocumentStatusEnum.APPROVED,
    description: 'Estado de aprobación (APPROVED, REJECTED)',
  })
  @IsEnum(DocumentStatusEnum)
  status: DocumentStatusEnum;

  @ApiPropertyOptional({ example: 'Foto borrosa, por favor adjuntar imagen legible del documento.', description: 'Motivo de rechazo en caso de no ser aprobado' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
