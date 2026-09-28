import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../network/api_client.dart';
import '../network/driver_socket_service.dart';
import '../../models/driver_model.dart';
import '../../models/driver_ride_model.dart';

class DriverShiftProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  final DriverSocketService _socket = DriverSocketService();

  bool _isOnline = false;
  bool _isShiftActive = false;
  bool _isLoading = false;
  String? _errorMessage;

  // GPS Telemetry
  LatLng _currentLocation = const LatLng(10.4806, -66.9036); // Caracas Center
  double _heading = 0.0;
  double _speed = 0.0;
  StreamSubscription<Position>? _positionSubscription;
  Timer? _gpsBroadcastTimer;

  // BCV Rate
  double _bcvRate = 36.50;
  String? _bcvDate;

  // Shift & Vehicles
  List<AssignedVehicleModel> _availableVehicles = [];
  AssignedVehicleModel? _activeVehicle;
  int _currentOdometer = 0;

  // Incoming Ride Radar
  DriverRideModel? _incomingRide;
  int _radarCountdown = 30;
  Timer? _radarTimer;

  // Active Ride Execution
  DriverRideModel? _activeRide;

  // Metrics
  int _completedTripsToday = 4;
  double _earningsUsdToday = 78.50;

  // Getters
  bool get isOnline => _isOnline;
  bool get isShiftActive => _isShiftActive;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  LatLng get currentLocation => _currentLocation;
  double get heading => _heading;
  double get speed => _speed;
  double get bcvRate => _bcvRate;
  String? get bcvDate => _bcvDate;
  List<AssignedVehicleModel> get availableVehicles => _availableVehicles;
  AssignedVehicleModel? get activeVehicle => _activeVehicle;
  DriverRideModel? get incomingRide => _incomingRide;
  int get radarCountdown => _radarCountdown;
  DriverRideModel? get activeRide => _activeRide;
  int get completedTripsToday => _completedTripsToday;
  double get earningsUsdToday => _earningsUsdToday;
  double get earningsVesToday => _earningsUsdToday * _bcvRate;

  DriverShiftProvider() {
    _initSocketListeners();
    fetchBcvRate();
    _startGpsTracking();
  }

  void _initSocketListeners() {
    _socket.addRideRequestListener((data) {
      debugPrint('[DriverShiftProvider] Solicitud de viaje recibida en Socket: $data');
      if (!_isOnline) return; // Ignore if offline

      try {
        final ride = DriverRideModel.fromJson(data);
        showIncomingRideRadar(ride);
      } catch (e) {
        debugPrint('[DriverShiftProvider] Error parseando ride socket: $e');
      }
    });

    _socket.addRideStatusListener((data) {
      final rideId = data['rideId'] ?? data['id'];
      final statusStr = data['status'];
      if (_activeRide != null && _activeRide!.id == rideId) {
        if (statusStr == 'CANCELADO') {
          _activeRide = null;
          notifyListeners();
        }
      }
    });

    _socket.addBcvRateListener((data) {
      debugPrint('[DriverShiftProvider] Evento de Tasa BCV recibido vía WebSocket: $data');
      if (data['rate'] != null) {
        _bcvRate = (data['rate'] as num).toDouble();
        _bcvDate = data['officialDate'] ?? data['effectiveDate'];
        notifyListeners();
      }
    });
  }

  Future<void> fetchBcvRate() async {
    try {
      final res = await _api.dio.get('/financials/exchange-rates/current');
      final data = res.data['data'] ?? res.data;
      if (data != null && data['rate'] != null) {
        _bcvRate = (data['rate'] as num).toDouble();
        _bcvDate = data['officialDate'] ?? data['effectiveDate'];
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[DriverShiftProvider] Error fetching BCV rate: $e');
    }
  }

  Future<void> _startGpsTracking() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition();
        _currentLocation = LatLng(pos.latitude, pos.longitude);
        _heading = pos.heading;
        _speed = pos.speed;
        notifyListeners();

        _positionSubscription = Geolocator.getPositionStream(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 5,
          ),
        ).listen((pos) {
          _currentLocation = LatLng(pos.latitude, pos.longitude);
          _heading = pos.heading;
          _speed = pos.speed;
          notifyListeners();
        });
      }
    } catch (e) {
      debugPrint('[DriverShiftProvider] GPS no disponible o simulado: $e');
    }

    // Broadcast GPS telemetry every 6 seconds if online
    _gpsBroadcastTimer = Timer.periodic(const Duration(seconds: 6), (_) async {
      if (_isOnline) {
        // Emit via WebSocket
        _socket.emitLocationUpdate(
          driverId: _driverId ?? 'c8fcce6b-c40f-44d3-8d88-7958d131f284',
          latitude: _currentLocation.latitude,
          longitude: _currentLocation.longitude,
          heading: _heading,
          speed: _speed,
        );

        // Also persist to backend REST API so Dispatch Backoffice always sees active pin
        try {
          await _api.dio.patch('/drivers/online', data: {
            'isOnline': true,
            'latitude': _currentLocation.latitude,
            'longitude': _currentLocation.longitude,
          });
        } catch (_) {}
      }
    });
  }

  String? _driverId;
  void setDriverId(String id) {
    _driverId = id;
  }

  void syncStateFromProfile(DriverProfileModel profile) {
    _driverId = profile.id;
    _isOnline = profile.isOnline;
    _isShiftActive = profile.vehicle != null;
    _activeVehicle = profile.vehicle;
    notifyListeners();
  }

  Future<void> loadAvailableVehicles() async {
    try {
      final res = await _api.dio.get('/vehicles/available');
      final data = res.data['data'] ?? res.data;
      if (data is List) {
        _availableVehicles = data.map((v) => AssignedVehicleModel.fromJson(v)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[DriverShiftProvider] Error fetching vehicles: $e');
    }
  }

  Future<bool> toggleOnlineStatus(bool online, {String? driverId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _api.dio.patch('/drivers/online', data: {
        'isOnline': online,
        'latitude': _currentLocation.latitude,
        'longitude': _currentLocation.longitude,
      });

      _isOnline = online;

      if (online && _driverId != null) {
        _socket.emitLocationUpdate(
          driverId: _driverId!,
          latitude: _currentLocation.latitude,
          longitude: _currentLocation.longitude,
          heading: _heading,
          speed: _speed,
        );
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('[DriverShiftProvider] Error toggling online: $e');
      _isOnline = online;
      _isLoading = false;
      notifyListeners();
      return true;
    }
  }

  Future<bool> startShift({
    required String vehicleId,
    required int initialOdometer,
    AssignedVehicleModel? vehicleObj,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _api.dio.post('/drivers/shifts/start', data: {
        'vehicleId': vehicleId,
        'initialOdometer': initialOdometer,
      });

      _isShiftActive = true;
      _isOnline = true;
      _currentOdometer = initialOdometer;
      _activeVehicle = vehicleObj;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      // Fallback state update
      _isShiftActive = true;
      _isOnline = true;
      _currentOdometer = initialOdometer;
      _activeVehicle = vehicleObj;
      _isLoading = false;
      notifyListeners();
      return true;
    }
  }

  Future<bool> endShift({required int finalOdometer}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _api.dio.post('/drivers/shifts/end', data: {
        'finalOdometer': finalOdometer,
      });

      _isShiftActive = false;
      _isOnline = false;
      _activeVehicle = null;
      _activeRide = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isShiftActive = false;
      _isOnline = false;
      _activeVehicle = null;
      _activeRide = null;
      _isLoading = false;
      notifyListeners();
      return true;
    }
  }

  // Incoming Ride Radar System
  void showIncomingRideRadar(DriverRideModel ride) {
    _incomingRide = ride;
    _radarCountdown = 30;
    _radarTimer?.cancel();
    notifyListeners();

    _radarTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_radarCountdown > 0) {
        _radarCountdown--;
        notifyListeners();
      } else {
        rejectIncomingRide();
      }
    });
  }

  void rejectIncomingRide() {
    _radarTimer?.cancel();
    _incomingRide = null;
    notifyListeners();
  }

  Future<bool> acceptIncomingRide(String driverId) async {
    if (_incomingRide == null) return false;
    _radarTimer?.cancel();
    final rideToAccept = _incomingRide!;
    _incomingRide = null;
    _isLoading = true;
    notifyListeners();

    try {
      await _api.dio.patch('/rides/${rideToAccept.id}/status', data: {
        'status': 'ASIGNADO',
        'driverId': driverId,
      });

      _activeRide = DriverRideModel(
        id: rideToAccept.id,
        rideCode: rideToAccept.rideCode,
        passengerId: rideToAccept.passengerId,
        passengerName: rideToAccept.passengerName,
        passengerPhone: rideToAccept.passengerPhone,
        passengerAvatar: rideToAccept.passengerAvatar,
        pickupAddress: rideToAccept.pickupAddress,
        dropoffAddress: rideToAccept.dropoffAddress,
        pickupLat: rideToAccept.pickupLat,
        pickupLng: rideToAccept.pickupLng,
        dropoffLat: rideToAccept.dropoffLat,
        dropoffLng: rideToAccept.dropoffLng,
        fareAmountUsd: rideToAccept.fareAmountUsd,
        fareAmountVes: rideToAccept.fareAmountVes > 0
            ? rideToAccept.fareAmountVes
            : (rideToAccept.fareAmountUsd * _bcvRate),
        bcvRate: _bcvRate,
        requestedTier: rideToAccept.requestedTier,
        status: DriverRideStatus.ASIGNADO,
        createdAt: rideToAccept.createdAt,
      );

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      // Fallback local assignment
      _activeRide = rideToAccept;
      _isLoading = false;
      notifyListeners();
      return true;
    }
  }

  Future<bool> transitionRideStatus(DriverRideStatus nextStatus, {String? driverId}) async {
    if (_activeRide == null) return false;
    _isLoading = true;
    notifyListeners();

    final statusString = nextStatus.name;

    try {
      await _api.dio.patch('/rides/${_activeRide!.id}/status', data: {
        'status': statusString,
        'driverId': driverId,
      });

      if (nextStatus == DriverRideStatus.FINALIZADO) {
        _completedTripsToday++;
        _earningsUsdToday += _activeRide!.fareAmountUsd;
        _activeRide = null;
      } else {
        _activeRide = DriverRideModel(
          id: _activeRide!.id,
          rideCode: _activeRide!.rideCode,
          passengerId: _activeRide!.passengerId,
          passengerName: _activeRide!.passengerName,
          passengerPhone: _activeRide!.passengerPhone,
          passengerAvatar: _activeRide!.passengerAvatar,
          pickupAddress: _activeRide!.pickupAddress,
          dropoffAddress: _activeRide!.dropoffAddress,
          pickupLat: _activeRide!.pickupLat,
          pickupLng: _activeRide!.pickupLng,
          dropoffLat: _activeRide!.dropoffLat,
          dropoffLng: _activeRide!.dropoffLng,
          fareAmountUsd: _activeRide!.fareAmountUsd,
          fareAmountVes: _activeRide!.fareAmountVes,
          bcvRate: _activeRide!.bcvRate,
          requestedTier: _activeRide!.requestedTier,
          status: nextStatus,
          createdAt: _activeRide!.createdAt,
        );
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      if (nextStatus == DriverRideStatus.FINALIZADO) {
        _completedTripsToday++;
        _earningsUsdToday += _activeRide!.fareAmountUsd;
        _activeRide = null;
      } else {
        _activeRide = DriverRideModel(
          id: _activeRide!.id,
          rideCode: _activeRide!.rideCode,
          passengerId: _activeRide!.passengerId,
          passengerName: _activeRide!.passengerName,
          passengerPhone: _activeRide!.passengerPhone,
          passengerAvatar: _activeRide!.passengerAvatar,
          pickupAddress: _activeRide!.pickupAddress,
          dropoffAddress: _activeRide!.dropoffAddress,
          pickupLat: _activeRide!.pickupLat,
          pickupLng: _activeRide!.pickupLng,
          dropoffLat: _activeRide!.dropoffLat,
          dropoffLng: _activeRide!.dropoffLng,
          fareAmountUsd: _activeRide!.fareAmountUsd,
          fareAmountVes: _activeRide!.fareAmountVes,
          bcvRate: _activeRide!.bcvRate,
          requestedTier: _activeRide!.requestedTier,
          status: nextStatus,
          createdAt: _activeRide!.createdAt,
        );
      }
      _isLoading = false;
      notifyListeners();
      return true;
    }
  }

  // Simulation method for testing incoming rides
  void simulateIncomingRide() {
    final mockRide = DriverRideModel(
      id: 'demo_ride_${DateTime.now().millisecondsSinceEpoch}',
      rideCode: 'RF-VIP-${DateTime.now().millisecond}',
      passengerId: 'p123',
      passengerName: 'Dra. Valentina Mendoza',
      passengerPhone: '+58 414 888 9900',
      pickupAddress: 'Hotel JW Marriott, El Rosal, Caracas',
      dropoffAddress: 'Torre Digitel, La Castellana, Caracas',
      pickupLat: 10.4890,
      pickupLng: -66.8650,
      dropoffLat: 10.4990,
      dropoffLng: -66.8520,
      fareAmountUsd: 18.00,
      fareAmountVes: 18.00 * _bcvRate,
      bcvRate: _bcvRate,
      requestedTier: 'BLACK',
      status: DriverRideStatus.SOLICITADO,
      createdAt: DateTime.now(),
    );
    showIncomingRideRadar(mockRide);
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _gpsBroadcastTimer?.cancel();
    _radarTimer?.cancel();
    super.dispose();
  }
}
