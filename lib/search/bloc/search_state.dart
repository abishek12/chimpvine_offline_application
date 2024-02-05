part of 'search_bloc.dart';

sealed class SearchState extends Equatable {
  const SearchState();

  @override
  List<Object> get props => [];
}

final class SearchInitial extends SearchState {}

final class SearchEnable extends SearchState {
  final bool isSubject;

  const SearchEnable({
    this.isSubject = false,
  });

  @override
  List<Object> get props => [isSubject];
}
