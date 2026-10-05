import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'account_orders.dart';
import 'auth_screens.dart';
import 'cart_tab.dart';
import 'checkout.dart';
import 'home_tab.dart';
import 'menu_tab.dart';
import 'models.dart';
import 'product_details.dart';
import 'shop_backend.dart';
import 'theme.dart';

/// App shell: wine header + 5 bottom tabs (native port of website nav/pages).
class PinkOvenShop extends StatefulWidget {
  const PinkOvenShop({super.key});
  @override
  State<PinkOvenShop> createState() => PinkOvenShopState();
}

class PinkOvenShopState extends State<PinkOvenShop> {
  int tab = 0;
  List<Product> products = [];
  List<CartLine> cart = [];
  bool loadingProducts = true;
  bool loadingCart = false;
  String? productsError;
  String? cartError;
  String filter = 'all';
  String? email;

  @override
  void initState() {
    super.initState();
    email = Supabase.instance.client.auth.currentUser?.email;
    Supabase.instance.client.auth.onAuthStateChange.listen((d) {
      if (!mounted) return;
      setState(() => email = d.session?.user.email);
      loadCart();
    });
    loadProducts();
    loadCart();
  }

  Future<void> loadProducts() async {
    setState(() { loadingProducts = true; productsError = null; });
    try {
      products = await ShopBackend.fetchProducts();
    } catch (e) {
      productsError = '$e'.replaceAll('Exception: ', '');
    }
    if (mounted) setState(() => loadingProducts = false);
  }

  Future<void> loadCart() async {
    if (ShopBackend.userId == null) {
      if (mounted) setState(() { cart = []; cartError = null; });
      return;
    }
    if (mounted) setState(() { loadingCart = true; cartError = null; });
    try {
      cart = await ShopBackend.fetchCart();
    } catch (e) {
      // Never swallow this: a blocked RLS policy or a missing cart_items table
      // used to render as "Your cart is empty", which is indistinguishable
      // from a genuinely empty cart and silently breaks the sync demo.
      if (mounted) setState(() => cartError = '$e'.replaceAll('Exception: ', ''));
    }
    if (mounted) setState(() => loadingCart = false);
  }

  Map<String, int> get qtyBySlug {
    final m = <String, int>{};
    for (final l in cart) {
      m[l.product.slug] = (m[l.product.slug] ?? 0) + l.quantity;
    }
    return m;
  }

  int get subtotal => cart.fold(0, (s, l) => s + l.lineTotal);
  int get count => cart.fold(0, (s, l) => s + l.quantity);

  Future<void> add(Product p, [int qty = 1, List<CartOption> options = const []]) async {
    if (ShopBackend.userId == null) {
      await requireLogin();
      if (ShopBackend.userId == null || !mounted) return;
    }
    final key = CartLine(product: p, quantity: 1, options: options).lineKey;
    final existing = cart.where((l) => l.lineKey == key).fold(0, (s, l) => s + l.quantity);
    await ShopBackend.setLine(p, existing + qty, options);
    await loadCart();
  }

  Future<void> dec(Product p) async {
    final lines = cart.where((l) => l.product.slug == p.slug).toList();
    if (lines.isEmpty) return;
    final base = lines.where((l) => l.options.isEmpty).toList();
    final target = base.isNotEmpty ? base.first : lines.first;
    await ShopBackend.setLine(target.product, target.quantity - 1, target.options);
    await loadCart();
  }

  Future<void> setLineQty(CartLine l, int qty) async {
    await ShopBackend.setLine(l.product, qty, l.options);
    await loadCart();
  }

  Future<void> requireLogin() async {
    if (!mounted) return;
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  void goTab(int i) => setState(() => tab = i);

  void openProduct(Product p) {
    final related = products.where((o) => o.slug != p.slug && o.category == p.category).take(4).toList();
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ProductDetailsScreen(
        product: p, related: related, qtyBySlug: qtyBySlug,
        onAdd: add, onDec: dec, onOpen: openProduct,
      ),
    )).then((_) => loadCart());
  }

  Future<void> logout() async {
    await ShopBackend.signOut();
    if (!mounted) return;
    setState(() { cart = []; email = null; tab = 0; });
  }

  void setFilter(String c) => setState(() => filter = c);

  @override
  Widget build(BuildContext context) {
    final shown = filter == 'all' ? products : products.where((p) => p.category == filter).toList();
    const bestSlugs = {'chocolate-chip-thin', 'biscoff-thin', 'white-chocolate-thin', 'taro-boba'};
    final best = products.where((p) => bestSlugs.contains(p.slug)).toList();
    return Scaffold(
      appBar: AppBar(
        title: GestureDetector(onTap: () => goTab(0), child: const Text("tt's pink oven")),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: OutlinedButton(
              style: outlinePill.copyWith(
                  padding: WidgetStateProperty.all(const EdgeInsets.symmetric(horizontal: 12, vertical: 6))),
              onPressed: () => goTab(2),
              child: Text('🛒${count > 0 ? ' ($count)' : ''}',
                  style: sansStyle(size: 13, color: wine, weight: FontWeight.w700)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: email == null
                ? FilledButton(
                    style: winePill.copyWith(
                        padding: WidgetStateProperty.all(const EdgeInsets.symmetric(horizontal: 12, vertical: 6))),
                    onPressed: requireLogin,
                    child: Text('Login', style: sansStyle(size: 13, color: Colors.white, weight: FontWeight.w700)),
                  )
                : FilledButton(
                    style: winePill.copyWith(
                        padding: WidgetStateProperty.all(const EdgeInsets.symmetric(horizontal: 12, vertical: 6))),
                    onPressed: () => goTab(4),
                    child: Text('Account', style: sansStyle(size: 13, color: Colors.white, weight: FontWeight.w700)),
                  ),
          ),
        ],
      ),
      body: IndexedStack(
        index: tab,
        children: [
          HomeTabView(host: this, best: best.isEmpty ? products.take(4).toList() : best),
          MenuTab(
            shown: shown, filter: filter, loading: loadingProducts, error: productsError,
            onRetry: loadProducts, onFilter: setFilter,
            onAdd: (p) => add(p), onDec: dec, onOpen: openProduct, qtyBySlug: qtyBySlug,
          ),
          CartTab(
            cart: cart, loading: loadingCart, subtotal: subtotal, error: cartError, onRefresh: loadCart,
            onSetQty: setLineQty, onCheckout: () => goTab(3),
            onContinueShopping: () => goTab(1),
          ),
          CheckoutTab(onLoadCart: loadCart, onBrowseMenu: () => goTab(1)),
          AccountTabView(host: this),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: goTab,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.cake_outlined), selectedIcon: Icon(Icons.cake), label: 'Menu'),
          NavigationDestination(icon: Icon(Icons.shopping_bag_outlined), selectedIcon: Icon(Icons.shopping_bag), label: 'Cart'),
          NavigationDestination(icon: Icon(Icons.receipt_outlined), selectedIcon: Icon(Icons.receipt), label: 'Checkout'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Account'),
        ],
      ),
    );
  }
}
