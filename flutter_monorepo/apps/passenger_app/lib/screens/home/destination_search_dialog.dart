import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:core_ui/core_ui.dart';

class DestinationPreset {
  final String title;
  final String address;
  final LatLng location;
  final IconData icon;

  const DestinationPreset({
    required this.title,
    required this.address,
    required this.location,
    required this.icon,
  });
}

class DestinationSearchDialog extends StatefulWidget {
  final LatLng userLocation;

  const DestinationSearchDialog({
    super.key,
    required this.userLocation,
  });

  @override
  State<DestinationSearchDialog> createState() => _DestinationSearchDialogState();
}

class _DestinationSearchDialogState extends State<DestinationSearchDialog> {
  final TextEditingController _searchController = TextEditingController();

  static const List<DestinationPreset> popularDestinations = [
    DestinationPreset(
      title: 'Aeropuerto Internacional Simón Bolívar (CCS)',
      address: 'Maiquetía, La Guaira (Terminal Nacional e Internacional)',
      location: LatLng(10.6030, -66.9906),
      icon: Icons.flight_takeoff_rounded,
    ),
    DestinationPreset(
      title: 'Hotel Eurobuilding & Suites Caracas',
      address: 'Calle La Guairita, Chuao, Caracas',
      location: LatLng(10.4740, -66.8520),
      icon: Icons.hotel_rounded,
    ),
    DestinationPreset(
      title: 'Centro Financiero Las Mercedes',
      address: 'Av. Principal de Las Mercedes, Caracas',
      location: LatLng(10.4810, -66.8625),
      icon: Icons.business_center_rounded,
    ),
    DestinationPreset(
      title: 'Hotel Tamanaco Intercontinental',
      address: 'Av. Principal de Las Mercedes, Caracas',
      location: LatLng(10.4785, -66.8565),
      icon: Icons.apartment_rounded,
    ),
    DestinationPreset(
      title: 'Torre Altamira Business Hub',
      address: 'Plaza Francia, Altamira Sur, Chacao',
      location: LatLng(10.4960, -66.8530),
      icon: Icons.location_city_rounded,
    ),
    DestinationPreset(
      title: 'Centro San Ignacio',
      address: 'Av. Blandín, La Castellana, Chacao',
      location: LatLng(10.4990, -66.8570),
      icon: Icons.shopping_bag_rounded,
    ),
    DestinationPreset(
      title: 'Clínica El Ávila',
      address: '6ta Transversal con Av. San Juan Bosco, Altamira',
      location: LatLng(10.5040, -66.8510),
      icon: Icons.local_hospital_rounded,
    ),
    DestinationPreset(
      title: 'Aeropuerto Caracas Oscar Machado Zuloaga',
      address: 'Charallave, Estado Miranda (Aviación Privada)',
      location: LatLng(10.2870, -66.8120),
      icon: Icons.airplanemode_active_rounded,
    ),
  ];

  List<DestinationPreset> _filteredList = popularDestinations;

  void _onSearchChanged(String query) {
    setState(() {
      if (query.trim().isEmpty) {
        _filteredList = popularDestinations;
      } else {
        final q = query.toLowerCase();
        _filteredList = popularDestinations.where((d) {
          return d.title.toLowerCase().contains(q) || d.address.toLowerCase().contains(q);
        }).toList();
      }
    });
  }

  void _selectCustomAddress(String text) {
    if (text.trim().isEmpty) return;
    // Offset slightly from user location for demo/instant navigation
    final customLoc = LatLng(
      widget.userLocation.latitude + 0.015,
      widget.userLocation.longitude + 0.012,
    );
    Navigator.of(context).pop({
      'address': text.trim(),
      'location': customLoc,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: ExecutiveColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: ExecutiveColors.borderGold, width: 1.5)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          // Handle pill
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: ExecutiveColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    '¿A dónde te trasladamos?',
                    style: ExecutiveTypography.h2.copyWith(fontSize: 20),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: ExecutiveColors.textMuted),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Search Field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              decoration: BoxDecoration(
                color: ExecutiveColors.surfaceElevated,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: ExecutiveColors.borderLight),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                onSubmitted: _selectCustomAddress,
                style: const TextStyle(color: Colors.white, fontSize: 15),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search, color: ExecutiveColors.gold, size: 22),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: ExecutiveColors.textMuted, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                  hintText: 'Buscar hotel, aeropuerto, oficina o dirección...',
                  hintStyle: const TextStyle(color: ExecutiveColors.textMuted, fontSize: 14),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Custom written query quick selector
          if (_searchController.text.trim().isNotEmpty && _filteredList.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: LuxuryCard(
                hasGoldBorder: true,
                onTap: () => _selectCustomAddress(_searchController.text),
                child: Row(
                  children: [
                    const Icon(Icons.pin_drop_rounded, color: ExecutiveColors.gold, size: 24),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _searchController.text.trim(),
                            style: ExecutiveTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'Usar esta dirección en el mapa',
                            style: ExecutiveTypography.bodySmall.copyWith(color: ExecutiveColors.gold),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, color: ExecutiveColors.gold, size: 16),
                  ],
                ),
              ),
            ),

          // Destinations List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              itemCount: _filteredList.length,
              separatorBuilder: (_, __) => const Divider(color: ExecutiveColors.borderLight, height: 1),
              itemBuilder: (context, index) {
                final dest = _filteredList[index];
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                  leading: Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: ExecutiveColors.surfaceElevated,
                      shape: BoxShape.circle,
                      border: Border.all(color: ExecutiveColors.borderLight),
                    ),
                    child: Icon(dest.icon, color: ExecutiveColors.gold, size: 20),
                  ),
                  title: Text(
                    dest.title,
                    style: ExecutiveTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  subtitle: Text(
                    dest.address,
                    style: ExecutiveTypography.bodySmall.copyWith(
                      color: ExecutiveColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: const Icon(
                    Icons.north_west_rounded,
                    color: ExecutiveColors.textMuted,
                    size: 16,
                  ),
                  onTap: () {
                    Navigator.of(context).pop({
                      'address': '${dest.title}, ${dest.address}',
                      'location': dest.location,
                    });
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
