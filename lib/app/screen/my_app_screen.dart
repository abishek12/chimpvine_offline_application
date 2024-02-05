import 'package:flutter/material.dart';

import '../constant/app_routes.dart';

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      routerConfig: appRoutes,
      theme: ThemeData(
        // scaffoldBackgroundColor: AppColor().appColor,
        // brightness: Brightness.light,
        // appBarTheme: const AppBarTheme(
        //   backgroundColor: Colors.transparent,
        //   centerTitle: false,
        // ),
        useMaterial3: true,
      ),
    );
  }
}
