import 'package:chimpvine_offline_application/app/widgets/text_widget.dart';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../membership/helper/membership_helper.dart';

class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        padding: const EdgeInsets.all(20.0),
        width: MediaQuery.of(context).size.width * 0.5,
        height: MediaQuery.of(context).size.width * 0.2,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CustomText(
                strText: "Login",
                fontWeight: FontWeight.bold,
                fontSize: 10 * 3,
              ),
              TextFormField(
                controller: _usernameController,
                decoration: const InputDecoration(labelText: 'School Username'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter the school username';
                  }
                  return null;
                },
              ),
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter the password';
                  }
                  return null;
                },
              ),
              const Gap(10 * 2),
              ElevatedButton(
                onPressed: () {
                  if (_formKey.currentState?.validate() ?? false) {
                    _login();
                  }
                },
                child: const Text("Login"),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _setSetupKey() async {
    final prefs = await SharedPreferences.getInstance();
    prefs.setBool('isLoggedIn', true);
  }

  void _login() async {
    String username = _usernameController.text;
    String password = _passwordController.text;

    await DatabaseHelper.getMembershipByUsername(username).then((value) {
      if (value!.password == password) {
        context.pushReplacementNamed("homeScreen");
        _setSetupKey();
      }
    });
  }
}
