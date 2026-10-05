import 'package:flutter/material.dart';
import 'home.dart';
import 'theme.dart';

/// tt's pink oven — MaterialApp using the website's exact brand theme.
/// Boots straight into the NATIVE shop (no WebView, no external URLs).
class PinkOvenApp extends StatelessWidget {
  const PinkOvenApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "tt's pink oven",
      debugShowCheckedModeBanner: false,
      theme: buildShopTheme(),
      home: const PinkOvenShop(),
    );
  }
}

