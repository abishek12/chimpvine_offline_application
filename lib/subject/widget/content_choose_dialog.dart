import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/constant/app_color.dart';
import '../../app/constant/app_image.dart';
import '../../app/widgets/text_widget.dart';
import '../helper/subject_helper.dart';

class ContentChooseDialog extends StatelessWidget {
  final String grade;
  final int subject;
  const ContentChooseDialog({
    super.key,
    required this.grade,
    required this.subject,
  });

  @override
  Widget build(BuildContext context) {
    final AppIcon appIcon = AppIcon();
    final AppImage appImage = AppImage();
    return AlertDialog(
      title: IconButton(
        icon: appIcon.close,
        onPressed: () => context.pop(),
      ),
      content: SizedBox(
        height: 370,
        child: Column(
          children: [
            CustomText(
              strText: "Grade $grade->${subjectHelper(subject)}",
              fontSize: 16,
            ),
            const SizedBox(
              height: 16,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _ui(
                  context,
                  "Interactive Content",
                  appImage.interactivePng,
                  "interactiveScreen",
                ),
                const SizedBox(
                  width: 16,
                ),
                _ui(
                  context,
                  "Games ",
                  appImage.gamePng,
                  "gameScreen",
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _ui(
    BuildContext context,
    final String title,
    final String imageName,
    final String onTap,
  ) {
    return Column(
      children: [
        InkWell(
          onTap: () => context.pushNamed(onTap),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColor().whiteColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Image.asset(
              imageName,
              height: 260,
            ),
          ),
        ),
        const SizedBox(
          height: 16,
        ),
        CustomText(
          strText: title,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ],
    );
  }
}
