import 'package:flutter/material.dart';

class AppIconButton extends StatelessWidget {
  final String btnText;
  final VoidCallback onTap;
  final IconData icon;

  const AppIconButton({
    super.key,
    required this.btnText,
    required this.onTap,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon),
      label: Text(btnText),
    );
  }
}
