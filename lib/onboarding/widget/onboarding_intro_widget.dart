import 'package:flutter/material.dart';

class OnBoardingIntroWidget extends StatelessWidget {
  const OnBoardingIntroWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final wContext = MediaQuery.of(context);
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xff5928E5).withOpacity(0.8),
        image: const DecorationImage(
          fit: BoxFit.fill,
          image: AssetImage("assets/onboarding/one/BackGround-Star.png"),
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            left: 0,
            right: 0,
            top: 50,
            child: Center(
              child: Image.asset(
                "assets/onboarding/one/one_text.png",
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            child: Image.asset(
              "assets/onboarding/one/Cloud-1.png",
              width: wContext.size.width / 2,
              fit: BoxFit.fill,
            ),
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Image.asset(
              "assets/onboarding/one/Cloud-2.png",
              width: wContext.size.width / 2,
              fit: BoxFit.fill,
            ),
          ),
          Positioned(
            left: wContext.size.width * 0.3,
            bottom: 50,
            child: Image.asset(
              "assets/onboarding/one/chimpu.png",
              fit: BoxFit.fill,
            ),
          ),
          Positioned(
            left: wContext.size.width * 0.45,
            bottom: 200,
            child: Image.asset(
              "assets/onboarding/one/cloud-text.png",
              width: 400,
              fit: BoxFit.fill,
            ),
          ),
        ],
      ),
    );
  }
}
