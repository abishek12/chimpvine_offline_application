import 'package:flutter/material.dart';

import '../../home/widgets/app_bar_widget/app_logo_widget.dart';
import '../../home/widgets/app_bar_widget/home_app_bar.dart';
import '../widget/game_testing.dart';

class GameScreen extends StatelessWidget {
  final String gradeIndex;
  final String subjectIndex;
  final String type;

  const GameScreen({
    super.key,
    required this.gradeIndex,
    required this.subjectIndex,
    required this.type,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Container(
          margin: const EdgeInsets.symmetric(
            horizontal: 60.0,
            vertical: 48.0,
          ),
          child: const Column(
            children: [
              HomeAppBar(isVisible: true),
              AppLogoWidget(),
              GameTesting(),
            ],
          ),
        ),
      ),
    );
  }
}
