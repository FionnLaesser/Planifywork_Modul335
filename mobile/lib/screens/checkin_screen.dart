import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/flipper_auth_models.dart';
import '../services/api_config.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/flipper_auth_api.dart';
import '../services/hce_session_bridge.dart';

class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key, this.active = true});

  final bool active;

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  static const Duration _pollInterval = Duration(seconds: 1);
  static const Duration _fallbackWaitTimeout = Duration(seconds: 65);

  bool _loading = true;
  bool _busy = false;
  bool _checkedIn = false;
  String? _error;
  String? _message;
  AuthStartResponse? _pendingSession;
  _TimeEntry? _currentEntry;
  _TimeEntry? _lastEntry;
  final TextEditingController _breakMinutesController =
      TextEditingController(text: '0');

  AuthApi get _flipperApi => AuthApi(ApiConfig.baseUrl);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCurrent();
    });
  }

  @override
  void dispose() {
    unawaited(HceSessionBridge.clearSession().catchError((_) {}));
    _breakMinutesController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant CheckInScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.active && !oldWidget.active) {
      _loadCurrent(silent: true);
    }
  }

  Future<void> _loadCurrent({bool silent = false}) async {
    final auth = context.read<AuthService>();
    final userId = auth.userId;

    if (userId == null) {
      if (!mounted) {
        return;
      }
      setState(() {
        _loading = false;
        _error = 'Benutzer-ID fehlt';
      });
      return;
    }

    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final api = ApiService(auth);
      final entry = await _fetchCurrentEntry(api, userId);
      final latestEntry = entry ?? await _fetchLatestEntry(api, userId);
      if (!mounted) {
        return;
      }
      setState(() {
        _checkedIn = entry != null;
        _currentEntry = entry;
        _lastEntry = latestEntry;
        _error = null;
        if (!silent) {
          _message = null;
        }
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted && !silent) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _toggleCheckIn() async {
    if (_checkedIn) {
      await _checkOut();
    } else {
      await _checkIn();
    }
  }

  Future<void> _checkIn() async {
    await _runFlipperTimeAction(action: 'LOGIN');
  }

  Future<void> _checkOut() async {
    final auth = context.read<AuthService>();
    final userId = auth.userId;
    if (userId == null) {
      setState(() => _error = 'Benutzer-ID fehlt');
      return;
    }

    final breakText = _breakMinutesController.text.trim();
    final breakMinutes = int.tryParse(breakText.isEmpty ? '0' : breakText);
    if (breakMinutes == null || breakMinutes < 0) {
      setState(() => _error = 'Pause muss eine positive Zahl oder 0 sein');
      return;
    }

    await _runFlipperTimeAction(
      action: 'LOGOUT',
      breakMinutes: breakMinutes,
    );
  }

  Future<void> _runFlipperTimeAction({
    required String action,
    int breakMinutes = 0,
  }) async {
    final auth = context.read<AuthService>();
    final userId = auth.userId;
    final username = auth.username;
    if (userId == null) {
      setState(() => _error = 'Benutzer-ID fehlt');
      return;
    }
    if (username == null || username.isEmpty) {
      setState(() => _error = 'Benutzername fehlt');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
      _message = 'Warte auf Flipper';
      _pendingSession = null;
    });

    try {
      final session = await _flipperApi.start(
        username: username,
        action: action,
        breakMinutes: action == 'LOGOUT' ? breakMinutes : null,
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _pendingSession = session;
        _message = 'Warte auf Flipper und WiFi-Devboard';
      });

      await HceSessionBridge.updateSession(session: session, username: username);
      final status = await _waitForDeviceConfirmation(session);
      await HceSessionBridge.clearSession();

      if (!status.success) {
        throw ApiException('Backend hat die Zeiterfassung nicht bestätigt');
      }

      await _refreshAfterConfirmedAction(
        auth: auth,
        userId: userId,
        action: action,
      );
    } catch (error) {
      await HceSessionBridge.clearSession().catchError((_) {});
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
        _message = null;
      });
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
          _pendingSession = null;
        });
      }
    }
  }

  Future<AuthStatus> _waitForDeviceConfirmation(
    AuthStartResponse session,
  ) async {
    final deadline =
        session.expiresAt ?? DateTime.now().add(_fallbackWaitTimeout);

    while (DateTime.now().isBefore(deadline)) {
      final status = await _flipperApi.status(session.sessionId);
      if (status.used) {
        return status;
      }

      await Future.delayed(_pollInterval);
    }

    throw ApiException('Keine Bestätigung vom Flipper erhalten');
  }

  Future<void> _refreshAfterConfirmedAction({
    required AuthService auth,
    required int userId,
    required String action,
  }) async {
    final api = ApiService(auth);
    final current = await _fetchCurrentEntry(api, userId);
    final latest = current ?? await _fetchLatestEntry(api, userId);

    if (!mounted) {
      return;
    }

    if (action == 'LOGIN' && current == null) {
      throw ApiException('Check-in wurde nicht als offener Eintrag gefunden');
    }
    if (action == 'LOGOUT' && (latest == null || latest.checkOut == null)) {
      throw ApiException(
        'Check-out wurde nicht als abgeschlossener Eintrag gefunden',
      );
    }

    setState(() {
      _checkedIn = current != null;
      _currentEntry = current;
      _lastEntry = latest;
      _message = action == 'LOGIN' ? 'Eingecheckt' : 'Ausgecheckt';
    });
  }

  Future<_TimeEntry?> _fetchCurrentEntry(ApiService api, int userId) async {
    final data = await api.get('/api/time/current/$userId');
    return data == null ? null : _TimeEntry.fromJson(data);
  }

  Future<_TimeEntry?> _fetchLatestEntry(ApiService api, int userId) async {
    final data = await api.get('/api/time/latest/$userId');
    return data == null ? null : _TimeEntry.fromJson(data);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final entry = _currentEntry ?? _lastEntry;

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _checkedIn ? Icons.check_circle : Icons.radio_button_unchecked,
              size: 84,
              color: _checkedIn ? Colors.green : Colors.grey,
            ),
            const SizedBox(height: 20),
            Text(
              _checkedIn ? 'Eingecheckt' : 'Ausgecheckt',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            if (entry != null) ...[
              const SizedBox(height: 12),
              _InfoText(
                label: _checkedIn ? 'Seit' : 'Letzter Check-in',
                value: _formatDateTime(entry.checkIn),
              ),
              if (entry.checkOut != null)
                _InfoText(
                  label: 'Letzter Check-out',
                  value: _formatDateTime(entry.checkOut!),
                ),
              if (entry.breakMinutes > 0 || entry.checkOut != null)
                _InfoText(
                  label: 'Pause',
                  value: '${entry.breakMinutes} min',
                ),
              if (entry.totalHours != null)
                _InfoText(
                  label: 'Erfasste Zeit',
                  value: '${entry.totalHours!.toStringAsFixed(2)} h',
                ),
            ],
            if (_message != null) ...[
              const SizedBox(height: 12),
              Text(
                _message!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF166534)),
              ),
            ],
            if (_pendingSession != null) ...[
              const SizedBox(height: 8),
              Text(
                'Session ${_pendingSession!.sessionId}',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFB91C1C)),
              ),
            ],
            if (_checkedIn) ...[
              const SizedBox(height: 20),
              TextField(
                controller: _breakMinutesController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Pause in Minuten',
                  helperText: 'Wird beim Check-out von der Arbeitszeit abgezogen',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.coffee),
                ),
              ),
            ],
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _busy ? null : _toggleCheckIn,
              icon: _busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Icon(_checkedIn ? Icons.logout : Icons.login),
              label: Text(_checkedIn ? 'Check-out' : 'Check-in'),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: _busy ? null : () => _loadCurrent(),
              icon: const Icon(Icons.refresh),
              label: const Text('Aktualisieren'),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoText extends StatelessWidget {
  const _InfoText({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Text('$label: $value', textAlign: TextAlign.center),
    );
  }
}

