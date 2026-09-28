import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:core_ui/core_ui.dart';
import '../../core/providers/driver_auth_provider.dart';
import '../../core/providers/driver_shift_provider.dart';
import '../auth/driver_login_screen.dart';

class DriverProfileScreen extends StatelessWidget {
  const DriverProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<DriverAuthProvider>();
    final shift = context.watch<DriverShiftProvider>();
    final profile = auth.profile;

    return Scaffold(
      backgroundColor: ExecutiveColors.background,
      appBar: AppBar(
        title: Text(
          'PERFIL CONDUCTOR VIP',
          style: ExecutiveTypography.h3.copyWith(
            color: ExecutiveColors.gold,
            letterSpacing: 2.0,
          ),
        ),
        backgroundColor: ExecutiveColors.surface,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Driver Profile Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: ExecutiveColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: ExecutiveColors.gold.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  RfAvatar(
                    name: profile?.user.fullName ?? 'Chofer Ejecutivo',
                    radius: 40,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    profile?.user.fullName ?? 'Chofer Ejecutivo VIP',
                    style: ExecutiveTypography.h2.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    profile?.user.email ?? 'chofer1@rumbofino.com',
                    style: ExecutiveTypography.caption.copyWith(
                      color: ExecutiveColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const RfBadge(text: 'CONDUCTOR VIP', variant: RfBadgeVariant.gold),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: ExecutiveColors.gold.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.star, color: ExecutiveColors.gold, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '${profile?.rating ?? 5.0}',
                              style: ExecutiveTypography.caption.copyWith(
                                color: ExecutiveColors.gold,
                                fontWeight: FontWeight.bold,
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

            const SizedBox(height: 20),

            // Performance Metrics
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: ExecutiveColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: ExecutiveColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'VIAJES HOY',
                          style: ExecutiveTypography.caption.copyWith(
                            color: ExecutiveColors.textTertiary,
                            fontSize: 10,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${shift.completedTripsToday}',
                          style: ExecutiveTypography.h2.copyWith(
                            color: ExecutiveColors.gold,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: ExecutiveColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: ExecutiveColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'GANANCIAS HOY',
                          style: ExecutiveTypography.caption.copyWith(
                            color: ExecutiveColors.textTertiary,
                            fontSize: 10,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '\$${shift.earningsUsdToday.toStringAsFixed(2)}',
                          style: ExecutiveTypography.h2.copyWith(
                            color: ExecutiveColors.success,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Assigned Vehicle Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: ExecutiveColors.surface,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: ExecutiveColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'VEHÍCULO ASIGNADO',
                        style: ExecutiveTypography.caption.copyWith(
                          color: ExecutiveColors.gold,
                          letterSpacing: 1.2,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const RfBadge(text: 'BLACK TIER', variant: RfBadgeVariant.gold),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: ExecutiveColors.gold.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.directions_car, color: ExecutiveColors.gold, size: 26),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              profile?.vehicle?.displayName ?? 'Toyota Fortuner Executive (AB123CD)',
                              style: ExecutiveTypography.bodyLarge.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Color: ${profile?.vehicle?.color ?? 'Negro'} • Categoría VIP',
                              style: ExecutiveTypography.caption.copyWith(
                                color: ExecutiveColors.textSecondary,
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

            const SizedBox(height: 20),

            // Document Compliance Status Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: ExecutiveColors.surface,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: ExecutiveColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'EXPEDIENTE DIGITAL & AUDITORÍA',
                    style: ExecutiveTypography.caption.copyWith(
                      color: ExecutiveColors.gold,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 14),
                  _buildDocRow(
                    title: 'Licencia de Conducir (Quinta)',
                    subtitle: profile?.licenseNumber ?? 'V-19827364',
                    isApproved: true,
                  ),
                  const Divider(color: ExecutiveColors.border, height: 16),
                  _buildDocRow(
                    title: 'Certificado Médico Vial',
                    subtitle: 'Vigente hasta Dic 2027',
                    isApproved: true,
                  ),
                  const Divider(color: ExecutiveColors.border, height: 16),
                  _buildDocRow(
                    title: 'Certificado de Antecedentes',
                    subtitle: 'Auditado & Aprobado',
                    isApproved: true,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // Logout Button
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: ExecutiveColors.error),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              onPressed: () async {
                await auth.logout();
                if (context.mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const DriverLoginScreen()),
                    (route) => false,
                  );
                }
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.logout_rounded, color: ExecutiveColors.error, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'CERRAR SESIÓN DE CHOFER',
                    style: ExecutiveTypography.button.copyWith(
                      color: ExecutiveColors.error,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildDocRow({
    required String title,
    required String subtitle,
    required bool isApproved,
  }) {
    return Row(
      children: [
        Icon(
          isApproved ? Icons.verified : Icons.hourglass_top,
          color: isApproved ? ExecutiveColors.success : ExecutiveColors.warning,
          size: 20,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: ExecutiveTypography.bodyMedium.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                subtitle,
                style: ExecutiveTypography.caption.copyWith(
                  color: ExecutiveColors.textSecondary,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
        RfBadge(
          text: isApproved ? 'APROBADO' : 'PENDIENTE',
          variant: isApproved ? RfBadgeVariant.success : RfBadgeVariant.gold,
        ),
      ],
    );
  }
}
