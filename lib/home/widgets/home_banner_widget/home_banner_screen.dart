import 'package:flutter/material.dart';

class HomeBannerScreen extends StatelessWidget {
  const HomeBannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: MediaQuery.of(context).size.width,
      height: 150,
      child: PageView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: 3,
          itemBuilder: (context, index) {
            return Padding(
              padding: const EdgeInsets.all(16.0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  "assets/banner/danson_360.jpeg",
                  fit: BoxFit.cover,
                ),
              ),
            );
          }),
    );
  }
}
