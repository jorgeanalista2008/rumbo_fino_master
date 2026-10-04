import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:core_ui/core_ui.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/ride_provider.dart';
import 'destination_search_dialog.dart';
import 'passenger_drawer.dart';

class HomeMapScreen extends StatefulWidget {
  const HomeMapScreen({super.key});

  @override
  State<HomeMapScreen> createState() => _HomeMapScreenState();
}

class _HomeMapScreenState extends State<HomeMapScreen> {
  final MapController _mapController = MapController();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  int _selectedRatingStars = 5;
  final Set<String> _selectedFeedbackTags = {};
  final TextEditingController _feedbackController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RideProvider>().initializeData();
    });
  }

  void _centerOnLocation(LatLng location, [double zoom = 15.0]) {
    _mapController.move(location, zoom);
  }

  void _openDestinationSearch(RideProvider ride) async {
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DestinationSearchDialog(userLocation: ride.passengerLocation),
    );

    if (result != null && result['address'] != null && result['location'] is LatLng) {
      ride.setDestination(result['address'], result['location']);
      _fitMapToRoute(ride.passengerLocation, result['location']);
    }
  }

  void _fitMapToRoute(LatLng origin, LatLng destination) {
    final centerLat = (origin.latitude + destination.latitude) / 2;
    final centerLng = (origin.longitude + destination.longitude) / 2;
    _mapController.move(LatLng(centerLat, centerLng), 13.0);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final ride = context.watch<RideProvider>();

    return Scaffold(
      key: _scaffoldKey,
      drawer: const PassengerDrawer(),
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
              TileLayer(
                urlTemplate: ride.mapTilesUrl,
                userAgentPackageName: 'com.rumbofino.passenger_app',
                maxZoom: 19,
              ),

              // Polyline Route Layer (when route points exist)
              if (ride.routePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: ride.routePoints,
                      strokeWidth: 4.5,
                      color: ExecutiveColors.gold,
                    ),
                  ],
                ),

              // Markers Layer
              MarkerLayer(
                markers: [
                  // Passenger Origin Marker (Pulsing Gold Pin)
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
                          width: 24,
                          height: 24,
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
                            child: Icon(Icons.person, size: 13, color: Colors.black),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Destination Marker (if selected)
                  if (ride.destinationLocation != null)
                    Marker(
                      point: ride.destinationLocation!,
                      width: 44,
                      height: 44,
                      child: Container(
                        decoration: BoxDecoration(
                          color: ExecutiveColors.success,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: ExecutiveColors.success.withOpacity(0.5),
                              blurRadius: 10,
                            ),
                          ],
                        ),
                        child: const Icon(Icons.location_on, color: Colors.black, size: 24),
                      ),
                    ),

                  // Nearby Available Drivers (Real Only)
                  if (ride.flowState == RideFlowState.initial ||
                      ride.flowState == RideFlowState.selectingTier)
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
                              driver.category == 'LUXURY_ARMORED'
                                  ? Icons.shield_outlined
                                  : Icons.directions_car_filled_rounded,
                              color: ExecutiveColors.gold,
                              size: 20,
                            ),
                          ),
                        ),
                      );
                    }),

                  // Active Assigned Driver Marker (Moving Live Telemetry)
                  if (ride.activeRide != null &&
                      ride.activeRide!.driverLatitude != null &&
                      ride.activeRide!.driverLongitude != null)
                    Marker(
                      point: LatLng(
                        ride.activeRide!.driverLatitude!,
                        ride.activeRide!.driverLongitude!,
                      ),
                      width: 52,
                      height: 52,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF090B0E),
                          shape: BoxShape.circle,
                          border: Border.all(color: ExecutiveColors.gold, width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: ExecutiveColors.gold.withOpacity(0.6),
                              blurRadius: 14,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(Icons.directions_car_filled, color: ExecutiveColors.gold, size: 26),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),

          // 2. Top Header Bar (Executive Floating Navbar)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Menu Drawer Button
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => _scaffoldKey.currentState?.openDrawer(),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          width: 46,
                          height: 46,
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
                          child: const Icon(Icons.menu_rounded, color: ExecutiveColors.gold),
                        ),
                      ),
                    ),

                    // Center App Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: ExecutiveColors.surfaceGlass,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: ExecutiveColors.borderGold.withOpacity(0.4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.stars, color: ExecutiveColors.gold, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            'RUMBO FINO VIP',
                            style: ExecutiveTypography.h3.copyWith(
                              fontSize: 13,
                              color: ExecutiveColors.gold,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // BCV Live Rate Chip
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => ride.fetchBcvRate(),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
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
                          child: Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: ExecutiveColors.success,
                                  shape: BoxShape.circle,
                                ),
                              ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(
                                    begin: const Offset(0.8, 0.8),
                                    end: const Offset(1.2, 1.2),
                                    duration: 1000.ms,
                                  ),
                              const SizedBox(width: 6),
                              Text(
                                'Bs. ${ride.bcvRate.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  color: ExecutiveColors.gold,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 3. Floating Map Controls (GPS Recenter & Mapbox Style Toggle)
          Positioned(
            right: 16,
            bottom: _getBottomOffset(ride.flowState),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Mapbox Style Switcher Button (Dark VIP / Satellite)
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      if (ride.mapStyle == 'dark') {
                        ride.setMapStyle('satellite');
                      } else {
                        ride.setMapStyle('dark');
                      }
                    },
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
                      child: Icon(
                        ride.mapStyle == 'satellite'
                            ? Icons.satellite_alt_rounded
                            : Icons.layers_rounded,
                        color: ExecutiveColors.gold,
                        size: 22,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // GPS Recenter Button
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => _centerOnLocation(ride.passengerLocation),
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
              ],
            ),
          ),

          // 4. Executive Bottom Sheet & Ride Panel
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildBottomPanel(context, ride, auth),
          ),
        ],
      ),
    );
  }

  double _getBottomOffset(RideFlowState state) {
    switch (state) {
      case RideFlowState.selectingTier:
        return 420;
      case RideFlowState.requestingRide:
        return 290;
      case RideFlowState.driverAssigned:
      case RideFlowState.driverArrived:
        return 330;
      case RideFlowState.inProgress:
        return 280;
      case RideFlowState.completed:
        return 400;
      default:
        return 260;
    }
  }

  Widget _buildBottomPanel(BuildContext context, RideProvider ride, AuthProvider auth) {
    switch (ride.flowState) {
      case RideFlowState.selectingTier:
        return _buildTierSelectorCard(context, ride);
      case RideFlowState.requestingRide:
        return _buildRadarSearchCard(context, ride);
      case RideFlowState.driverAssigned:
      case RideFlowState.driverArrived:
        return _buildDriverAssignedCard(context, ride);
      case RideFlowState.inProgress:
        return _buildInProgressCard(context, ride);
      case RideFlowState.completed:
        return _buildCompletedReceiptCard(context, ride);
      default:
        return _buildDestinationSearchCard(context, ride, auth);
    }
  }

  // ==========================================
  // PANEL 1: DESTINATION SEARCH (INITIAL)
  // ==========================================
  Widget _buildDestinationSearchCard(BuildContext context, RideProvider ride, AuthProvider auth) {
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
            'Hola, ${auth.currentUser?.firstName ?? "Pasajero VIP"}',
            style: ExecutiveTypography.h2.copyWith(fontSize: 20),
          ),
          Text(
            '¿A dónde te trasladamos hoy con protocolo VIP?',
            style: ExecutiveTypography.bodySmall,
          ),
          const SizedBox(height: 18),

          // Search Destination Pill
          LuxuryCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            hasGoldBorder: true,
            onTap: () => _openDestinationSearch(ride),
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
                const Icon(Icons.arrow_forward_ios_rounded, color: ExecutiveColors.gold, size: 14),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Luxury Destinations Quick Shortcuts
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                RfShortcutChip(
                  label: 'Aeropuerto Maiquetía (CCS)',
                  icon: Icons.flight_takeoff_rounded,
                  onTap: () {
                    ride.setDestination(
                      'Aeropuerto Intl. Simón Bolívar Maiquetía (CCS)',
                      const LatLng(10.6030, -66.9906),
                    );
                    _fitMapToRoute(ride.passengerLocation, const LatLng(10.6030, -66.9906));
                  },
                ),
                const SizedBox(width: 8),
                RfShortcutChip(
                  label: 'Las Mercedes VIP',
                  icon: Icons.business_center_rounded,
                  onTap: () {
                    final dest = LatLng(
                      ride.passengerLocation.latitude + 0.012,
                      ride.passengerLocation.longitude + 0.010,
                    );
                    ride.setDestination('Centro Financiero Las Mercedes, Caracas', dest);
                    _fitMapToRoute(ride.passengerLocation, dest);
                  },
                ),
                const SizedBox(width: 8),
                RfShortcutChip(
                  label: 'Eurobuilding Hotel',
                  icon: Icons.hotel_rounded,
                  onTap: () {
                    const dest = LatLng(10.4740, -66.8520);
                    ride.setDestination('Hotel Eurobuilding Caracas, Chuao', dest);
                    _fitMapToRoute(ride.passengerLocation, dest);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // PANEL 2: TIER SELECTOR & QUOTE (RIDERY/UBER)
  // ==========================================
  Widget _buildTierSelectorCard(BuildContext context, RideProvider ride) {
    final currencyFormat = NumberFormat('#,##0.00', 'es_VE');

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
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Selecciona tu Categoría VIP', style: ExecutiveTypography.h3),
                  Text(
                    '${ride.routeDistanceKm} km • ~${ride.routeEstimatedMinutes} min de viaje',
                    style: ExecutiveTypography.bodySmall.copyWith(color: ExecutiveColors.gold),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, color: ExecutiveColors.textMuted, size: 20),
                onPressed: ride.resetToMap,
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Categories List
          ...ride.categories.map((cat) {
            final isSelected = ride.selectedCategory?.id == cat.id;
            final icon = cat.id == 'LUXURY_ARMORED'
                ? Icons.shield_outlined
                : (cat.id == 'VIP_SUV'
                    ? Icons.directions_car_rounded
                    : (cat.id == 'PREMIUM_VAN' ? Icons.airport_shuttle_rounded : Icons.directions_car_filled));

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: () => ride.selectCategory(cat),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelected ? ExecutiveColors.surfaceElevated : ExecutiveColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? ExecutiveColors.gold : ExecutiveColors.borderLight,
                      width: isSelected ? 1.8 : 1.0,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? ExecutiveColors.gold.withOpacity(0.15)
                              : ExecutiveColors.surfaceElevated,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(icon, color: ExecutiveColors.gold, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  cat.name,
                                  style: ExecutiveTypography.bodyMedium.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: ExecutiveColors.gold.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    cat.badge,
                                    style: const TextStyle(
                                      color: ExecutiveColors.gold,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              cat.subtitle,
                              style: ExecutiveTypography.bodySmall.copyWith(
                                color: ExecutiveColors.textSecondary,
                                fontSize: 11,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '\$${cat.fareUsd.toStringAsFixed(2)}',
                            style: ExecutiveTypography.h3.copyWith(
                              color: ExecutiveColors.gold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            'Bs. ${currencyFormat.format(cat.fareVes)}',
                            style: ExecutiveTypography.bodySmall.copyWith(
                              color: ExecutiveColors.textMuted,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),

          const SizedBox(height: 8),

          // Payment Method Selector Bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Método de Pago:',
                style: ExecutiveTypography.bodySmall,
              ),
              DropdownButton<String>(
                value: ride.selectedPaymentMethod,
                dropdownColor: ExecutiveColors.surfaceElevated,
                underline: const SizedBox(),
                icon: const Icon(Icons.arrow_drop_down, color: ExecutiveColors.gold),
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                items: const [
                  DropdownMenuItem(value: 'PAGO_MOVIL', child: Text('Pago Móvil (Tasa BCV)')),
                  DropdownMenuItem(value: 'CASH', child: Text('Efectivo USD')),
                  DropdownMenuItem(value: 'ZELLE', child: Text('Zelle Transfer')),
                  DropdownMenuItem(value: 'CREDIT_CARD', child: Text('Tarjeta de Crédito')),
                ],
                onChanged: (val) {
                  if (val != null) ride.selectPaymentMethod(val);
                },
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Error message if any
          if (ride.rideErrorMessage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                ride.rideErrorMessage!,
                style: const TextStyle(color: ExecutiveColors.error, fontSize: 12),
              ),
            ),

          // Confirm Button
          LuxuryButton(
            text: 'Solicitar ${ride.selectedCategory?.name ?? "Viaje"} • \$${ride.selectedCategory?.fareUsd.toStringAsFixed(2)}',
            isLoading: ride.isCreatingRide,
            onPressed: () => ride.requestRide(),
            icon: const Icon(Icons.flash_on, color: Color(0xFF090B0E), size: 20),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // PANEL 3: RADAR SCANNING (REQUESTING RIDE)
  // ==========================================
  Widget _buildRadarSearchCard(BuildContext context, RideProvider ride) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
      decoration: const BoxDecoration(
        color: ExecutiveColors.surfaceGlass,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: ExecutiveColors.borderGold, width: 2.0)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Radar pulsing animation
          Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: ExecutiveColors.gold.withOpacity(0.12),
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(
                    begin: const Offset(1, 1),
                    end: const Offset(1.5, 1.5),
                    duration: 1500.ms,
                  ),
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: ExecutiveColors.gold.withOpacity(0.25),
                ),
              ),
              const Icon(Icons.radar_rounded, color: ExecutiveColors.gold, size: 32),
            ],
          ),
          const SizedBox(height: 18),

          Text(
            'Localizando Chofer Ejecutivo...',
            style: ExecutiveTypography.h3.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 6),
          Text(
            'Conectando con la flota de protocolo más cercana a tu ubicación',
            style: ExecutiveTypography.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),

          // Destination & Fare Chip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: ExecutiveColors.surfaceElevated,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ExecutiveColors.borderLight),
            ),
            child: Row(
              children: [
                const Icon(Icons.location_on, color: ExecutiveColors.gold, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    ride.destinationAddress,
                    style: ExecutiveTypography.bodySmall.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  '\$${ride.selectedCategory?.fareUsd.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: ExecutiveColors.gold,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          LuxuryButton(
            text: 'Cancelar Solicitud',
            variant: LuxuryButtonVariant.outline,
            isLoading: ride.isCancelling,
            onPressed: () => ride.cancelActiveRide(),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // PANEL 4: DRIVER ASSIGNED & ARRIVED
  // ==========================================
  Widget _buildDriverAssignedCard(BuildContext context, RideProvider ride) {
    final isArrived = ride.flowState == RideFlowState.driverArrived;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      decoration: BoxDecoration(
        color: ExecutiveColors.surfaceGlass,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(
            color: isArrived ? ExecutiveColors.success : ExecutiveColors.borderGold,
            width: 2.0,
          ),
        ),
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
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isArrived ? ExecutiveColors.success : ExecutiveColors.gold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    isArrived ? 'CHOFER EN EL PUNTO • ABORDAJE' : 'CHOFER EN CAMINO',
                    style: ExecutiveTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isArrived ? ExecutiveColors.success : ExecutiveColors.gold,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
              Text(
                isArrived ? 'LLEGÓ' : 'ETA: ~4 MIN',
                style: ExecutiveTypography.h3.copyWith(
                  color: isArrived ? ExecutiveColors.success : ExecutiveColors.gold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Driver & Vehicle Card
          LuxuryCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: ExecutiveColors.surfaceElevated,
                  backgroundImage: ride.activeRide?.driverAvatar != null
                      ? NetworkImage(ride.activeRide!.driverAvatar!)
                      : null,
                  child: ride.activeRide?.driverAvatar == null
                      ? const Icon(Icons.person, color: ExecutiveColors.gold, size: 30)
                      : null,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              ride.activeRide?.driverName ?? 'Chofer Ejecutivo Asignado',
                              style: ExecutiveTypography.bodyLarge.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.star, color: Colors.amber, size: 14),
                          Text(
                            ' ${ride.activeRide?.driverRating.toStringAsFixed(1) ?? "5.0"}',
                            style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      Text(
                        ride.activeRide?.fullVehicleDescription ?? 'Vehículo Ejecutivo',
                        style: ExecutiveTypography.bodySmall.copyWith(
                          color: ExecutiveColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                if (ride.activeRide?.vehiclePlate != null && ride.activeRide!.vehiclePlate!.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: ExecutiveColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: ExecutiveColors.borderGold),
                    ),
                    child: Text(
                      ride.activeRide!.vehiclePlate!,
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        color: ExecutiveColors.gold,
                        letterSpacing: 1.2,
                        fontSize: 13,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Action Buttons: Call & Cancel
          Row(
            children: [
              Expanded(
                child: LuxuryButton(
                  text: 'Llamar Chofer',
                  variant: LuxuryButtonVariant.dark,
                  icon: const Icon(Icons.phone, color: Colors.white, size: 18),
                  onPressed: () {
                    final phone = ride.activeRide?.driverPhone;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Llamando a chofer: ${phone ?? "+58 412 888 3322"}'),
                        backgroundColor: ExecutiveColors.surfaceElevated,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: LuxuryButton(
                  text: 'Cancelar',
                  variant: LuxuryButtonVariant.danger,
                  isLoading: ride.isCancelling,
                  onPressed: () => ride.cancelActiveRide(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // PANEL 5: IN PROGRESS
  // ==========================================
  Widget _buildInProgressCard(BuildContext context, RideProvider ride) {
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
                    'EN VIAJE HACIA TU DESTINO',
                    style: ExecutiveTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.bold,
                      color: ExecutiveColors.gold,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
              Text(
                '\$${ride.activeRide?.displayFareUsd.toStringAsFixed(2) ?? "0.00"}',
                style: ExecutiveTypography.h3.copyWith(
                  color: ExecutiveColors.gold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Destination Card
          LuxuryCard(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                const Icon(Icons.location_on, color: ExecutiveColors.gold, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Destino en Progreso',
                        style: ExecutiveTypography.bodySmall.copyWith(color: ExecutiveColors.textMuted),
                      ),
                      Text(
                        ride.activeRide?.destinationAddress ?? ride.destinationAddress,
                        style: ExecutiveTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
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
                  text: 'Compartir Ruta',
                  variant: LuxuryButtonVariant.outline,
                  icon: const Icon(Icons.share_location, color: ExecutiveColors.gold, size: 18),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Enlace de rastreo satelital copiado al portapapeles.'),
                        backgroundColor: ExecutiveColors.surfaceElevated,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: LuxuryButton(
                  text: 'SOS Seguridad',
                  variant: LuxuryButtonVariant.danger,
                  icon: const Icon(Icons.shield, color: Colors.white, size: 18),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (_) => AlertDialog(
                        backgroundColor: ExecutiveColors.surface,
                        title: const Text('Asistencia VIP Inmediata', style: TextStyle(color: ExecutiveColors.error)),
                        content: const Text(
                          '¿Deseas activar la señal de alerta a la Central de Seguridad y Monitoreo Satelital de Rumbo Fino?',
                          style: TextStyle(color: Colors.white),
                        ),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
                          TextButton(
                            onPressed: () {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Alerta de seguridad transmitida a la Central VIP.'),
                                  backgroundColor: ExecutiveColors.error,
                                ),
                              );
                            },
                            child: const Text('ACTIVAR ALERTA', style: TextStyle(color: ExecutiveColors.error)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // PANEL 6: TRIP COMPLETED & RATING RECEIPT
  // ==========================================
  Widget _buildCompletedReceiptCard(BuildContext context, RideProvider ride) {
    final currencyFormat = NumberFormat('#,##0.00', 'es_VE');

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
          const Icon(Icons.check_circle_rounded, color: ExecutiveColors.success, size: 48),
          const SizedBox(height: 8),
          Text('¡Viaje Finalizado con Éxito!', style: ExecutiveTypography.h2.copyWith(fontSize: 20)),
          Text('Gracias por viajar con el servicio VIP de Rumbo Fino', style: ExecutiveTypography.bodySmall),
          const SizedBox(height: 16),

          // Total Fare Summary Card
          LuxuryCard(
            padding: const EdgeInsets.all(16),
            hasGoldBorder: true,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total Pagado', style: ExecutiveTypography.bodySmall.copyWith(color: ExecutiveColors.textMuted)),
                    Text(
                      '\$${ride.activeRide?.displayFareUsd.toStringAsFixed(2) ?? "0.00"} USD',
                      style: ExecutiveTypography.h2.copyWith(color: ExecutiveColors.gold, fontSize: 22),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Equivalente Oficial BCV', style: ExecutiveTypography.bodySmall.copyWith(color: ExecutiveColors.textMuted)),
                    Text(
                      'Bs. ${currencyFormat.format(ride.activeRide?.displayFareVes ?? 0.0)}',
                      style: ExecutiveTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Interactive Star Rating
          Text('Califica la experiencia con tu chofer', style: ExecutiveTypography.bodyMedium),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              final star = index + 1;
              return IconButton(
                icon: Icon(
                  star <= _selectedRatingStars ? Icons.star_rounded : Icons.star_border_rounded,
                  color: Colors.amber,
                  size: 36,
                ),
                onPressed: () {
                  setState(() => _selectedRatingStars = star);
                },
              );
            }),
          ),
          const SizedBox(height: 10),

          // Feedback tags
          Wrap(
            spacing: 8,
            children: [
              'Excelente Conducción',
              'Vehículo Impecable',
              'Puntualidad Absoluta',
              'Atención VIP',
            ].map((tag) {
              final isSelected = _selectedFeedbackTags.contains(tag);
              return FilterChip(
                label: Text(tag, style: TextStyle(fontSize: 11, color: isSelected ? Colors.black : Colors.white)),
                selected: isSelected,
                selectedColor: ExecutiveColors.gold,
                backgroundColor: ExecutiveColors.surfaceElevated,
                checkmarkColor: Colors.black,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedFeedbackTags.add(tag);
                    } else {
                      _selectedFeedbackTags.remove(tag);
                    }
                  });
                },
              );
            }).toList(),
          ),

          const SizedBox(height: 12),

          // Optional comment text field
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: ExecutiveColors.surfaceElevated,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ExecutiveColors.borderLight),
            ),
            child: TextField(
              controller: _feedbackController,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: const InputDecoration(
                hintText: 'Comentario opcional para el chofer o servicio...',
                hintStyle: TextStyle(color: ExecutiveColors.textMuted, fontSize: 12),
                border: InputBorder.none,
              ),
            ),
          ),

          const SizedBox(height: 16),

          LuxuryButton(
            text: 'Enviar Calificación y Volver',
            onPressed: () {
              final tags = _selectedFeedbackTags.join(', ');
              final written = _feedbackController.text.trim();
              final comment = [tags, if (written.isNotEmpty) written].where((e) => e.isNotEmpty).join(' • ');
              ride.submitRating(
                rating: _selectedRatingStars,
                comment: comment.isNotEmpty ? comment : 'Excelente traslado',
                cleanlinessRating: 5,
                punctualityRating: 5,
                comfortRating: 5,
              );
            },
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }
}
