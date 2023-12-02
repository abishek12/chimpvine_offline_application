import 'package:flutter/material.dart';

import 'home_game_ui_widget.dart';

class HomeGameWidget extends StatelessWidget {
  const HomeGameWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 300,
      child: GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
          ),
          itemCount: 4,
          itemBuilder: (context, index) {
            return const HomeGameUIWidget();
          }),
    );
  }
}
