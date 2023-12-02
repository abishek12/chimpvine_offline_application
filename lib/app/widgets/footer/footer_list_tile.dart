import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../text_widget.dart';

class FooterListTile extends StatelessWidget {
  final String title;
  final String subTitle;
  final String image;
  const FooterListTile({
    super.key,
    required this.title,
    required this.subTitle,
    required this.image,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SvgPicture.asset(image),
        CustomText(
          strText: title,
        ),
        CustomText(
          strText: subTitle,
        ),
      ],
    );
  }
}
