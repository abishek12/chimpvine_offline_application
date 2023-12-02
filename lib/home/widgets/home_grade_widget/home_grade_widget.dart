import 'package:flutter/material.dart';

import 'home_grade_ui.dart';

class HomeGradeWidget extends StatelessWidget {
  const HomeGradeWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 300,
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 8,
          childAspectRatio: 1 / 2,
        ),
        itemCount: 8,
        itemBuilder: (context, index) {
          return HomeGradeUI(index: index);
        },
      ),
    );
  }
}
