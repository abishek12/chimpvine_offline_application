import 'package:flutter/material.dart';

import '../../utils/home_bottom_sheets_items.dart';
import 'home_bottom_sheet_tile.dart';

class HomeBottomSheet extends StatelessWidget {
  const HomeBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: ListView.builder(
          itemCount: homeBottomSheetItems.length,
          itemBuilder: (context, index) {
            final items = homeBottomSheetItems[index];
            return HomeBottomSheetTile(
              title: items['npTitle'],
              imageName: items['image'],
              onTap: items['onTap'],
            );
          }),
    );
  }
}
