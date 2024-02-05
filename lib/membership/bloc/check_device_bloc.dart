import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

import '../helper/check_device_compatibility.dart';

part 'check_device_event.dart';
part 'check_device_state.dart';

class CheckDeviceBloc extends Bloc<CheckDeviceEvent, CheckDeviceState> {
  CheckDeviceBloc() : super(CheckDeviceInitial()) {
    on<CheckDeviceCompatibility>((event, emit) async {
      //emit(const AuthenticationLoading(isLoading: true));
      final bool deviceState = await checkDeviceCompatibility();
      emit(CheckDeviceLoading(isLoading: deviceState));
      emit(CheckDeviceCurrentState(isCompatible: deviceState));
    });
  }
}
