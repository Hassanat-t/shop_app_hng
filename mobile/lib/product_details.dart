import 'package:flutter/material.dart';

import 'models.dart';
import 'product_image.dart';
import 'product_card.dart';


/// Port of the website's /menu/[slug] page (ProductView.tsx): big art,
/// category kicker, serif name, description, price, boba size pills
/// (+₦500 Large), qty stepper, ADD TO CART, "You may also like".
class ProductDetailsScreen extends StatefulWidget {
  final Product product;
  final List<Product> related;
  final Map<String, int> qtyBySlug;
  final Future<void> Function(Product, int, List<CartOption>) onAdd;
  final void Function(Product) onDec;
  final ValueChanged<Product> onOpen;
  const ProductDetailsScreen({
    super.key,
    required this.product,
    required this.related,
    required this.qtyBySlug,
    required this.onAdd,
    required this.onDec,
    required this.onOpen,
  });

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

// _SizeButton moved to top-level to avoid "class_in_class" error
class _SizeButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _SizeButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: selected ? Colors.red : Colors.transparent,
          border: Border.all(color: Colors.red),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: selected ? Colors.white : Colors.red,
            fontWeight: FontWeight.w700,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

// _QtyButton moved to top-level to avoid "class_in_class" error
class _QtyButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _QtyButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.red),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Icon(
          icon,
          color: Colors.red,
          size: 20,
        ),
      ),
    );
  }
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  String size = 'Regular';
  int _qty = 1;

  int get sizeDelta => widget.product.category == 'boba' && size == 'Large' ? 500 : 0;

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    return Scaffold(
      appBar: AppBar(title: const Text("tt's pink oven")),
      body: ListView(
        padding: EdgeInsets.fromLTRB(16, 20, 16, 32),
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Container(
              color: Colors.amber,
              child: ProductImage(imageUrl: p.imageUrl, size: double.infinity, radius: 24),
            ),
          ),
          const SizedBox(height: 18),
          Text(p.category.toUpperCase(), style: TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(p.name, style: TextStyle(fontSize: 34)),
          const SizedBox(height: 8),
          Text(p.description, style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 14),
          Text("${p.price + sizeDelta}", style: TextStyle(fontSize: 26, color: Colors.red, fontWeight: FontWeight.w700)),
          // Boba size selector (only for boba category)
          if (p.category == 'boba') ...[
            const SizedBox(height: 16),
            Text('Size', style: TextStyle(fontSize: 14, color: Colors.red, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _SizeButton(
                    label: 'Regular',
                    selected: size == 'Regular',
                    onTap: () => setState(() => size = 'Regular'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _SizeButton(
                    label: 'Large',
                    selected: size == 'Large',
                    onTap: () => setState(() => size = 'Large'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '+₦500',
              style: TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.w600),
            ),
          ],
          const SizedBox(height: 24),
          Row(
            children: [
              _QtyButton(
                icon: Icons.remove,
                onTap: () {
                  setState(() {
                    if (_qty > 1) _qty--;
                  });
                },
              ),
              const SizedBox(width: 12),
              Text(
                '$_qty',
                style: TextStyle(fontSize: 18, color: Colors.red, fontWeight: FontWeight.w700),
              ),
              const SizedBox(width: 12),
              _QtyButton(
                icon: Icons.add,
                onTap: () {
                  setState(() {
                    if (_qty < 50) _qty++;
                  });
                },
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ButtonStyle(
                minimumSize: WidgetStateProperty.all(const Size.fromHeight(48)),
              ),
              onPressed: () async {
                final List<CartOption> options = p.category == 'boba'
                    ? [CartOption(label: 'Size', value: size, priceDelta: size == 'Large' ? 500 : 0)]
                    : [];
                await widget.onAdd(p, _qty, options);
                if (!mounted) return;
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Added to cart!'),
                    backgroundColor: Colors.red,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              child: const Text('ADD TO CART'),
            ),
          ),
          const SizedBox(height: 32),
          if (widget.related.isNotEmpty) ...[
            Text('You may also like', style: TextStyle(fontSize: 18, color: Colors.red, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            SizedBox(
              height: 120,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  for (final related in widget.related)
                    Padding(
                      padding: EdgeInsets.only(right: 12),
                      child: ProductCard(
                        product: related,
                        qtyInCart: widget.qtyBySlug[related.slug] ?? 0,
                        onInc: () => widget.onAdd(related, 1, []),
                        onDec: () => widget.onDec(related),
                        onTap: () => widget.onOpen(related),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}