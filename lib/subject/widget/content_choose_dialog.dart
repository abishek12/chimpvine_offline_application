import 'package:chimpvine_offline_application/app/constant/app_color.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/constant/app_image.dart';
import '../../app/widgets/text_widget.dart';

class ContentChooseDialog extends StatelessWidget {
  final String grade;
  final String subject;
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
              strText: "Grade $grade->$subject",
              fontSize: 16,
            ),
            const SizedBox(
              height: 16,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _ui("Interactive Content", appImage.interactivePng),
                const SizedBox(
                  width: 16,
                ),
                _ui("Games", appImage.gamePng),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _ui(
    final String title,
    final String imageName,
  ) {
    return Column(
      children: [
        InkWell(
          onTap: () {},
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColor().whiteColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Image.network(
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
