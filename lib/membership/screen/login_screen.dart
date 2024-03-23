import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../app/widgets/text_widget.dart';
import '../../authentication/login/widget/login_form.dart';
import '../../authentication/register/screen/auth_sign_up_screen.dart';
import '../../home/screen/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder(
          future: _getSetupKey(),
          builder: (context, snapshot) {
            if (snapshot.hasData && snapshot.data == true) {
              return const HomeScreen();
            }
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            }
            return SingleChildScrollView(
              child: Container(
                color: const Color(0xff5928E5).withOpacity(0.8),
                child: Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: Container(
                        width: double.infinity,
                        height: MediaQuery.of(context).size.height,
                        padding: const EdgeInsets.all(10 * 3),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const CustomText(
                              strText: "Welcome To Chimpvine",
                              fontSize: 10 * 4.5,
                              fontWeight: FontWeight.w700,
                            ),
                            const Gap(10 * 3),
                            const CustomText(
                              strText:
                                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                              fontSize: 10 * 2,
                              fontWeight: FontWeight.normal,
                              textAlign: TextAlign.center,
                            ),
                            const Gap(10 * 3),
                            ElevatedButton(
                              onPressed: () => showDialog(
                                context: context,
                                builder: (context) => const LoginForm(),
                              ),
                              child: const Text("Get Started"),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Container(
                        decoration: const BoxDecoration(),
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            CustomText(
                              strText: "Create an Account",
                              fontSize: 10 * 4.5,
                              fontWeight: FontWeight.w700,
                              color: Colors.white70,
                            ),
                            AuthSignUpScreen(),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
    );
  }

  Future<bool> _getSetupKey() async {
    final prefs = await SharedPreferences.getInstance();
    final bool value = prefs.getBool('isLoggedIn') ?? false;
    return value;
  }
}
