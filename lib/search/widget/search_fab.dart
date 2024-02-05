import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../bloc/search_bloc.dart';

class SearchFAB extends StatefulWidget {
  const SearchFAB({super.key});

  @override
  State<SearchFAB> createState() => _SearchFABState();
}

class _SearchFABState extends State<SearchFAB> {
  @override
  Widget build(BuildContext context) {
    return BlocConsumer<SearchBloc, SearchState>(
      listener: (context, state) {},
      builder: (context, state) {
        if (state is SearchEnable && state.isSubject == true) {
          return FloatingActionButton.extended(
            onPressed: () => context.pushNamed("playground"),
            label: const Text("Browse"),
          );
        }
        return const SizedBox.shrink();
      },
    );
  }

  @override
  void dispose() {
    BlocProvider.of<SearchBloc>(context).close();
    super.dispose();
  }
}
