import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'search_event.dart';
part 'search_state.dart';

class SearchBloc extends Bloc<SearchEvent, SearchState> {
  SearchBloc() : super(SearchInitial()) {
    on<SearchUserGrade>((event, emit) async {
      final grade = event.grade;
      final prefs = await SharedPreferences.getInstance();
      prefs.setString("search_grade", grade);

      if (prefs.getString("search_subject") != null) {
        emit(const SearchEnable(isSubject: true));
      }
    });

    on<SearchUserSubject>((event, emit) async {
      final subject = event.subject;
      final prefs = await SharedPreferences.getInstance();
      prefs.setString("search_subject", subject);

      if (prefs.getString("search_grade") != null) {
        emit(const SearchEnable(isSubject: true));
      }
    });
  }
}
