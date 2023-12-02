import 'package:chimpvine_offline_application/app/constant/app_color.dart';
import 'package:flutter/material.dart';

import '../constant/app_routes.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      routerConfig: appRoutes,
      theme: ThemeData(
        scaffoldBackgroundColor: AppColor().appColor,
        brightness: Brightness.light,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          centerTitle: false,
        ),
        useMaterial3: true,
      ),
    );
  }
}
