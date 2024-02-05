import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'app/screen/my_app_screen.dart';
import 'footer/cubit/footer_cubit.dart';
import 'membership/bloc/authentication_bloc.dart';
import 'membership/bloc/check_device_bloc.dart';
import 'search/bloc/search_bloc.dart';
import 'splash/cubit/splash_cubit.dart';
import 'subject/cubit/subject_cubit.dart';

void main() {
  runApp(
    MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (_) => SplashCubit(),
        ),
        BlocProvider(
          create: (_) => AuthenticationBloc(),
        ),
        BlocProvider(
          create: (_) => CheckDeviceBloc(),
        ),
        BlocProvider(
          create: (_) => SubjectCubit(),
        ),
        BlocProvider(
          create: (_) => FooterCubit(),
        ),
        BlocProvider(
          create: (_) => SearchBloc(),
        ),
      ],
      child: const MyApp(),
    ),
  );
}
