import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:core_ui/core_ui.dart';
import '../../../models/driver_ride_model.dart';

class IncomingRideRadarDialog extends StatelessWidget {
  final DriverRideModel ride;
  final int countdown;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  const IncomingRideRadarDialog({
    super.key,
    required this.ride,
    required this.countdown,
    required this.onAccept,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final progress = countdown / 30.0;

    return Container(
      color: Colors.black.withOpacity(0.85),
      child: Center(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 20),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: ExecutiveColors.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: ExecutiveColors.gold, width: 2),
            boxShadow: [
              BoxShadow(
                color: ExecutiveColors.gold.withOpacity(0.3),
                blurRadius: 35,
                spreadRadius: 4,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Radar Pulsing Circle & Countdown
              Stack(
                alignment: Alignment.center,
                children: [
                  // Animated radar wave
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: ExecutiveColors.gold.withOpacity(0.4),
                        width: 1.5,
                      ),
                    ),
                  )
                      .animate(onPlay: (controller) => controller.repeat())
                      .scale(begin: const Offset(1, 1), end: const Offset(1.3, 1.3), duration: 1200.ms)
                      .fadeOut(duration: 1200.ms),

                  // Progress arc
                  SizedBox(
                    width: 80,
                    height: 80,
                    child: CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 6,
                      backgroundColor: ExecutiveColors.surfaceElevated,
                      valueColor: const AlwaysStoppedAnimation<Color>(ExecutiveColors.gold),
                    ),
                  ),

                  // Countdown number
                  Text(
                    '$countdown',
                    style: ExecutiveTypography.h2.copyWith(
                      color: ExecutiveColors.gold,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Title & Category Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'NUEVO VIAJE VIP',
                    style: ExecutiveTypography.h3.copyWith(
                      color: Colors.white,
                      letterSpacing: 2.0,
                    ),
                  ),
                  const SizedBox(width: 8),
                  RfBadge(
                    text: ride.requestedTier,
                    variant: RfBadgeVariant.gold,
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Dual Currency Fare Box
              DualCurrencyDisplay(
                amountUsd: ride.fareAmountUsd,
                bcvRate: ride.bcvRate,
                isLarge: true,
              ),

              const SizedBox(height: 20),

              // Passenger info row
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: ExecutiveColors.background,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: ExecutiveColors.border),
                ),
                child: Row(
                  children: [
                    const RfAvatar(name: 'VIP', radius: 18),
                    const SizedBox(width: 12),
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
                          Text(
                            'Pasajero VIP Rumbo Fino',
                            style: ExecutiveTypography.caption.copyWith(
                              color: ExecutiveColors.goldLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Route Details (Pickup -> Destination)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: ExecutiveColors.background,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: ExecutiveColors.border),
                ),
                child: Column(
                  children: [
                    // Pickup
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.trip_origin, color: ExecutiveColors.gold, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'ORIGEN DE RECOGIDA',
                                style: ExecutiveTypography.caption.copyWith(
                                  color: ExecutiveColors.textTertiary,
                                ),
                              ),
                              Text(
                                ride.pickupAddress,
                                maxLines: 2,
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
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Divider(color: ExecutiveColors.border, height: 1),
                    ),
                    // Dropoff
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.location_on, color: ExecutiveColors.success, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'DESTINO FINAL',
                                style: ExecutiveTypography.caption.copyWith(
                                  color: ExecutiveColors.textTertiary,
                                ),
                              ),
                              Text(
                                ride.dropoffAddress,
                                maxLines: 2,
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
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: ExecutiveColors.border),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: onReject,
                      child: Text(
                        'IGNORAR',
                        style: ExecutiveTypography.button.copyWith(
                          color: ExecutiveColors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    flex: 2,
                    child: LuxuryButton(
                      text: 'ACEPTAR VIAJE',
                      onPressed: onAccept,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
