import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'auth_screens.dart';
import 'home.dart';
import 'theme.dart';

/// Native port of /account/orders: profile header, order list w/ detail
/// sheets, logout. Same Supabase auth + orders as the website.
class AccountTabView extends StatefulWidget {
  final PinkOvenShopState host;
  const AccountTabView({super.key, required this.host});

  @override
  State<AccountTabView> createState() => _AccountTabViewState();
}

class _AccountTabViewState extends State<AccountTabView> {
  List<Map<String, dynamic>> orders = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final db = Supabase.instance.client;
      final uid = db.auth.currentUser?.id;
      if (uid == null) {
        if (mounted) setState(() { loading = false; orders = []; });
        return;
      }
      final rows = await db.from('orders').select().eq('user_id', uid).order('created_at', ascending: false);
      orders = (rows as List).map((r) => Map<String, dynamic>.from(r as Map)).toList();
    } catch (e) {
      error = '$e'.replaceAll('Exception: ', '');
    }
    if (mounted) setState(() => loading = false);
  }


  Future<void> _showDetail(Map<String, dynamic> o) async {
    List<Map<String, dynamic>> items = [];
    try {
      final db = Supabase.instance.client;
      final rows = await db.from('order_items').select().eq('order_id', o['id']);
      items = (rows as List).map((r) => Map<String, dynamic>.from(r as Map)).toList();
    } catch (_) {}
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4,
              decoration: BoxDecoration(color: pink, borderRadius: BorderRadius.circular(999)))),
          const SizedBox(height: 12),
          Text("${o['order_number']}", style: serifStyle(size: 22)),
          Text("${o['fulfilment_method']} · ${o['status']}", style: sansStyle(size: 12, color: muted)),
          const SizedBox(height: 12),
          for (final it in items)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Expanded(child: Text("${it['product_name']} x ${it['quantity']}", style: sansStyle(size: 13))),
                Text("₦${it['line_total']}", style: sansStyle(size: 13, weight: FontWeight.w700)),
              ]),
            ),
          const Divider(),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Total', style: sansStyle(size: 15, color: wine, weight: FontWeight.w700)),
            Text("₦${o['total']}", style: sansStyle(size: 15, color: wine, weight: FontWeight.w700)),
          ]),
        ]),
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    final email = widget.host.email;
    if (email == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text("Welcome to tt's pink oven", textAlign: TextAlign.center, style: serifStyle(size: 28)),
            const SizedBox(height: 6),
            Text('Sign in to continue', style: sansStyle(size: 14, color: muted)),
            const SizedBox(height: 20),
            FilledButton(
              style: winePill.copyWith(minimumSize: WidgetStateProperty.all(const Size.fromHeight(48))),
              onPressed: () async {
                await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
                _load();
              },
              child: const Text('LOGIN / SIGN UP'),
            ),
          ]),
        ),
      );
    }
    return RefreshIndicator(
      color: wine,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        children: [
          Text('My Account', style: serifStyle(size: 30)),
          const SizedBox(height: 4),
          Text(email, style: sansStyle(size: 14, color: muted)),
          const SizedBox(height: 12),
          OutlinedButton(style: outlinePill, onPressed: widget.host.logout, child: const Text('LOGOUT')),
          const SizedBox(height: 20),
          Text('My Orders', style: serifStyle(size: 22)),
          const SizedBox(height: 10),
          if (loading)
            const Center(child: CircularProgressIndicator(color: wine))
          else if (error != null)
            Text(error!, style: sansStyle(color: muted))
          else if (orders.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                  color: Colors.white, borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0x80E8B7C2))),
              child: Column(children: [
                Text('No orders yet. Your sweet history will appear here.',
                    textAlign: TextAlign.center, style: sansStyle(size: 13, color: muted)),
                const SizedBox(height: 12),
                FilledButton(style: winePill, onPressed: () => widget.host.goTab(1),
                    child: const Text('SHOP THE MENU')),
              ]),
            )
          else
            for (final o in orders)
              GestureDetector(
                onTap: () => _showDetail(o),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                      color: Colors.white, borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0x80E8B7C2))),
                  child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text("${o['order_number']}",
                            style: sansStyle(size: 14, color: wine, weight: FontWeight.w700)),
                        Text("${o['fulfilment_method']} · ${o['status']}",
                            style: sansStyle(size: 12, color: muted)),
                      ]),
                    ),
                    Text("₦${o['total']}", style: sansStyle(size: 14, weight: FontWeight.w700)),
                  ]),
                ),
              ),
          const SizedBox(height: 8),
          OutlinedButton(
            style: outlinePill.copyWith(minimumSize: WidgetStateProperty.all(const Size.fromHeight(44))),
            onPressed: () async {
              await widget.host.loadCart();
              if (context.mounted) {
                ScaffoldMessenger.of(context)
                    .showSnackBar(const SnackBar(content: Text('Cart reloaded from server.')));
              }
            },
            child: const Text('SYNC WEBSITE CART'),
          ),
        ],
      ),
    );
  }
}
