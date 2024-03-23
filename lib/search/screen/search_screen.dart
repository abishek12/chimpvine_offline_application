import 'package:flutter/material.dart';

import '../helper/clear_search_key.dart';
import '../widget/search_fab.dart';
import '../widget/search_flexible_space.dart';
import '../widget/search_grade.dart';
import '../widget/search_subject.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  @override
  void initState() {
    clearKey();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverAppBar(
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(20.0),
                    bottomRight: Radius.circular(20.0),
                  ),
                ),
                expandedHeight: MediaQuery.of(context).size.height * 0.35,
                flexibleSpace: const SearchFlexibleSpace(),
                pinned: true,
                snap: false,
                floating: false,
              ),
              const SliverToBoxAdapter(
                child: SearchGradeWidget(),
              ),
              const SliverToBoxAdapter(
                child: SearchSubjectWidget(),
              ),
            ],
          ),
        ],
      ),
      floatingActionButton: const SearchFAB(),
    );
  }
}
