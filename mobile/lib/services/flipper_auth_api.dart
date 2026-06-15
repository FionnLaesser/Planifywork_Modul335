import 'dart:async';
import 'dart:convert';
import 'dart:io';

import '../models/flipper_auth_models.dart';
import 'api_config.dart';

class AuthApi {
  AuthApi(String baseUrl) : baseUrl = _cleanBaseUrl(baseUrl);

  final String baseUrl;

  Future<AuthStartResponse> start({
    required String username,
    required String action,
    int? breakMinutes,
  }) async {
    final json = await _post('/api/flipper-auth/start', {
      'username': username,
      'action': action,
      if (breakMinutes != null) 'breakMinutes': breakMinutes,
    });
    return AuthStartResponse.fromJson(json);
  }

  Future<ApiMessage> simulateDevice(int sessionId) async {
    final json = await _post('/api/flipper-auth/simulate-device', {
      'sessionId': sessionId,
    });
    return ApiMessage.fromJson(json);
  }

  Future<AuthStatus> status(int sessionId) async {
    final json = await _get('/api/flipper-auth/status/$sessionId');
    return AuthStatus.fromJson(json);
  }

  Future<Map<String, dynamic>> _get(String path) async {
    return _request('GET', path);
  }

  Future<Map<String, dynamic>> _post(
    String path,
    Map<String, dynamic> body,
  ) async {
    return _request('POST', path, body: body);
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final client = HttpClient()..connectionTimeout = ApiConfig.requestTimeout;

    try {
      final uri = Uri.parse('$baseUrl$path');
      final request = method == 'GET'
          ? await client.getUrl(uri).timeout(ApiConfig.requestTimeout)
          : await client.postUrl(uri).timeout(ApiConfig.requestTimeout);

      request.headers.contentType = ContentType.json;
      if (body != null) {
        request.write(jsonEncode(body));
      }

      final response = await request.close().timeout(ApiConfig.requestTimeout);
      final text = await response
          .transform(utf8.decoder)
          .join()
          .timeout(ApiConfig.requestTimeout);
      final decoded = _decodeResponse(text, response.statusCode);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(
          decoded['message']?.toString() ??
              'HTTP ${response.statusCode}: ${_shorten(text)}',
        );
      }

      return decoded;
    } on FormatException catch (error) {
      throw ApiException('Antwort konnte nicht gelesen werden: $error');
    } on SocketException catch (error) {
      throw ApiException('Backend nicht erreichbar: ${error.message}');
    } on TimeoutException {
      throw ApiException('Backend nicht erreichbar: Timeout');
    } finally {
      client.close(force: true);
    }
  }
}

Map<String, dynamic> _decodeResponse(String text, int statusCode) {
  if (text.isEmpty) {
    return <String, dynamic>{};
  }

  try {
    final decoded = jsonDecode(text);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    throw ApiException('Unerwartete Antwort von Backend: ${_shorten(text)}');
  } on FormatException catch (error) {
    throw ApiException(
      'Antwort konnte nicht gelesen werden (HTTP $statusCode): '
      '${_shorten(text)} ($error)',
    );
  }
}

String _shorten(String value) {
  final singleLine = value.replaceAll(RegExp(r'\s+'), ' ').trim();
  if (singleLine.isEmpty) {
    return 'keine Antwort';
  }
  if (singleLine.length <= 160) {
    return singleLine;
  }
  return '${singleLine.substring(0, 160)}...';
}

class ApiException implements Exception {
  ApiException(this.message);

  final String message;

  @override
  String toString() {
    return message;
  }
}

String _cleanBaseUrl(String value) {
  final trimmed = value.trim();
  if (trimmed.endsWith('/')) {
    return trimmed.substring(0, trimmed.length - 1);
  }
  return trimmed;
}
