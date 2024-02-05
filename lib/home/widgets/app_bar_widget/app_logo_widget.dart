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
        width: 700,
        height: 180,
        fit: BoxFit.fill,
      ),
    );
  }
}
