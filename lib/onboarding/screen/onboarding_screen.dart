import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../membership/screen/login_screen.dart';
import '../helper/onboarding_helper.dart';
import '../utils/onboarding_items.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final controller = PageController();
  bool isLastPage = false;
  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
        future: getIntroScreen(),
        builder: (context, snapshot) {
          if (snapshot.hasData && snapshot.data == true) {
            return const LoginScreen();
          }
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }
          return Scaffold(
            body: Container(
              padding: const EdgeInsets.only(bottom: 80),
              child: PageView.builder(
                  controller: controller,
                  itemCount: onboardingItems.length,
                  onPageChanged: (value) => setState(() {
                        isLastPage = value == 2;
                      }),
                  itemBuilder: (context, index) {
                    return const Column();
                  }),
            ),
            bottomSheet: isLastPage
                ? SizedBox(
                    width: double.infinity,
                    height: 80.0,
                    child: TextButton(
                      onPressed: () {
                        context.pushReplacementNamed("loginScreen");
                        setIntroScreen();
                      },
                      child: const Text("Get Started"),
                    ),
                  )
                : Container(
                    width: MediaQuery.of(context).size.width,
                    padding: const EdgeInsets.symmetric(horizontal: 80.0),
                    height: 80.0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton(
                          onPressed: () => controller.jumpToPage(2),
                          child: const Text("Skip"),
                        ),
                        Center(
                          child: SmoothPageIndicator(
                            controller: controller,
                            count: 3,
                            effect: const WormEffect(
                              spacing: 16,
                            ),
                            onDotClicked: (index) => controller.animateToPage(
                              index,
                              duration: const Duration(milliseconds: 500),
                              curve: Curves.easeInOut,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () => controller.nextPage(
                            duration: const Duration(milliseconds: 500),
                            curve: Curves.easeInOut,
                          ),
                          child: const Text("Next"),
                        ),
                      ],
                    ),
                  ),
          );
        });
  }
}
