import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'theme.dart';

/// Renders the website's product art on the phone.
/// image_url from Supabase is like "/products/taro-boba.svg"; the same SVGs
/// are bundled as assets (assets/products/) so no localhost fetch is needed.
///
/// Pass a FINITE height always. [width] may be double.infinity to fill
/// (e.g. inside a card). The old `size: double.infinity` API produced an
/// unbounded Container + SvgPicture, which lays out to 0 / throws and
/// renders as a blank box — the reason SVGs "were not showing".
class ProductImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final double? size; // shorthand for square images (e.g. cart thumbnails)
  final double radius;
  final BoxFit fit;
  const ProductImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.size = 72,
    this.radius = 16,
    this.fit = BoxFit.cover,
  });

  static const _bundled = {
    'biscoff.svg',
    'chocolate-chip.svg',
    'lychee-boba.svg',
    'milk-tea.svg',
    'oreo-boba.svg',
    'oreo-cookie.svg',
    'taro-boba.svg',
    'white-chocolate.svg',
  };

  String? get assetPath {
    if (imageUrl.isEmpty) return null;
    // Accept "/products/x.svg", "assets/products/x.svg", full URLs, query strings.
    var file = imageUrl.split('?').first.split('/').last.trim().toLowerCase();
    if (file.isEmpty || !file.endsWith('.svg')) return null;
    if (!_bundled.contains(file)) return null;
    return 'assets/products/$file';
  }

  @override
  Widget build(BuildContext context) {
    final double w = width ?? size ?? 72;
    final double h = height ?? size ?? 72;
    final asset = assetPath;
    Widget child;
    if (asset == null) {
      child = Center(child: Icon(Icons.cake_outlined, color: wine, size: 36));
    } else {
      child = SvgPicture.asset(
        asset,
        width: w.isFinite ? w : null,
        height: h.isFinite ? h : null,
        fit: fit,
        semanticsLabel: 'product image',
        placeholderBuilder: (ctx) =>
            Center(child: Icon(Icons.cake_outlined, color: wine.withValues(alpha: 0.5), size: 36)),
      );
    }
    // Width may expand; height MUST stay finite or the SVG collapses to blank.
    final double safeH = h.isFinite ? h : 176;
    return Container(
      width: w,
      height: safeH,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: lightPink,
        borderRadius: BorderRadius.circular(radius),
      ),
      child: child,
    );
  }
}
