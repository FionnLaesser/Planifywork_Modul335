import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import 'absence_screen.dart';
import 'calendar_screen.dart';
import 'checkin_screen.dart';
import 'flipper_auth_screen.dart';
import 'report_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  static const _screens = [
    CalendarScreen(),
    CheckInScreen(),
    AbsenceScreen(),
    ReportScreen(),
    FlipperAuthScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Workforce'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<AuthService>().logout(),
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        onTap: (i) => setState(() => _selectedIndex = i),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month),
            label: 'Kalender',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.login), label: 'Check-in'),
          BottomNavigationBarItem(
            icon: Icon(Icons.beach_access),
            label: 'Absenzen',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.camera_alt),
            label: 'Rapport',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.nfc), label: 'Flipper'),
        ],
      ),
    );
  }
}
