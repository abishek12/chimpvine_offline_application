part of 'check_device_bloc.dart';

sealed class CheckDeviceEvent extends Equatable {
  const CheckDeviceEvent();

  @override
  List<Object> get props => [];
}

class CheckDeviceCompatibility extends CheckDeviceEvent {}
