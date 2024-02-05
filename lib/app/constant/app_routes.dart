import 'package:go_router/go_router.dart';

import '../../home/screen/home_screen.dart';
import '../../membership/screen/authentication_bloc_screen.dart';
import '../../membership/screen/login_screen.dart';
import '../../profile/screen/profile_screen.dart';
import '../../search/screen/search_playground.dart';
import '../../search/screen/search_screen.dart';
import '../../splash/screen/splash_screen.dart';
import '../../subject/screen/play_ground_detail_screen.dart';

final appRoutes = GoRouter(
  initialLocation: "/",
  routes: [
    GoRoute(
      path: "/",
      name: "splashScreen",
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: "/authentication",
      name: "authenticationScreen",
      builder: (context, state) => const AuthenticationBlocScreen(),
    ),
    GoRoute(
      path: "/login",
      name: "loginScreen",
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: "/home",
      name: "homeScreen",
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: "/search",
      name: "searchScreen",
      builder: (context, state) => const SearchScreen(),
    ),
    GoRoute(
      path: "/profile",
      name: "profileScreen",
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: "/playground",
      name: "playground",
      builder: (context, state) => const SearchPlayground(),
    ),
    GoRoute(
      path: "/playground-details/:path",
      name: "playgroundDetails",
      builder: (context, state) => PlayGroundDetailScreen(
        path: state.pathParameters['path'].toString(),
      ),
    ),
  ],
);
