import 'package:flutter/material.dart';
import 'package:webview_flutter_plus/webview_flutter_plus.dart';

class PlayGroundDetailScreen extends StatelessWidget {
  final String path;
  const PlayGroundDetailScreen({
    super.key,
    required this.path,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: SizedBox(
        width: MediaQuery.of(context).size.width,
        height: MediaQuery.of(context).size.height,
        child: WebViewPlus(
          javascriptMode: JavascriptMode.unrestricted,
          serverPort: 5000,
          onWebViewCreated: (controller) {
            controller.loadUrl(path);
          },
          zoomEnabled: false,
        ),
      ),
    );
  }
}
