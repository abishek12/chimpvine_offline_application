import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/widgets/text_field_widget.dart';
import '../../home/widgets/app_bar_widget/app_logo_widget.dart';

class MembershipScreen extends StatelessWidget {
  const MembershipScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final TextEditingController schoolName = TextEditingController();
    final TextEditingController schoolAddress = TextEditingController();
    return Scaffold(
      body: SingleChildScrollView(
        child: Container(
          margin: const EdgeInsets.symmetric(
            horizontal: 60.0,
            vertical: 70.0,
          ),
          child: Column(
            children: [
              // App logo
              const AppLogoWidget(),
              // School Name
              TextFieldWidget(
                controller: schoolName,
                lableText: "School Name",
                icon: "",
                hintText: "Enter School Name",
              ),
              // School Address
              TextFieldWidget(
                controller: schoolAddress,
                lableText: "School Address",
                icon: "",
                hintText: "Enter School Address",
              ),
              TextFieldWidget(
                controller: schoolAddress,
                lableText: "Contact No.",
                icon: "",
                hintText: "+977 xx-xxx-xx-xxx",
              ),
              ElevatedButton.icon(
                onPressed: () => context.pushNamed('homeScreen'),
                icon: const Icon(Icons.keyboard_arrow_right_outlined),
                label: const Text("Proceed"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
