import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class IconContainerAppBarHome extends StatelessWidget {
  final String iconName;
  const IconContainerAppBarHome({
    super.key,
    required this.iconName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8.0),
      ),
      child: SvgPicture.asset(iconName),
    );
  }
}
