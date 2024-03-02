import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../membership/screen/login_screen.dart';
import '../helper/onboarding_helper.dart';
import '../utils/onboarding_items.dart';
import '../widget/onboarding_intro_widget.dart';
import 'onboarding_end.dart';
import 'onboarding_middle_widget.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController controller = PageController(initialPage: 0);
  int currentPage = 0;
  final List<Widget> widgetItems = [
    const OnBoardingIntroWidget(),
    const OnBoardingMiddleWidget(),
    const OnBoardingEndWidget(),
  ];

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
              onPageChanged: (index) {
                setState(() {
                  currentPage = index;
                });
              },
              itemBuilder: (context, index) => widgetItems[index],
            ),
          ),
          bottomSheet: isLastPage()
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
                        onPressed: () {
                          if (currentPage < widgetItems.length - 1) {
                            controller.nextPage(
                              duration: const Duration(milliseconds: 500),
                              curve: Curves.easeInOut,
                            );
                          } else {
                            // Handle reaching the end of pages
                          }
                        },
                        child: const Text("Next"),
                      ),
                    ],
                  ),
                ),
        );
      },
    );
  }

  bool isLastPage() {
    return currentPage == widgetItems.length - 1;
  }
}
