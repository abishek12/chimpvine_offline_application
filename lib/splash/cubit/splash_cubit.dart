import 'package:flutter_bloc/flutter_bloc.dart';
import '../helper/remaining_year.dart';

enum SplashState { initail, loaded, error }

class SplashCubit extends Cubit<SplashState> {
  SplashCubit() : super(SplashState.initail);

  void changeScreen() async {
    final int differenceInYears = await remainingYear();
    Future.delayed(const Duration(seconds: 3), () {
      if (differenceInYears >= 2) {
        emit(SplashState.error);
      } else {
        emit(SplashState.loaded);
      }
    });
  }
}
