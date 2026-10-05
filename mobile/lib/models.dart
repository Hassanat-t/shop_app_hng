// Shared types mirror the website's src/types/index.ts + Supabase schema.
class CartOption {
  final String label;
  final String value;
  final int priceDelta;
  const CartOption({required this.label, required this.value, this.priceDelta = 0});

  Map<String, dynamic> toJson() => {'label': label, 'value': value, 'priceDelta': priceDelta};

  factory CartOption.fromJson(Map<String, dynamic> j) => CartOption(
        label: '${j['label'] ?? ''}',
        value: '${j['value'] ?? ''}',
        priceDelta: (j['priceDelta'] as num?)?.toInt() ?? 0,
      );
}

class Product {
  final String id;
  final String name;
  final String slug;
  final String description;
  final String category; // cookies | boba
  final int price; // NGN
  final String imageUrl;
  final String? badge;
  const Product({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.category,
    required this.price,
    required this.imageUrl,
    this.badge,
  });

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: '${j['id'] ?? ''}',
        name: '${j['name'] ?? ''}',
        slug: '${j['slug'] ?? ''}',
        description: '${j['description'] ?? ''}',
        category: '${j['category'] ?? ''}',
        price: (j['price'] as num?)?.toInt() ?? 0,
        imageUrl: '${j['image_url'] ?? ''}',
        badge: j['badge'] == null ? null : '${j['badge']}',
      );
}

class CartLine {
  final Product product;
  final int quantity;
  final List<CartOption> options;
  const CartLine({required this.product, required this.quantity, this.options = const []});

  String get lineKey {
    final sig = options.map((o) => '${o.label}=${o.value}').toList()..sort();
    return '${product.slug.isNotEmpty ? product.slug : product.id}|${sig.join(',')}';
  }

  int get unitPrice => product.price + options.fold(0, (s, o) => s + o.priceDelta);
  int get lineTotal => unitPrice * quantity;
}

String formatNGN(int n) {
  final s = n.toString();
  final buf = StringBuffer();
  var count = 0;
  for (var i = s.length - 1; i >= 0; i--) {
    buf.write(s[i]);
    count++;
    if (count % 3 == 0 && i != 0) buf.write(',');
  }
  return '₦${buf.toString().split('').reversed.join()}';
}

/// Bundled menu used when the phone is offline (DNS failure, airplane mode,
/// emulator with no network). Mirrors the website's src/data/products.ts and
/// the Supabase seed rows; image_urls match assets/products/*.svg exactly so
/// the menu renders with art even with zero connectivity.
const List<Product> fallbackProducts = [
  Product(
    id: 'p-choc-chip',
    name: 'Chocolate Chip Thin',
    slug: 'chocolate-chip-thin',
    description:
        'Thin, crisp-edged and chewy in the middle, loaded with chocolate chips.',
    category: 'cookies',
    price: 2500,
    imageUrl: '/products/chocolate-chip.svg',
    badge: '#1 TOP PICK',
  ),
  Product(
    id: 'p-biscoff',
    name: 'Biscoff Thin',
    slug: 'biscoff-thin',
    description: 'A buttery thin cookie with caramelised Biscoff flavour.',
    category: 'cookies',
    price: 2800,
    imageUrl: '/products/biscoff.svg',
  ),
  Product(
    id: 'p-white-choc',
    name: 'White Chocolate Thin',
    slug: 'white-chocolate-thin',
    description: 'A delicate thin cookie packed with creamy white chocolate.',
    category: 'cookies',
    price: 2800,
    imageUrl: '/products/white-chocolate.svg',
  ),
  Product(
    id: 'p-oreo-cookie',
    name: 'Oreo Thin',
    slug: 'oreo-thin',
    description: 'A chocolatey thin cookie loaded with Oreo pieces.',
    category: 'cookies',
    price: 2800,
    imageUrl: '/products/oreo-cookie.svg',
  ),
  Product(
    id: 'p-taro',
    name: 'Taro Boba',
    slug: 'taro-boba',
    description: 'Creamy taro milk tea with chewy boba pearls.',
    category: 'boba',
    price: 3500,
    imageUrl: '/products/taro-boba.svg',
    badge: 'BEST SELLER',
  ),
  Product(
    id: 'p-milk-tea',
    name: 'Milk Tea Boba',
    slug: 'milk-tea-boba',
    description: 'Classic creamy milk tea served with chewy boba pearls.',
    category: 'boba',
    price: 3200,
    imageUrl: '/products/milk-tea.svg',
  ),
  Product(
    id: 'p-oreo-boba',
    name: 'Oreo Boba',
    slug: 'oreo-boba',
    description: 'Sweet creamy milk tea blended with Oreo goodness and boba.',
    category: 'boba',
    price: 3800,
    imageUrl: '/products/oreo-boba.svg',
    badge: 'NEW',
  ),
  Product(
    id: 'p-lychee',
    name: 'Lychee Boba',
    slug: 'lychee-boba',
    description: 'Refreshing lychee tea with chewy boba pearls.',
    category: 'boba',
    price: 3400,
    imageUrl: '/products/lychee-boba.svg',
  ),
];

/// Turns a raw network failure (SocketException host lookup, timeouts,
/// ClientException walls) into one friendly line for the UI.
String friendlyNetworkError(Object e) {
  final s = '$e'.toLowerCase();
  if (s.contains('failed host lookup') ||
      s.contains('no address associated with hostname') ||
      s.contains('socketexception') ||
      s.contains('network is unreachable') ||
      s.contains('connection refused') ||
      s.contains('connection timed out') ||
      s.contains('timeoutexception')) {
    return 'No internet connection. Check your Wi-Fi or mobile data, then tap RETRY.';
  }
  return '$e'.replaceAll('Exception: ', '');
}
