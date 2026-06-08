import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class ApiService {
  static const String _baseUrl = 'http://10.0.2.2:8000';

  final AuthService _auth;

  ApiService(this._auth);

  Future<dynamic> get(String path) async {
    final res = await http.get(
      Uri.parse('$_baseUrl$path'),
      headers: _auth.authHeaders,
    );
    _checkStatus(res);
    return jsonDecode(res.body);
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('$_baseUrl$path'),
      headers: _auth.authHeaders,
      body: jsonEncode(body),
    );
    _checkStatus(res);
    return jsonDecode(res.body);
  }

  Future<dynamic> uploadImage(
    String path,
    File imageFile, {
    Map<String, String>? fields,
  }) async {
    final request = http.MultipartRequest('POST', Uri.parse('$_baseUrl$path'));
    if (_auth.token != null) {
      request.headers['Authorization'] = 'Bearer ${_auth.token}';
    }
    if (fields != null) {
      request.fields.addAll(fields);
    }
    request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));
    final streamedResponse = await request.send();
    final res = await http.Response.fromStream(streamedResponse);
    _checkStatus(res);
    return jsonDecode(res.body);
  }

  void _checkStatus(http.Response res) {
    if (res.statusCode == 401) throw Exception('Nicht autorisiert');
    if (res.statusCode >= 400) throw Exception('Fehler: ${res.statusCode}');
  }
}
