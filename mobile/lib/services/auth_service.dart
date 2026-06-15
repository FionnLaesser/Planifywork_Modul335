import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'api_config.dart';

class AuthService extends ChangeNotifier {
  static const String _baseUrl = ApiConfig.baseUrl;
  static const String _tokenKey = 'jwt_token';
  static const String _roleKey = 'jwt_role';
  static const String _usernameKey = 'jwt_username';
  static const String _userIdKey = 'jwt_user_id';

  String? _token;
  String? _role;
  String? _username;
  int? _userId;
  String? _lastError;

  bool get isLoggedIn => _token != null;
  String? get token => _token;
  String? get role => _role;
  String? get username => _username;
  int? get userId => _userId;
  String? get lastError => _lastError;

  AuthService() {
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    _role = prefs.getString(_roleKey);
    _username = prefs.getString(_usernameKey);
    _userId = prefs.getInt(_userIdKey);
    notifyListeners();
  }

  Future<bool> login(String username, String password) async {
    _lastError = null;

    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/api/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'username': username, 'password': password}),
          )
          .timeout(ApiConfig.requestTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data['token'];
        _role = data['role'];
        _username = data['username'];
        _userId = data['userId'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, _token!);
        if (_role != null) await prefs.setString(_roleKey, _role!);
        if (_username != null) await prefs.setString(_usernameKey, _username!);
        if (_userId != null) await prefs.setInt(_userIdKey, _userId!);

        notifyListeners();
        return true;
      }

      _lastError = 'Login fehlgeschlagen (${response.statusCode})';
    } catch (error) {
      _lastError = 'Backend nicht erreichbar: $error';
    }

    return false;
  }

  Future<void> logout() async {
    _token = null;
    _role = null;
    _username = null;
    _userId = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_roleKey);
    await prefs.remove(_usernameKey);
    await prefs.remove(_userIdKey);
    notifyListeners();
  }

  Map<String, String> get authHeaders => {
        if (_token != null) 'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      };
}
