part of 'check_device_bloc.dart';

sealed class CheckDeviceState extends Equatable {
  const CheckDeviceState();

  @override
  List<Object> get props => [];
}

final class CheckDeviceInitial extends CheckDeviceState {}

final class CheckDeviceLoading extends CheckDeviceState {
  final bool isLoading;

  const CheckDeviceLoading({
    required this.isLoading,
  });

  @override
  List<Object> get props => [isLoading];
}

final class CheckDeviceCurrentState extends CheckDeviceState {
  final bool isCompatible;
  const CheckDeviceCurrentState({
    required this.isCompatible,
  });

  @override
  List<Object> get props => [isCompatible];
}
