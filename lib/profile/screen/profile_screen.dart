import 'package:chimpvine_offline_application/authentication/register/screen/auth_sign_up_screen.dart';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../app/constant/app_button.dart';
import '../../app/widgets/text_widget.dart';
import '../widget/profile_list_members.dart';
import '../widget/remaining_time_chart.dart';
import '../widget/school_detail_container.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.start,
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
                        onTap: () => showDialog(
                          context: context,
                          builder: (context) => Dialog(
                            child: SizedBox(
                              width: MediaQuery.of(context).size.width * 0.5,
                              child: const SingleChildScrollView(
                                child: AuthSignUpScreen(),
                              ),
                            ),
                          ),
                        ),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SchoolDetailContainer(),
                        const Gap(10 * 5),
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
                          child: const RemainingTimeChart(),
                        ),
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
                            vertical: 10 * 2,
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
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: EdgeInsets.only(top: 10 * 2),
                                child: CustomText(
                                  strText: "Accounts",
                                  fontSize: 10 * 2,
                                ),
                              ),
                              Divider(),
                              ProfileListMembers(),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
