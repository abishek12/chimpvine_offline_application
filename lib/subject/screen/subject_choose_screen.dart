import 'package:flutter/material.dart';

import '../../home/widgets/app_bar_widget/home_app_bar.dart';

class SubjectChooseScreen extends StatelessWidget {
  const SubjectChooseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: 60.0,
          vertical: 48.0,
        ),
        child: const Column(
          children: [
            HomeAppBar(
              isVisible: true,
            ),
          ],
        ),
      ),
    );
  }
}
