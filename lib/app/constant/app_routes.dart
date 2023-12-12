import 'package:go_router/go_router.dart';

import '../../games/screen/game_screen.dart';
import '../../h5p/screen/interactive_screen.dart';
import '../../home/screen/home_screen.dart';
import '../../membership/screen/member_ship_screen.dart';
import '../../profile/screen/profile_screen.dart';
import '../../splash/screen/splash_screen.dart';

final appRoutes = GoRouter(
  initialLocation: "/",
  routes: [
    GoRoute(
      path: "/",
      name: "splashScreen",
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: "/membership",
      name: "membershipScreen",
      builder: (context, state) => const MembershipScreen(),
    ),
    GoRoute(
      path: "/home",
      name: "homeScreen",
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: "/profile",
      name: "profileScreen",
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: "/interactive",
      name: "interactiveScreen",
      builder: (context, state) => const InteractiveScreen(),
    ),
    GoRoute(
      path: "/games",
      name: "gameScreen",
      builder: (context, state) => const GameScreen(),
    ),
  ],
);
