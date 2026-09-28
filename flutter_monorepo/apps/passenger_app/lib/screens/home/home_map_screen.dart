import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:core_ui/core_ui.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/ride_provider.dart';
import '../auth/login_screen.dart';

class HomeMapScreen extends StatefulWidget {
  const HomeMapScreen({super.key});

  @override
  State<HomeMapScreen> createState() => _HomeMapScreenState();
}

class _HomeMapScreenState extends State<HomeMapScreen> {
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RideProvider>().initializeData();
    });
  }

  void _centerOnPassenger(LatLng location) {
    _mapController.move(location, 15.0);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final ride = context.watch<RideProvider>();

    return Scaffold(
      backgroundColor: ExecutiveColors.background,
      body: Stack(
        children: [
          // 1. Fullscreen Dark Luxury Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: ride.passengerLocation,
              initialZoom: 14.5,
              minZoom: 5.0,
              maxZoom: 18.0,
            ),
            children: [
              // CartoDB Dark Matter Luxury Tiles
              TileLayer(
                urlTemplate: 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
                userAgentPackageName: 'com.rumbofino.passenger_app',
                maxZoom: 19,
              ),

              // Markers Layer (Passenger + Nearby Luxury Chauffeurs)
              MarkerLayer(
                markers: [
                  // Passenger Marker (Pulsing Gold Pin)
                  Marker(
                    point: ride.passengerLocation,
                    width: 50,
                    height: 50,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: ExecutiveColors.gold.withOpacity(0.25),
                          ),
                        ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(
                              begin: const Offset(1, 1),
                              end: const Offset(1.4, 1.4),
                              duration: 1200.ms,
                            ),
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: ExecutiveColors.goldGradient,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: ExecutiveColors.gold.withOpacity(0.5),
                                blurRadius: 10,
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Icon(Icons.person, size: 12, color: Colors.black),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Nearby Chauffeurs Markers
                  ...ride.nearbyDrivers.map((driver) {
                    return Marker(
                      point: LatLng(driver.latitude, driver.longitude),
                      width: 44,
                      height: 44,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF14171F),
                          shape: BoxShape.circle,
                          border: Border.all(color: ExecutiveColors.gold, width: 1.5),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.6),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Icon(
                            driver.category == 'SUV_BLINDADA'
                                ? Icons.shield_outlined
                                : Icons.directions_car_filled_rounded,
                            color: ExecutiveColors.gold,
                            size: 20,
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ],
          ),

          // 2. Top Executive Floating Header
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  // User Avatar & Name Pill
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: ExecutiveColors.surfaceGlass,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: ExecutiveColors.borderLight),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 12,
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: ExecutiveColors.gold,
                            child: Text(
                              (auth.currentUser?.firstName.isNotEmpty ?? false)
                                  ? auth.currentUser!.firstName[0]
                                  : 'P',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.black,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  auth.currentUser?.fullName ?? 'Pasajero VIP',
                                  style: ExecutiveTypography.bodyMedium.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: ExecutiveColors.textPrimary,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  'Membresía Ejecutiva',
                                  style: ExecutiveTypography.bodySmall.copyWith(
                                    fontSize: 11,
                                    color: ExecutiveColors.gold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(width: 10),

                  // BCV Live Rate Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: ExecutiveColors.surfaceGlass,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: ExecutiveColors.borderGold),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'TASA BCV',
                          style: ExecutiveTypography.bodySmall.copyWith(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: ExecutiveColors.gold,
                          ),
                        ),
                        Text(
                          'Bs. ${ride.bcvRate.toStringAsFixed(2)}',
                          style: ExecutiveTypography.bodyMedium.copyWith(
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 10),

                  // Logout button
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () async {
                        await auth.logout();
                        if (context.mounted) {
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                          );
                        }
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: ExecutiveColors.surfaceGlass,
                          shape: BoxShape.circle,
                          border: Border.all(color: ExecutiveColors.borderLight),
                        ),
                        child: const Icon(Icons.logout, color: ExecutiveColors.textSecondary, size: 20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Floating Map Controls (Center GPS button)
          Positioned(
            right: 16,
            bottom: 340,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _centerOnPassenger(ride.passengerLocation),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: ExecutiveColors.surfaceGlass,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: ExecutiveColors.borderLight),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.my_location, color: ExecutiveColors.gold),
                ),
              ),
            ),
          ),

          // 4. Executive Bottom Sheet & Ride Panel
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildExecutiveBottomSheet(context, ride),
          ),
        ],
      ),
    );
  }

  Widget _buildExecutiveBottomSheet(BuildContext context, RideProvider ride) {
    if (ride.flowState == RideFlowState.requestingRide ||
        ride.flowState == RideFlowState.driverAssigned ||
        ride.flowState == RideFlowState.inProgress) {
      return _buildActiveRideCard(context, ride);
    }

    if (ride.flowState == RideFlowState.selectingTier) {
      return _buildTierSelectorCard(context, ride);
    }

    // Default: Destination Search Sheet
    return _buildDestinationSearchCard(context, ride);
  }

  Widget _buildDestinationSearchCard(BuildContext context, RideProvider ride) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      decoration: const BoxDecoration(
        color: ExecutiveColors.surfaceGlass,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: ExecutiveColors.borderLight, width: 1.5)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
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
            '¿A dónde te trasladamos hoy?',
            style: ExecutiveTypography.h2.copyWith(fontSize: 20),
          ),
          Text(
            'Flota ejecutiva y choferes de protocolo a tu disposición',
            style: ExecutiveTypography.bodySmall,
          ),
          const SizedBox(height: 18),

          // Search Destination Pill
          LuxuryCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            hasGoldBorder: true,
            onTap: () {
              ride.setDestination(
                'Hotel Tamanaco Intercontinental, Las Mercedes',
                LatLng(ride.passengerLocation.latitude + 0.012, ride.passengerLocation.longitude + 0.010),
              );
            },
            child: Row(
              children: [
                const Icon(Icons.search, color: ExecutiveColors.gold, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Ingresa dirección o lugar de destino...',
                    style: ExecutiveTypography.bodyMedium.copyWith(
                      color: ExecutiveColors.textMuted,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Luxury Destinations Quick Shortcuts
          Row(
            children: [
              _buildPresetChip(
                'Tamanaco',
                Icons.hotel,
                () => ride.setDestination(
                  'Hotel Tamanaco Intercontinental',
                  LatLng(ride.passengerLocation.latitude + 0.012, ride.passengerLocation.longitude + 0.010),
                ),
              ),
              const SizedBox(width: 8),
              _buildPresetChip(
                'Aeropuerto Maiquetía',
                Icons.flight_takeoff,
                () => ride.setDestination(
                  'Aeropuerto Intl. Simón Bolívar Maiquetía',
                  const LatLng(10.6030, -66.9906),
                ),
              ),
              const SizedBox(width: 8),
              _buildPresetChip(
                'Altamira VIP',
                Icons.business_center,
                () => ride.setDestination(
                  'Torre Altamira Business Hub',
                  LatLng(ride.passengerLocation.latitude + 0.008, ride.passengerLocation.longitude + 0.006),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPresetChip(String label, IconData icon, VoidCallback onTap) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: ExecutiveColors.surfaceElevated,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ExecutiveColors.border),
            ),
            child: Column(
              children: [
                Icon(icon, color: ExecutiveColors.gold, size: 18),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: ExecutiveTypography.bodySmall.copyWith(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: ExecutiveColors.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTierSelectorCard(BuildContext context, RideProvider ride) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      decoration: const BoxDecoration(
        color: ExecutiveColors.surfaceGlass,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: ExecutiveColors.borderLight, width: 1.5)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Selecciona tu Categoría VIP',
                style: ExecutiveTypography.h3,
              ),
              IconButton(
                icon: const Icon(Icons.close, color: ExecutiveColors.textMuted, size: 20),
                onPressed: ride.resetToMap,
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Tiers List
          ...RideProvider.availableTiers.map((tier) {
            final isSelected = ride.selectedTier.id == tier.id;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              child: LuxuryCard(
                padding: const EdgeInsets.all(14),
                hasGoldBorder: isSelected,
                onTap: () => ride.selectTier(tier),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? ExecutiveColors.gold.withOpacity(0.15)
                            : ExecutiveColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? ExecutiveColors.gold : ExecutiveColors.border,
                        ),
                      ),
                      child: Icon(
                        tier.id == 'SUV_BLINDADA'
                            ? Icons.shield_outlined
                            : (tier.id == 'VIP_GOLD'
                                ? Icons.stars_rounded
                                : Icons.directions_car_filled_rounded),
                        color: isSelected ? ExecutiveColors.gold : ExecutiveColors.textSecondary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                tier.name,
                                style: ExecutiveTypography.bodyLarge.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? ExecutiveColors.gold : Colors.white,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                decoration: BoxDecoration(
                                  color: ExecutiveColors.gold.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  tier.badge,
                                  style: const TextStyle(
                                    fontSize: 8,
                                    fontWeight: FontWeight.bold,
                                    color: ExecutiveColors.gold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          Text(
                            tier.subtitle,
                            style: ExecutiveTypography.bodySmall.copyWith(fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    DualCurrencyDisplay(
                      amountUsd: tier.baseFareUsd,
                      bcvRate: ride.bcvRate,
                      isLarge: false,
                    ),
                  ],
                ),
              ),
            );
          }),

          const SizedBox(height: 16),

          LuxuryButton(
            text: 'Solicitar ${ride.selectedTier.name}',
            isLoading: ride.isCreatingRide,
            onPressed: () => ride.requestRide(),
            icon: const Icon(Icons.flash_on, color: Color(0xFF090B0E), size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveRideCard(BuildContext context, RideProvider ride) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      decoration: const BoxDecoration(
        color: ExecutiveColors.surfaceGlass,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: ExecutiveColors.borderGold, width: 2.0)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: ExecutiveColors.success,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'CHOFER EN CAMINO',
                    style: ExecutiveTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.bold,
                      color: ExecutiveColors.gold,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
              Text(
                'ETA: 4 MIN',
                style: ExecutiveTypography.h3.copyWith(
                  color: ExecutiveColors.success,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Driver & Vehicle Details
          LuxuryCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 24,
                  backgroundColor: ExecutiveColors.surfaceElevated,
                  child: Icon(Icons.person, color: ExecutiveColors.gold, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ride.activeRide?.driverName ?? 'Carlos Mendoza',
                        style: ExecutiveTypography.bodyLarge.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        ride.activeRide?.vehicleModel ?? 'Mercedes-Benz E-Class 2024',
                        style: ExecutiveTypography.bodySmall.copyWith(
                          color: ExecutiveColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: ExecutiveColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: ExecutiveColors.borderGold),
                  ),
                  child: Text(
                    ride.activeRide?.vehiclePlate ?? 'RF-8825',
                    style: const TextStyle(
                      fontFamily: 'Outfit',
                      fontWeight: FontWeight.w900,
                      color: ExecutiveColors.gold,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: LuxuryButton(
                  text: 'Llamar Chofer',
                  variant: LuxuryButtonVariant.dark,
                  icon: const Icon(Icons.phone, color: Colors.white, size: 18),
                  onPressed: () {},
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: LuxuryButton(
                  text: 'Cancelar',
                  variant: LuxuryButtonVariant.danger,
                  onPressed: () => ride.cancelActiveRide(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
