import 'dart:html';
import 'dart:js' as js;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/constant/app_image.dart';
import '../../../app/constant/app_string.dart';
import '../../../app/widgets/text_widget.dart';
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
                onTap: () => showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (context) => AlertDialog(
                    title: const Text("Are you Sure?"),
                    actions: [
                      MaterialButton(
                        color: Colors.green,
                        onPressed: () {
                          // context.pop();
                          // exit(0);

                          // bool confirmClose =
                          //     window.confirm('Are you sure you want to close?');
                          // if (confirmClose) {
                          //   // Trigger custom logic if the user confirms
                          //   js.context.callMethod('close');
                          // }
                        },
                        child: const Text("Yes"),
                      ),
                      MaterialButton(
                        color: Colors.red,
                        onPressed: () => context.pop(),
                        child: const Text("No"),
                      ),
                    ],
                  ),
                ),
                child: IconContainerAppBarHome(
                  iconName: appImage.close,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
