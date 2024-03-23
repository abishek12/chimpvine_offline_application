import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../app/widgets/text_widget.dart';
import '../../../membership/helper/membership_helper.dart';
import '../../widget/auth_text_field.dart';

class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool isVisible = true;
  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        color: const Color(0xff5928E5).withOpacity(0.8),
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
                color: Colors.white70,
              ),
              AuthTextField(
                controller: _usernameController,
                hintText: 'Enter username',
                labelText: "Username",
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter the school username';
                  }
                  return null;
                },
              ),
              AuthTextField(
                isObscureText: isVisible,
                controller: _passwordController,
                hintText: 'Enter Password',
                labelText: "Password",
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter the password';
                  }
                  return null;
                },
                suffixIcon: IconButton(
                  onPressed: () => setState(() {
                    isVisible = !isVisible;
                  }),
                  icon:
                      Icon(isVisible ? Icons.visibility_off : Icons.visibility),
                  color: Colors.white,
                ),
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

  void _setSetupKey(String username) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('username', username);
    prefs.setBool('isLoggedIn', true);
  }

  void _login() async {
    String username = _usernameController.text;
    String password = _passwordController.text;

    await DatabaseHelper.getMembershipByUsername(username).then((value) {
      if (value!.password == password) {
        context.pushReplacementNamed("homeScreen");
        _setSetupKey(username);
      }
    });
  }
}
