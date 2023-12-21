import 'package:flutter/material.dart';

import '../../../app/constant/app_string.dart';
import '../../../app/widgets/text_widget.dart';
import '../../../subject/screen/subject_screen.dart';

class HomeGradeUI extends StatelessWidget {
  final int index;
  const HomeGradeUI({
    super.key,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final AppString appString = AppString();
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CustomText(
            strText: "${appString.grade} ${index + 1}",
            fontSize: 30.0,
          ),
          SubjectScreen(
            gradeIndex: index,
          )
        ],
      ),
    );
  }
}
