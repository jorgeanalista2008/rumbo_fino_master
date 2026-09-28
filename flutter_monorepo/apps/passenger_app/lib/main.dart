import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:core_ui/core_ui.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/ride_provider.dart';
import 'screens/splash/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set transparent system bars with light icons for Dark Executive Luxury theme
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
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => RideProvider()),
      ],
      child: const RumboFinoPassengerApp(),
    ),
  );
}

class RumboFinoPassengerApp extends StatelessWidget {
  const RumboFinoPassengerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rumbo Fino - Pasajeros',
      debugShowCheckedModeBanner: false,
      theme: ExecutiveTheme.themeData,
      home: const SplashScreen(),
    );
  }
}
