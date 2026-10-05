import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:tt_pink_oven_mobile/app.dart';
import 'package:tt_pink_oven_mobile/config.dart';

void main() {
  // PinkOvenShopState.initState() reads Supabase.instance.client.auth, so the
  // client must be initialized before the widget tree is pumped. main.dart does
  // this in the real app; tests must do it themselves.
  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      publishableKey: AppConfig.supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        // No device storage or deep-link plugin is available in the test
        // harness, so keep the session purely in memory.
        persistSession: false,
        detectSessionInUri: false,
      ),
    );
  });

  testWidgets('App boots to login or shop', (WidgetTester tester) async {
    await tester.pumpWidget(const PinkOvenApp());
    await tester.pump();
    expect(find.textContaining('pink oven'), findsWidgets);
  });
}
