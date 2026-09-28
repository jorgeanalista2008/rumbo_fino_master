import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:core_ui/core_ui.dart';
import '../../core/providers/auth_provider.dart';
import '../home/home_map_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController(text: 'pasajero1@rumbofino.com');
  final _passwordController = TextEditingController(text: 'Pasajero2026*');

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.login(
      _emailController.text,
      _passwordController.text,
    );

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const HomeMapScreen(),
          transitionsBuilder: (_, a, __, c) => FadeTransition(opacity: a, child: c),
          transitionDuration: const Duration(milliseconds: 500),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final isLoading = authProvider.status == AuthStatus.authenticating;

    return Scaffold(
      backgroundColor: ExecutiveColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Gold Emblem
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    gradient: ExecutiveColors.goldGradient,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: ExecutiveColors.gold.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'RF',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF090B0E),
                      ),
                    ),
                  ),
                ).animate().scale(duration: 500.ms),
                const SizedBox(height: 18),
                Text(
                  'RUMBO FINO',
                  style: ExecutiveTypography.goldHeading.copyWith(
                    fontSize: 22,
                    letterSpacing: 2.5,
                  ),
                ),
                Text(
                  'Acceso Pasajeros Ejecutivos',
                  style: ExecutiveTypography.bodyMedium,
                ),
                const SizedBox(height: 32),

                // Form Container
                LuxuryCard(
                  padding: const EdgeInsets.all(24),
                  hasGoldBorder: true,
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (authProvider.errorMessage != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: ExecutiveColors.error.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: ExecutiveColors.error.withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.info_outline,
                                    color: ExecutiveColors.error, size: 20),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    authProvider.errorMessage!,
                                    style: ExecutiveTypography.bodySmall.copyWith(
                                      color: ExecutiveColors.error,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ).animate().shake(),
                        ],
                        LuxuryTextField(
                          controller: _emailController,
                          label: 'Correo Corporativo / Personal',
                          hintText: 'ejemplo@rumbofino.com',
                          keyboardType: TextInputType.emailAddress,
                          prefixIcon: const Icon(Icons.email_outlined),
                          validator: (val) {
                            if (val == null || val.isEmpty) {
                              return 'Por favor ingresa tu correo';
                            }
                            if (!val.contains('@')) {
                              return 'Ingresa un correo electrónico válido';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 20),
                        LuxuryTextField(
                          controller: _passwordController,
                          label: 'Contraseña de Seguridad',
                          hintText: '••••••••',
                          obscureText: true,
                          prefixIcon: const Icon(Icons.lock_outline),
                          validator: (val) {
                            if (val == null || val.isEmpty) {
                              return 'Por favor ingresa tu contraseña';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 28),
                        LuxuryButton(
                          text: 'Ingresar a Rumbo Fino',
                          isLoading: isLoading,
                          onPressed: _handleLogin,
                          icon: const Icon(Icons.arrow_forward_rounded,
                              color: Color(0xFF090B0E), size: 20),
                        ),
                      ],
                    ),
                  ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),

                const SizedBox(height: 24),

                // Quick fill demo pill
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      _emailController.text = 'pasajero1@rumbofino.com';
                      _passwordController.text = 'Pasajero2026*';
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: ExecutiveColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: ExecutiveColors.border),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.key_outlined,
                              color: ExecutiveColors.gold, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            'Autocompletar Pasajero VIP (Elena Rostova)',
                            style: ExecutiveTypography.bodySmall.copyWith(
                              color: ExecutiveColors.gold,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
