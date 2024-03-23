import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

import 'search_box_widget.dart';

class SearchFlexibleSpace extends StatelessWidget {
  const SearchFlexibleSpace({super.key});

  @override
  Widget build(BuildContext context) {
    return FlexibleSpaceBar(
      background: Container(
        color: const Color(0xff5928E5).withOpacity(0.8),
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Stack(
              children: [
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Search Chimpvine Content',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24.0,
                      ),
                    ),
                    Gap(10 * 2),
                    SearchBoxWidget(),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
