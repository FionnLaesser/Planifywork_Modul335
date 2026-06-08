import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  File? _image;
  final ImagePicker _picker = ImagePicker();
  final TextEditingController _orderIdController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();
  bool _uploading = false;
  String? _message;
  String? _error;

  @override
  void dispose() {
    _orderIdController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (picked != null) {
      setState(() {
        _image = File(picked.path);
        _message = null;
        _error = null;
      });
    }
  }

  Future<void> _uploadImage() async {
    final auth = context.read<AuthService>();
    final image = _image;

    if (image == null) return;
    if (auth.userId == null) {
      setState(() => _error = 'Keine Mitarbeiter-ID im Login gefunden. Bitte neu anmelden.');
      return;
    }

    setState(() {
      _uploading = true;
      _message = null;
      _error = null;
    });

    try {
      final fields = <String, String>{
        'employeeId': auth.userId.toString(),
      };
      final orderId = _orderIdController.text.trim();
      final note = _noteController.text.trim();
      if (orderId.isNotEmpty) fields['orderId'] = orderId;
      if (note.isNotEmpty) fields['note'] = note;

      final api = ApiService(auth);
      final result = await api.uploadImage('/api/media/upload', image, fields: fields);
      setState(() {
        _message = 'Rapport hochgeladen: ${result['filename'] ?? 'Bild'}';
        _image = null;
        _orderIdController.clear();
        _noteController.clear();
      });
    } catch (e) {
      setState(() => _error = 'Upload fehlgeschlagen: $e');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Rapport / Bilder', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text(
            'Nimm ein Foto auf und lade es als Rapportnachweis in MongoDB hoch.',
            style: TextStyle(color: Colors.black54),
          ),
          const SizedBox(height: 16),
          if (_message != null)
            _InfoBox(text: _message!, color: Colors.green.shade700, background: Colors.green.shade50),
          if (_error != null)
            _InfoBox(text: _error!, color: Colors.red.shade700, background: Colors.red.shade50),
          if (_image != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.file(_image!, height: 220, fit: BoxFit.cover),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _orderIdController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Auftrag-ID optional',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _noteController,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Notiz optional',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: _uploading ? null : _pickImage,
            icon: const Icon(Icons.camera_alt),
            label: const Text('Bild aufnehmen'),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: _image == null || _uploading ? null : _uploadImage,
            icon: _uploading
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.upload),
            label: Text(_uploading ? 'Lade hoch…' : 'Hochladen'),
          ),
        ],
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  final String text;
  final Color color;
  final Color background;

  const _InfoBox({required this.text, required this.color, required this.background});

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
