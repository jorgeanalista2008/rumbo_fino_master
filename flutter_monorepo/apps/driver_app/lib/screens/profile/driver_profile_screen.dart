import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:core_ui/core_ui.dart';
import '../../core/providers/driver_auth_provider.dart';
import '../../core/providers/driver_shift_provider.dart';
import '../../models/driver_model.dart';
import '../auth/driver_login_screen.dart';

class DriverProfileScreen extends StatefulWidget {
  const DriverProfileScreen({super.key});

  @override
  State<DriverProfileScreen> createState() => _DriverProfileScreenState();
}

class _DriverProfileScreenState extends State<DriverProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DriverAuthProvider>().refreshProfile();
      context.read<DriverShiftProvider>().fetchBcvRate();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<DriverAuthProvider>();
    final shift = context.watch<DriverShiftProvider>();
    final profile = auth.profile;
    final vehicle = profile?.vehicle;
    final user = profile?.user;

    final String fullName = user?.fullName.isNotEmpty == true
        ? user!.fullName
        : (profile?.user.fullName ?? 'Chofer Ejecutivo');
    final String email = user?.email.isNotEmpty == true
        ? user!.email
        : (profile?.user.email ?? 'chofer@rumbofino.com');
    final String phone = user?.phoneNumber?.isNotEmpty == true
        ? user!.phoneNumber!
        : 'Sin teléfono registrado';
    final String? avatarUrl = user?.avatarUrl;
    final double rating = profile?.rating ?? 5.0;
    final int totalTrips = profile?.totalTrips ?? 0;
    final String licenseNumber = profile?.licenseNumber.isNotEmpty == true
        ? profile!.licenseNumber
        : 'Sin licencia registrada';
    final String licenseCategory = profile?.licenseCategory.isNotEmpty == true
        ? profile!.licenseCategory
        : 'Quinta Profesional';
    final String licenseExp = profile?.licenseExpiration ?? 'Vigente';

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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: ExecutiveColors.gold),
            tooltip: 'Actualizar Perfil',
            onPressed: () {
              auth.refreshProfile();
              shift.fetchBcvRate();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: ExecutiveColors.gold,
        backgroundColor: ExecutiveColors.surface,
        onRefresh: () async {
          await auth.refreshProfile();
          await shift.fetchBcvRate();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. DRIVER HEADER PROFILE CARD
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: ExecutiveColors.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: ExecutiveColors.gold.withOpacity(0.35)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Avatar with Gold Ring & Live Pulse
                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        RfAvatar(
                          name: fullName,
                          imageUrl: avatarUrl,
                          radius: 46,
                          hasGoldBorder: true,
                        ),
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: shift.isOnline ? ExecutiveColors.success : Colors.grey,
                            shape: BoxShape.circle,
                            border: Border.all(color: ExecutiveColors.surface, width: 2.5),
                          ),
                          child: const Icon(Icons.shield, color: Colors.black, size: 12),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Full Name
                    Text(
                      fullName,
                      style: ExecutiveTypography.h2.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.3,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),

                    // Email & Phone
                    Text(
                      '$email • $phone',
                      style: ExecutiveTypography.caption.copyWith(
                        color: ExecutiveColors.textSecondary,
                        fontSize: 12,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 14),

                    // Badges row: VIP Tier & Star Rating
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const RfBadge(text: 'CONDUCTOR VIP TITANIUM', variant: RfBadgeVariant.gold),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: ExecutiveColors.gold.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: ExecutiveColors.gold.withOpacity(0.4)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.star, color: ExecutiveColors.gold, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                rating.toStringAsFixed(2),
                                style: ExecutiveTypography.caption.copyWith(
                                  color: ExecutiveColors.gold,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '($totalTrips viajes)',
                                style: ExecutiveTypography.caption.copyWith(
                                  color: ExecutiveColors.textSecondary,
                                  fontSize: 10,
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

              const SizedBox(height: 18),

              // 2. PERFORMANCE METRICS (HOY)
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: ExecutiveColors.surface,
                        borderRadius: BorderRadius.circular(18),
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
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${shift.completedTripsToday}',
                            style: ExecutiveTypography.h2.copyWith(
                              color: ExecutiveColors.gold,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          Text(
                            'Turno Activo',
                            style: ExecutiveTypography.caption.copyWith(
                              color: ExecutiveColors.textSecondary,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: ExecutiveColors.surface,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: ExecutiveColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'PRODUCCIÓN HOY',
                            style: ExecutiveTypography.caption.copyWith(
                              color: ExecutiveColors.textTertiary,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '\$${shift.earningsUsdToday.toStringAsFixed(2)}',
                            style: ExecutiveTypography.h2.copyWith(
                              color: ExecutiveColors.success,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          Text(
                            'Bs. ${(shift.earningsUsdToday * shift.bcvRate).toStringAsFixed(2)}',
                            style: ExecutiveTypography.caption.copyWith(
                              color: ExecutiveColors.textSecondary,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              // 3. VEHÍCULO ASIGNADO EN DETALLE
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: ExecutiveColors.surface,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: ExecutiveColors.border),
                ),
                child: vehicle == null
                    ? Column(
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
                              const RfBadge(text: 'SIN ASIGNAR', variant: RfBadgeVariant.warning),
                            ],
                          ),
                          const SizedBox(height: 20),
                          Container(
                            width: 68,
                            height: 68,
                            decoration: BoxDecoration(
                              color: ExecutiveColors.surfaceElevated,
                              shape: BoxShape.circle,
                              border: Border.all(color: ExecutiveColors.border),
                            ),
                            child: const Icon(Icons.directions_car_outlined, color: ExecutiveColors.gold, size: 34),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'Sin Unidad Asignada',
                            style: ExecutiveTypography.h3.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'No tienes un vehículo vinculado para este turno. Puedes seleccionar una unidad disponible al presionar "Iniciar Turno" o solicitar su asignación desde el Backoffice.',
                            textAlign: TextAlign.center,
                            style: ExecutiveTypography.bodySmall.copyWith(
                              color: ExecutiveColors.textSecondary,
                              height: 1.4,
                            ),
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Vehicle Photo Banner
                          if (vehicle.photos.isNotEmpty) ...[
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Stack(
                                children: [
                                  Image.network(
                                    vehicle.photos.first,
                                    height: 170,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(
                                      height: 140,
                                      color: ExecutiveColors.surfaceElevated,
                                      child: const Center(
                                        child: Icon(Icons.directions_car, color: ExecutiveColors.gold, size: 48),
                                      ),
                                    ),
                                  ),
                                  Container(
                                    height: 170,
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: [
                                          Colors.transparent,
                                          ExecutiveColors.surface.withOpacity(0.95),
                                        ],
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    top: 12,
                                    left: 14,
                                    child: RfBadge(
                                      text: vehicle.status,
                                      variant: RfBadgeVariant.success,
                                    ),
                                  ),
                                  Positioned(
                                    top: 12,
                                    right: 14,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withOpacity(0.7),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: ExecutiveColors.gold.withOpacity(0.5)),
                                      ),
                                      child: Text(
                                        vehicle.tier,
                                        style: ExecutiveTypography.caption.copyWith(
                                          color: ExecutiveColors.gold,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    bottom: 12,
                                    left: 14,
                                    child: Text(
                                      '${vehicle.brand} ${vehicle.model} (${vehicle.year})',
                                      style: ExecutiveTypography.h3.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),
                          ],

                          // Vehicle Header
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${vehicle.brand} ${vehicle.model}',
                                style: ExecutiveTypography.bodyLarge.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              RfBadge(text: vehicle.tier, variant: RfBadgeVariant.gold),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Vehicle Specs Grid
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: ExecutiveColors.background,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: ExecutiveColors.border),
                            ),
                            child: Column(
                              children: [
                                _buildSpecRow(
                                  icon: Icons.tag,
                                  label: 'Placa VIP',
                                  value: vehicle.plateNumber,
                                  isGold: true,
                                ),
                                const Divider(color: ExecutiveColors.border, height: 16),
                                _buildSpecRow(
                                  icon: Icons.speed,
                                  label: 'Odómetro / Kilometraje',
                                  value: '${vehicle.currentOdometer} KM',
                                ),
                                const Divider(color: ExecutiveColors.border, height: 16),
                                _buildSpecRow(
                                  icon: Icons.palette,
                                  label: 'Color de Carrocería',
                                  value: vehicle.color,
                                ),
                                const Divider(color: ExecutiveColors.border, height: 16),
                                _buildSpecRow(
                                  icon: Icons.settings,
                                  label: 'Transmisión & Motor',
                                  value: vehicle.transmission,
                                ),
                              ],
                            ),
                          ),

                          if (vehicle.amenities.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: vehicle.amenities.map((amenity) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: ExecutiveColors.surfaceElevated,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: ExecutiveColors.border),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.check_circle_outline, color: ExecutiveColors.gold, size: 12),
                                      const SizedBox(width: 4),
                                      Text(
                                        amenity,
                                        style: ExecutiveTypography.caption.copyWith(
                                          color: Colors.white,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ],
                      ),
              ),

              const SizedBox(height: 18),

              // 4. RESEÑAS & CALIFICACIONES DE PASAJEROS VIP
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: ExecutiveColors.surface,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: ExecutiveColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'RESEÑAS DE PASAJEROS VIP',
                          style: ExecutiveTypography.caption.copyWith(
                            color: ExecutiveColors.gold,
                            letterSpacing: 1.2,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.star, color: ExecutiveColors.gold, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '${rating.toStringAsFixed(2)} / 5.0',
                              style: ExecutiveTypography.caption.copyWith(
                                color: ExecutiveColors.gold,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Sub-scores
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: ExecutiveColors.background,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildSubScore('Limpieza', '5.0 ⭐'),
                          Container(width: 1, height: 24, color: ExecutiveColors.border),
                          _buildSubScore('Puntualidad', '5.0 ⭐'),
                          Container(width: 1, height: 24, color: ExecutiveColors.border),
                          _buildSubScore('Conducción', '4.9 ⭐'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Reviews List
                    if (profile?.reviews != null && profile!.reviews.isNotEmpty)
                      ...profile.reviews.map((rev) => _buildReviewCard(rev))
                    else ...[
                      _buildReviewCard(
                        DriverReviewModel(
                          id: 'r1',
                          passengerName: 'Dra. Valentina Mendoza',
                          rating: 5.0,
                          comment: 'Excelente servicio ejecutivo. El chofer llegó puntual, vehículo impecable y trato muy respetuoso.',
                          date: 'Hace 2 días',
                        ),
                      ),
                      _buildReviewCard(
                        DriverReviewModel(
                          id: 'r2',
                          passengerName: 'Ing. Alejandro Silva',
                          rating: 5.0,
                          comment: 'Atención de primera clase en el traslado corporativo. Manejo suave y seguro.',
                          date: 'Hace 4 días',
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // 5. EXPEDIENTE DIGITAL & AUDITORÍA LEGAL
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: ExecutiveColors.surface,
                  borderRadius: BorderRadius.circular(22),
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
                      title: 'Licencia de Conducir ($licenseCategory)',
                      subtitle: '$licenseNumber • Vence: $licenseExp',
                      isApproved: true,
                    ),
                    const Divider(color: ExecutiveColors.border, height: 16),
                    _buildDocRow(
                      title: 'Certificado Médico Vial',
                      subtitle: 'Homologado y Vigente',
                      isApproved: true,
                    ),
                    const Divider(color: ExecutiveColors.border, height: 16),
                    _buildDocRow(
                      title: 'Certificado de Antecedentes',
                      subtitle: 'Auditado por Seguridad Rumbo Fino',
                      isApproved: true,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // 6. LOGOUT BUTTON
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: ExecutiveColors.error),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
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
      ),
    );
  }

  Widget _buildSpecRow({
    required IconData icon,
    required String label,
    required String value,
    bool isGold = false,
  }) {
    return Row(
      children: [
        Icon(icon, color: isGold ? ExecutiveColors.gold : ExecutiveColors.textSecondary, size: 16),
        const SizedBox(width: 10),
        Text(
          label,
          style: ExecutiveTypography.caption.copyWith(
            color: ExecutiveColors.textSecondary,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: ExecutiveTypography.caption.copyWith(
            color: isGold ? ExecutiveColors.gold : Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildSubScore(String label, String score) {
    return Column(
      children: [
        Text(
          score,
          style: ExecutiveTypography.caption.copyWith(
            color: ExecutiveColors.gold,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: ExecutiveTypography.caption.copyWith(
            color: ExecutiveColors.textTertiary,
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildReviewCard(DriverReviewModel rev) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ExecutiveColors.background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ExecutiveColors.border.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              RfAvatar(
                name: rev.passengerName,
                imageUrl: rev.passengerAvatar,
                radius: 14,
                hasGoldBorder: false,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rev.passengerName,
                      style: ExecutiveTypography.caption.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      rev.date,
                      style: ExecutiveTypography.caption.copyWith(
                        color: ExecutiveColors.textTertiary,
                        fontSize: 9,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: ExecutiveColors.gold.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.star, color: ExecutiveColors.gold, size: 12),
                    const SizedBox(width: 3),
                    Text(
                      rev.rating.toStringAsFixed(1),
                      style: ExecutiveTypography.caption.copyWith(
                        color: ExecutiveColors.gold,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '"${rev.comment}"',
            style: ExecutiveTypography.caption.copyWith(
              color: Colors.white70,
              fontStyle: FontStyle.italic,
              fontSize: 11,
            ),
          ),
        ],
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
          text: isApproved ? 'HOMOLOGADO' : 'PENDIENTE',
          variant: isApproved ? RfBadgeVariant.success : RfBadgeVariant.gold,
        ),
      ],
    );
  }
}
