import 'package:flutter/material.dart';

class TextFieldWidget extends StatelessWidget {
  final TextEditingController controller;
  final String lableText;
  final String hintText;
  final String icon;
  final bool? isobscureText;
  const TextFieldWidget({
    super.key,
    required this.controller,
    required this.lableText,
    required this.icon,
    this.isobscureText,
    required this.hintText,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 16.0,
        vertical: 24.0,
      ),
      child: TextFormField(
        controller: controller,
        obscureText: isobscureText ?? false,
        decoration: InputDecoration(
          hintText: hintText,
          labelText: lableText,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }
}
