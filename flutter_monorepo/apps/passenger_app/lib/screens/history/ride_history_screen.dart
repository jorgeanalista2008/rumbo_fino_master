import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:core_ui/core_ui.dart';
import '../../core/network/api_client.dart';
import '../../models/ride_model.dart';

class RideHistoryScreen extends StatefulWidget {
  const RideHistoryScreen({super.key});

  @override
  State<RideHistoryScreen> createState() => _RideHistoryScreenState();
}

class _RideHistoryScreenState extends State<RideHistoryScreen> {
  final ApiClient _api = ApiClient();
  bool _isLoading = true;
  List<RideModel> _rides = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _api.dio.get('/rides/passenger/history');
      final data = response.data['data'] ?? response.data;
      if (data is List) {
        _rides = data.map((json) => RideModel.fromJson(json)).toList();
      }
    } catch (e) {
      _error = 'No se pudo cargar el historial de viajes.';
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ExecutiveColors.background,
      appBar: AppBar(
        title: const Text('Mis Viajes Ejecutivos'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: ExecutiveColors.gold),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: ExecutiveColors.gold),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, color: ExecutiveColors.error, size: 48),
            const SizedBox(height: 12),
            Text(_error!, style: ExecutiveTypography.bodyMedium),
            const SizedBox(height: 16),
            LuxuryButton(
              text: 'Reintentar',
              onPressed: _loadHistory,
              width: 160,
            ),
          ],
        ),
      );
    }

    if (_rides.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: const BoxDecoration(
                color: ExecutiveColors.surfaceElevated,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.directions_car_outlined, color: ExecutiveColors.gold, size: 40),
            ),
            const SizedBox(height: 16),
            Text(
              'Aún no tienes viajes registrados',
              style: ExecutiveTypography.h3,
            ),
            const SizedBox(height: 8),
            Text(
              'Tus traslados ejecutivos completados aparecerán aquí.',
              style: ExecutiveTypography.bodySmall,
            ),
          ],
        ),
      );
    }

    final currencyFormat = NumberFormat('#,##0.00', 'es_VE');

    return RefreshIndicator(
      color: ExecutiveColors.gold,
      backgroundColor: ExecutiveColors.surface,
      onRefresh: _loadHistory,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        itemCount: _rides.length,
        separatorBuilder: (_, __) => const SizedBox(height: 14),
        itemBuilder: (context, index) {
          final ride = _rides[index];
          final dateStr = DateFormat('dd/MM/yyyy • hh:mm a').format(ride.createdAt);
          final isCompleted = ride.status == 'FINALIZADO';
          final isCancelled = ride.status == 'CANCELADO';

          return LuxuryCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Date & Status Badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      dateStr,
                      style: ExecutiveTypography.bodySmall.copyWith(
                        color: ExecutiveColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? ExecutiveColors.success.withOpacity(0.15)
                            : (isCancelled
                                ? ExecutiveColors.error.withOpacity(0.15)
                                : ExecutiveColors.gold.withOpacity(0.15)),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: isCompleted
                              ? ExecutiveColors.success
                              : (isCancelled ? ExecutiveColors.error : ExecutiveColors.gold),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        ride.status,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isCompleted
                              ? ExecutiveColors.success
                              : (isCancelled ? ExecutiveColors.error : ExecutiveColors.gold),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Origin & Destination
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      children: [
                        const Icon(Icons.radio_button_checked, color: ExecutiveColors.gold, size: 16),
                        Container(width: 1.5, height: 26, color: ExecutiveColors.borderLight),
                        const Icon(Icons.location_on, color: ExecutiveColors.success, size: 16),
                      ],
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ride.originAddress,
                            style: ExecutiveTypography.bodySmall.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 18),
                          Text(
                            ride.destinationAddress,
                            style: ExecutiveTypography.bodySmall.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const Divider(color: ExecutiveColors.borderLight, height: 24),

                // Vehicle, Driver & Total Fare
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ride.driverName ?? 'Chofer Ejecutivo',
                          style: ExecutiveTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          ride.fullVehicleDescription,
                          style: ExecutiveTypography.bodySmall.copyWith(
                            color: ExecutiveColors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '\$${ride.displayFareUsd.toStringAsFixed(2)}',
                          style: ExecutiveTypography.h3.copyWith(
                            color: ExecutiveColors.gold,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          'Bs. ${currencyFormat.format(ride.displayFareVes)}',
                          style: ExecutiveTypography.bodySmall.copyWith(
                            color: ExecutiveColors.textMuted,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
