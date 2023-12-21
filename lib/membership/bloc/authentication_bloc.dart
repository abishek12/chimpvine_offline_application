import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'authentication_event.dart';
part 'authentication_state.dart';

class AuthenticationBloc
    extends Bloc<AuthenticationEvent, AuthenticationState> {
  AuthenticationBloc() : super(AuthenticationInitial()) {
    // on<CheckDeviceCompatibility>((event, emit) async {
    //   emit(const AuthenticationLoading(isLoading: true));
    //   final bool getDeviceInfo = await checkDeviceCompatibility();
    //   emit(CheckDeviceLoading(isLoading: getDeviceInfo));
    //   emit(const AuthenticationLoading(isLoading: false));
    // });
    on<CheckAuthentication>((event, emit) async {
      emit(const AuthenticationLoading(isLoading: true));
      final prefs = await SharedPreferences.getInstance();
      final bool value = prefs.getBool("isLoggedIn") ?? false;
      emit(const AuthenticationLoading(isLoading: false));
      emit(AuthenticationSuccess(isLoggedIn: value));
    });
  }
}
