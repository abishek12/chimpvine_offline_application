import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/constant/app_image.dart';
import '../../../app/constant/app_string.dart';
import '../../../app/widgets/text_widget.dart';
import '../home_bottom_sheet/home_bottom_sheet.dart';
import 'icon_container_app_bar_home.dart';

class HomeAppBar extends StatelessWidget {
  final bool? isVisible;
  const HomeAppBar({
    super.key,
    this.isVisible,
  });

  @override
  Widget build(BuildContext context) {
    final AppImage appImage = AppImage();
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Visibility(
          visible: isVisible ?? false,
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 16.0,
              vertical: 8.0,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8.0),
            ),
            child: InkWell(
              onTap: () => context.pop(),
              child: Row(
                children: [
                  const Icon(
                    Icons.arrow_back_ios,
                  ),
                  CustomText(strText: AppString().back),
                ],
              ),
            ),
          ),
        ),
        InkWell(
          onTap: () => context.pushReplacementNamed("homeScreen"),
          child: Row(
            children: [
              Visibility(
                visible: isVisible ?? false,
                child: IconContainerAppBarHome(
                  iconName: appImage.home,
                ),
              ),
              const SizedBox(
                width: 8.0,
              ),
              InkWell(
                onTap: () => showModalBottomSheet(
                  context: context,
                  builder: (context) => const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: HomeBottomSheet(),
                  ),
                ),
                child: IconContainerAppBarHome(
                  iconName: appImage.school,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
