import 'package:flutter/material.dart';

import '../helper/play_ground_helper.dart';
import 'games_play_ground.dart';

class SearchPlayground extends StatefulWidget {
  const SearchPlayground({super.key});

  @override
  State<SearchPlayground> createState() => _SearchPlaygroundState();
}

class _SearchPlaygroundState extends State<SearchPlayground> {
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          bottom: const TabBar(
            tabs: [
              Tab(child: Text('Games')),
              Tab(child: Text('Interactive Content')),
            ],
          ),
        ),
        body: FutureBuilder(
          future: searchPlaygroundHelper(),
          builder: (context, snapshot) {
            if (snapshot.hasData) {
              return TabBarView(
                children: [
                  GamesPlayGround(items: snapshot.data![0]),
                  GamesPlayGround(items: snapshot.data![1]),
                ],
              );
            }
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            }
            if (snapshot.hasError) {
              return Center(
                child: Text('${snapshot.error}'),
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}
