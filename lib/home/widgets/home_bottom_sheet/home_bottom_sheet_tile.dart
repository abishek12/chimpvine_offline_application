import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';

import '../../../app/widgets/text_widget.dart';

class HomeBottomSheetTile extends StatelessWidget {
  final String title;
  final String imageName;
  const HomeBottomSheetTile({
    super.key,
    required this.title,
    required this.imageName,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: CustomText(strText: title),
      trailing: SvgPicture.asset(imageName),
    );
  }
}
