import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

import '../../app/widgets/text_widget.dart';
import '../helper/remaining_days_helper.dart';

class RemainingTimeChart extends StatelessWidget {
  const RemainingTimeChart({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const CustomText(
          strText: "Date of Installation",
          fontSize: 20,
        ),
        const Gap(10),
        FutureBuilder<int?>(
          future: getRemainingDays(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LinearProgressIndicator();
            } else if (snapshot.hasError || snapshot.data == null) {
              return const Text('Error: Unable to fetch installation date');
            } else {
              double progress = 1 - (snapshot.data! / (2 * 365));
              return LinearProgressIndicator(value: progress);
            }
          },
        ),
        const Gap(10),
        FutureBuilder<int?>(
          future: getRemainingDays(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const CustomText(
                strText: "Remaining Days: Calculating...",
                fontSize: 20,
              );
            } else if (snapshot.hasError || snapshot.data == null) {
              return const Text('Error: Unable to calculate remaining days');
            } else {
              return CustomText(
                strText: "Remaining Days: ${snapshot.data}",
                fontSize: 20,
              );
            }
          },
        ),
      ],
    );
  }
}
