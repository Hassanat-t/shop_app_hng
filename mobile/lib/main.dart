// tt's pink oven mobile — same Supabase backend as the website.
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app.dart' show PinkOvenApp;
import 'config.dart' show AppConfig;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(url: AppConfig.supabaseUrl, publishableKey: AppConfig.supabaseAnonKey);
  runApp(const PinkOvenApp());
}
