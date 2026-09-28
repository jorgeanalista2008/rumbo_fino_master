import 'dart:developer';
import 'package:socket_io_client/socket_io_client.dart' as io;

class DriverSocketService {
  static final DriverSocketService _instance = DriverSocketService._internal();
  factory DriverSocketService() => _instance;

  io.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  final List<Function(Map<String, dynamic>)> _rideRequestListeners = [];
  final List<Function(Map<String, dynamic>)> _rideStatusListeners = [];

  DriverSocketService._internal();

  void connect(String token) {
    if (_socket != null && _socket!.connected) return;

    try {
      _socket = io.io(
        'https://rumbo-fino-master.vercel.app/rides',
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(20)
            .setReconnectionDelay(2000)
            .setAuth({'token': token})
            .build(),
      );

      _socket!.onConnect((_) {
        log('🟢 [DriverSocket] Chofer Conectado a Rumbo Fino Realtime: ${_socket?.id}');
      });

      _socket!.on('ride_requested', (data) {
        log('⚡ [DriverSocket] Nueva solicitud de viaje entrante: $data');
        if (data is Map<String, dynamic>) {
          for (final listener in _rideRequestListeners) {
            listener(data);
          }
        }
      });

      _socket!.on('ride:new_request', (data) {
        log('⚡ [DriverSocket] Nueva solicitud de viaje: $data');
        if (data is Map<String, dynamic>) {
          for (final listener in _rideRequestListeners) {
            listener(data);
          }
        }
      });

      _socket!.on('ride_status_changed', (data) {
        log('🔄 [DriverSocket] Estado de viaje actualizado: $data');
        if (data is Map<String, dynamic>) {
          for (final listener in _rideStatusListeners) {
            listener(data);
          }
        }
      });

      _socket!.onDisconnect((reason) {
        log('🟡 [DriverSocket] Chofer desconectado: $reason');
      });

      _socket!.onConnectError((err) {
        log('⚠️ [DriverSocket] Error conexión: $err');
      });
    } catch (e) {
      log('❌ [DriverSocket] Excepción al conectar: $e');
    }
  }

  void emitLocationUpdate({
    required String driverId,
    required double latitude,
    required double longitude,
    double? heading,
    double? speed,
  }) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('driver:location_update', {
        'driverId': driverId,
        'latitude': latitude,
        'longitude': longitude,
        'heading': heading ?? 0.0,
        'speed': speed ?? 0.0,
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }

  void addRideRequestListener(Function(Map<String, dynamic>) listener) {
    _rideRequestListeners.add(listener);
  }

  void removeRideRequestListener(Function(Map<String, dynamic>) listener) {
    _rideRequestListeners.remove(listener);
  }

  void addRideStatusListener(Function(Map<String, dynamic>) listener) {
    _rideStatusListeners.add(listener);
  }

  void removeRideStatusListener(Function(Map<String, dynamic>) listener) {
    _rideStatusListeners.remove(listener);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
