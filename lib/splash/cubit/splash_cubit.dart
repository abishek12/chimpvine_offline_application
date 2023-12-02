import 'package:flutter_bloc/flutter_bloc.dart';

enum SplashState { initail, loaded }

class SplashCubit extends Cubit<SplashState> {
  SplashCubit() : super(SplashState.initail);

  void changeScreen() {
    Future.delayed(const Duration(seconds: 3), () {
      emit(SplashState.loaded);
    });
  }
}
