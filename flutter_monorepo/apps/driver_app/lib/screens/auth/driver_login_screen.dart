import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:core_ui/core_ui.dart';
import '../../core/providers/driver_auth_provider.dart';
import '../dashboard/driver_dashboard_screen.dart';

class DriverLoginScreen extends StatefulWidget {
  const DriverLoginScreen({super.key});

  @override
  State<DriverLoginScreen> createState() => _DriverLoginScreenState();
}

class _DriverLoginScreenState extends State<DriverLoginScreen> {
  final _emailController = TextEditingController(text: 'chofer1@rumbofino.com');
  final _passwordController = TextEditingController(text: 'Chofer2026*');
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<DriverAuthProvider>();
    final success = await auth.login(
      _emailController.text,
      _passwordController.text,
    );

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const DriverDashboardScreen(),
          transitionsBuilder: (_, a, __, c) => FadeTransition(opacity: a, child: c),
          transitionDuration: const Duration(milliseconds: 600),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<DriverAuthProvider>();

    return Scaffold(
      backgroundColor: ExecutiveColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo Crest
                  Center(
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: ExecutiveColors.surface,
                        shape: BoxShape.circle,
                        border: Border.all(color: ExecutiveColors.gold, width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: ExecutiveColors.gold.withOpacity(0.25),
                            blurRadius: 20,
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.drive_eta_rounded,
                          color: ExecutiveColors.gold,
                          size: 36,
                        ),
                      ),
                    ),
                  ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),

                  const SizedBox(height: 20),

                  // Titles
                  Text(
                    'RUMBO FINO',
                    textAlign: TextAlign.center,
                    style: ExecutiveTypography.h2.copyWith(
                      color: ExecutiveColors.gold,
                      letterSpacing: 4.0,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'PORTAL EXCLUSIVO CONDUCTORES VIP',
                    textAlign: TextAlign.center,
                    style: ExecutiveTypography.caption.copyWith(
                      color: ExecutiveColors.textSecondary,
                      letterSpacing: 2.0,
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Quick test credentials pill
                  GestureDetector(
                    onTap: () {
                      _emailController.text = 'chofer1@rumbofino.com';
                      _passwordController.text = 'Chofer2026*';
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                      decoration: BoxDecoration(
                        color: ExecutiveColors.gold.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: ExecutiveColors.gold.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.touch_app_rounded, color: ExecutiveColors.gold, size: 18),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Chofer Demo (Click para autocompletar)',
                                  style: ExecutiveTypography.caption.copyWith(
                                    color: ExecutiveColors.goldLight,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'chofer1@rumbofino.com • Chofer2026*',
                                  style: ExecutiveTypography.caption.copyWith(
                                    color: ExecutiveColors.textTertiary,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ).animate().fadeIn(delay: 200.ms),

                  const SizedBox(height: 24),

                  // Error message banner
                  if (auth.errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: ExecutiveColors.error.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: ExecutiveColors.error.withOpacity(0.5)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: ExecutiveColors.error, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              auth.errorMessage!,
                              style: ExecutiveTypography.bodySmall.copyWith(
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Email Field
                  LuxuryTextField(
                    label: 'Correo Electrónico',
                    hintText: 'ej. chofer1@rumbofino.com',
                    controller: _emailController,
                    prefixIcon: const Icon(Icons.badge_outlined, color: ExecutiveColors.gold, size: 20),
                    keyboardType: TextInputType.emailAddress,
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Ingrese su correo registrado';
                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  // Password Field
                  LuxuryTextField(
                    label: 'Contraseña de Conductor',
                    hintText: '••••••••',
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    prefixIcon: const Icon(Icons.lock_outline, color: ExecutiveColors.gold, size: 20),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: ExecutiveColors.textSecondary,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Ingrese su contraseña';
                      return null;
                    },
                  ),

                  const SizedBox(height: 32),

                  // Submit Button
                  LuxuryButton(
                    text: 'INICIAR SESIÓN EN FLOTA',
                    isLoading: auth.isLoading,
                    onPressed: _handleLogin,
                  ),

                  const SizedBox(height: 28),

                  // Bottom Notice
                  Center(
                    child: Text(
                      'Rumbo Fino Enterprise • Conexión Cifrada SSL',
                      style: ExecutiveTypography.caption.copyWith(
                        color: ExecutiveColors.textTertiary,
                        fontSize: 10,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
