import 'package:flutter/material.dart';

import '../model/search_model.dart';

class UserSearchScreen extends StatelessWidget {
  final List<InteractiveContent> searchResults;
  const UserSearchScreen({
    super.key,
    required this.searchResults,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Text(searchResults.length.toString()),
    );
  }
}
