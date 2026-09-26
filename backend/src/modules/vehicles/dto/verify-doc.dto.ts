import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatusEnum } from '../../../common/enums/roles.enum';

export class VerifyDocDto {
  @ApiProperty({
    enum: DocumentStatusEnum,
    example: DocumentStatusEnum.APPROVED,
    description: 'Resultado de la verificación (APPROVED o REJECTED)',
  })
  @IsEnum(DocumentStatusEnum, { message: 'Estado de documento inválido' })
  status: DocumentStatusEnum;

  @ApiProperty({
    example: 'Documento vigente y verificado por la gerencia de operaciones',
    description: 'Motivo de rechazo o nota explicativa',
    required: false,
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
