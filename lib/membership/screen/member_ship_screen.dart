import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/check_device_bloc.dart';
import 'authentication_bloc_screen.dart';

class MembershipScreen extends StatelessWidget {
  const MembershipScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<CheckDeviceBloc, CheckDeviceState>(
        listener: (context, state) {},
        builder: (context, state) {
          // if (state is CheckDeviceInitial) {
          //   BlocProvider.of<CheckDeviceBloc>(context)
          //       .add(CheckDeviceCompatibility());
          //   return const Center(
          //     child: CircularProgressIndicator(),
          //   );
          // }
          // if (state is CheckDeviceCurrentState && state.isCompatible == false) {
          //   return const ErrorScreen(
          //     errorMessage: 'Chimpvine is not compatible with this device.',
          //   );
          // }
          return const AuthenticationBlocScreen();
        },
      ),
    );
  }
}
