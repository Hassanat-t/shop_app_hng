import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Brand tokens copied 1:1 from the website (src/app/globals.css + README).
const wine = Color(0xFF670625);
const pink = Color(0xFFE8B7C2);
const lightPink = Color(0xFFFFF5F7);
const cream = Color(0xFFF7F1EA);
const ink = Color(0xFF3d2229);
const muted = Color(0xFF7a5a5a);

// Playfair Display headings + Nunito Sans body — same fonts as the website.
TextStyle serifStyle({double size = 28, Color color = wine, double height = 1.1}) =>
    GoogleFonts.playfairDisplay(fontSize: size, fontWeight: FontWeight.w700, color: color, height: height);

TextStyle sansStyle({double size = 14, Color color = ink, FontWeight weight = FontWeight.w400}) =>
    GoogleFonts.nunitoSans(fontSize: size, fontWeight: weight, color: color);

// .btn-wine — solid wine pill button.
final ButtonStyle winePill = FilledButton.styleFrom(
  backgroundColor: wine,
  foregroundColor: Colors.white,
  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
  shape: const StadiumBorder(),
  textStyle: sansStyle(size: 14, color: Colors.white, weight: FontWeight.w700),
);

// Outline pill — border wine, text wine (website's secondary buttons).
final ButtonStyle outlinePill = OutlinedButton.styleFrom(
  foregroundColor: wine,
  side: const BorderSide(color: wine),
  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
  shape: const StadiumBorder(),
  textStyle: sansStyle(size: 14, color: wine, weight: FontWeight.w700),
);

ThemeData buildShopTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: lightPink,
    colorScheme: ColorScheme.fromSeed(seedColor: wine, primary: wine),
    textTheme: GoogleFonts.nunitoSansTextTheme().apply(bodyColor: ink, displayColor: ink),
    appBarTheme: AppBarTheme(
      backgroundColor: const Color(0xE6FFF5F7), // light-pink/90
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      foregroundColor: wine,
      titleTextStyle: serifStyle(size: 22, color: wine),
      iconTheme: const IconThemeData(color: wine),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      hintStyle: sansStyle(size: 14, color: muted),
      labelStyle: sansStyle(size: 14, color: muted),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0x80E8B7C2)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0x80E8B7C2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: wine, width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(style: winePill),
    outlinedButtonTheme: OutlinedButtonThemeData(style: outlinePill),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: lightPink,
      indicatorColor: const Color(0x4DE8B7C2), // pink/30
      labelTextStyle: WidgetStateProperty.all(sansStyle(size: 11, color: wine, weight: FontWeight.w700)),
      iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
            color: states.contains(WidgetState.selected) ? wine : muted,
          )),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: wine,
      contentTextStyle: sansStyle(size: 13, color: Colors.white),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
  );
}

