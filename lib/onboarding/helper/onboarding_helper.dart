import 'package:shared_preferences/shared_preferences.dart';

Future<void> setIntroScreen() async {
  final prefs = await SharedPreferences.getInstance();
  prefs.setBool("introScreen", true);
}

Future<bool> getIntroScreen() async {
  final prefs = await SharedPreferences.getInstance();
  final bool value = prefs.getBool("introScreen") ?? false;
  return value;
}
