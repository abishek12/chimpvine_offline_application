import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../home/screen/home_screen.dart';
import '../bloc/authentication_bloc.dart';
import 'member_ship_screen.dart';

class AuthenticationBlocScreen extends StatelessWidget {
  const AuthenticationBlocScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthenticationBloc, AuthenticationState>(
      builder: (context, state) {
        if (state is AuthenticationInitial) {
          BlocProvider.of<AuthenticationBloc>(context)
              .add(CheckAuthentication());
        }
        if (state is AuthenticationSuccess) {
          final bool value = state.isLoggedIn;
          return value ? const HomeScreen() : const MembershipScreen();
        }
        if (state is AuthenticationError) {}
        return const SizedBox.shrink();
      },
    );
  }
}
