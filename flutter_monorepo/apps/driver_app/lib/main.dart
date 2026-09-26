import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_location/core_location.dart';

void main() {
  runApp(const RumboFinoDriverApp());
}

class RumboFinoDriverApp extends StatelessWidget {
  const RumboFinoDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rumbo Fino - Chofer Ejecutivo',
      theme: ExecutiveTheme.themeData,
      home: const DriverHomeScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  bool _isOnline = false;

  void _toggleAvailability() {
    setState(() {
      _isOnline = !_isOnline;
    });

    if (_isOnline) {
      BackgroundLocationService().startForegroundTracking();
    } else {
      BackgroundLocationService().stopForegroundTracking();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CHOFER EJECUTIVO'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: ExecutiveTheme.cardSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _isOnline ? ExecutiveTheme.luxuryGold : Colors.grey,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isOnline ? 'ESTADO: EN LÍNEA' : 'ESTADO: DESCONECTADO',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: _isOnline ? ExecutiveTheme.luxuryGold : Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _isOnline ? 'Transmitiendo GPS...' : 'Pulsa para activar turno',
                        style: const TextStyle(
                          color: ExecutiveTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  Switch(
                    value: _isOnline,
                    activeColor: ExecutiveTheme.luxuryGold,
                    onChanged: (val) => _toggleAvailability(),
                  ),
                ],
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _toggleAvailability,
                icon: Icon(_isOnline ? Icons.power_settings_new : Icons.play_arrow),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isOnline ? Colors.redAccent : ExecutiveTheme.luxuryGold,
                ),
                label: Text(_isOnline ? 'FINALIZAR TURNO' : 'INICIAR TURNO EJECUTIVO'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
