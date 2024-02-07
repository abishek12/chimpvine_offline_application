import 'package:flutter_bloc/flutter_bloc.dart';

import '../../onboarding/helper/date_time_helper.dart';

enum SplashState { initail, loaded, error }

class SplashCubit extends Cubit<SplashState> {
  SplashCubit() : super(SplashState.initail);

  void changeScreen() async {
    final dateHelper = DateTableHelper();
    await dateHelper.insertDate('2024-02-07');
    List<String> dates = await dateHelper.getDates();
    DateTime storedDate = DateTime.parse(dates[0]);
    DateTime now = DateTime.now();
    int differenceInYears = now.year - storedDate.year;
    Future.delayed(const Duration(seconds: 3), () {
      if (differenceInYears >= 2) {
        emit(SplashState.error);
      } else {
        emit(SplashState.loaded);
      }
    });
  }
}
