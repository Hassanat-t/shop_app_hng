import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'theme.dart';

/// Renders the website's product art on the phone.
/// image_url from Supabase is like "/products/taro-boba.svg"; the same SVGs
/// are bundled as assets (assets/products/) so no localhost fetch is needed.
class ProductImage extends StatelessWidget {
  final String imageUrl;
  final double size;
  final double radius;
  const ProductImage({super.key, required this.imageUrl, this.size = 72, this.radius = 16});

  String? get assetPath {
    if (imageUrl.isEmpty) return null;
    final file = imageUrl.split('/').last;
    if (file.isEmpty) return null;
    return 'assets/products/$file';
  }

  @override
  Widget build(BuildContext context) {
    final asset = assetPath;
    return Container(
      width: size,
      height: size,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: lightPink,
        borderRadius: BorderRadius.circular(radius),
      ),
      child: asset == null
          ? Center(child: Icon(Icons.cake_outlined, color: wine, size: size * 0.4))
          : SvgPicture.asset(asset, width: size, height: size, fit: BoxFit.cover),
    );
  }
}
