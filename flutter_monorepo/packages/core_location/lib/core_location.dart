import 'dart:async';

class TelemetryLocationPoint {
  final double latitude;
  final double longitude;
  final double speed;
  final double heading;
  final DateTime timestamp;

  TelemetryLocationPoint({
    required this.latitude,
    required this.longitude,
    required this.speed,
    required this.heading,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'latitude': latitude,
        'longitude': longitude,
        'speed': speed,
        'heading': heading,
        'timestamp': timestamp.toIso8601String(),
      };
}

class BackgroundLocationService {
  static final BackgroundLocationService _instance = BackgroundLocationService._internal();
  factory BackgroundLocationService() => _instance;
  BackgroundLocationService._internal();

  final _locationController = StreamController<TelemetryLocationPoint>.broadcast();
  Stream<TelemetryLocationPoint> get locationStream => _locationController.stream;

  bool _isTracking = false;
  bool get isTracking => _isTracking;

  Future<void> startForegroundTracking() async {
    _isTracking = true;
    // In production: Initializes flutter_background_service + geolocator stream with distanceFilter: 10m
  }

  Future<void> stopForegroundTracking() async {
    _isTracking = false;
  }
}
