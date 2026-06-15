import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/api_service.dart';
import '../services/auth_service.dart';

class AbsenceScreen extends StatefulWidget {
  const AbsenceScreen({super.key});

  @override
  State<AbsenceScreen> createState() => _AbsenceScreenState();
}

class _AbsenceScreenState extends State<AbsenceScreen> {
  final TextEditingController _reasonController = TextEditingController();

  String _type = 'VACATION';
  DateTime? _startDate;
  DateTime? _endDate;
  bool _loading = true;
  bool _submitting = false;
  String? _message;
  String? _error;
  List<_AbsenceEntry> _entries = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAbsences());
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _loadAbsences() async {
    final auth = context.read<AuthService>();
    final userId = auth.userId;
    if (userId == null) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Keine Mitarbeiter-ID im Login gefunden. Bitte neu anmelden.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await ApiService(auth).get('/api/absences/employee/$userId');
      final items = (data as List<dynamic>? ?? [])
          .map((item) => _AbsenceEntry.fromJson(item as Map<String, dynamic>))
          .toList();
      if (!mounted) return;
      setState(() {
        _entries = items;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = 'Absenzen konnten nicht geladen werden: $error';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _pickDate({required bool start}) async {
    final now = DateTime.now();
    final initialDate = start
        ? (_startDate ?? now)
        : (_endDate ?? _startDate ?? now);

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );

    if (picked == null || !mounted) return;

    setState(() {
      if (start) {
        _startDate = picked;
        if (_endDate != null && _endDate!.isBefore(picked)) {
          _endDate = picked;
        }
      } else {
        _endDate = picked;
      }
      _message = null;
      _error = null;
    });
  }

  Future<void> _submit() async {
    final auth = context.read<AuthService>();
    final userId = auth.userId;
    if (userId == null) {
      setState(() => _error = 'Keine Mitarbeiter-ID im Login gefunden. Bitte neu anmelden.');
      return;
    }
    if (_startDate == null || _endDate == null) {
      setState(() => _error = 'Bitte Start- und Enddatum auswählen.');
      return;
    }
    if (_endDate!.isBefore(_startDate!)) {
      setState(() => _error = 'Enddatum darf nicht vor dem Startdatum liegen.');
      return;
    }

    setState(() {
      _submitting = true;
      _message = null;
      _error = null;
    });

    try {
      final response = await ApiService(auth).post('/api/absences', {
        'employeeId': userId,
        'type': _type,
        'startDate': _formatDate(_startDate!),
        'endDate': _formatDate(_endDate!),
        'reason': _reasonController.text.trim(),
      });
      final created = _AbsenceEntry.fromJson(response as Map<String, dynamic>);
      if (!mounted) return;
      setState(() {
        _entries = [created, ..._entries];
        _message = _type == 'VACATION'
            ? 'Ferienanfrage wurde eingereicht.'
            : 'Absenz wurde eingereicht.';
        _reasonController.clear();
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = 'Anfrage konnte nicht gesendet werden: $error';
      });
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Absenzen & Ferien', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text(
            'Reiche Ferien oder Absenzen direkt an HR ein. Der Status bleibt offen, bis HR entscheidet.',
            style: TextStyle(color: Colors.black54),
          ),
          const SizedBox(height: 16),
          if (_message != null)
            _InfoBox(text: _message!, color: Colors.green.shade700, background: Colors.green.shade50),
          if (_error != null)
            _InfoBox(text: _error!, color: Colors.red.shade700, background: Colors.red.shade50),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Neue Anfrage', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _type,
                    decoration: const InputDecoration(
                      labelText: 'Typ',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'VACATION', child: Text('Ferien')),
                      DropdownMenuItem(value: 'SICK', child: Text('Krankheit')),
                      DropdownMenuItem(value: 'OTHER', child: Text('Sonstiges')),
                    ],
                    onChanged: _submitting ? null : (value) => setState(() => _type = value ?? 'VACATION'),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _submitting ? null : () => _pickDate(start: true),
                          icon: const Icon(Icons.date_range),
                          label: Text(_startDate == null ? 'Startdatum' : _formatDisplayDate(_startDate!)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _submitting ? null : () => _pickDate(start: false),
                          icon: const Icon(Icons.event_available),
                          label: Text(_endDate == null ? 'Enddatum' : _formatDisplayDate(_endDate!)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _reasonController,
                    minLines: 2,
                    maxLines: 4,
                    enabled: !_submitting,
                    decoration: const InputDecoration(
                      labelText: 'Begründung optional',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _submitting ? null : _submit,
                    icon: _submitting
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.send),
                    label: Text(_submitting ? 'Sende…' : 'Anfrage einreichen'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Meine Anfragen', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              IconButton(
                onPressed: _loading ? null : _loadAbsences,
                icon: const Icon(Icons.refresh),
                tooltip: 'Aktualisieren',
              ),
            ],
          ),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_entries.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Text('Noch keine Abwesenheitsanfragen vorhanden.', textAlign: TextAlign.center),
            )
          else
            ..._entries.map((entry) => _AbsenceCard(entry: entry)),
        ],
      ),
    );
  }
}

class _AbsenceCard extends StatelessWidget {
  const _AbsenceCard({required this.entry});

  final _AbsenceEntry entry;

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (entry.status) {
      'APPROVED' => Colors.green.shade700,
      'REJECTED' => Colors.red.shade700,
      _ => Colors.orange.shade800,
    };
    final typeLabel = switch (entry.type) {
      'VACATION' => 'Ferien',
      'SICK' => 'Krankheit',
      _ => 'Sonstiges',
    };
    final statusLabel = switch (entry.status) {
      'APPROVED' => 'Genehmigt',
      'REJECTED' => 'Abgelehnt',
      _ => 'Offen',
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        title: Text('$typeLabel · ${_formatDisplayDate(entry.startDate)} – ${_formatDisplayDate(entry.endDate)}'),
        subtitle: Text(entry.reason?.isNotEmpty == true ? entry.reason! : 'Keine Begründung'),
        trailing: Text(
          statusLabel,
          style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  const _InfoBox({required this.text, required this.color, required this.background});

  final String text;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(text, style: TextStyle(color: color)),
    );
  }
}

class _AbsenceEntry {
  const _AbsenceEntry({
    required this.id,
    required this.type,
    required this.startDate,
    required this.endDate,
    required this.status,
    this.reason,
  });

  final int id;
  final String type;
  final DateTime startDate;
  final DateTime endDate;
  final String status;
  final String? reason;

  factory _AbsenceEntry.fromJson(Map<String, dynamic> json) {
    return _AbsenceEntry(
      id: _readInt(json['id']),
      type: json['type']?.toString() ?? 'OTHER',
      startDate: DateTime.parse(json['startDate'].toString()),
      endDate: DateTime.parse(json['endDate'].toString()),
      status: json['status']?.toString() ?? 'PENDING',
      reason: json['reason']?.toString(),
    );
  }
}

int _readInt(Object? value) {
  if (value is int) return value;
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

String _formatDate(DateTime value) {
  String two(int number) => number.toString().padLeft(2, '0');
  return '${value.year}-${two(value.month)}-${two(value.day)}';
}

String _formatDisplayDate(DateTime value) {
  String two(int number) => number.toString().padLeft(2, '0');
  return '${two(value.day)}.${two(value.month)}.${value.year}';
}
