// Shared Supabase cart logic used by website (/api/cart) and the Flutter app.
// One row per (user_id, product_id, options_sig) so both clients see one cart.
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config.dart';
import 'models.dart';

String optionsSig(List<CartOption> options) {
  final parts = options.map((o) => '${o.label}=${o.value}').toList()..sort();
  return parts.join(',');
}

/// Thrown when the phone has no network path to Supabase: carries the bundled
/// menu so the UI can still render products + SVG art offline.
class FallbackProductsException implements Exception {
  final List<Product> products;
  const FallbackProductsException(this.products);
}

class ShopBackend {
  static SupabaseClient get _db => Supabase.instance.client;

  static String? get userId => _db.auth.currentUser?.id;

  /// Email/password login against the SAME Supabase Auth project as the website.
  static Future<void> signIn(String email, String password) async {
    await _db.auth.signInWithPassword(email: email.trim(), password: password);
  }

  /// Returns true when Supabase requires email confirmation before login.
  static Future<bool> signUp(String email, String password, {String name = ''}) async {
    final res = await _db.auth.signUp(
      email: email.trim(),
      password: password,
      data: name.isEmpty ? null : {'full_name': name},
    );
    final u = res.user;
    if (u != null && name.isNotEmpty) {
      await _db.from('profiles').upsert({'id': u.id, 'email': email.trim(), 'full_name': name});
    }
    // session == null → confirm-email flow is on (user must verify first).
    return res.session == null && u != null;
  }

  static Future<void> signOut() async {
    try {
      await GoogleSignIn().disconnect();
    } catch (_) {}
    return _db.auth.signOut();
  }

