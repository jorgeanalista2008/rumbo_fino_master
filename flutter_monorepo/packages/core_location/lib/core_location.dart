import 'dart:async';
import 'dart:convert';

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

class MapboxConfig {
  MapboxConfig._();

  static final String accessToken = utf8.decode(base64.decode(
    'cGsuZXlKMUlqb2lhbTl5WjJWaGJtRnNhWE4wWVRJd01EZ2lMQ0poSWpvaVkyMTFiMm8yY0dJNE1EQjVaek13YjJ4eWQzUTVOWFY1YWlKOS5LXy1DUVBaRDdsVmY5YkJISVM2dWVn',
  ));

  static const String darkStyleId = 'mapbox/dark-v11';
  static const String navigationNightStyleId = 'mapbox/navigation-night-v1';
  static const String satelliteStyleId = 'mapbox/satellite-streets-v12';

  static String get darkTilesUrl =>
      'https://api.mapbox.com/styles/v1/$darkStyleId/tiles/256/{z}/{x}/{y}@2x?access_token=$accessToken';

  static String get navigationNightTilesUrl =>
      'https://api.mapbox.com/styles/v1/$navigationNightStyleId/tiles/256/{z}/{x}/{y}@2x?access_token=$accessToken';

  static String get satelliteTilesUrl =>
      'https://api.mapbox.com/styles/v1/$satelliteStyleId/tiles/256/{z}/{x}/{y}@2x?access_token=$accessToken';

  static String geocodingUrl(String query) =>
      'https://api.mapbox.com/geocoding/v5/mapbox.places/${Uri.encodeComponent(query)}.json?country=ve&access_token=$accessToken';

  static String directionsUrl({
    required double originLng,
    required double originLat,
    required double destLng,
    required double destLat,
  }) =>
      'https://api.mapbox.com/directions/v5/mapbox/driving/$originLng,$originLat;$destLng,$destLat?geometries=geojson&overview=full&access_token=$accessToken';
}
