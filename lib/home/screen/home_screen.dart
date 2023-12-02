import 'package:flutter/material.dart';

import '../../app/constant/app_string.dart';
import '../../app/widgets/heading_widget.dart';
import '../../footer/footer_screen.dart';
import '../widgets/app_bar_widget/home_app_bar.dart';
import '../widgets/home_banner_widget/home_banner_screen.dart';
import '../widgets/home_game_widget/home_game_widget.dart';
import '../widgets/home_grade_widget/home_grade_widget.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppString appString = AppString();
    return Scaffold(
      body: SingleChildScrollView(
        child: Container(
          margin: const EdgeInsets.symmetric(
            horizontal: 60.0,
            vertical: 48.0,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const HomeAppBar(),
              HeadingWidget(title: '${appString.grade}s'),
              const HomeGradeWidget(),
              const SizedBox(
                height: 24,
              ),
              HeadingWidget(title: appString.games),
              const HomeGameWidget(),
              const SizedBox(
                height: 24,
              ),
              const HomeBannerScreen(),
              const SizedBox(
                height: 36,
              ),
              const Divider(
                thickness: 3,
              ),
              const FooterScreen(),
            ],
          ),
        ),
      ),
    );
  }
}
