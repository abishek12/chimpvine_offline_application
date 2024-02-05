import 'package:chimpvine_offline_application/app/constant/app_button.dart';
import 'package:chimpvine_offline_application/app/widgets/text_widget.dart';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              Container(
                width: MediaQuery.of(context).size.width,
                height: MediaQuery.of(context).size.height * 0.4,
                decoration: const BoxDecoration(
                  color: Color(0xff637A9F),
                ),
              ),
              Positioned(
                bottom: -50,
                left: 200,
                child: Container(
                  padding: const EdgeInsets.all(50),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.rectangle,
                  ),
                  child: Image.asset("assets/profile/person-one.png"),
                ),
              ),
              Positioned(
                bottom: 20,
                right: MediaQuery.of(context).size.width * 0.05,
                child: Row(
                  children: [
                    AppIconButton(
                      btnText: "Logout",
                      onTap: () async {
                        context.pushReplacementNamed("loginScreen");
                        final prefs = await SharedPreferences.getInstance();
                        prefs.remove("isLoggedIn");
                      },
                      icon: Icons.logout,
                    ),
                    const Gap(12),
                    AppIconButton(
                      btnText: "Add Account",
                      onTap: () {},
                      icon: Icons.person_add,
                    ),
                  ],
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 10 * 6,
              horizontal: 10 * 10,
            ),
            child: Row(
              children: [
                Expanded(
                  flex: 1,
                  child: Column(
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10 * 3,
                          vertical: 10 * 5,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.grey.shade300,
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const CustomText(
                          strText: "Children Model High School",
                          fontSize: 10 * 3,
                          fontWeight: FontWeight.w700,
                        ),
                      )
                    ],
                  ),
                ),
                const Gap(10 * 5),
                Expanded(
                  flex: 2,
                  child: Column(
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10 * 3,
                          vertical: 10 * 5,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.grey.shade300,
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text("Children Model High School"),
                      )
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
