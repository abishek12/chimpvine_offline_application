part of 'search_bloc.dart';

sealed class SearchEvent extends Equatable {
  const SearchEvent();

  @override
  List<Object> get props => [];
}

class SearchUserGrade extends SearchEvent {
  final String grade;

  const SearchUserGrade({
    required this.grade,
  });
  @override
  List<Object> get props => [grade];
}

class SearchUserSubject extends SearchEvent {
  final String subject;

  const SearchUserSubject({
    required this.subject,
  });
  @override
  List<Object> get props => [subject];
}

class SearchUserType extends SearchEvent {
  final String type;

  const SearchUserType({
    required this.type,
  });
  @override
  List<Object> get props => [type];
}
