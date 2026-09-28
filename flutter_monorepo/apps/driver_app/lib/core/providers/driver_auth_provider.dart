import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_client.dart';
import '../network/driver_socket_service.dart';
import '../../models/driver_model.dart';

class DriverAuthProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  final DriverSocketService _socket = DriverSocketService();

  bool _isInitialized = false;
  bool _isLoading = false;
  String? _errorMessage;
  String? _token;
  DriverProfileModel? _profile;

  bool get isInitialized => _isInitialized;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get token => _token;
  DriverProfileModel? get profile => _profile;
  bool get isAuthenticated => _token != null && _profile != null;

  Future<void> initAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('driver_access_token');
      final profileJsonStr = prefs.getString('driver_profile_data');

      if (_token != null && _token!.isNotEmpty) {
        if (profileJsonStr != null) {
          try {
            _profile = DriverProfileModel.fromJson(jsonDecode(profileJsonStr));
          } catch (_) {}
        }
        // Connect socket & fetch latest profile
        _socket.connect(_token!);
        await refreshProfile();
      }
    } catch (e) {
      debugPrint('[DriverAuthProvider] Error en initAuth: $e');
    } finally {
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.dio.post('/auth/login', data: {
        'email': email.trim(),
        'password': password.trim(),
      });

      final responseData = response.data['data'] ?? response.data;
      final accessToken = responseData['access_token'] ?? responseData['accessToken'];
      final userMap = responseData['user'];

      if (userMap == null || userMap['role'] != 'DRIVER') {
        _errorMessage = 'Acceso Denegado: Esta aplicación está reservada exclusivamente para Choferes Ejecutivos de Rumbo Fino.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _token = accessToken;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('driver_access_token', _token!);
      await prefs.setString('driver_user_data', jsonEncode(userMap));

      _socket.connect(_token!);

      // Fetch driver entity details
      await refreshProfile();

      _isLoading = false;
      notifyListeners();
      return true;
    } on DioException catch (dioErr) {
      _isLoading = false;
      final serverMsg = dioErr.response?.data?['message'];
      _errorMessage = serverMsg ?? 'Credenciales inválidas o error de conexión';
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Error inesperado al iniciar sesión: $e';
      notifyListeners();
      return false;
    }
  }

  Future<void> refreshProfile() async {
    if (_token == null) return;
    try {
      final res = await _api.dio.get('/drivers/me');
      final data = res.data['data'] ?? res.data;
      _profile = DriverProfileModel.fromJson(data);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('driver_profile_data', jsonEncode(data));
      notifyListeners();
    } catch (e) {
      debugPrint('[DriverAuthProvider] Error refreshing profile: $e');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('driver_access_token');
    await prefs.remove('driver_user_data');
    await prefs.remove('driver_profile_data');

    _socket.disconnect();
    _token = null;
    _profile = null;
    _errorMessage = null;
    notifyListeners();
  }
}
