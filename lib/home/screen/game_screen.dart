// import 'package:chimpvine_offline_application/app/constant/app_color.dart';
import 'package:chimpvine_offline_application/app/constant/app_string.dart';
import 'package:chimpvine_offline_application/app/widgets/heading_widget.dart';
import 'package:chimpvine_offline_application/app/widgets/text_widget.dart';
import 'package:chimpvine_offline_application/footer/footer_screen.dart';
import 'package:chimpvine_offline_application/home/widgets/app_bar_widget/home_app_bar.dart';
import 'package:flutter/material.dart';

class GameScreen extends StatelessWidget {
  const GameScreen({super.key});

  @override
  Widget build(BuildContext context) {
    AppString appString = AppString();
    double height = MediaQuery.of(context).size.height;
    return Scaffold(
      body: SingleChildScrollView(
        child: Container(
          margin: EdgeInsets.symmetric(horizontal: 60, vertical: 48.0),
          child: Column(
            children: [
              HomeAppBar(isVisible: true),
              SizedBox(height: height / 20),
              HeadingWidget(title: appString.games),
              SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  CustomText(
                    strText: appString.grade + ": 1",
                    // color: appColor.appColor,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                  CustomText(
                    strText: appString.subject + ": " + appString.english,
                    // color: appColor.appColor,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ],
              ),
              SizedBox(height: 25.0),
              Divider(thickness: 1.5),
              SizedBox(height: 15.0),
              Container(
                height: 700,
                child: GridView.builder(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                    ),
                    itemCount: 8,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.all(10.0),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.green,
                            ),
                          ),
                        ),
                      );
                    }),
              ),
              Divider(),
              FooterScreen(),
            ],
          ),
        ),
      ),
    );
  }
}
