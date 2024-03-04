import 'package:chimpvine_offline_application/home/screen/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../app/widgets/text_widget.dart';
import '../../profile/screen/sign_up_screen.dart';
import '../../profile/widget/login_form.dart';

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
                decoration: const BoxDecoration(
                  color: Color(0xff5928E5),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      bottom: 0,
                      child: Image.asset(
                        "assets/onboarding/one/Cloud-1.png",
                        width: MediaQuery.of(context).size.width / 2,
                        fit: BoxFit.fill,
                      ),
                    ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Image.asset(
                        "assets/onboarding/one/Cloud-2.png",
                        width: MediaQuery.of(context).size.width / 2,
                        fit: BoxFit.fill,
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.center,
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
                                  color: Colors.white,
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
                              mainAxisAlignment: MainAxisAlignment.start,
                              children: [
                                CustomText(
                                  strText: "Create an Account",
                                  fontSize: 10 * 4.5,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                                SignUpForm(),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    Positioned(
                      left: MediaQuery.of(context).size.width * 0.2,
                      bottom: 50,
                      child: Image.asset(
                        "assets/onboarding/one/chimpu.png",
                        fit: BoxFit.fill,
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
