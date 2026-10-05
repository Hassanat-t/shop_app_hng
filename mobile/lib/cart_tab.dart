import 'package:flutter/material.dart';
import 'models.dart';
import 'product_image.dart';
import 'theme.dart';

/// Port of the website's /cart page: serif "Your Cart (n)", cream item
/// cards with image/qty stepper/remove, subtotal box, CONTINUE SHOPPING
/// (outline) + PROCEED TO CHECKOUT (wine) pills.
class CartTab extends StatelessWidget {
  final List<CartLine> cart;
  final bool loading;
  final int subtotal;
  final String? error;
  final Future<void> Function() onRefresh;
  final Future<void> Function(CartLine, int) onSetQty;
  final VoidCallback onCheckout;
  final VoidCallback onContinueShopping;
  const CartTab({
    super.key,
    required this.cart,
    required this.loading,
    required this.subtotal,
    this.error,
    required this.onRefresh,
    required this.onSetQty,
    required this.onCheckout,
    required this.onContinueShopping,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: wine));
    }
    if (cart.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(error == null ? 'Your cart is empty' : 'Could not load your cart',
                textAlign: TextAlign.center, style: serifStyle(size: 26)),
            const SizedBox(height: 8),
            Text(
              error ?? 'Something sweet is waiting for you.',
              textAlign: TextAlign.center,
              style: sansStyle(size: 14, color: error == null ? muted : const Color(0xFFB91C1C)),
            ),
            const SizedBox(height: 24),
            FilledButton(style: winePill, onPressed: onContinueShopping, child: const Text('CONTINUE SHOPPING')),
            const SizedBox(height: 12),
            OutlinedButton(style: outlinePill, onPressed: onRefresh, child: const Text('REFRESH FROM SERVER')),
          ]),
        ),
      );
    }
    return RefreshIndicator(
      color: wine,
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        children: [
          Text('Your Cart (${cart.fold(0, (s, l) => s + l.quantity)})', style: serifStyle(size: 28)),
          const SizedBox(height: 16),
          for (final l in cart) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cream,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x4DE8B7C2)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ProductImage(imageUrl: l.product.imageUrl, size: 72, radius: 12),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(l.product.name, style: sansStyle(size: 15, color: wine, weight: FontWeight.w700)),
                        for (final o in l.options)
                          Text('${o.label}: ${o.value}', style: sansStyle(size: 12, color: muted)),
                        Text(formatNGN(l.unitPrice), style: sansStyle(size: 14, weight: FontWeight.w700)),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            _StepperBtn(label: '−', onTap: () => onSetQty(l, l.quantity - 1)),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              child: Text('${l.quantity}', style: sansStyle(size: 14, weight: FontWeight.w700)),
                            ),
                            _StepperBtn(label: '+', onTap: () => onSetQty(l, l.quantity + 1)),
                            const SizedBox(width: 12),
                            GestureDetector(
                              onTap: () => onSetQty(l, 0),
                              child: Text('Remove',
                                  style: sansStyle(size: 12).copyWith(decoration: TextDecoration.underline)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Text(formatNGN(l.lineTotal), style: sansStyle(size: 15, color: wine, weight: FontWeight.w700)),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x33000000)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Subtotal', style: sansStyle(size: 15, color: wine, weight: FontWeight.w700)),
                    Text(formatNGN(subtotal), style: sansStyle(size: 15, color: wine, weight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: outlinePill,
                        onPressed: onContinueShopping,
                        child: const Text('CONTINUE SHOPPING'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        style: winePill,
                        onPressed: onCheckout,
                        child: const Text('CHECKOUT'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StepperBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _StepperBtn({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: Container(
        width: 28,
        height: 28,
        alignment: Alignment.center,
        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: wine)),
        child: Text(label, style: sansStyle(size: 14, color: wine, weight: FontWeight.w700)),
      ),
    );
  }
}
