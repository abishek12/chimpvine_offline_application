import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

import '../../app/widgets/text_widget.dart';
import '../../home/widgets/app_bar_widget/app_logo_widget.dart';
import '../../home/widgets/app_bar_widget/home_app_bar.dart';
import '../helper/subject_helper.dart';

class PlayGroundScreen extends StatelessWidget {
  final String grade;
  final String subject;
  final String type;
  const PlayGroundScreen({
    super.key,
    required this.grade,
    required this.subject,
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
            child: Column(
              children: [
                const HomeAppBar(isVisible: true),
                const AppLogoWidget(),
                const Gap(16),
                CustomText(
                  strText:
                      'Grade $grade -- ${subjectHelper(subject)} (${type == "ic" ? "Interactive Content" : "Games"})',
                  fontSize: 24,
                  color: Colors.white,
                ),
                Expanded(
                  child: GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                    ),
                    itemCount: 40,
                    itemBuilder: (context, index) {
                      return Text(index.toString());
                    },
                  ),
                )
              ],
            )),
      ),
    );
  }
}
