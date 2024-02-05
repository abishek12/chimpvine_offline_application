import 'package:flutter/material.dart';

class HomeGameRecommendation extends StatelessWidget {
  const HomeGameRecommendation({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.of(context).size.width,
      child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            crossAxisSpacing: 8,
          ),
          itemCount: 4,
          itemBuilder: (context, index) {
            return Card(
              child: Column(
                children: [
                  Image.asset("assets/games/game_one.png"),
                ],
              ),
            );
          }),
    );
  }
}
