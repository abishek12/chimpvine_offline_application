import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../subject/helper/subject_helper.dart';

Future<List> searchPlaygroundHelper() async {
  final prefs = await SharedPreferences.getInstance();
  final String? grade = prefs.getString('search_grade');
  final String? subject = prefs.getString('search_subject');

  final String data = await rootBundle.loadString(
    "assets/json/Grade-$grade/G$grade-${subjectHelper(subject!)}.json",
  );

  final items = jsonDecode(data);
  final List ic = items["ic"];
  final List games = items["games"];
  return [games, ic];
}
