import 'package:flutter/material.dart';

import '../../../app/widgets/text_widget.dart';

class AuthSignUpScreen extends StatelessWidget {
  const AuthSignUpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        CustomText(strText: "Create an Account"),
        
      ],
    );
  }
}
