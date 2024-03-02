import 'package:flutter/material.dart';

class OnBoardingEndWidget extends StatelessWidget {
  const OnBoardingEndWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final wContext = MediaQuery.of(context);
    return Container(
      width: wContext.size.width,
      height: wContext.size.height,
      decoration: const BoxDecoration(
        color: Colors.red,
      ),
      child: const Stack(
        children: [],
      ),
    );
  }
}
