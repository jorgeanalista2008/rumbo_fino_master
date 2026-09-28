import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import '../../../models/driver_ride_model.dart';

class ActiveRideCard extends StatelessWidget {
  final DriverRideModel ride;
  final Function(DriverRideStatus nextStatus) onStatusChange;
  final VoidCallback onCancel;

  const ActiveRideCard({
    super.key,
    required this.ride,
    required this.onStatusChange,
    required this.onCancel,
  });

  String get _statusLabel {
    switch (ride.status) {
      case DriverRideStatus.ASIGNADO:
        return 'VIAJE ASIGNADO';
      case DriverRideStatus.EN_CAMINO:
        return 'EN CAMINO AL PASAJERO';
      case DriverRideStatus.ABORDAJE:
        return 'PUNTO DE ABORDAJE';
      case DriverRideStatus.EN_CURSO:
        return 'VIAJE EJECUTIVO EN CURSO';
      case DriverRideStatus.FINALIZADO:
        return 'VIAJE COMPLETADO';
      case DriverRideStatus.CANCELADO:
        return 'VIAJE CANCELADO';
      default:
        return 'EN PROGRESO';
    }
  }

  String get _actionButtonLabel {
    switch (ride.status) {
      case DriverRideStatus.ASIGNADO:
        return 'DIRIGIRME AL ORIGEN';
      case DriverRideStatus.EN_CAMINO:
        return 'LLEGUÉ AL PUNTO DE RECOGIDA';
      case DriverRideStatus.ABORDAJE:
        return 'INICIAR VIAJE EJECUTIVO';
      case DriverRideStatus.EN_CURSO:
        return 'FINALIZAR VIAJE & COBRAR';
      default:
        return 'ACTUALIZAR ESTADO';
    }
  }

  DriverRideStatus get _nextStatus {
    switch (ride.status) {
      case DriverRideStatus.ASIGNADO:
        return DriverRideStatus.EN_CAMINO;
      case DriverRideStatus.EN_CAMINO:
        return DriverRideStatus.ABORDAJE;
      case DriverRideStatus.ABORDAJE:
        return DriverRideStatus.EN_CURSO;
      case DriverRideStatus.EN_CURSO:
        return DriverRideStatus.FINALIZADO;
      default:
        return DriverRideStatus.FINALIZADO;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ExecutiveColors.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: ExecutiveColors.gold.withOpacity(0.4), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.8),
            blurRadius: 30,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status bar + code
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const RfPulseDot(variant: PulseDotVariant.gold, size: 10),
                    const SizedBox(width: 8),
                    Text(
                      _statusLabel,
                      style: ExecutiveTypography.caption.copyWith(
                        color: ExecutiveColors.gold,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
                Text(
                  ride.rideCode ?? '#VIP-SERVICE',
                  style: ExecutiveTypography.caption.copyWith(
                    color: ExecutiveColors.textTertiary,
                    letterSpacing: 1.0,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // Passenger Info Header
            Row(
              children: [
                RfAvatar(name: ride.passengerName, radius: 24),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ride.passengerName,
                        style: ExecutiveTypography.bodyLarge.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Row(
                        children: [
                          const RfBadge(text: 'VIP', variant: RfBadgeVariant.gold),
                          const SizedBox(width: 6),
                          Text(
                            ride.passengerPhone ?? '+58 414 000 0000',
                            style: ExecutiveTypography.caption.copyWith(
                              color: ExecutiveColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Fare box
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '\$${ride.fareAmountUsd.toStringAsFixed(2)}',
                      style: ExecutiveTypography.h3.copyWith(
                        color: ExecutiveColors.gold,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      'Bs. ${ride.fareAmountVes.toStringAsFixed(2)}',
                      style: ExecutiveTypography.caption.copyWith(
                        color: ExecutiveColors.goldLight.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Destination address card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: ExecutiveColors.background,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: ExecutiveColors.border),
              ),
              child: Row(
                children: [
                  Icon(
                    ride.status == DriverRideStatus.EN_CURSO
                        ? Icons.flag_rounded
                        : Icons.my_location_rounded,
                    color: ExecutiveColors.gold,
                    size: 22,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ride.status == DriverRideStatus.EN_CURSO
                              ? 'RUMBO AL DESTINO'
                              : 'PUNTO DE RECOGIDA',
                          style: ExecutiveTypography.caption.copyWith(
                            color: ExecutiveColors.textTertiary,
                            letterSpacing: 1.0,
                          ),
                        ),
                        Text(
                          ride.status == DriverRideStatus.EN_CURSO
                              ? ride.dropoffAddress
                              : ride.pickupAddress,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: ExecutiveTypography.bodyMedium.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Main Action Transition Button
            LuxuryButton(
              text: _actionButtonLabel,
              onPressed: () => onStatusChange(_nextStatus),
            ),
          ],
        ),
      ),
    );
  }
}
