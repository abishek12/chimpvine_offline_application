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
    return AlertDialog(
      title: IconButton(
        icon: appIcon.close,
        onPressed: () => context.pop(),
      ),
      content: SizedBox(
        height: 350,
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
                _ui("Interactive Content",
                    "https://media.istockphoto.com/id/637696304/photo/patan.jpg?s=612x612&w=0&k=20&c=-53aSTGBGoOOqX5aoC3Hs1jhZ527v3Id_xOawHHVPpg="),
                const SizedBox(
                  width: 16,
                ),
                _ui("Games",
                    "https://media.istockphoto.com/id/637696304/photo/patan.jpg?s=612x612&w=0&k=20&c=-53aSTGBGoOOqX5aoC3Hs1jhZ527v3Id_xOawHHVPpg="),
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
        Image.network(
          imageName,
          height: 260,
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
