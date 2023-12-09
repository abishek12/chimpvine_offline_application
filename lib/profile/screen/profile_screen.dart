import 'package:chimpvine_offline_application/app/constant/app_string.dart';
import 'package:chimpvine_offline_application/app/widgets/text_widget.dart';
import 'package:chimpvine_offline_application/home/widgets/app_bar_widget/app_logo_widget.dart';
import 'package:flutter/material.dart';

import '../../home/widgets/app_bar_widget/home_app_bar.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    AppString appString = AppString();
    DateTime full_date = DateTime.now();
    DateTime expired_date = full_date.add(Duration(days: 365));

    return Scaffold(
      body: SingleChildScrollView(
        child: Container(
          margin: const EdgeInsets.symmetric(
            horizontal: 60.0,
            vertical: 48.0,
          ),
          child: Column(
            children: [
              HomeAppBar(
                isVisible: true,
              ),
              AppLogoWidget(),
              SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.blue[500],
                      ),
                    ),
                    Positioned(
                      right: 100,
                      bottom: -300,
                      child: Container(
                        height: 350,
                        width: 500,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Center(
                                child: CustomText(
                                  strText: appString.more_information,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              SizedBox(height: 25),
                              Center(
                                child: CustomText(
                                  strText: appString.total_interactive_content,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              SizedBox(height: 20),
                              Column(
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceAround,
                                    children: [
                                      CustomText(strText: appString.science),
                                      CustomText(strText: appString.english),
                                      CustomText(strText: appString.computer),
                                    ],
                                  ),
                                  SizedBox(height: 15),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceAround,
                                    children: [
                                      CustomText(
                                          strText:
                                              appString.science_no.toString()),
                                      CustomText(
                                          strText:
                                              appString.english_no.toString()),
                                      CustomText(
                                          strText:
                                              appString.computer_no.toString()),
                                    ],
                                  ),
                                ],
                              ),
                              SizedBox(height: 20),
                              Row(
                                children: [],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: -300,
                      left: 100,
                      child: Container(
                        height: 350,
                        width: 300,
                        decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(5.0)),
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Center(
                                child: CustomText(
                                  strText: appString.school_name,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              SizedBox(height: 15),
                              Center(
                                child: CircleAvatar(
                                  radius: 20,
                                  backgroundColor: Colors.grey,
                                  backgroundImage: NetworkImage(
                                      "https://static.vecteezy.com/system/resources/previews/009/952/572/non_2x/male-profile-picture-vector.jpg"),
                                ),
                              ),
                              SizedBox(height: 20),
                              Row(
                                children: [
                                  CustomText(
                                      strText: appString.address + " : "),
                                  CustomText(strText: "Baneshwor, Kathmandu"),
                                ],
                              ),
                              SizedBox(height: 20),
                              Row(
                                children: [
                                  CustomText(
                                      strText: appString.contact + " : "),
                                  CustomText(strText: "9863487548"),
                                ],
                              ),
                              SizedBox(height: 20),
                              Row(
                                children: [
                                  CustomText(
                                      strText:
                                          appString.installed_date + " : "),
                                  CustomText(
                                      strText: full_date.year.toString() +
                                          "/" +
                                          full_date.month.toString() +
                                          "/" +
                                          full_date.day.toString())
                                ],
                              ),
                              SizedBox(height: 20),
                              Row(
                                children: [
                                  CustomText(
                                      strText: appString.expired_date + " : "),
                                  CustomText(
                                      strText: expired_date.year.toString() +
                                          "/" +
                                          expired_date.month.toString() +
                                          "/" +
                                          expired_date.day.toString())
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
