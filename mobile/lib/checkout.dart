import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config.dart';
import 'models.dart';
import 'shop_backend.dart';
import 'theme.dart';

/// Port of the website's /checkout page: white form card (serif "Checkout",
/// inputs, PICKUP/DELIVERY pills, PLACE ORDER) + cream ORDER SUMMARY card.
class CheckoutTab extends StatefulWidget {
  final Future<void> Function() onLoadCart;
  final VoidCallback onBrowseMenu;
  const CheckoutTab({super.key, required this.onLoadCart, required this.onBrowseMenu});

  @override
  State<CheckoutTab> createState() => CheckoutTabState();
}

class CheckoutTabState extends State<CheckoutTab> {
  final name = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  final address = TextEditingController();
  final notes = TextEditingController();
  String fulfil = 'pickup';
  bool loading = false;
  String? msg;
  String? orderNumber;
  List<CartLine> cart = [];
  bool loadingCart = true;

  @override
  void initState() {
    super.initState();
    load();
    email.text = Supabase.instance.client.auth.currentUser?.email ?? '';
  }

  Future<void> load() async {
    try {
      cart = await ShopBackend.fetchCart();
    } catch (_) {}
    if (mounted) setState(() => loadingCart = false);
  }

  Future<void> place() async {
    setState(() { loading = true; msg = null; });
    try {
      if (name.text.trim().length < 2) throw StateError('Enter full name.');
      if (!email.text.contains('@')) throw StateError('Enter valid email.');
      if (phone.text.trim().length < 5) throw StateError('Enter phone.');
      if (fulfil == 'delivery' && address.text.trim().isEmpty) {
        throw StateError('Enter delivery address.');
      }
      if (cart.isEmpty) throw StateError('Cart is empty.');
      final num = await ShopBackend.placeOrderDirect(
        customerName: name.text.trim(),
        email: email.text.trim(),
        phone: phone.text.trim(),
        fulfilment: fulfil,
        address: address.text.trim(),
        notes: notes.text.trim(),
        lines: cart,
      );
      setState(() { orderNumber = num; cart = []; });
      await widget.onLoadCart();
    } catch (e) {
      final s = '$e';
      setState(() {
        msg = s.contains('row-level security') || s.contains('policy')
            ? 'Checkout needs orders INSERT policy. Run supabase/cart.sql.'
            : s.replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Widget _pill(String label, bool selected, VoidCallback onTap) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      selectedColor: wine,
      backgroundColor: Colors.transparent,
      side: const BorderSide(color: wine),
      labelStyle: sansStyle(size: 12, color: selected ? Colors.white : wine, weight: FontWeight.w700),
      shape: const StadiumBorder(),
      showCheckmark: false,
      onSelected: (_) => onTap(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sub = cart.fold(0, (s, l) => s + l.lineTotal);
    final fee = fulfil == 'delivery' ? AppConfig.deliveryFee : 0;

    if (orderNumber != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text('Order placed!', style: serifStyle(size: 30)),
            const SizedBox(height: 8),
            Text('Order number: $orderNumber', style: sansStyle(size: 14, color: muted)),
            const SizedBox(height: 4),
            Text('Pay on pickup/delivery.', style: sansStyle(size: 13, color: muted)),
            const SizedBox(height: 24),
            FilledButton(style: winePill, onPressed: widget.onBrowseMenu, child: const Text('SHOP THE MENU')),
          ]),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x33000000)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Checkout', style: serifStyle(size: 26)),
              const SizedBox(height: 12),
              if (msg != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(msg!, style: sansStyle(size: 13, color: const Color(0xFFB91C1C))),
                ),
              ],
              if (loadingCart) const LinearProgressIndicator(color: wine),
              TextField(controller: name, decoration: const InputDecoration(labelText: 'Full name')),
              const SizedBox(height: 12),
              TextField(
                controller: email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Phone number'),
              ),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(child: _pill('PICKUP', fulfil == 'pickup', () => setState(() => fulfil = 'pickup'))),
                const SizedBox(width: 10),
                Expanded(child: _pill('DELIVERY', fulfil == 'delivery', () => setState(() => fulfil = 'delivery'))),
              ]),
              if (fulfil == 'delivery') ...[
                const SizedBox(height: 12),
                TextField(controller: address, maxLines: 2, decoration: const InputDecoration(labelText: 'Delivery address')),
              ],
              const SizedBox(height: 12),
              TextField(controller: notes, maxLines: 2, decoration: const InputDecoration(labelText: 'Order notes (optional)')),
              const SizedBox(height: 18),
              FilledButton(
                style: winePill.copyWith(minimumSize: WidgetStateProperty.all(const Size.fromHeight(48))),
                onPressed: loading ? null : place,
                child: loading
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('PLACE ORDER · ${formatNGN(sub + fee)}'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: cream,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x66E8B7C2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('ORDER SUMMARY', style: sansStyle(size: 14, color: wine, weight: FontWeight.w700)),
              const SizedBox(height: 12),
              if (cart.isEmpty)
                Text('Your cart is empty.', style: sansStyle(size: 13, color: muted))
              else ...[
                for (final l in cart)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text('${l.product.name} x ${l.quantity}',
                              style: sansStyle(size: 13), overflow: TextOverflow.ellipsis),
                        ),
                        Text(formatNGN(l.lineTotal), style: sansStyle(size: 13)),
                      ],
                    ),
                  ),
                const Divider(color: Color(0x33000000)),
                _sumRow('Subtotal', formatNGN(sub)),
                _sumRow('Delivery fee', formatNGN(fee)),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total', style: sansStyle(size: 17, color: wine, weight: FontWeight.w700)),
                    Text(formatNGN(sub + fee), style: sansStyle(size: 17, color: wine, weight: FontWeight.w700)),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _sumRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(label, style: sansStyle(size: 13)), Text(value, style: sansStyle(size: 13))],
      ),
    );
  }
}
