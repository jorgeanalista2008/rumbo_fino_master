import 'dart:async';
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

class VehicleCategoryQuote {
  final String id;
  final String name;
  final String subtitle;
  final String badge;
  final String capacity;
  final double baseFareUsd;
  final double perKmUsd;
  final double minimumFareUsd;
  final String icon;

  // Dynamically calculated per route
  double fareUsd;
  double fareVes;

  VehicleCategoryQuote({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.badge,
    required this.capacity,
    required this.baseFareUsd,
    required this.perKmUsd,
    required this.minimumFareUsd,
    required this.icon,
    this.fareUsd = 0.0,
    this.fareVes = 0.0,
  });

  void calculateFare(double distanceKm, double bcvRate) {
    final rawUsd = baseFareUsd + (distanceKm * perKmUsd);
    fareUsd = double.parse((rawUsd < minimumFareUsd ? minimumFareUsd : rawUsd).toStringAsFixed(2));
    fareVes = double.parse((fareUsd * bcvRate).toStringAsFixed(2));
  }
}

class RideProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  final SocketService _socket = SocketService();

  RideFlowState _flowState = RideFlowState.initial;
  LatLng _passengerLocation = const LatLng(10.4900, -66.8600); // Caracas default
  bool _isLoadingLocation = false;

  double _bcvRate = 875.0;
  String? _bcvDate;
  List<DriverLocationModel> _nearbyDrivers = [];

  // Routing and destination
  String _originAddress = 'Ubicación actual';
  String _destinationAddress = '';
  LatLng? _destinationLocation;
  double _routeDistanceKm = 0.0;
  int _routeEstimatedMinutes = 10;
  List<LatLng> _routePoints = [];

  // Vehicle Categories
  static List<VehicleCategoryQuote> get defaultCategories => [
    VehicleCategoryQuote(
      id: 'EXECUTIVE_SEDAN',
      name: 'Sedán Ejecutivo',
      subtitle: 'Toyota Corolla / Camry / Mercedes Clase C',
      badge: 'PREMIUM',
      capacity: '4 Pasajeros',
      baseFareUsd: 8.0,
      perKmUsd: 1.20,
      minimumFareUsd: 10.0,
      icon: 'sedan',
    ),
    VehicleCategoryQuote(
      id: 'VIP_SUV',
      name: 'SUV Ejecutiva',
      subtitle: 'Toyota Fortuner / 4Runner / Tahoe',
      badge: 'VIP CONFORT',
      capacity: '5-6 Pasajeros',
      baseFareUsd: 15.0,
      perKmUsd: 1.80,
      minimumFareUsd: 18.0,
      icon: 'suv',
    ),
    VehicleCategoryQuote(
      id: 'PREMIUM_VAN',
      name: 'Van Ejecutiva',
      subtitle: 'Toyota HiAce VIP / Mercedes Sprinter',
      badge: 'GRUPO EJECUTIVO',
      capacity: '8-12 Pasajeros',
      baseFareUsd: 25.0,
      perKmUsd: 2.50,
      minimumFareUsd: 30.0,
      icon: 'van',
    ),
    VehicleCategoryQuote(
      id: 'LUXURY_ARMORED',
      name: 'Blindado VIP',
      subtitle: 'Blindaje Nivel IV/V con Chofer Escolta',
      badge: 'MÁXIMA SEGURIDAD',
      capacity: '4 Pasajeros',
      baseFareUsd: 50.0,
      perKmUsd: 4.00,
      minimumFareUsd: 60.0,
      icon: 'shield',
    ),
  ];

  List<VehicleCategoryQuote> _categories = [];
  VehicleCategoryQuote? _selectedCategory;
  String _selectedPaymentMethod = 'PAGO_MOVIL';

  RideModel? _activeRide;
  bool _isCreatingRide = false;
  bool _isCancelling = false;
  String? _rideErrorMessage;
  Timer? _ridePollTimer;

  // Getters
  RideFlowState get flowState => _flowState;
  LatLng get passengerLocation => _passengerLocation;
  bool get isLoadingLocation => _isLoadingLocation;
  double get bcvRate => _bcvRate;
  String? get bcvDate => _bcvDate;
  List<DriverLocationModel> get nearbyDrivers => _nearbyDrivers;
  String get originAddress => _originAddress;
  String get destinationAddress => _destinationAddress;
  LatLng? get destinationLocation => _destinationLocation;
  double get routeDistanceKm => _routeDistanceKm;
  int get routeEstimatedMinutes => _routeEstimatedMinutes;
  List<LatLng> get routePoints => _routePoints;
  List<VehicleCategoryQuote> get categories => _categories;
  VehicleCategoryQuote? get selectedCategory => _selectedCategory;
  String get selectedPaymentMethod => _selectedPaymentMethod;
  RideModel? get activeRide => _activeRide;
  bool get isCreatingRide => _isCreatingRide;
  bool get isCancelling => _isCancelling;
  String? get rideErrorMessage => _rideErrorMessage;

  RideProvider() {
    _categories = defaultCategories;
    _selectedCategory = _categories[0];

    // Setup Socket Listeners
    _socket.addLocationListener(_handleRealtimeDriverLocation);
    _socket.addTelemetryListener(_handleActiveRideTelemetry);
    _socket.addRideStatusListener(_handleRealtimeRideStatus);
    _socket.addBcvRateListener(_handleRealtimeBcvRate);
  }

  void _handleRealtimeDriverLocation(Map<String, dynamic> data) {
    try {
      final updatedDriver = DriverLocationModel.fromJson(data);
      if (updatedDriver.latitude == 0.0 || updatedDriver.longitude == 0.0) return;

      final index = _nearbyDrivers.indexWhere((d) => d.driverId == updatedDriver.driverId);
      if (index >= 0) {
        _nearbyDrivers[index] = updatedDriver;
      } else {
        _nearbyDrivers.add(updatedDriver);
      }
      notifyListeners();
    } catch (_) {}
  }

  void _handleActiveRideTelemetry(Map<String, dynamic> data) {
    try {
      if (_activeRide == null) return;
      final lat = (data['latitude'] is num)
          ? (data['latitude'] as num).toDouble()
          : double.tryParse(data['latitude']?.toString() ?? '');
      final lng = (data['longitude'] is num)
          ? (data['longitude'] as num).toDouble()
          : double.tryParse(data['longitude']?.toString() ?? '');
      final heading = (data['heading'] is num)
          ? (data['heading'] as num).toDouble()
          : double.tryParse(data['heading']?.toString() ?? '');
      final speed = (data['speed'] is num)
          ? (data['speed'] as num).toDouble()
          : double.tryParse(data['speed']?.toString() ?? '');

      if (lat != null && lng != null) {
        _activeRide = _activeRide!.copyWith(
          driverLatitude: lat,
          driverLongitude: lng,
          driverHeading: heading,
          driverSpeed: speed,
        );
        notifyListeners();
      }
    } catch (_) {}
  }

  void _handleRealtimeRideStatus(Map<String, dynamic> data) {
    try {
      final rideId = data['rideId']?.toString();
      final status = (data['status'] ?? '').toString().toUpperCase();

      if (_activeRide != null && (_activeRide!.id == rideId || rideId == null)) {
        _updateFlowFromStatus(status);
        if (_activeRide!.id.isNotEmpty) {
          fetchActiveRideStatus(_activeRide!.id);
        }
      }
    } catch (_) {}
  }

  void _handleRealtimeBcvRate(Map<String, dynamic> data) {
    try {
      final r = data['rate'];
      if (r != null) {
        _bcvRate = (r is num) ? r.toDouble() : (double.tryParse(r.toString()) ?? _bcvRate);
        _bcvDate = data['officialDate']?.toString() ?? data['effectiveDate']?.toString();
        _recalculateCategoryFares();
        notifyListeners();
      }
    } catch (_) {}
  }

  void _updateFlowFromStatus(String status) {
    switch (status) {
      case 'SOLICITADO':
        _flowState = RideFlowState.requestingRide;
        break;
      case 'ASIGNADO':
      case 'EN_CAMINO':
        _flowState = RideFlowState.driverAssigned;
        break;
      case 'ABORDAJE':
        _flowState = RideFlowState.driverArrived;
        break;
      case 'EN_CURSO':
        _flowState = RideFlowState.inProgress;
        break;
      case 'FINALIZADO':
        _flowState = RideFlowState.completed;
        _stopRidePolling();
        break;
      case 'CANCELADO':
        resetToMap();
        break;
      default:
        break;
    }
    notifyListeners();
  }

  Future<void> initializeData() async {
    await fetchBcvRate();
    await fetchCurrentLocation();
    await fetchNearbyDrivers();
    await checkExistingActiveRide();
  }

  Future<void> fetchBcvRate() async {
    try {
      final res = await _api.dio.get('/financials/exchange-rates/current');
      final data = res.data['data'] ?? res.data;
      if (data != null && data['rate'] != null) {
        final r = data['rate'];
        _bcvRate = (r is num) ? r.toDouble() : (double.tryParse(r.toString()) ?? 875.0);
        _bcvDate = data['officialDate']?.toString() ?? data['effectiveDate']?.toString();
        _recalculateCategoryFares();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[RideProvider] Error al obtener tasa BCV: $e');
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
      _passengerLocation = const LatLng(10.4900, -66.8600); // Caracas Altamira default
    } finally {
      _isLoadingLocation = false;
      notifyListeners();
    }
  }

  Future<void> fetchNearbyDrivers() async {
    try {
      final response = await _api.dio.get('/drivers');
      final data = response.data['data'] ?? response.data;
      if (data is List) {
        _nearbyDrivers = data
            .map((item) => DriverLocationModel.fromJson(item))
            .where((d) => d.latitude != 0.0 && d.longitude != 0.0)
            .toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[RideProvider] Error cargando choferes cercanos: $e');
      _nearbyDrivers = [];
      notifyListeners();
    }
  }

  Future<void> checkExistingActiveRide() async {
    try {
      final response = await _api.dio.get('/rides/passenger/active');
      final data = response.data['data'] ?? response.data;
      if (data != null && data['id'] != null) {
        _activeRide = RideModel.fromJson(data);
        _socket.joinRideRoom(_activeRide!.id);
        _updateFlowFromStatus(_activeRide!.status);
        _startRidePolling(_activeRide!.id);
      }
    } catch (e) {
      debugPrint('[RideProvider] No active ride: $e');
    }
  }

  void setDestination(String address, LatLng location) {
    _destinationAddress = address;
    _destinationLocation = location;

    // Calculate approximate distance using Haversine
    const distanceCalculator = Distance();
    final meters = distanceCalculator.as(
      LengthUnit.Meter,
      _passengerLocation,
      _destinationLocation!,
    );
    _routeDistanceKm = double.parse((meters / 1000.0).toStringAsFixed(2));
    if (_routeDistanceKm < 0.5) _routeDistanceKm = 0.5;
    _routeEstimatedMinutes = (_routeDistanceKm * 2.5 + 5).ceil();

    // Create preview polyline route
    _routePoints = [
      _passengerLocation,
      LatLng(
        (_passengerLocation.latitude + _destinationLocation!.latitude) / 2,
        (_passengerLocation.longitude + _destinationLocation!.longitude) / 2,
      ),
      _destinationLocation!,
    ];

    _recalculateCategoryFares();
    _flowState = RideFlowState.selectingTier;
    notifyListeners();

    // Request dynamic server quote in background if available
    _fetchServerFareEstimate();
  }

  Future<void> _fetchServerFareEstimate() async {
    if (_destinationLocation == null) return;
    try {
      final response = await _api.dio.post('/rides/estimate', data: {
        'originLat': _passengerLocation.latitude,
        'originLng': _passengerLocation.longitude,
        'destinationLat': _destinationLocation!.latitude,
        'destinationLng': _destinationLocation!.longitude,
      });

      final data = response.data['data'] ?? response.data;
      if (data != null && data['categories'] is List) {
        final List serverCats = data['categories'];
        for (final sc in serverCats) {
          final catId = sc['category']?.toString();
          final target = _categories.firstWhere((c) => c.id == catId, orElse: () => _categories[0]);
          if (sc['fareUsd'] != null) {
            target.fareUsd = (sc['fareUsd'] as num).toDouble();
            target.fareVes = (sc['fareVes'] as num).toDouble();
          }
        }
        notifyListeners();
      }
    } catch (_) {}
  }

  void _recalculateCategoryFares() {
    for (final cat in _categories) {
      cat.calculateFare(_routeDistanceKm, _bcvRate);
    }
  }

  void selectCategory(VehicleCategoryQuote category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void selectPaymentMethod(String method) {
    _selectedPaymentMethod = method;
    notifyListeners();
  }

  void resetToMap() {
    _stopRidePolling();
    _flowState = RideFlowState.initial;
    _destinationAddress = '';
    _destinationLocation = null;
    _routePoints = [];
    _activeRide = null;
    _rideErrorMessage = null;
    notifyListeners();
  }

  Future<bool> requestRide() async {
    if (_destinationLocation == null) return false;

    _isCreatingRide = true;
    _rideErrorMessage = null;
    notifyListeners();

    try {
      final categoryId = _selectedCategory?.id ?? 'EXECUTIVE_SEDAN';
      final totalFare = _selectedCategory?.fareUsd ?? 15.0;

      final payload = {
        'originAddress': _originAddress,
        'originLat': _passengerLocation.latitude,
        'originLng': _passengerLocation.longitude,
        'destinationAddress': _destinationAddress,
        'destinationLat': _destinationLocation!.latitude,
        'destinationLng': _destinationLocation!.longitude,
        'categoryRequested': categoryId,
        'paymentMethod': _selectedPaymentMethod,
        'totalFare': totalFare,
      };

      final response = await _api.dio.post('/rides', data: payload);
      final data = response.data['data'] ?? response.data;

      if (response.data['success'] == true || data != null) {
        _activeRide = RideModel.fromJson(data);
        _socket.joinRideRoom(_activeRide!.id);
        _flowState = RideFlowState.requestingRide;
        _isCreatingRide = false;
        _startRidePolling(_activeRide!.id);
        notifyListeners();
        return true;
      } else {
        _rideErrorMessage = response.data['message'] ?? 'No se pudo generar la solicitud de viaje.';
        _isCreatingRide = false;
        notifyListeners();
        return false;
      }
    } on DioException catch (e) {
      _rideErrorMessage = e.response?.data?['message'] ?? 'Error de conexión con la central VIP.';
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
      final data = response.data['data'] ?? response.data;
      if (data != null) {
        _activeRide = RideModel.fromJson(data);
        _updateFlowFromStatus(_activeRide!.status);
        notifyListeners();
      }
    } catch (_) {}
  }

  void _startRidePolling(String rideId) {
    _stopRidePolling();
    _ridePollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_activeRide != null && _flowState != RideFlowState.initial) {
        fetchActiveRideStatus(rideId);
      } else {
        _stopRidePolling();
      }
    });
  }

  void _stopRidePolling() {
    _ridePollTimer?.cancel();
    _ridePollTimer = null;
  }

  Future<bool> cancelActiveRide() async {
    if (_activeRide == null) {
      resetToMap();
      return true;
    }

    _isCancelling = true;
    notifyListeners();

    try {
      await _api.dio.patch('/rides/${_activeRide!.id}/status', data: {
        'status': 'CANCELADO',
        'cancellationReason': 'Cancelado por el pasajero',
      });
      _isCancelling = false;
      resetToMap();
      return true;
    } catch (e) {
      debugPrint('[RideProvider] Error cancelando viaje: $e');
      _isCancelling = false;
      resetToMap();
      return true;
    }
  }

  Future<bool> submitRating({
    required int rating,
    String? comment,
    int? cleanlinessRating,
    int? punctualityRating,
    int? comfortRating,
  }) async {
    if (_activeRide == null) {
      resetToMap();
      return true;
    }

    try {
      await _api.dio.post('/rides/${_activeRide!.id}/rate', data: {
        'rating': rating,
        'comment': comment,
        'cleanlinessRating': cleanlinessRating,
        'punctualityRating': punctualityRating,
        'comfortRating': comfortRating,
      });
      resetToMap();
      return true;
    } catch (e) {
      debugPrint('[RideProvider] Error al enviar reseña: $e');
      resetToMap();
      return false;
    }
  }

  @override
  void dispose() {
    _stopRidePolling();
    _socket.removeLocationListener(_handleRealtimeDriverLocation);
    _socket.removeTelemetryListener(_handleActiveRideTelemetry);
    _socket.removeRideStatusListener(_handleRealtimeRideStatus);
    _socket.removeBcvRateListener(_handleRealtimeBcvRate);
    super.dispose();
  }
}
