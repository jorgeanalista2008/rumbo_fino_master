import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:core_ui/core_ui.dart';
import '../../core/providers/driver_auth_provider.dart';
import '../auth/driver_login_screen.dart';
import '../dashboard/driver_dashboard_screen.dart';

class DriverSplashScreen extends StatefulWidget {
  const DriverSplashScreen({super.key});

  @override
  State<DriverSplashScreen> createState() => _DriverSplashScreenState();
}

class _DriverSplashScreenState extends State<DriverSplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(milliseconds: 2200));
    if (!mounted) return;

    final auth = context.read<DriverAuthProvider>();
    await auth.initAuth();

    if (!mounted) return;

    if (auth.isAuthenticated) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const DriverDashboardScreen(),
          transitionsBuilder: (_, a, __, c) => FadeTransition(opacity: a, child: c),
          transitionDuration: const Duration(milliseconds: 600),
        ),
      );
    } else {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const DriverLoginScreen(),
          transitionsBuilder: (_, a, __, c) => FadeTransition(opacity: a, child: c),
          transitionDuration: const Duration(milliseconds: 600),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ExecutiveColors.background,
      body: Stack(
        children: [
          // Ambient luxury glow
          Positioned(
            top: -120,
            right: -120,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    ExecutiveColors.gold.withOpacity(0.18),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Gold Monogram Badge
                Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    color: ExecutiveColors.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: ExecutiveColors.gold, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: ExecutiveColors.gold.withOpacity(0.35),
                        blurRadius: 30,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.drive_eta_rounded,
                          color: ExecutiveColors.gold,
                          size: 38,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'RF',
                          style: ExecutiveTypography.h3.copyWith(
                            color: ExecutiveColors.gold,
                            letterSpacing: 3,
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                    .animate()
                    .scale(duration: 800.ms, curve: Curves.easeOutBack)
                    .then()
                    .shimmer(duration: 1500.ms, color: ExecutiveColors.goldLight),

                const SizedBox(height: 32),

                // Brand Name
                Text(
                  'RUMBO FINO',
                  style: ExecutiveTypography.h1.copyWith(
                    letterSpacing: 6.0,
                    color: ExecutiveColors.gold,
                    fontWeight: FontWeight.w800,
                    fontSize: 26,
                  ),
                ).animate().fadeIn(duration: 800.ms).slideY(begin: 0.2, end: 0),

                const SizedBox(height: 6),

                // Subtitle
                Text(
                  'CONSOLA EJECUTIVA CHOFER VIP',
                  style: ExecutiveTypography.caption.copyWith(
                    letterSpacing: 3.5,
                    color: ExecutiveColors.textSecondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ).animate().fadeIn(delay: 300.ms, duration: 800.ms),

                const SizedBox(height: 48),

                // Progress Indicator
                const SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.2,
                    valueColor: AlwaysStoppedAnimation<Color>(ExecutiveColors.gold),
                  ),
                ).animate().fadeIn(delay: 600.ms),
              ],
            ),
          ),

          // Bottom Version Info
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                'v1.0.0 • FLEET COMMAND',
                style: ExecutiveTypography.caption.copyWith(
                  color: ExecutiveColors.textTertiary,
                  letterSpacing: 2,
                  fontSize: 10,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
