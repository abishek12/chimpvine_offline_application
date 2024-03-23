import 'dart:convert';

import 'package:flutter/services.dart';

import '../model/search_model.dart';

Future<List<SearchResults>> loadSearchResults() async {
  List<SearchResults> allSearchResults = [];

  for (int gradeLevel = 1; gradeLevel <= 8; gradeLevel++) {
    final String jsonPath =
        'assets/json/Grade-$gradeLevel/G$gradeLevel-English.json';
    final String jsonString = await rootBundle.loadString(jsonPath);
    final jsonData = json.decode(jsonString);

    allSearchResults.add(SearchResults.fromJson(jsonData));
  }

  return allSearchResults;
}
