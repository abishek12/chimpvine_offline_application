import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(20.0),
                bottomRight: Radius.circular(20.0),
              ),
            ),
            expandedHeight: MediaQuery.of(context).size.height * 0.45,
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
        color: Colors.blue,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Search Chimpvine Content',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24.0,
                  ),
                ),
                const Gap(10 * 2),
                SizedBox(
                  width: MediaQuery.of(context).size.width / 2,
                  child: Row(
                    children: [
                      Expanded(
                        flex: 5,
                        child: TextFormField(
                          decoration: InputDecoration(
                            hintText: 'Enter your text',
                            fillColor: Colors.white,
                            filled: true,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10.0),
                            ),
                            suffixIcon: const Icon(
                              Icons.search,
                              color: Colors.black,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