  /// Google OAuth — SAME Supabase Auth project as the website, so the
  /// auth.users.id (and therefore cart + orders) is identical on both.
  /// Setup: Supabase dashboard → Auth → Sign In → Google ON (same client
  /// id/secret as the website), plus an Android OAuth client for this app's
  /// package (see mobile/GOOGLE_SETUP.md). No password is ever stored.
  static Future<void> signInWithGoogle() async {
    final serverId = AppConfig.googleWebClientId.trim();
    if (serverId.isEmpty) {
      throw StateError(
        'Google sign-in is not configured. Run with '
        '--dart-define=GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com '
        '(see mobile/GOOGLE_SETUP.md). Email login works now.',
      );
    }
    final google = GoogleSignIn(
      serverClientId: serverId,
      scopes: const ['email', 'openid'],
    );
    // google_sign_in v6 caches the last account: a previous token-less login
    // is silently reused and fails with a null idToken every retry. Sign out
    // first so each attempt does a fresh native sign-in.
    try {
      await google.signOut();
    } catch (_) {}
    final account = await google.signIn();
    if (account == null) throw StateError('Google sign-in cancelled.');
    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw StateError(
        'Google did not return an ID token. Add an Android OAuth client for '
        'com.ttpinkoven.tt_pink_oven_mobile with this device\'s SHA-1 in '
        'Google Cloud (see mobile/GOOGLE_SETUP.md), then try again.',
      );
    }
    await _db.auth.signInWithIdToken(
      provider: OAuthProvider.google,
      idToken: idToken,
      accessToken: auth.accessToken,
    );
  }

  static Future<List<Product>> fetchProducts() async {
    try {
      final rows =
          await _db.from('products').select().eq('is_active', true).order('created_at');
      final list =
          (rows as List).map((r) => Product.fromJson(Map<String, dynamic>.from(r as Map))).toList();
      if (list.isEmpty) return fallbackProducts;
      return list;
    } catch (e) {
      // No network (DNS/host-lookup failure, airplane mode, emulator offline):
      // serve the bundled menu so the shop still renders with art. The caller
      // still surfaces a friendly banner via friendlyNetworkError.
      final s = '$e'.toLowerCase();
      if (s.contains('failed host lookup') ||
          s.contains('no address associated with hostname') ||
          s.contains('socketexception') ||
          s.contains('network is unreachable') ||
          s.contains('connection refused') ||
          s.contains('connection timed out') ||
          s.contains('timeoutexception') ||
          s.contains('clientexception')) {
        throw FallbackProductsException(fallbackProducts);
      }
      rethrow;
    }
  }

  static Future<List<CartLine>> fetchCart() async {
    final uid = userId;
    if (uid == null) return [];
    final rows = await _db
        .from('cart_items')
        .select('quantity, options, product:products(*)')
        .eq('user_id', uid)
        .order('created_at');
    final out = <CartLine>[];
    for (final r in (rows as List)) {
      final m = Map<String, dynamic>.from(r as Map);
      final p = m['product'];
      if (p == null) continue;
      final opts = ((m['options'] as List?) ?? [])
          .map((o) => CartOption.fromJson(Map<String, dynamic>.from(o as Map)))
          .toList();
      out.add(CartLine(
        product: Product.fromJson(Map<String, dynamic>.from(p as Map)),
        quantity: (m['quantity'] as num?)?.toInt() ?? 0,
        options: opts,
      ));
    }
    return out.where((l) => l.quantity > 0).toList();
  }

  /// Add-or-replace one shared cart line (mobile -> website sync path).
  static Future<void> setLine(Product product, int quantity, [List<CartOption> options = const []]) async {
    final uid = userId;
    if (uid == null) throw StateError('Login required.');
    final sig = optionsSig(options);
    if (quantity <= 0) {
      await _db.from('cart_items').delete().eq('user_id', uid).eq('product_id', product.id).eq('options_sig', sig);
      return;
    }
    await _db.from('cart_items').upsert(
      {
        'user_id': uid,
        'product_id': product.id,
        'quantity': quantity.clamp(1, 50),
        'options': options.map((o) => o.toJson()).toList(),
        'options_sig': sig,
      },
      onConflict: 'user_id,product_id,options_sig',
    );
  }

  static Future<void> clearCart() async {
    final uid = userId;
    if (uid == null) return;
    await _db.from('cart_items').delete().eq('user_id', uid);
  }

  /// Realtime stream of MY cart rows — website edits appear live in the app.
  static Stream<List<Map<String, dynamic>>> watchMyCart() {
    final uid = userId;
    if (uid == null) return const Stream.empty();
    return _db.from('cart_items').stream(primaryKey: ['id']).eq('user_id', uid);
  }

  /// Checkout via the existing website API route is intentionally NOT used:
  /// a physical phone cannot reach the dev server's localhost, so the app
  /// inserts into the same orders/order_items tables directly.
  static Future<Map<String, dynamic>> placeOrderViaApi({
    required String baseUrl,
    required String customerName,
    required String email,
    required String phone,
    required String fulfilment,
    required String address,
    required String notes,
    required List<CartLine> lines,
  }) async {
    throw UnimplementedError(
        'Use placeOrderDirect: phones cannot reach the website localhost API.');
  }

  /// Direct order insert using the same orders/order_items tables as the site.
  /// Requires the RLS INSERT policies in supabase/cart.sql
  /// (phones use the anon key; the service-role key must never ship in the app).
  static Future<String> placeOrderDirect({
    required String customerName,
    required String email,
    required String phone,
    required String fulfilment,
    required String address,
    required String notes,
    required List<CartLine> lines,
  }) async {
    final uid = userId;
    if (uid == null) throw StateError('Login required.');
    final subtotal = lines.fold(0, (s, l) => s + l.lineTotal);
    final fee = fulfilment == 'delivery' ? AppConfig.deliveryFee : 0;
    final total = subtotal + fee;
    final now = DateTime.now();
    final orderNumber =
        'TPO-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-${(1000 + (DateTime.now().millisecond % 9000))}';
    final order = await _db.from('orders').insert({
      'user_id': uid,
      'order_number': orderNumber,
      'customer_name': customerName,
      'email': email,
      'phone': phone,
      'fulfilment_method': fulfilment,
      'delivery_address': address,
      'notes': notes,
      'subtotal': subtotal,
      'delivery_fee': fee,
      'total': total,
      'status': 'pending',
    }).select('id').single();
    final oid = (order as Map)['id'] as String;
    await _db.from('order_items').insert(lines.map((l) => {
          'order_id': oid,
          'product_id': l.product.id,
          'product_name': l.product.name,
          'unit_price': l.unitPrice,
          'quantity': l.quantity,
          'line_total': l.lineTotal,
        }).toList());
    await clearCart();
    return orderNumber;
  }
}
