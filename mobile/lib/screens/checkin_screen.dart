import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/api_service.dart';
import '../services/auth_service.dart';

class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key, this.active = true});

  final bool active;

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  bool _loading = true;
  bool _busy = false;
  bool _checkedIn = false;
  String? _error;
  String? _message;
  _TimeEntry? _currentEntry;
  _TimeEntry? _lastEntry;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCurrent();
    });
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
      final data = await ApiService(auth).get('/api/time/current/$userId');
      final entry = data == null ? null : _TimeEntry.fromJson(data);
      if (!mounted) {
        return;
      }
      setState(() {
        _checkedIn = entry != null;
        _currentEntry = entry;
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
    final auth = context.read<AuthService>();
    final userId = auth.userId;
    if (userId == null) {
      setState(() => _error = 'Benutzer-ID fehlt');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
      _message = null;
    });

    try {
      final data = await ApiService(auth).post('/api/time/checkin', {
        'employeeId': userId,
      });
      final entry = _TimeEntry.fromJson(data);
      if (!mounted) {
        return;
      }
      setState(() {
        _checkedIn = true;
        _currentEntry = entry;
        _lastEntry = entry;
        _message = 'Eingecheckt';
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
        });
      }
    }
  }

  Future<void> _checkOut() async {
    final auth = context.read<AuthService>();
    final userId = auth.userId;
    if (userId == null) {
      setState(() => _error = 'Benutzer-ID fehlt');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
      _message = null;
    });

    try {
      final data = await ApiService(auth).post('/api/time/checkout', {
        'employeeId': userId,
        'breakMinutes': 0,
      });
      final entry = _TimeEntry.fromJson(data);
      if (!mounted) {
        return;
      }
      setState(() {
        _checkedIn = false;
        _currentEntry = null;
        _lastEntry = entry;
        _message = 'Ausgecheckt';
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
        });
      }
    }
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
                style: const TextStyle(color: Color(0xFF166534)),
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
    required this.totalHours,
  });

  final int id;
  final int employeeId;
  final DateTime checkIn;
  final DateTime? checkOut;
  final double? totalHours;

  factory _TimeEntry.fromJson(dynamic json) {
    final map = json as Map<String, dynamic>;
    return _TimeEntry(
      id: _readInt(map['id']),
      employeeId: _readInt(map['employeeId']),
      checkIn: _readDateTime(map['checkIn']) ?? DateTime.now(),
      checkOut: _readDateTime(map['checkOut']),
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
