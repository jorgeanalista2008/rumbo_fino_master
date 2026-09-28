import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:core_ui/core_ui.dart';
import '../../../core/providers/driver_shift_provider.dart';

class EndShiftModal extends StatefulWidget {
  const EndShiftModal({super.key});

  @override
  State<EndShiftModal> createState() => _EndShiftModalState();
}

class _EndShiftModalState extends State<EndShiftModal> {
  final _finalOdometerController = TextEditingController(text: '45340');

  @override
  void dispose() {
    _finalOdometerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shiftProvider = context.watch<DriverShiftProvider>();

    return Container(
      decoration: const BoxDecoration(
        color: ExecutiveColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: ExecutiveColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          Text(
            'FINALIZAR TURNO DE CONDUCCIÓN',
            style: ExecutiveTypography.h3.copyWith(
              color: ExecutiveColors.gold,
              letterSpacing: 1.5,
            ),
          ),
          Text(
            'Ingrese el kilometraje final y confirme el cierre de jornada',
            style: ExecutiveTypography.caption.copyWith(
              color: ExecutiveColors.textSecondary,
            ),
          ),

          const SizedBox(height: 20),

          // Daily summary card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: ExecutiveColors.background,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: ExecutiveColors.border),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Text(
                      '${shiftProvider.completedTripsToday}',
                      style: ExecutiveTypography.h2.copyWith(
                        color: ExecutiveColors.gold,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'VIAJES HOY',
                      style: ExecutiveTypography.caption.copyWith(
                        color: ExecutiveColors.textTertiary,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
                Container(width: 1, height: 35, color: ExecutiveColors.border),
                Column(
                  children: [
                    Text(
                      '\$${shiftProvider.earningsUsdToday.toStringAsFixed(2)}',
                      style: ExecutiveTypography.h2.copyWith(
                        color: ExecutiveColors.success,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Bs. ${shiftProvider.earningsVesToday.toStringAsFixed(0)}',
                      style: ExecutiveTypography.caption.copyWith(
                        color: ExecutiveColors.textTertiary,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Final Odometer Field
          LuxuryTextField(
            label: 'Odómetro / Kilometraje Final (KM)',
            hintText: 'ej. 45340',
            controller: _finalOdometerController,
            keyboardType: TextInputType.number,
            prefixIcon: const Icon(Icons.speed, color: ExecutiveColors.gold, size: 20),
          ),

          const SizedBox(height: 24),

          // Action Button
          LuxuryButton(
            text: 'CERRAR TURNO Y DESCONECTAR',
            isLoading: shiftProvider.isLoading,
            onPressed: () async {
              final odo = int.tryParse(_finalOdometerController.text.trim()) ?? 0;
              final success = await shiftProvider.endShift(finalOdometer: odo);
              if (success && mounted) {
                Navigator.of(context).pop();
              }
            },
          ),
        ],
      ),
    );
  }
}
