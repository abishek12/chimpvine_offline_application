import 'package:flutter/material.dart';
import 'package:webview_flutter_plus/webview_flutter_plus.dart';

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
    return SingleChildScrollView(
      child: SizedBox(
        width: MediaQuery.of(context).size.width,
        height: MediaQuery.of(context).size.height,
        child: WebViewPlus(
          javascriptMode: JavascriptMode.unrestricted,
          onWebViewCreated: (controller) {
            controller.loadUrl(dir);
          },
          zoomEnabled: false,
        ),
      ),
    );
  }
}
