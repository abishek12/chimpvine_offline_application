import 'package:flutter/material.dart';

class CustomText extends StatelessWidget {
  final String strText;
  final double? fontSize;
  final Color? color;
  final FontWeight? fontWeight;
  const CustomText({
    super.key,
    required this.strText,
    this.fontSize,
    this.color,
    this.fontWeight,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      strText,
      style: TextStyle(
        fontSize: fontSize ?? 14.0,
        color: color ?? Colors.black,
        fontWeight: fontWeight ?? FontWeight.normal,
      ),
    );
  }
}
