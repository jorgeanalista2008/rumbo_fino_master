import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../network/api_client.dart';
import '../network/socket_service.dart';
import '../../models/telemetry_models.dart';
import '../../models/ride_model.dart';

enum RideFlowState {
  initial,
  selectingDestination,
  selectingTier,
  requestingRide,
  driverAssigned,
  driverArrived,
  inProgress,
  completed,
}

class VehicleTier {
  final String id;
  final String name;
  final String subtitle;
  final double baseFareUsd;
  final String icon;
  final String badge;

  const VehicleTier({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.baseFareUsd,
    required this.icon,
    required this.badge,
  });
}

class RideProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  final SocketService _socket = SocketService();

  RideFlowState _flowState = RideFlowState.initial;
  LatLng _passengerLocation = const LatLng(10.4900, -66.8600); // Caracas default
  bool _isLoadingLocation = false;

  double _bcvRate = 64.85;
  List<DriverLocationModel> _nearbyDrivers = [];
  
  // Destination
  final String _originAddress = 'Ubicación actual';
  String _destinationAddress = '';
  LatLng? _destinationLocation;
  
  // Vehicle Tiers
  static const List<VehicleTier> availableTiers = [
    VehicleTier(
      id: 'SEDAN_EJECUTIVO',
      name: 'Sedán Ejecutivo',
      subtitle: 'Mercedes-Benz Clase E, Audi A6',
      baseFareUsd: 25.0,
      icon: 'sedan',
      badge: 'PREMIUM',
    ),
    VehicleTier(
      id: 'SUV_BLINDADA',
      name: 'SUV Blindada',
      subtitle: 'Cadillac Escalade, Blindaje Nivel IV',
      baseFareUsd: 55.0,
      icon: 'suv',
      badge: 'MÁXIMA SEGURIDAD',
    ),
    VehicleTier(
      id: 'VIP_GOLD',
      name: 'VIP Chauffeur Gold',
      subtitle: 'BMW Serie 7, Chofer de Protocolo',
      baseFareUsd: 85.0,
      icon: 'vip',
      badge: 'ULTRA LUXURY',
    ),
  ];

  VehicleTier _selectedTier = availableTiers[0];
  RideModel? _activeRide;
  bool _isCreatingRide = false;
  String? _rideErrorMessage;

  RideFlowState get flowState => _flowState;
  LatLng get passengerLocation => _passengerLocation;
  bool get isLoadingLocation => _isLoadingLocation;
  double get bcvRate => _bcvRate;
  List<DriverLocationModel> get nearbyDrivers => _nearbyDrivers;
  String get originAddress => _originAddress;
  String get destinationAddress => _destinationAddress;
  LatLng? get destinationLocation => _destinationLocation;
  VehicleTier get selectedTier => _selectedTier;
  RideModel? get activeRide => _activeRide;
  bool get isCreatingRide => _isCreatingRide;
  String? get rideErrorMessage => _rideErrorMessage;

  RideProvider() {
    _socket.addLocationListener(_handleRealtimeDriverLocation);
    _socket.addRideStatusListener(_handleRealtimeRideStatus);
  }

  void _handleRealtimeDriverLocation(Map<String, dynamic> data) {
    try {
      final updatedDriver = DriverLocationModel.fromJson(data);
      final index = _nearbyDrivers.indexWhere((d) => d.driverId == updatedDriver.driverId);
      if (index >= 0) {
        _nearbyDrivers[index] = updatedDriver;
      } else {
        _nearbyDrivers.add(updatedDriver);
      }
      notifyListeners();
    } catch (_) {}
  }

  void _handleRealtimeRideStatus(Map<String, dynamic> data) {
    try {
      if (_activeRide != null && data['rideId'] == _activeRide!.id) {
        final newStatus = (data['status'] ?? '').toString().toUpperCase();
        if (newStatus == 'EN_CAMINO') {
          _flowState = RideFlowState.driverAssigned;
        } else if (newStatus == 'LLEGO') {
          _flowState = RideFlowState.driverArrived;
        } else if (newStatus == 'EN_CURSO') {
          _flowState = RideFlowState.inProgress;
        } else if (newStatus == 'FINALIZADO') {
          _flowState = RideFlowState.completed;
        }
        fetchActiveRideStatus(_activeRide!.id);
      }
    } catch (_) {}
  }

  Future<void> initializeData() async {
    await fetchBcvRate();
    await fetchCurrentLocation();
    await fetchNearbyDrivers();
  }

  Future<void> fetchBcvRate() async {
    try {
      final response = await _api.dio.get('/financials/exchange-rates/current');
      if (response.data['success'] == true && response.data['data'] != null) {
        _bcvRate = (response.data['data']['rate'] as num?)?.toDouble() ?? 64.85;
        notifyListeners();
      }
    } catch (_) {
      _bcvRate = 64.85;
    }
  }

  Future<void> fetchCurrentLocation() async {
    _isLoadingLocation = true;
    notifyListeners();

    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 8),
        );
        _passengerLocation = LatLng(position.latitude, position.longitude);
      }
    } catch (_) {
      // Keep Caracas center fallback
      _passengerLocation = const LatLng(10.4900, -66.8600);
    } finally {
      _isLoadingLocation = false;
      notifyListeners();
    }
  }

  Future<void> fetchNearbyDrivers() async {
    try {
      final response = await _api.dio.get('/drivers');
      if (response.data['success'] == true && response.data['data'] != null) {
        final List list = response.data['data'];
        _nearbyDrivers = list
            .map((item) => DriverLocationModel.fromJson(item))
            .where((d) => d.latitude != 0.0)
            .toList();
        notifyListeners();
      }
    } catch (_) {
      // Mocked nearby luxury chauffeurs for Caracas Las Mercedes / Altamira demo
      _nearbyDrivers = [
        DriverLocationModel(
          driverId: 'chofer1',
          name: 'Carlos Mendoza',
          latitude: _passengerLocation.latitude + 0.0035,
          longitude: _passengerLocation.longitude + 0.0025,
          vehicleModel: 'Mercedes-Benz E-Class 2024',
          plate: 'RF-8825',
          category: 'SEDAN_EJECUTIVO',
        ),
        DriverLocationModel(
          driverId: 'chofer2',
          name: 'Roberto Silva',
          latitude: _passengerLocation.latitude - 0.0040,
          longitude: _passengerLocation.longitude - 0.0030,
          vehicleModel: 'Cadillac Escalade Platinum',
          plate: 'RF-0099',
          category: 'SUV_BLINDADA',
        ),
        DriverLocationModel(
          driverId: 'chofer3',
          name: 'Fernando Quintero',
          latitude: _passengerLocation.latitude + 0.0020,
          longitude: _passengerLocation.longitude - 0.0045,
          vehicleModel: 'BMW Serie 7 Individual',
          plate: 'RF-7777',
          category: 'VIP_GOLD',
        ),
      ];
      notifyListeners();
    }
  }

  void setDestination(String address, LatLng location) {
    _destinationAddress = address;
    _destinationLocation = location;
    _flowState = RideFlowState.selectingTier;
    notifyListeners();
  }

  void selectTier(VehicleTier tier) {
    _selectedTier = tier;
    notifyListeners();
  }

  void resetToMap() {
    _flowState = RideFlowState.initial;
    _destinationAddress = '';
    _destinationLocation = null;
    _activeRide = null;
    _rideErrorMessage = null;
    notifyListeners();
  }

  Future<bool> requestRide() async {
    _isCreatingRide = true;
    _rideErrorMessage = null;
    notifyListeners();

    try {
      final payload = {
        'originAddress': _originAddress,
        'originLatitude': _passengerLocation.latitude,
        'originLongitude': _passengerLocation.longitude,
        'destinationAddress': _destinationAddress.isNotEmpty
            ? _destinationAddress
            : 'Hotel Tamanaco Intercontinental',
        'destinationLatitude': _destinationLocation?.latitude ?? (_passengerLocation.latitude + 0.015),
        'destinationLongitude': _destinationLocation?.longitude ?? (_passengerLocation.longitude + 0.015),
        'category': _selectedTier.id,
        'estimatedFareUsd': _selectedTier.baseFareUsd,
      };

      final response = await _api.dio.post('/rides', data: payload);

      if (response.data['success'] == true && response.data['data'] != null) {
        _activeRide = RideModel.fromJson(response.data['data']);
        _flowState = RideFlowState.requestingRide;
        _isCreatingRide = false;
        notifyListeners();
        return true;
      } else {
        _rideErrorMessage = response.data['message'] ?? 'No se pudo generar la solicitud de viaje.';
        _isCreatingRide = false;
        notifyListeners();
        return false;
      }
    } on DioException catch (e) {
      _rideErrorMessage = e.response?.data?['message'] ?? 'Error al conectar con la central de despacho.';
      _isCreatingRide = false;
      notifyListeners();
      return false;
    } catch (e) {
      _rideErrorMessage = 'Error: $e';
      _isCreatingRide = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchActiveRideStatus(String rideId) async {
    try {
      final response = await _api.dio.get('/rides/$rideId');
      if (response.data['success'] == true && response.data['data'] != null) {
        _activeRide = RideModel.fromJson(response.data['data']);
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<bool> cancelActiveRide() async {
    if (_activeRide == null) return false;
    try {
      await _api.dio.post('/rides/${_activeRide!.id}/cancel');
      resetToMap();
      return true;
    } catch (_) {
      resetToMap();
      return true;
    }
  }

  @override
  void dispose() {
    _socket.removeLocationListener(_handleRealtimeDriverLocation);
    _socket.removeRideStatusListener(_handleRealtimeRideStatus);
    super.dispose();
  }
}
