import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:core_ui/core_ui.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/ride_provider.dart';
import '../history/ride_history_screen.dart';
import '../auth/login_screen.dart';

class PassengerDrawer extends StatelessWidget {
  const PassengerDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final ride = context.watch<RideProvider>();
    final user = auth.currentUser;

    return Drawer(
      backgroundColor: ExecutiveColors.surface,
      child: SafeArea(
        child: Column(
          children: [
            // User Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: ExecutiveColors.borderLight)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: ExecutiveColors.gold.withOpacity(0.2),
                    child: Text(
                      user != null && user.firstName.isNotEmpty
                          ? user.firstName[0].toUpperCase()
                          : 'P',
                      style: const TextStyle(
                        color: ExecutiveColors.gold,
                        fontWeight: FontWeight.bold,
                        fontSize: 22,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                user?.fullName ?? 'Pasajero VIP',
                                style: ExecutiveTypography.bodyLarge.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.verified, color: ExecutiveColors.gold, size: 16),
                          ],
                        ),
                        Text(
                          user?.email ?? 'usuario@rumbofino.com',
                          style: ExecutiveTypography.bodySmall.copyWith(
                            color: ExecutiveColors.textMuted,
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: ExecutiveColors.gold.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'MEMBRESÍA BLACK VIP',
                            style: TextStyle(
                              color: ExecutiveColors.gold,
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Live BCV Ticker Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              color: ExecutiveColors.surfaceElevated,
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: ExecutiveColors.success,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Tasa Oficial BCV:',
                    style: ExecutiveTypography.bodySmall.copyWith(fontSize: 12),
                  ),
                  const Spacer(),
                  Text(
                    'Bs. ${ride.bcvRate.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: ExecutiveColors.gold,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),

            // Navigation Items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 10),
                children: [
                  ListTile(
                    leading: const Icon(Icons.history_rounded, color: ExecutiveColors.gold),
                    title: const Text('Mis Viajes Ejecutivos', style: TextStyle(color: Colors.white)),
                    subtitle: const Text('Historial de traslados y recibos', style: TextStyle(color: ExecutiveColors.textMuted, fontSize: 12)),
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const RideHistoryScreen()),
                      );
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.account_balance_wallet_outlined, color: ExecutiveColors.gold),
                    title: const Text('Métodos de Pago', style: TextStyle(color: Colors.white)),
                    subtitle: const Text('Pago Móvil, Zelle, Efectivo USD', style: TextStyle(color: ExecutiveColors.textMuted, fontSize: 12)),
                    onTap: () {
                      Navigator.of(context).pop();
                      _showPaymentMethodsDialog(context);
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.headset_mic_outlined, color: ExecutiveColors.gold),
                    title: const Text('Concierge VIP & Soporte', style: TextStyle(color: Colors.white)),
                    subtitle: const Text('Atención 24/7 para clientes VIP', style: TextStyle(color: ExecutiveColors.textMuted, fontSize: 12)),
                    onTap: () {
                      Navigator.of(context).pop();
                      _showConciergeDialog(context);
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.shield_outlined, color: ExecutiveColors.gold),
                    title: const Text('Seguridad & Protocolo', style: TextStyle(color: Colors.white)),
                    subtitle: const Text('Choferes verificados y rastreo satelital', style: TextStyle(color: ExecutiveColors.textMuted, fontSize: 12)),
                    onTap: () {
                      Navigator.of(context).pop();
                      _showSecurityDialog(context);
                    },
                  ),
                ],
              ),
            ),

            // Logout Button
            Padding(
              padding: const EdgeInsets.all(20),
              child: LuxuryButton(
                text: 'Cerrar Sesión',
                variant: LuxuryButtonVariant.outline,
                icon: const Icon(Icons.logout, color: ExecutiveColors.gold, size: 18),
                onPressed: () async {
                  await auth.logout();
                  if (context.mounted) {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPaymentMethodsDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: ExecutiveColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Métodos de Pago Disponibles', style: ExecutiveTypography.h3),
              const SizedBox(height: 16),
              _buildPaymentRow(Icons.phone_android, 'Pago Móvil Interbancario', 'Conversión automática a tasa BCV en tiempo real'),
              _buildPaymentRow(Icons.attach_money, 'Efectivo Divisas (USD)', 'Pago exacto al chofer ejecutivo'),
              _buildPaymentRow(Icons.flash_on, 'Zelle Directo', 'Transferencias instantáneas USD'),
              _buildPaymentRow(Icons.credit_card, 'Tarjeta Internacional', 'Visa / Mastercard / Amex'),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPaymentRow(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: ExecutiveColors.surfaceElevated,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: ExecutiveColors.borderLight),
            ),
            child: Icon(icon, color: ExecutiveColors.gold, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: ExecutiveTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
                Text(subtitle, style: ExecutiveTypography.bodySmall.copyWith(color: ExecutiveColors.textSecondary, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showConciergeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: ExecutiveColors.surface,
        title: Text('Concierge VIP 24/7', style: ExecutiveTypography.h3),
        content: const Text(
          'Nuestro equipo de despacho y seguridad ejecutiva está disponible permanentemente para coordinar traslados especiales, caravanas y soporte.\n\nLínea Central: +58 412 888 3322\nEmail: concierge@rumbofino.com',
          style: TextStyle(color: ExecutiveColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Entendido', style: TextStyle(color: ExecutiveColors.gold)),
          ),
        ],
      ),
    );
  }

  void _showSecurityDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: ExecutiveColors.surface,
        title: Text('Protocolo de Seguridad', style: ExecutiveTypography.h3),
        content: const Text(
          '• Choferes de protocolo rigurosamente auditados con antecedentes penales y pruebas toxicológicas.\n• Monitoreo GPS continuo con botón de pánico satelital.\n• Flota blindada certificada Nivel IV y V.\n• Privacidad y confidencialidad absoluta.',
          style: TextStyle(color: ExecutiveColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cerrar', style: TextStyle(color: ExecutiveColors.gold)),
          ),
        ],
      ),
    );
  }
}
