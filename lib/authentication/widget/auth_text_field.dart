import 'package:flutter/material.dart';

class AuthTextField extends StatelessWidget {
  final TextEditingController controller;
  final TextInputType? textInputType;
  final String hintText;
  final String labelText;
  final Widget? suffixIcon;
  final bool? isObscureText;
  
  final String? Function(String?)? validator;

  const AuthTextField({
    super.key,
    required this.controller,
    required this.hintText,
    required this.labelText,
    this.suffixIcon,
    this.isObscureText,
    this.textInputType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      decoration: BoxDecoration(
        color: const Color(0xff5928E5).withOpacity(0.2),
        borderRadius: BorderRadius.circular(6),
      ),
      child: TextFormField(
        obscureText:isObscureText ?? false,
        keyboardType: textInputType ?? TextInputType.name,
        controller: controller,
        style: const TextStyle(
          color: Colors.white,
        ),
        validator: validator,
        decoration: InputDecoration(
          labelText: labelText,
          border: InputBorder.none,
          suffixIcon: suffixIcon ??const SizedBox.shrink(),
          labelStyle: const TextStyle(
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
