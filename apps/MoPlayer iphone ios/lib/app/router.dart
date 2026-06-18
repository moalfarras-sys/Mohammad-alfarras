import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/login_screen.dart';
import '../features/favorites/favorites_screen.dart';
import '../features/home/home_screen.dart';
import '../features/live/live_screen.dart';
import '../features/movies/movie_detail_screen.dart';
import '../features/movies/movies_screen.dart';
import '../features/player/player_screen.dart';
import '../features/player/playback_args.dart';
import '../features/search/search_screen.dart';
import '../features/series/series_detail_screen.dart';
import '../features/series/series_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/splash/splash_screen.dart';
import '../models/series.dart';
import '../models/vod_movie.dart';
import '../providers/core_providers.dart';
import 'main_shell.dart';
import 'routes.dart';

final _rootKey = GlobalKey<NavigatorState>();
final _shellKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  final cinematicMotion = ref.watch(
    settingsProvider.select((settings) => settings.cinematicMotion),
  );
  ref.listen(isLoggedInProvider, (previous, next) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: Routes.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final loggedIn = ref.read(isLoggedInProvider);
      final loc = state.matchedLocation;
      if (loc == Routes.splash) return null;
      final onLogin = loc == Routes.login;
      final addingSource =
          onLogin && state.uri.queryParameters['addSource'] == '1';
      if (!loggedIn && !onLogin) return Routes.login;
      if (loggedIn && onLogin && !addingSource) return Routes.home;
      return null;
    },
    routes: [
      GoRoute(
        path: Routes.splash,
        pageBuilder: (context, state) => _cinematicPage(
          state: state,
          child: const SplashScreen(),
          enabled: cinematicMotion,
        ),
      ),
      GoRoute(
        path: Routes.login,
        pageBuilder: (context, state) => _cinematicPage(
          state: state,
          child: const LoginScreen(),
          enabled: cinematicMotion,
        ),
      ),

      // Fullscreen routes (above the shell).
      GoRoute(
        path: Routes.player,
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => _cinematicPage(
          state: state,
          child: PlayerScreen(args: state.extra as PlaybackArgs),
          enabled: cinematicMotion,
          fullscreen: true,
        ),
      ),
      GoRoute(
        path: Routes.movieDetail,
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => _cinematicPage(
          state: state,
          child: MovieDetailScreen(movie: state.extra as VodMovie),
          enabled: cinematicMotion,
          fullscreen: true,
        ),
      ),
      GoRoute(
        path: Routes.seriesDetail,
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => _cinematicPage(
          state: state,
          child: SeriesDetailScreen(series: state.extra as SeriesItem),
          enabled: cinematicMotion,
          fullscreen: true,
        ),
      ),

      // The main landscape shell with the side navigation rail.
      StatefulShellRoute.indexedStack(
        parentNavigatorKey: _rootKey,
        builder: (context, state, shell) => MainShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(
            navigatorKey: _shellKey,
            routes: [
              GoRoute(
                path: Routes.home,
                pageBuilder: (context, state) => _cinematicPage(
                  state: state,
                  child: const HomeScreen(),
                  enabled: cinematicMotion,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.live,
                pageBuilder: (context, state) => _cinematicPage(
                  state: state,
                  child: const LiveScreen(),
                  enabled: cinematicMotion,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.movies,
                pageBuilder: (context, state) => _cinematicPage(
                  state: state,
                  child: const MoviesScreen(),
                  enabled: cinematicMotion,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.series,
                pageBuilder: (context, state) => _cinematicPage(
                  state: state,
                  child: const SeriesScreen(),
                  enabled: cinematicMotion,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.search,
                pageBuilder: (context, state) => _cinematicPage(
                  state: state,
                  child: const SearchScreen(),
                  enabled: cinematicMotion,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.favorites,
                pageBuilder: (context, state) => _cinematicPage(
                  state: state,
                  child: const FavoritesScreen(),
                  enabled: cinematicMotion,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.settings,
                pageBuilder: (context, state) => _cinematicPage(
                  state: state,
                  child: const SettingsScreen(),
                  enabled: cinematicMotion,
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

Page<void> _cinematicPage({
  required GoRouterState state,
  required Widget child,
  required bool enabled,
  bool fullscreen = false,
}) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: enabled
        ? Duration(milliseconds: fullscreen ? 360 : 280)
        : Duration.zero,
    reverseTransitionDuration: enabled
        ? Duration(milliseconds: fullscreen ? 260 : 200)
        : Duration.zero,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (!enabled || MediaQuery.disableAnimationsOf(context)) return child;
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      final rotate = Tween<double>(
        begin: fullscreen ? 0.055 : 0.035,
        end: 0,
      ).evaluate(curved);
      final scale = Tween<double>(
        begin: fullscreen ? 0.965 : 0.985,
        end: 1,
      ).evaluate(curved);
      final opacity = Tween<double>(begin: 0, end: 1).evaluate(curved);
      final dx = Tween<double>(
        begin: fullscreen ? 24 : 12,
        end: 0,
      ).evaluate(curved);

      return Opacity(
        opacity: opacity,
        child: Transform.translate(
          offset: Offset(dx, 0),
          child: Transform(
            alignment: Alignment.center,
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.0012)
              ..rotateY(rotate)
              ..scaleByDouble(scale, scale, scale, 1),
            child: child,
          ),
        ),
      );
    },
  );
}
