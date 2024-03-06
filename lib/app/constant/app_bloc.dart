import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../footer/cubit/footer_cubit.dart';
import '../../membership/bloc/authentication_bloc.dart';
import '../../membership/bloc/check_device_bloc.dart';
import '../../search/bloc/search_bloc.dart';
import '../../splash/cubit/splash_cubit.dart';
import '../../subject/cubit/subject_cubit.dart';

class AppBlocProviders extends StatelessWidget {
  const AppBlocProviders({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) => SplashCubit(),
        ),
        BlocProvider(
          create: (context) => AuthenticationBloc(),
        ),
        BlocProvider(
          create: (context) => CheckDeviceBloc(),
        ),
        BlocProvider(
          create: (context) => SubjectCubit(),
        ),
        BlocProvider(
          create: (context) => FooterCubit(),
        ),
        BlocProvider(
          create: (context) => SearchBloc(),
        ),
      ],
      child: child,
    );
  }
}
