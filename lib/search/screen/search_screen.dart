import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../widget/search_box_widget.dart';
import '../widget/search_fab.dart';
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

  Future<void> clearKey() async {
    final prefs = await SharedPreferences.getInstance();
    prefs.remove('search_grade');
    prefs.remove('search_subject');
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
                flexibleSpace: const MyFlexibleSpace(),
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

class MyFlexibleSpace extends StatelessWidget {
  const MyFlexibleSpace({super.key});

  @override
  Widget build(BuildContext context) {
    return FlexibleSpaceBar(
      background: Container(
        color: const Color(0xff5928E5).withOpacity(0.8),
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Stack(
              children: [
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Search Chimpvine Content',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24.0,
                      ),
                    ),
                    Gap(10 * 2),
                    SearchBoxWidget(),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
