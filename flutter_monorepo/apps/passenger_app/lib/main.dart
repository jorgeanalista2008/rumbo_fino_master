import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';

void main() {
  runApp(const RumboFinoPassengerApp());
}

class RumboFinoPassengerApp extends StatelessWidget {
  const RumboFinoPassengerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rumbo Fino - VIP Passenger',
      theme: ExecutiveTheme.themeData,
      home: const PassengerHomeScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class PassengerHomeScreen extends StatelessWidget {
  const PassengerHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RUMBO FINO VIP'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Bienvenido, Cliente VIP',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: ExecutiveTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Solicita tu traslado ejecutivo con máxima puntualidad y confort.',
              style: TextStyle(
                fontSize: 16,
                color: ExecutiveTheme.textSecondary,
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.local_taxi),
                label: const Text('SOLICITAR VIAJE EJECUTIVO'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
