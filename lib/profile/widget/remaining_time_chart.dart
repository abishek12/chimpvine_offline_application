import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

import '../../app/widgets/text_widget.dart';

class RemainingTimeChart extends StatelessWidget {
  const RemainingTimeChart({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        CustomText(
          strText: "Date of Installation",
          fontSize: 20,
        ),
        Gap(10),
        LinearProgressIndicator(
          value: 0.4,
        ),
        Gap(10),
        CustomText(
          strText: "Remaining Days: 700",
          fontSize: 20,
        ),
      ],
    );
  }
}
