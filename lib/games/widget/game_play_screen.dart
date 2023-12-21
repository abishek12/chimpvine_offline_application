import 'package:flutter/material.dart';
import 'package:webview_flutter_plus/webview_flutter_plus.dart';

import '../../home/widgets/app_bar_widget/app_logo_widget.dart';
import '../../home/widgets/app_bar_widget/home_app_bar.dart';

class GamePlayScreen extends StatelessWidget {
  final String title;
  final String dir;
  const GamePlayScreen({
    super.key,
    required this.title,
    required this.dir,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: 60.0,
          vertical: 48.0,
        ),
        child: Column(
          children: [
            const HomeAppBar(isVisible: true),
            const AppLogoWidget(),
            SizedBox(
              width: MediaQuery.of(context).size.width,
              height: MediaQuery.of(context).size.height * 0.70,
              child: WebViewPlus(
                javascriptMode: JavascriptMode.unrestricted,
                onWebViewCreated: (controller) {
                  controller.loadUrl(dir);
                },
                zoomEnabled: false,
              ),
            )
          ],
        ),
      ),
    );
  }
}
