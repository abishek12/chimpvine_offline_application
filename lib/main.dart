import 'package:flutter/material.dart';

import 'app/constant/app_bloc.dart';
import 'app/screen/my_app_screen.dart';

void main() {
  runApp(const AppBlocProviders(
    child: MyApp(),
  ));
}
