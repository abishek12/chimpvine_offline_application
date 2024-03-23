import 'package:shared_preferences/shared_preferences.dart';

import '../../membership/helper/membership_helper.dart';
import '../../membership/model/user_model.dart';

Future<UserModel?> getUserDetail() async {
  final prefs = await SharedPreferences.getInstance();
  final String username = prefs.getString('username') ?? '';
  final items = DatabaseHelper.getMembershipByUsername(username);
  return items;
}
