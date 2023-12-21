import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/widgets/text_widget.dart';
import '../../home/screen/home_screen.dart';
import '../bloc/authentication_bloc.dart';
import 'member_choose_acc_screen.dart';

class AuthenticationBlocScreen extends StatelessWidget {
  const AuthenticationBlocScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<AuthenticationBloc, AuthenticationState>(
        builder: (context, state) {
          if (state is AuthenticationInitial) {
            BlocProvider.of<AuthenticationBloc>(context)
                .add(CheckAuthentication());
          }
          if (state is AuthenticationLoading) {
            final bool value = state.isLoading;
            return value
                ? const Center(
                    child: CircularProgressIndicator(),
                  )
                : const SizedBox.shrink();
          }
          if (state is AuthenticationSuccess) {
            final bool value = state.isLoggedIn;
            return value
                ? const HomeScreen()
                : const MemberChooseAccountScreen();
          }
          if (state is AuthenticationError) {
            return const Center(
              child: CustomText(strText: "Error"),
            );
          }
          return const Center(
            child: CircularProgressIndicator(),
          );
        },
      ),
    );
  }
}
