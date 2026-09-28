import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;

  io.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  final List<Function(Map<String, dynamic>)> _locationListeners = [];
  final List<Function(Map<String, dynamic>)> _rideStatusListeners = [];
  final List<Function(Map<String, dynamic>)> _bcvRateListeners = [];
  final List<Function(Map<String, dynamic>)> _telemetryListeners = [];

  SocketService._internal();

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
        debugPrint('🟢 [SocketService] Conectado a Rumbo Fino Realtime: ${_socket?.id}');
      });

      // Global driver locations (for nearby drivers)
      _socket!.on('driver:global_location', (data) {
        if (data is Map<String, dynamic>) {
          for (final listener in _locationListeners) {
            listener(data);
          }
        }
      });
      _socket!.on('driver_location', (data) {
        if (data is Map<String, dynamic>) {
          for (final listener in _locationListeners) {
            listener(data);
          }
        }
      });

      // Active ride telemetry stream (live tracking assigned driver)
      _socket!.on('ride:telemetry_stream', (data) {
        if (data is Map<String, dynamic>) {
          for (final listener in _telemetryListeners) {
            listener(data);
          }
        }
      });

      // Ride status changes
      _socket!.on('ride:status_changed', (data) {
        if (data is Map<String, dynamic>) {
          for (final listener in _rideStatusListeners) {
            listener(data);
          }
        }
      });
      _socket!.on('ride:global_status', (data) {
        if (data is Map<String, dynamic>) {
          for (final listener in _rideStatusListeners) {
            listener(data);
          }
        }
      });

      // BCV Rate updates
      _socket!.on('financials:bcv_rate_updated', (data) {
        if (data is Map<String, dynamic>) {
          for (final listener in _bcvRateListeners) {
            listener(data);
          }
        }
      });

      _socket!.onDisconnect((reason) {
        debugPrint('🟡 [SocketService] Desconectado: $reason');
      });

      _socket!.onConnectError((err) {
        debugPrint('⚠️ [SocketService] Error conexión Socket: $err');
      });
    } catch (e) {
      debugPrint('❌ [SocketService] Excepción al inicializar: $e');
    }
  }

  void joinRideRoom(String rideId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('ride:join_room', {'rideId': rideId});
      debugPrint('🚕 [SocketService] Unido a sala del viaje: ride:$rideId');
    }
  }

  void addLocationListener(Function(Map<String, dynamic>) listener) {
    _locationListeners.add(listener);
  }

  void removeLocationListener(Function(Map<String, dynamic>) listener) {
    _locationListeners.remove(listener);
  }

  void addTelemetryListener(Function(Map<String, dynamic>) listener) {
    _telemetryListeners.add(listener);
  }

  void removeTelemetryListener(Function(Map<String, dynamic>) listener) {
    _telemetryListeners.remove(listener);
  }

  void addRideStatusListener(Function(Map<String, dynamic>) listener) {
    _rideStatusListeners.add(listener);
  }

  void removeRideStatusListener(Function(Map<String, dynamic>) listener) {
    _rideStatusListeners.remove(listener);
  }

  void addBcvRateListener(Function(Map<String, dynamic>) listener) {
    _bcvRateListeners.add(listener);
  }

  void removeBcvRateListener(Function(Map<String, dynamic>) listener) {
    _bcvRateListeners.remove(listener);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
