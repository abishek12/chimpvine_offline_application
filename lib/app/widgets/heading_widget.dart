import 'package:flutter/material.dart';

import '../constant/app_color.dart';
import 'text_widget.dart';

class HeadingWidget extends StatelessWidget {
  final String title;
  const HeadingWidget({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    final AppColor appColor = AppColor();
    return CustomText(
      strText: title,
      fontSize: 40.0,
      color: appColor.whiteColor,
      fontWeight: FontWeight.w700,
    );
  }
}
