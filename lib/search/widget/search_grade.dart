import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/widgets/text_widget.dart';
import '../bloc/search_bloc.dart';

class SearchGradeWidget extends StatefulWidget {
  const SearchGradeWidget({super.key});

  @override
  State<SearchGradeWidget> createState() => _SearchGradeWidgetState();
}

class _SearchGradeWidgetState extends State<SearchGradeWidget> {
  int _selectedGradeCardIndex = -1;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 48.0,
      ),
      height: 240,
      child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 8,
          ),
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 8,
          itemBuilder: (context, index) {
            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedGradeCardIndex = index;
                });
                BlocProvider.of<SearchBloc>(context).add(
                  SearchUserGrade(grade: '${index + 1}'),
                );
              },
              child: Container(
                margin: const EdgeInsets.only(right: 16),
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: index == _selectedGradeCardIndex
                          ? Colors.red
                          : Colors.transparent,
                      width: 2.0,
                    ),
                    boxShadow: index == _selectedGradeCardIndex
                        ? const [
                            BoxShadow(
                                color: Colors.grey,
                                offset: Offset(2, 2),
                                blurRadius: 4),
                          ]
                        : null),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      "assets/grades/grades-${index + 1}.png",
                    ),
                    CustomText(
                      strText: "Grade ${index + 1}",
                      fontSize: 20,
                    ),
                  ],
                ),
              ),
            );
          }),
    );
  }
}
