import 'package:chimpvine_offline_application/app/widgets/text_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../app/constant/app_color.dart';

class FooterUI extends StatelessWidget {
  final String imageName;
  final String title;
  final String subTitle;
  const FooterUI({
    super.key,
    required this.imageName,
    required this.title,
    required this.subTitle,
  });

  @override
  Widget build(BuildContext context) {
    final AppColor appColor = AppColor();
    return Column(
      children: [
        SvgPicture.asset(
          "assets/footer/$imageName",
          width: 60,
          height: 80,
        ),
        const SizedBox(
          height: 12,
        ),
        CustomText(
          strText: title,
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: appColor.whiteColor,
        ),
        CustomText(
          strText: subTitle,
          fontSize: 18,
          color: appColor.whiteColor,
        ),
      ],
    );
  }
}
