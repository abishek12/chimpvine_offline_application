import 'package:flutter/material.dart';

import '../utils/game_testing_list.dart';
import 'game_play_screen.dart';

class GameTesting extends StatelessWidget {
  const GameTesting({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: MediaQuery.of(context).size.width,
      height: MediaQuery.of(context).size.height * 0.7,
      child: GridView.builder(
          itemCount: gameTesting.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            childAspectRatio: 1.5,
            crossAxisCount: 4,
          ),
          itemBuilder: (context, index) {
            return InkWell(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => GamePlayScreen(
                    title: "${gameTesting[index]['title']}",
                    dir: "${gameTesting[index]['dir']}",
                  ),
                ),
              ),
              child: Column(
                children: [
                  Image.asset(
                    "assets/games/game_one.png",
                    width: 300,
                    fit: BoxFit.cover,
                  ),
                  Text(
                    "${gameTesting[index]['title']}",
                    style: const TextStyle(
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
            );
          }),
    );
  }
}
