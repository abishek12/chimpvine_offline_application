import 'package:flutter/material.dart';

class HomeBannerScreen extends StatelessWidget {
  const HomeBannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: MediaQuery.of(context).size.width,
      height: 100,
      child: PageView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: 3,
          itemBuilder: (context, index) {
            return Image.asset("assets/banner/danson_360.jpeg");
          }),
    );
  }
}
