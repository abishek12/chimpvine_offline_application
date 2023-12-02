import 'package:go_router/go_router.dart';

import '../../home/screen/home_screen.dart';
import '../../splash/screen/splash_screen.dart';
import '../../subject/screen/subject_choose_screen.dart';

final appRoutes = GoRouter(
  initialLocation: "/",
  routes: [
    GoRoute(
      path: "/",
      name: "splashScreen",
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: "/home",
      name: "homeScreen",
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: "/chooseSubject",
      name: "chooseSubject",
      builder: (context, state) => const SubjectChooseScreen(),
    ),
  ],
);
