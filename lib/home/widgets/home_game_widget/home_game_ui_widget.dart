import 'package:flutter/material.dart';

import '../../../app/widgets/text_widget.dart';

class HomeGameUIWidget extends StatelessWidget {
  const HomeGameUIWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.asset(
              "assets/games/game_one.png",
              height: 210,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          const CustomText(
            strText: 'This is the demo title of the website as we can see',
            fontSize: 20,
            fontWeight: FontWeight.w600,
          )
        ],
      ),
    );
  }
}
