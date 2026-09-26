import { BadRequestException } from '@nestjs/common';
import { RideStatusEnum } from '../../../../common/enums/roles.enum';

export class RideStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<RideStatusEnum, RideStatusEnum[]> = {
    [RideStatusEnum.SOLICITADO]: [RideStatusEnum.ASIGNADO, RideStatusEnum.CANCELADO],
    [RideStatusEnum.ASIGNADO]: [RideStatusEnum.EN_CAMINO, RideStatusEnum.CANCELADO],
    [RideStatusEnum.EN_CAMINO]: [RideStatusEnum.ABORDAJE, RideStatusEnum.CANCELADO],
    [RideStatusEnum.ABORDAJE]: [RideStatusEnum.EN_CURSO, RideStatusEnum.CANCELADO],
    [RideStatusEnum.EN_CURSO]: [RideStatusEnum.FINALIZADO, RideStatusEnum.CANCELADO],
    [RideStatusEnum.FINALIZADO]: [],
    [RideStatusEnum.CANCELADO]: [],
  };

  static validateTransition(currentStatus: RideStatusEnum, targetStatus: RideStatusEnum): void {
    const allowed = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Transición de estado inválida: No se puede cambiar de '${currentStatus}' a '${targetStatus}'`,
      );
    }
  }
}
