import 'package:flutter/material.dart';
import 'models.dart';
import 'product_image.dart';
import 'theme.dart';

/// Exact mobile port of the website's src/components/products/ProductCard.tsx:
/// cream card, rounded-2xl, SVG image, wine badge, name, 2-line description,
/// price + circular +/− stepper (or plain + when not in cart).
class ProductCard extends StatelessWidget {
  final Product product;
  final int qtyInCart;
  final VoidCallback onInc;
  final VoidCallback onDec;
  final VoidCallback? onTap;
  const ProductCard({
    super.key,
    required this.product,
    required this.qtyInCart,
    required this.onInc,
    required this.onDec,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: cream,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x4DE8B7C2)), // pink/30
        boxShadow: const [
          BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, 3)),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: onTap,
            child: ProductImage(
              imageUrl: product.imageUrl,
              size: double.infinity,
              radius: 12,
            ),
          ),
          const SizedBox(height: 8),
          if (product.badge != null && product.badge!.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: wine,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(product.badge!,
                  style: sansStyle(size: 10, color: Colors.white, weight: FontWeight.w700)),
            ),
          GestureDetector(
            onTap: onTap,
            child: Text(product.name, style: sansStyle(size: 15, color: wine, weight: FontWeight.w700)),
          ),
          const SizedBox(height: 2),
          Text(
            product.description,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: sansStyle(size: 12, color: muted),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(formatNGN(product.price),
                    style: sansStyle(size: 15, color: wine, weight: FontWeight.w700),
                    overflow: TextOverflow.ellipsis),
              ),
              qtyInCart == 0
                  ? _RoundBtn(label: '+', filled: true, onTap: onInc, size: 32)
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _RoundBtn(label: '−', filled: false, onTap: onDec, size: 28),
                        SizedBox(
                          width: 26,
                          child: Text('$qtyInCart',
                              textAlign: TextAlign.center,
                              style: sansStyle(size: 14, color: wine, weight: FontWeight.w700)),
                        ),
                        _RoundBtn(label: '+', filled: true, onTap: onInc, size: 28),
                      ],
                    ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RoundBtn extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;
  final double size;
  const _RoundBtn({required this.label, required this.filled, required this.onTap, required this.size});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: filled ? wine : Colors.transparent,
          border: filled ? null : Border.all(color: wine),
        ),
        child: Text(label,
            style: sansStyle(size: size * 0.5, color: filled ? Colors.white : wine, weight: FontWeight.w700)),
      ),
    );
  }
}
