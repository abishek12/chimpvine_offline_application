part of 'authentication_bloc.dart';

sealed class AuthenticationState extends Equatable {
  const AuthenticationState();

  @override
  List<Object> get props => [];
}

final class AuthenticationInitial extends AuthenticationState {}

final class AuthenticationLoading extends AuthenticationState {
  final bool isLoading;

  const AuthenticationLoading({
    required this.isLoading,
  });

  @override
  List<Object> get props => [isLoading];
}

final class CheckDeviceLoading extends AuthenticationState {
  final bool isLoading;

  const CheckDeviceLoading({
    required this.isLoading,
  });

  @override
  List<Object> get props => [isLoading];
}

final class AuthenticationSuccess extends AuthenticationState {
  final bool isLoggedIn;

  const AuthenticationSuccess({
    required this.isLoggedIn,
  });

  @override
  List<Object> get props => [isLoggedIn];
}

final class AuthenticationError extends AuthenticationState {
  final String strError;

  const AuthenticationError({
    required this.strError,
  });

  @override
  List<Object> get props => [strError];
}
