import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_client.dart';
import '../network/socket_service.dart';
import '../../models/user_model.dart';

enum AuthStatus { initial, authenticating, authenticated, unauthenticated, error }

class AuthProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  final SocketService _socket = SocketService();

  AuthStatus _status = AuthStatus.initial;
  UserModel? _currentUser;
  String? _token;
  String? _errorMessage;

  AuthStatus get status => _status;
  UserModel? get currentUser => _currentUser;
  String? get token => _token;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated && _currentUser != null;

  Future<void> checkSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedToken = prefs.getString('access_token');
      final savedUserJson = prefs.getString('user_data');

      if (savedToken != null && savedUserJson != null) {
        _token = savedToken;
        _currentUser = UserModel.fromJson(jsonDecode(savedUserJson));
        _status = AuthStatus.authenticated;
        _socket.connect(_token!);
        notifyListeners();
        return;
      }
    } catch (_) {
      // Ignore error and set unauthenticated
    }

    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.dio.post(
        '/auth/login',
        data: {
          'email': email.trim().toLowerCase(),
          'password': password,
        },
      );

      final data = response.data;
      if (data['success'] == true && data['data'] != null) {
        final userData = data['data']['user'];
        final accessToken = data['data']['accessToken'];

        final role = (userData['role'] ?? '').toString().toUpperCase();
        if (role != 'PASSENGER' && role != 'SUPER_ADMIN') {
          _status = AuthStatus.error;
          _errorMessage =
              'Esta app es exclusiva para Pasajeros Ejecutivos. Si eres Chofer o Administrador, utiliza la app correspondiente.';
          notifyListeners();
          return false;
        }

        _currentUser = UserModel.fromJson(userData);
        _token = accessToken;
        _status = AuthStatus.authenticated;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', _token!);
        await prefs.setString('user_data', jsonEncode(_currentUser!.toJson()));

        _socket.connect(_token!);
        notifyListeners();
        return true;
      } else {
        _status = AuthStatus.error;
        _errorMessage = data['message'] ?? 'Credenciales incorrectas';
        notifyListeners();
        return false;
      }
    } on DioException catch (e) {
      _status = AuthStatus.error;
      _errorMessage =
          e.response?.data?['message'] ?? 'Error de conexión con el servidor ejecutivo.';
      notifyListeners();
      return false;
    } catch (e) {
      _status = AuthStatus.error;
      _errorMessage = 'Ocurrió un error inesperado: $e';
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _status = AuthStatus.unauthenticated;
    _currentUser = null;
    _token = null;
    _socket.disconnect();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('user_data');

    notifyListeners();
  }
}
