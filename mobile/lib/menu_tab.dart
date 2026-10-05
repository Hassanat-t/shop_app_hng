import 'package:flutter/material.dart';
import 'models.dart';
import 'product_card.dart';
import 'theme.dart';

/// Exact port of the website's /menu page:
/// serif "THE MENU" heading, subtitle, pill filters, 2-col grid of ProductCards.
class MenuTab extends StatelessWidget {
  final List<Product> shown;
  final String filter;
  final bool loading;
  final String? error;
  final Future<void> Function() onRetry;
  final ValueChanged<String> onFilter;
  final Future<void> Function(Product) onAdd;
  final Future<void> Function(Product) onDec;
  final ValueChanged<Product> onOpen;
  final Map<String, int> qtyBySlug;
  const MenuTab({
    super.key,
    required this.shown,
    required this.filter,
    required this.loading,
    required this.error,
    required this.onRetry,
    required this.onFilter,
    required this.onAdd,
    required this.onDec,
    required this.onOpen,
    required this.qtyBySlug,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: wine));
    }
    if (error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(error!, textAlign: TextAlign.center, style: sansStyle(color: muted)),
            const SizedBox(height: 12),
            FilledButton(style: winePill, onPressed: onRetry, child: const Text('RETRY')),
          ]),
        ),
      );
    }
    return RefreshIndicator(
      color: wine,
      onRefresh: onRetry,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        children: [
          Text('THE MENU', style: serifStyle(size: 34)),
          const SizedBox(height: 2),
          Text('Something sweet for every mood.', style: sansStyle(size: 14, color: muted)),
          const SizedBox(height: 16),
          // Pill filters — same style as the website's ALL/COOKIES/BOBA buttons.
          Wrap(
            spacing: 8,
            children: [
              for (final c in ['all', 'cookies', 'boba'])
                ChoiceChip(
                  label: Text(c.toUpperCase()),
                  selected: filter == c,
                  selectedColor: wine,
                  backgroundColor: Colors.transparent,
                  side: const BorderSide(color: wine),
                  labelStyle: sansStyle(
                    size: 12,
                    color: filter == c ? Colors.white : wine,
                    weight: FontWeight.w700,
                  ),
                  shape: const StadiumBorder(),
                  showCheckmark: false,
                  onSelected: (_) => onFilter(c),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (shown.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Text('No treats here yet. Please check back soon.',
                  textAlign: TextAlign.center, style: sansStyle(color: muted)),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.52,
              ),
              itemCount: shown.length,
              itemBuilder: (context, i) {
                final p = shown[i];
                return ProductCard(
                  product: p,
                  qtyInCart: qtyBySlug[p.slug] ?? 0,
                  onInc: () => onAdd(p),
                  onDec: () => onDec(p),
                  onTap: () => onOpen(p),
                );
              },
            ),
        ],
      ),
    );
  }
}
