import 'package:flutter/material.dart';

class AppButton extends StatelessWidget {
  final String btnText;
  final Color? color;
  const AppButton({
    super.key,
    required this.btnText,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(),
      child: Text(btnText),
    );
  }
}

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