class _TimeEntry {
  const _TimeEntry({
    required this.id,
    required this.employeeId,
    required this.checkIn,
    required this.checkOut,
    required this.breakMinutes,
    required this.totalHours,
  });

  final int id;
  final int employeeId;
  final DateTime checkIn;
  final DateTime? checkOut;
  final int breakMinutes;
  final double? totalHours;

  factory _TimeEntry.fromJson(dynamic json) {
    final map = json as Map<String, dynamic>;
    return _TimeEntry(
      id: _readInt(map['id']),
      employeeId: _readInt(map['employeeId']),
      checkIn: _readDateTime(map['checkIn']) ?? DateTime.now(),
      checkOut: _readDateTime(map['checkOut']),
      breakMinutes:
          map['breakMinutes'] == null ? 0 : _readInt(map['breakMinutes']),
      totalHours: _readDouble(map['totalHours']),
    );
  }
}

int _readInt(Object? value) {
  if (value is int) {
    return value;
  }
  return int.parse(value.toString());
}

double? _readDouble(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value.toString());
}

DateTime? _readDateTime(Object? value) {
  final text = value?.toString();
  if (text == null || text.isEmpty) {
    return null;
  }
  return DateTime.tryParse(text)?.toLocal();
}

String _formatDateTime(DateTime value) {
  String two(int number) => number.toString().padLeft(2, '0');
  return '${two(value.day)}.${two(value.month)}.${value.year} '
      '${two(value.hour)}:${two(value.minute)}';
}
