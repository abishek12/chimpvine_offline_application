import 'package:chimpvine_offline_application/subject/helper/subject_helper.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/widgets/text_widget.dart';
import '../bloc/search_bloc.dart';

class SearchSubjectWidget extends StatefulWidget {
  const SearchSubjectWidget({super.key});

  @override
  State<SearchSubjectWidget> createState() => _SearchSubjectWidget();
}

class _SearchSubjectWidget extends State<SearchSubjectWidget> {
  int _selectedSubjectCardIndex = -1;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 48.0,
      ),
      height: 400,
      child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
          ),
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 4,
          itemBuilder: (context, index) {
            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedSubjectCardIndex = index;
                });
                BlocProvider.of<SearchBloc>(context).add(
                  SearchUserSubject(subject: '$index'),
                );
              },
              child: Container(
                margin: const EdgeInsets.only(right: 16),
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: index == _selectedSubjectCardIndex
                          ? Colors.red
                          : Colors.transparent,
                      width: 2.0,
                    ),
                    boxShadow: index == _selectedSubjectCardIndex
                        ? const [
                            BoxShadow(
                              color: Colors.grey,
                              offset: Offset(2, 2),
                              blurRadius: 4,
                            ),
                          ]
                        : null),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      "assets/grades/${subjectHelper('$index')}.jpg",
                      height: 310,
                      fit: BoxFit.cover,
                    ),
                    CustomText(
                      strText: subjectHelper('$index'),
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
