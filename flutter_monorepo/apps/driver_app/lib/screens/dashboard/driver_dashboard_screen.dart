import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:core_ui/core_ui.dart';
import '../../core/providers/driver_auth_provider.dart';
import '../../core/providers/driver_shift_provider.dart';
import '../../models/driver_ride_model.dart';
import '../profile/driver_profile_screen.dart';
import 'widgets/incoming_ride_radar_dialog.dart';
import 'widgets/active_ride_card.dart';
import 'widgets/start_shift_modal.dart';
import 'widgets/end_shift_modal.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<DriverAuthProvider>().refreshProfile();
      if (!mounted) return;
      final auth = context.read<DriverAuthProvider>();
      final shift = context.read<DriverShiftProvider>();
      if (auth.profile != null) {
        shift.syncStateFromProfile(auth.profile!);
      }
      await shift.fetchBcvRate();
    });
  }

  void _recenterMap(LatLng target) {
    _mapController.move(target, 15.0);
  }

  void _openStartShiftModal() {
    final auth = context.read<DriverAuthProvider>();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StartShiftModal(defaultVehicle: auth.profile?.vehicle),
    );
  }

  void _openEndShiftModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const EndShiftModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<DriverAuthProvider>();
    final shift = context.watch<DriverShiftProvider>();
    final driverProfile = auth.profile;
    final driverName = driverProfile?.user.fullName ?? 'Chofer VIP';

    if (driverProfile != null && driverProfile.id.isNotEmpty) {
      shift.setDriverId(driverProfile.id);
    }

    return Scaffold(
      backgroundColor: ExecutiveColors.background,
      body: Stack(
        children: [
          // 1. Full Screen Dark Matter Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: shift.currentLocation,
              initialZoom: 14.5,
              minZoom: 4.0,
              maxZoom: 18.0,
            ),
            children: [
              // OpenStreetMap High-Definition Tiles (No Watermark)
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.rumbofino.driver_app',
                maxZoom: 19,
              ),

              // Route Polyline if Active Ride
              if (shift.activeRide != null)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: [
                        LatLng(shift.activeRide!.pickupLat, shift.activeRide!.pickupLng),
                        LatLng(shift.activeRide!.dropoffLat, shift.activeRide!.dropoffLng),
                      ],
                      strokeWidth: 4.0,
                      color: ExecutiveColors.gold,
                    ),
                  ],
                ),

              // Markers Layer
              MarkerLayer(
                markers: [
                  // Active Driver Position Marker
                  Marker(
                    point: shift.currentLocation,
                    width: 54,
                    height: 54,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: (shift.isOnline ? ExecutiveColors.gold : ExecutiveColors.textSecondary)
                                .withOpacity(0.25),
                          ),
                        ),
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: ExecutiveColors.surface,
                            border: Border.all(
                              color: shift.isOnline ? ExecutiveColors.gold : ExecutiveColors.textSecondary,
                              width: 2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.6),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.navigation_rounded,
                            color: shift.isOnline ? ExecutiveColors.gold : ExecutiveColors.textSecondary,
                            size: 18,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Active Ride Pickup Marker
                  if (shift.activeRide != null)
                    Marker(
                      point: LatLng(shift.activeRide!.pickupLat, shift.activeRide!.pickupLng),
                      width: 40,
                      height: 40,
                      child: const Icon(
                        Icons.trip_origin,
                        color: ExecutiveColors.gold,
                        size: 32,
                      ),
                    ),

                  // Active Ride Dropoff Marker
                  if (shift.activeRide != null)
                    Marker(
                      point: LatLng(shift.activeRide!.dropoffLat, shift.activeRide!.dropoffLng),
                      width: 40,
                      height: 40,
                      child: const Icon(
                        Icons.location_on,
                        color: ExecutiveColors.success,
                        size: 36,
                      ),
                    ),
                ],
              ),
            ],
          ),

          // 2. Top Header Overlay (Status, BCV, Profile)
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Profile Capsule Button
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const DriverProfileScreen()),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: ExecutiveColors.surface.withOpacity(0.92),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: ExecutiveColors.gold.withOpacity(0.5)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.4),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          RfAvatar(
                            name: driverName,
                            imageUrl: driverProfile?.user.avatarUrl,
                            radius: 15,
                            hasGoldBorder: true,
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                driverName,
                                style: ExecutiveTypography.caption.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Row(
                                children: [
                                  const Icon(Icons.star, color: ExecutiveColors.gold, size: 11),
                                  const SizedBox(width: 2),
                                  Text(
                                    '${driverProfile?.rating ?? 4.98}',
                                    style: ExecutiveTypography.caption.copyWith(
                                      color: ExecutiveColors.goldLight,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  // BCV Rate Pill & Shift Badge
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () async {
                          await shift.fetchBcvRate();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Tasa BCV sincronizada en vivo: Bs. ${shift.bcvRate.toStringAsFixed(2)}'),
                                duration: const Duration(seconds: 2),
                                backgroundColor: ExecutiveColors.surfaceElevated,
                              ),
                            );
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: ExecutiveColors.surface.withOpacity(0.92),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: ExecutiveColors.gold.withOpacity(0.4)),
                          ),
                          child: Row(
                            children: [
                              const Text('🇻🇪', style: TextStyle(fontSize: 12)),
                              const SizedBox(width: 4),
                              Text(
                                'BCV: Bs. ${shift.bcvRate.toStringAsFixed(2)}',
                                style: ExecutiveTypography.caption.copyWith(
                                  color: ExecutiveColors.gold,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // 3. Online/Offline & Shift Switch Floating Bar (When not in active ride)
          if (shift.activeRide == null)
            Positioned(
              top: 100,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: ExecutiveColors.surface.withOpacity(0.95),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: shift.isOnline ? ExecutiveColors.success : ExecutiveColors.border,
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 15,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        RfPulseDot(
                          variant: shift.isOnline ? PulseDotVariant.success : PulseDotVariant.warning,
                          size: 12,
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              shift.isOnline ? 'EN LÍNEA • DISPONIBLE' : 'DESCONECTADO',
                              style: ExecutiveTypography.bodyMedium.copyWith(
                                color: shift.isOnline ? ExecutiveColors.success : ExecutiveColors.textSecondary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              shift.isShiftActive ? 'Turno en curso' : 'Sin turno asignado',
                              style: ExecutiveTypography.caption.copyWith(
                                color: ExecutiveColors.textTertiary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Switch(
                      value: shift.isOnline,
                      activeColor: ExecutiveColors.gold,
                      activeTrackColor: ExecutiveColors.gold.withOpacity(0.4),
                      inactiveThumbColor: ExecutiveColors.textSecondary,
                      inactiveTrackColor: ExecutiveColors.border,
                      onChanged: (val) {
                        if (val && !shift.isShiftActive) {
                          _openStartShiftModal();
                        } else if (!val && shift.isShiftActive) {
                          _openEndShiftModal();
                        } else {
                          shift.toggleOnlineStatus(val);
                        }
                      },
                    ),
                  ],
                ),
              ),
            ),

          // 4. Floating Action Controls (GPS Recenter + Demo Simulator)
          Positioned(
            right: 16,
            bottom: shift.activeRide != null ? 240 : 110,
            child: Column(
              children: [
                // Simulate Ride Button (for testing)
                FloatingActionButton.small(
                  heroTag: 'simulate_ride_btn',
                  backgroundColor: ExecutiveColors.surface,
                  foregroundColor: ExecutiveColors.gold,
                  onPressed: () => shift.simulateIncomingRide(),
                  child: const Icon(Icons.flash_on_rounded, size: 20),
                ),
                const SizedBox(height: 10),
                // Recenter GPS Button
                FloatingActionButton.small(
                  heroTag: 'recenter_gps_btn',
                  backgroundColor: ExecutiveColors.surface,
                  foregroundColor: ExecutiveColors.gold,
                  onPressed: () => _recenterMap(shift.currentLocation),
                  child: const Icon(Icons.my_location, size: 20),
                ),
              ],
            ),
          ),

          // 5. Active Ride Bottom Panel
          if (shift.activeRide != null)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: ActiveRideCard(
                ride: shift.activeRide!,
                onStatusChange: (nextStatus) {
                  shift.transitionRideStatus(
                    nextStatus,
                    driverId: driverProfile?.id,
                  );
                },
                onCancel: () {
                  shift.transitionRideStatus(
                    DriverRideStatus.CANCELADO,
                    driverId: driverProfile?.id,
                  );
                },
              ),
            ),

          // 6. Bottom Shift Bar (When Offline or No Active Ride)
          if (shift.activeRide == null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 24,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: ExecutiveColors.surface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: ExecutiveColors.border),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.6),
                      blurRadius: 20,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'PROGRESO HOY',
                            style: ExecutiveTypography.caption.copyWith(
                              color: ExecutiveColors.textTertiary,
                              letterSpacing: 1.0,
                            ),
                          ),
                          Row(
                            children: [
                              Text(
                                '${shift.completedTripsToday} viajes',
                                style: ExecutiveTypography.bodyMedium.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '•  \$${shift.earningsUsdToday.toStringAsFixed(2)}',
                                style: ExecutiveTypography.bodyMedium.copyWith(
                                  color: ExecutiveColors.success,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: shift.isShiftActive
                            ? ExecutiveColors.surfaceElevated
                            : ExecutiveColors.gold,
                        foregroundColor: shift.isShiftActive
                            ? ExecutiveColors.gold
                            : ExecutiveColors.background,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      onPressed: shift.isShiftActive
                          ? _openEndShiftModal
                          : _openStartShiftModal,
                      child: Text(
                        shift.isShiftActive ? 'CERRAR TURNO' : 'INICIAR TURNO',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // 7. Incoming Ride Radar Dialog Overlay
          if (shift.incomingRide != null)
            IncomingRideRadarDialog(
              ride: shift.incomingRide!,
              countdown: shift.radarCountdown,
              onAccept: () {
                shift.acceptIncomingRide(driverProfile?.id ?? 'driver_demo');
              },
              onReject: () {
                shift.rejectIncomingRide();
              },
            ),
        ],
      ),
    );
  }
}
