import 'package:flutter/material.dart';
import 'shop_backend.dart';
import 'theme.dart';

/// Same layout/styling as the website's /login page.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  bool busy = false;
  bool googleBusy = false;
  String? error;

  Future<void> _google() async {
    setState(() { googleBusy = true; error = null; });
    try {
      await ShopBackend.signInWithGoogle();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      final s = '$e';
      setState(() {
        error = s.contains('GOOGLE_WEB_CLIENT_ID') ||
                s.contains('not configured') ||
                s.contains('ApiException: 10')
            ? 'Google sign-in needs one-time setup (see mobile/GOOGLE_SETUP.md). Email login works now.'
            : s.contains('did not return an ID token')
                ? '$s Email login works now.'
                : s.replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => googleBusy = false);
    }
  }

  Future<void> _login() async {
    setState(() { busy = true; error = null; });
    try {
      if (!email.text.contains('@')) throw StateError('Enter a valid email address.');
      if (password.text.isEmpty) throw StateError('Enter your password.');
      await ShopBackend.signIn(email.text, password.text);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      final s = '$e';
      setState(() {
        error = s.contains('Invalid login credentials')
            ? 'Incorrect email or password. Please try again.'
            : s.contains('Email not confirmed')
                ? 'Please confirm your email first, then log in.'
                : s.replaceAll('Exception: ', '').replaceAll('AuthApiException: ', '');
      });
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  void _goSignup() {
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const SignupScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("tt's pink oven")),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Welcome back', textAlign: TextAlign.center, style: serifStyle(size: 30)),
              const SizedBox(height: 6),
              Text("Log in to your tt's pink oven account",
                  textAlign: TextAlign.center, style: sansStyle(size: 14, color: muted)),
              if (error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(error!, style: sansStyle(size: 13, color: const Color(0xFFB91C1C))),
                ),
              ],
              const SizedBox(height: 24),
              FilledButton(
                style: winePill.copyWith(minimumSize: WidgetStateProperty.all(const Size.fromHeight(48))),
                onPressed: googleBusy || busy ? null : _google,
                child: googleBusy
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Continue with Google'),
              ),
              const SizedBox(height: 16),
              Row(children: [
                const Expanded(child: Divider(color: Color(0x80E8B7C2))),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text('or log in with email', style: sansStyle(size: 12, color: muted)),
                ),
                const Expanded(child: Divider(color: Color(0x80E8B7C2))),
              ]),
              const SizedBox(height: 16),
              TextField(
                controller: email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: password,
                obscureText: true,
                autofillHints: const [AutofillHints.password],
                decoration: const InputDecoration(labelText: 'Password'),
                onSubmitted: (_) => _login(),
              ),
              const SizedBox(height: 20),
              FilledButton(
                style: winePill.copyWith(minimumSize: WidgetStateProperty.all(const Size.fromHeight(48))),
                onPressed: busy || googleBusy ? null : _login,
                child: busy
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('LOGIN'),
              ),
              const SizedBox(height: 16),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 6,
                children: [
                  Text('New here?', style: sansStyle(size: 14, color: muted)),
                  GestureDetector(
                    onTap: _goSignup,
                    child: Text('Create an account',
                        style: sansStyle(size: 14, color: wine, weight: FontWeight.w700)
                            .copyWith(decoration: TextDecoration.underline)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Same layout/styling as the website's /signup page.
class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  final confirm = TextEditingController();
  bool busy = false;
  String? error;
  String? info;

  Future<void> _signup() async {
    setState(() { busy = true; error = null; info = null; });
    try {
      if (!email.text.contains('@')) throw StateError('Enter a valid email address.');
      if (password.text.length < 6) throw StateError('Password must be at least 6 characters.');
      if (password.text != confirm.text) throw StateError('Passwords do not match.');
      final needConfirm = await ShopBackend.signUp(email.text, password.text);
      if (!mounted) return;
      if (needConfirm) {
        setState(() {
          info = 'Account created! Check your inbox to confirm your email, then log in.';
        });
      } else {
        Navigator.of(context).pop();
      }
    } catch (e) {
      setState(() =>
          error = '$e'.replaceAll('Exception: ', '').replaceAll('AuthApiException: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  void _goLogin() {
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("tt's pink oven")),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text("Join tt's pink oven", textAlign: TextAlign.center, style: serifStyle(size: 30)),
              const SizedBox(height: 6),
              Text('Create an account â€” it works on the website and the mobile app',
                  textAlign: TextAlign.center, style: sansStyle(size: 13, color: muted)),
              if (error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(error!, style: sansStyle(size: 13, color: const Color(0xFFB91C1C))),
                ),
              ],
              if (info != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDF4),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(info!, style: sansStyle(size: 13, color: const Color(0xFF166534))),
                ),
              ],
              const SizedBox(height: 24),
              TextField(
                controller: email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: password,
                obscureText: true,
                autofillHints: const [AutofillHints.newPassword],
                decoration: const InputDecoration(labelText: 'Password (min 6 characters)'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: confirm,
                obscureText: true,
                autofillHints: const [AutofillHints.newPassword],
                decoration: const InputDecoration(labelText: 'Confirm password'),
                onSubmitted: (_) => _signup(),
              ),
              const SizedBox(height: 20),
              FilledButton(
                style: winePill.copyWith(minimumSize: WidgetStateProperty.all(const Size.fromHeight(48))),
                onPressed: busy ? null : _signup,
                child: busy
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('CREATE ACCOUNT'),
              ),
              const SizedBox(height: 16),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 6,
                children: [
                  Text('Have an account?', style: sansStyle(size: 14, color: muted)),
                  GestureDetector(
                    onTap: _goLogin,
                    child: Text('Log in',
                        style: sansStyle(size: 14, color: wine, weight: FontWeight.w700)
                            .copyWith(decoration: TextDecoration.underline)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

