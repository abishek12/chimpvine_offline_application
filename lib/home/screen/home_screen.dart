import 'package:chimpvine_offline_application/home/widgets/home_content_recommendation.dart';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

import '../../app/constant/app_button.dart';
import '../../app/constant/app_image.dart';
import '../../app/widgets/text_widget.dart';
import '../../footer/footer_screen.dart';
import '../widgets/home_flexible_space.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    AppImage appImage = AppImage();
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            title: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 32.0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Image.asset(
                    appImage.logo,
                    width: 200,
                  ),
                  AppIconButton(
                    btnText: "Account",
                    icon: Icons.person,
                    onTap: () => context.pushNamed("profileScreen"),
                  ),
                ],
              ),
            ),
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(20.0),
                bottomRight: Radius.circular(20.0),
              ),
            ),
            expandedHeight: MediaQuery.of(context).size.height * 0.90,
            flexibleSpace: const HomeFlexibleSpace(),
            pinned: true,
            snap: false,
            floating: false,
          ),
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.only(top: 10 * 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10 * 3,
                        vertical: 10 * 1.5,
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: Color(0xffC9D7DD),
                              shape: BoxShape.circle,
                            ),
                            child: Image.asset("assets/home/video.png"),
                          ),
                          const Gap(10 * 2),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CustomText(
                                strText: "Video Training",
                                fontWeight: FontWeight.w700,
                                fontSize: 18,
                              ),
                              CustomText(strText: "with unlimited courses"),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10 * 3,
                        vertical: 10 * 1.5,
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: Color(0xffC9D7DD),
                              shape: BoxShape.circle,
                            ),
                            child: Image.asset("assets/home/teacher.png"),
                          ),
                          const Gap(10 * 2),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CustomText(
                                strText: "Expert Teacher",
                                fontWeight: FontWeight.w700,
                                fontSize: 18,
                              ),
                              CustomText(strText: "with unlimited courses"),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10 * 3,
                        vertical: 10 * 1.5,
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: Color(0xffC9D7DD),
                              shape: BoxShape.circle,
                            ),
                            child: Image.asset("assets/home/book.png"),
                          ),
                          const Gap(10 * 2),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CustomText(
                                strText: "Sets Question",
                                fontWeight: FontWeight.w700,
                                fontSize: 18,
                              ),
                              CustomText(strText: "with unlimited courses"),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SliverToBoxAdapter(
            child: HomeContentRecommendation(),
          ),
          const SliverToBoxAdapter(
            child: FooterScreen(),
          ),
        ],
      ),
    );
  }
}
