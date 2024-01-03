import 'dart:convert';

import 'package:flutter/services.dart';

Future<List> playgroundHelper(
  final String type,
  final grade,
) async {
  final String data = await rootBundle
      .loadString("assets/offline-content/$type/grade-$grade-$type/.json");
  final items = jsonDecode(data);
  return items['items'];
}
