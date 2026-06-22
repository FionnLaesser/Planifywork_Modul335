class ApiConfig {
  // Android Emulator: 10.0.2.2 = localhost des Host-Rechners
  // Echtes Gerät im selben WLAN: lokale IP des Host-Rechners

  static const String baseUrl = 'http://10.222.166.145:8000';

  static const Duration requestTimeout = Duration(seconds: 8);
}