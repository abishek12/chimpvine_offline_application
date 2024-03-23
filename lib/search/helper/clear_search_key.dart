import 'package:shared_preferences/shared_preferences.dart';

Future<void> clearKey() async {
  final prefs = await SharedPreferences.getInstance();
  prefs.remove('search_grade');
  prefs.remove('search_subject');
}
