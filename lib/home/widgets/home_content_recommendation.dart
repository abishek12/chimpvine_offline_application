import 'dart:convert';

import 'package:chimpvine_offline_application/app/widgets/text_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

class HomeContentRecommendation extends StatefulWidget {
  const HomeContentRecommendation({super.key});

  @override
  State<HomeContentRecommendation> createState() =>
      _HomeContentRecommendationState();
}

class _HomeContentRecommendationState extends State<HomeContentRecommendation> {
  @override
  Widget build(BuildContext context) {
    Future<Map<String, dynamic>> loadData() async {
      final String data = await rootBundle.loadString(
        "assets/json/Grade-2/G2-Science.json",
      );
      final items = jsonDecode(data);
      return items;
    }

    return FutureBuilder(
        future: loadData(),
        builder: (context, snapshot) {
          if (snapshot.hasData) {
            return Container(
              margin: const EdgeInsets.symmetric(
                horizontal: 10 * 6,
              ),
              padding: const EdgeInsets.only(top: 10 * 6),
              height: 500,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 1,
                    child: MasonryGridView.builder(
                      gridDelegate:
                          const SliverSimpleGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                      ),
                      itemCount: 6,
                      itemBuilder: (context, index) => Container(
                        margin: const EdgeInsets.all(16),
                        padding: const EdgeInsets.all(16),
                        width: double.infinity,
                        height: 180,
                        decoration: const BoxDecoration(
                          image: DecorationImage(
                            fit: BoxFit.fill,
                            image: AssetImage("assets/games/game_one.png"),
                          ),
                        ),
                        child: const CustomText(strText: "This is the Title"),
                      ),
                    ),
                  ),
                  const Gap(10 * 2),
                  Expanded(
                    flex: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const CustomText(
                          strText: "Chimpvine Online Games",
                          fontSize: 10 * 4,
                          fontWeight: FontWeight.w700,
                        ),
                        const Gap(10),
                        const CustomText(
                          strText:
                              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident",
                          fontSize: 10 * 2,
                        ),
                        const Gap(10),
                        ElevatedButton(
                          onPressed: () => context.pushNamed("searchScreen"),
                          child: const Text("Play Now"),
                        ),
                      ],
                    ),
                  )
                ],
              ),
            );
          }

          if (snapshot.hasError) {
            return Text(snapshot.error.toString());
          }
          return const SizedBox.shrink();
        });
  }
}
