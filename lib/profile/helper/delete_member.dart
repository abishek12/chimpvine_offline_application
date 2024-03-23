import 'package:shared_preferences/shared_preferences.dart';

import '../../membership/helper/membership_helper.dart';

Future<bool> deleteMember(String username) async {
  final prefs = await SharedPreferences.getInstance();
  final String strUsername = prefs.getString('username') ?? '';
  if (strUsername == username) {
    return false;
  } else {
    DatabaseHelper.deleteMembership(username);
    return true;
  }
}
