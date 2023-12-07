import 'package:flutter/material.dart';

import '../../../app/constant/app_image.dart';

class AppLogoWidget extends StatelessWidget {
  const AppLogoWidget({super.key});

  @override
  Widget build(BuildContext context) {
    AppImage appImage = AppImage();
    return Center(
      child: Image.asset(
        appImage.logo,
        width: MediaQuery.of(context).size.width * 0.30,
        height: 120,
        fit: BoxFit.cover,
      ),
    );
  }
}
