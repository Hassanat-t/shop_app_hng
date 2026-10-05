import 'package:flutter/material.dart';
import 'home.dart';
import 'models.dart';
import 'product_card.dart';
import 'theme.dart';

/// Native port of the website home page (src/app/page.tsx):
/// hero + ORDER NOW / VIEW MENU + best sellers + story band + CTA.
class HomeTabView extends StatelessWidget {
  final PinkOvenShopState host;
  final List<Product> best;
  const HomeTabView({super.key, required this.host, required this.best});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
      children: [
        Text('THIN COOKIES.\nGOOD VIBES.\nBOBA TOO.', style: serifStyle(size: 38, height: 1.05)),
        const SizedBox(height: 10),
        Text('Freshly baked thin cookies and creamy boba made for your sweet moments.',
            style: sansStyle(size: 14, color: muted)),
        const SizedBox(height: 18),
        Row(children: [
          Expanded(child: FilledButton(style: winePill, onPressed: () => host.goTab(1), child: const Text('ORDER NOW'))),
          const SizedBox(width: 12),
          Expanded(child: OutlinedButton(style: outlinePill, onPressed: () => host.goTab(1), child: const Text('VIEW MENU'))),
        ]),
        const SizedBox(height: 16),
        Text('PREMIUM INGREDIENTS · FRESHLY MADE · MADE WITH LOVE',
            style: sansStyle(size: 10, color: wine, weight: FontWeight.w700)),
        const SizedBox(height: 28),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('Your Favorites\nRight Here', style: serifStyle(size: 24)),
          OutlinedButton(style: outlinePill, onPressed: () => host.goTab(1), child: const Text('VIEW ALL')),
        ]),
        const SizedBox(height: 12),
        if (host.loadingProducts)
          const Center(child: CircularProgressIndicator(color: wine))
        else if (host.productsError != null)
          Text(host.productsError!, style: sansStyle(color: muted))
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.52),
            itemCount: best.length,
            itemBuilder: (context, i) {
              final p = best[i];
              return ProductCard(
                product: p, qtyInCart: host.qtyBySlug[p.slug] ?? 0,
                onInc: () => host.add(p), onDec: () => host.dec(p), onTap: () => host.openProduct(p),
              );
            },
          ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: wine, borderRadius: BorderRadius.circular(28)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('RELAX. SIP. ENJOY.', style: sansStyle(size: 11, color: pink, weight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text('BAKED WITH LOVE.\nSERVED WITH GOOD VIBES.',
                style: serifStyle(size: 24, color: Colors.white)),
            const SizedBox(height: 8),
            Text("tt's pink oven combines thin, chewy cookies with creamy boba drinks.",
                style: sansStyle(size: 13, color: const Color(0xD9FFFFFF))),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: ['Freshly made', 'Premium ingredients', 'Made with love', 'Sweet moments']
                  .map((f) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                            color: const Color(0x1AFFFFFF), borderRadius: BorderRadius.circular(16)),
                        child: Text(f,
                            style: sansStyle(size: 12, color: Colors.white, weight: FontWeight.w600)),
                      ))
                  .toList(),
            ),
          ]),
        ),
        const SizedBox(height: 24),
        Center(
            child: Text('YOUR NEXT FAVOURITE TREAT IS WAITING.',
                textAlign: TextAlign.center, style: serifStyle(size: 22))),
        const SizedBox(height: 12),
        Center(
            child:
                FilledButton(style: winePill, onPressed: () => host.goTab(1), child: const Text('SHOP THE MENU'))),
      ],
    );
  }
}
