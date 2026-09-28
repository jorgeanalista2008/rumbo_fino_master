import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:core_ui/core_ui.dart';
import '../../../core/providers/driver_shift_provider.dart';
import '../../../models/driver_model.dart';

class StartShiftModal extends StatefulWidget {
  final AssignedVehicleModel? defaultVehicle;

  const StartShiftModal({super.key, this.defaultVehicle});

  @override
  State<StartShiftModal> createState() => _StartShiftModalState();
}

class _StartShiftModalState extends State<StartShiftModal> {
  final _odometerController = TextEditingController(text: '45200');
  AssignedVehicleModel? _selectedVehicle;

  @override
  void initState() {
    super.initState();
    _selectedVehicle = widget.defaultVehicle ??
        AssignedVehicleModel(
          id: 'veh_default',
          plateNumber: 'AB123CD',
          brand: 'Toyota',
          model: 'Fortuner VIP',
          color: 'Negro',
          tier: 'BLACK',
        );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<DriverShiftProvider>().loadAvailableVehicles();
      }
    });
  }

  @override
  void dispose() {
    _odometerController.dispose();
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
            'INICIAR TURNO DE CONDUCCIÓN',
            style: ExecutiveTypography.h3.copyWith(
              color: ExecutiveColors.gold,
              letterSpacing: 1.5,
            ),
          ),
          Text(
            'Seleccione el vehículo asignado e ingrese el kilometraje inicial',
            style: ExecutiveTypography.caption.copyWith(
              color: ExecutiveColors.textSecondary,
            ),
          ),

          const SizedBox(height: 20),

          // Vehicle Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: ExecutiveColors.background,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: ExecutiveColors.gold.withOpacity(0.4)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: ExecutiveColors.gold.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.directions_car, color: ExecutiveColors.gold, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _selectedVehicle?.displayName ?? 'Toyota Fortuner VIP (AB123CD)',
                        style: ExecutiveTypography.bodyMedium.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Categoría: ${_selectedVehicle?.tier ?? 'BLACK'} • ${_selectedVehicle?.color ?? 'Negro'}',
                        style: ExecutiveTypography.caption.copyWith(
                          color: ExecutiveColors.goldLight,
                        ),
                      ),
                    ],
                  ),
                ),
                const RfBadge(text: 'ACTIVO', variant: RfBadgeVariant.gold),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Initial Odometer Field
          LuxuryTextField(
            label: 'Odómetro / Kilometraje Inicial (KM)',
            hintText: 'ej. 45200',
            controller: _odometerController,
            keyboardType: TextInputType.number,
            prefixIcon: const Icon(Icons.speed, color: ExecutiveColors.gold, size: 20),
          ),

          const SizedBox(height: 24),

          // Action Button
          LuxuryButton(
            text: 'ACTIVAR TURNO Y PONERSE EN LÍNEA',
            isLoading: shiftProvider.isLoading,
            onPressed: () async {
              final odo = int.tryParse(_odometerController.text.trim()) ?? 0;
              final success = await shiftProvider.startShift(
                vehicleId: _selectedVehicle?.id ?? 'veh_default',
                initialOdometer: odo,
                vehicleObj: _selectedVehicle,
              );
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
