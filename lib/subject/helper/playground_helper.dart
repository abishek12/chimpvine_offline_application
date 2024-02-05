import 'dart:convert';

import 'package:flutter/services.dart';

import 'subject_helper.dart';

Future<Map<String, dynamic>> playgroundHelper(
  final String grade,
  final String subject,
  final String type,
) async {
  final String data = await rootBundle.loadString(
    "assets/json/$type-json/Grade-$grade/G$grade-${subjectHelper(subject)}-$type.json",
  );
  final items = jsonDecode(data);
  return items;
}
