import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

import '../helper/user_search_helper.dart';
import '../model/search_model.dart';
import '../screen/user_search_screen.dart';

class SearchBoxWidget extends StatefulWidget {
  const SearchBoxWidget({super.key});

  @override
  State<SearchBoxWidget> createState() => _SearchBoxWidgetState();
}

class _SearchBoxWidgetState extends State<SearchBoxWidget> {
  late List<SearchResults> allSearchResults;
  late List<InteractiveContent> searchResults;
  late TextEditingController _searchController;
  final _searchKey = GlobalKey<FormState>();

  @override
  void initState() {
    allSearchResults = [];
    searchResults = [];
    _searchController = TextEditingController();
    loadAllSearchData();
    super.initState();
  }

  void loadAllSearchData() {
    loadSearchResults().then((results) {
      setState(() {
        allSearchResults = results;
        // Combine all search results into one list
        searchResults =
            results.expand((result) => result.interactiveContents).toList();
      });
    });
  }

  void search(String query) {
    setState(() {
      if (query.isEmpty) {
        searchResults = allSearchResults
            .expand((result) => result.interactiveContents)
            .toList();
        return;
      }

      setState(() {
        searchResults = searchResults
            .where((content) =>
                content.title.toLowerCase().contains(query.toLowerCase()))
            .toList();
      });
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => UserSearchScreen(
            searchResults: searchResults,
          ),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _searchKey,
      child: Container(
        padding: const EdgeInsets.all(8),
        width: MediaQuery.of(context).size.width * 0.5,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Icon(Icons.search),
            const Gap(10 * 3),
            Expanded(
              child: TextField(
                controller: _searchController,
                decoration: const InputDecoration(
                  hintText: "Addition ...",
                  border: InputBorder.none,
                ),
              ),
            ),
            InkWell(
              onTap: () => search(_searchController.text),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 30.0,
                  vertical: 10.0,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  color: Colors.amber,
                ),
                child: const Text("Search"),
              ),
            )
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
