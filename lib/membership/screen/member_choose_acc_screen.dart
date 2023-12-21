import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/widgets/text_widget.dart';

class MemberChooseAccountScreen extends StatelessWidget {
  const MemberChooseAccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Container(
          padding: const EdgeInsets.all(20),
          margin: const EdgeInsets.symmetric(horizontal: 50),
          height: 350,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CustomText(
                strText: "Who's Watching?",
                fontSize: 24,
                fontWeight: FontWeight.w700,
              ),
              Expanded(
                child: Center(
                  child: GridView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 5,
                    ),
                    itemCount: 5,
                    itemBuilder: (context, index) {
                      return InkWell(
                        onTap: () => context.pushReplacementNamed("homeScreen"),
                        child: Center(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Image.network(
                                "https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_640.png",
                                width: 200,
                              ),
                              const SizedBox(
                                height: 16,
                              ),
                              const CustomText(
                                strText: "Abishek Khanal",
                                fontSize: 20,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
