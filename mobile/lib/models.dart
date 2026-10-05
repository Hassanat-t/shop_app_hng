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
