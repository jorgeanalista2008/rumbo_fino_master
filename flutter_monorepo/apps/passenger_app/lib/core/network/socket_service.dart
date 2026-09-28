import 'dart:developer';
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;

  io.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  final List<Function(Map<String, dynamic>)> _locationListeners = [];
  final List<Function(Map<String, dynamic>)> _rideStatusListeners = [];

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
            .setReconnectionAttempts(15)
            .setReconnectionDelay(2000)
            .setAuth({'token': token})
            .build(),
      );

      _socket!.onConnect((_) {
        log('🟢 [SocketService] Conectado a Rumbo Fino Realtime: ${_socket?.id}');
      });

      _socket!.on('driver_location', (data) {
        if (data is Map<String, dynamic>) {
          for (final listener in _locationListeners) {
            listener(data);
          }
        }
      });

      _socket!.on('ride_status_changed', (data) {
        if (data is Map<String, dynamic>) {
          for (final listener in _rideStatusListeners) {
            listener(data);
          }
        }
      });

      _socket!.onDisconnect((reason) {
        log('🟡 [SocketService] Desconectado: $reason');
      });

      _socket!.onConnectError((err) {
        log('⚠️ [SocketService] Error conexión Socket: $err');
      });
    } catch (e) {
      log('❌ [SocketService] Excepción al inicializar: $e');
    }
  }

  void addLocationListener(Function(Map<String, dynamic>) listener) {
    _locationListeners.add(listener);
  }

  void removeLocationListener(Function(Map<String, dynamic>) listener) {
    _locationListeners.remove(listener);
  }

  void addRideStatusListener(Function(Map<String, dynamic>) listener) {
    _rideStatusListeners.add(listener);
  }

  void removeRideStatusListener(Function(Map<String, dynamic>) listener) {
    _rideStatusListeners.remove(listener);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
