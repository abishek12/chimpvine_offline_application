import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../onboarding/screen/onboarding_screen.dart';
import '../cubit/splash_cubit.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SplashCubit, SplashState>(
      builder: (context, state) {
        if (state == SplashState.error) {
          return const Center(
            child: Text("Key has been Expired"),
          );
        }
        if (state == SplashState.initail) {
          context.read<SplashCubit>().changeScreen();
          return Scaffold(
            body: Container(
              width: MediaQuery.of(context).size.width,
              height: MediaQuery.of(context).size.height,
              decoration: const BoxDecoration(
                color: Color(0xffCDBFF7),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: MediaQuery.of(context).size.height * 0.35,
                    left: MediaQuery.of(context).size.width * 0.5,
                    child: Image.asset(
                      "assets/home/chimpu.png",
                      width: 200,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    child: Image.asset(
                      "assets/home/splash_vector.png",
                      width: MediaQuery.of(context).size.width,
                      height: 150,
                      fit: BoxFit.fill,
                    ),
                  ),
                ],
              ),
            ),
          );
        }
        return const OnboardingScreen();
      },
    );
  }
}
