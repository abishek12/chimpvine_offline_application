import 'package:chimpvine_offline_application/app/widgets/text_widget.dart';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

class GamesPlayGround extends StatelessWidget {
  final List items;
  const GamesPlayGround({
    super.key,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 10 * 6,
        vertical: 10 * 3,
      ),
      child: ListView.separated(
        itemCount: items.length,
        itemBuilder: (context, index) {
          final Map<String, dynamic> data = items[index];
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Image.asset(
                data['image'],
                width: 350,
                height: 250,
                fit: BoxFit.cover,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24.0,
                  vertical: 48.0,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CustomText(
                      strText: data['title'],
                      fontWeight: FontWeight.w700,
                      fontSize: 25,
                    ),
                    const Gap(10),
                    ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.arrow_circle_right_sharp),
                      label: const Text("Play now"),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
        separatorBuilder: (BuildContext context, int index) {
          return const Divider();
        },
      ),
    );
  }
}
