import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:core_ui/core_ui.dart';
import 'core/providers/driver_auth_provider.dart';
import 'core/providers/driver_shift_provider.dart';
import 'screens/splash/driver_splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set immersive dark status bar style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: ExecutiveColors.background,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => DriverAuthProvider()),
        ChangeNotifierProvider(create: (_) => DriverShiftProvider()),
      ],
      child: const RumboFinoDriverApp(),
    ),
  );
}

class RumboFinoDriverApp extends StatelessWidget {
  const RumboFinoDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rumbo Fino - Cabina Chofer VIP',
      debugShowCheckedModeBanner: false,
      theme: ExecutiveTheme.themeData,
      home: const DriverSplashScreen(),
    );
  }
}
