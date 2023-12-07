import 'package:flutter/material.dart';

import '../../home/widgets/app_bar_widget/home_app_bar.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

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
              HomeAppBar(
                isVisible: true,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
