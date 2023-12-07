import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:go_router/go_router.dart';

import '../../../app/widgets/text_widget.dart';

class HomeBottomSheetTile extends StatelessWidget {
  final String title;
  final String imageName;
  final String onTap;
  const HomeBottomSheetTile({
    super.key,
    required this.title,
    required this.imageName,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: () => context.pushNamed(onTap),
      title: CustomText(strText: title),
      trailing: SvgPicture.asset(imageName),
    );
  }
}
