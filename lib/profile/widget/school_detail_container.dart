import 'package:flutter/material.dart';

import '../../app/widgets/text_widget.dart';
import '../helper/single_user_member.dart';

class SchoolDetailContainer extends StatelessWidget {
  const SchoolDetailContainer({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
        future: getUserDetail(),
        builder: (context, snapshot) {
          final items = snapshot.data;
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }
          if (snapshot.hasError) {
            return const Center(
              child: CustomText(strText: "Something went wrong"),
            );
          }
          if (snapshot.hasData) {
            return Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                horizontal: 10 * 3,
                vertical: 10 * 5,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.shade300,
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
                borderRadius: BorderRadius.circular(6),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CustomText(
                    strText: items!.username,
                    fontSize: 10 * 3,
                    fontWeight: FontWeight.w700,
                  ),
                  CustomText(
                    strText: items.address,
                    fontSize: 10 * 3,
                    fontWeight: FontWeight.normal,
                  ),
                  CustomText(
                    strText: items.contactNumber,
                    fontSize: 10 * 3,
                    fontWeight: FontWeight.normal,
                  ),
                ],
              ),
            );
          }
          return const SizedBox.shrink();
        });
  }
}
