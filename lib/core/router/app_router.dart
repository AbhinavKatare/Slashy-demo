import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/auth/auth_state.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/widgets/empty_state/app_error_state.dart';
import 'package:inbox_companion/features/auth/presentation/app_lock_screen.dart';
import 'package:inbox_companion/features/auth/presentation/welcome_screen.dart';
import 'package:inbox_companion/features/compose/presentation/compose_screen.dart';
import 'package:inbox_companion/features/conversation/presentation/conversation_screen.dart';
import 'package:inbox_companion/features/gallery/presentation/component_gallery_screen.dart';
import 'package:inbox_companion/features/inbox/presentation/inbox_screen.dart';
import 'package:inbox_companion/features/productivity/presentation/agenda_calendar_screen.dart';
import 'package:inbox_companion/features/productivity/presentation/tasks_screen.dart';
import 'package:inbox_companion/features/search/presentation/search_screen.dart';
import 'package:inbox_companion/features/settings/presentation/settings_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authService = ref.watch(authServiceProvider);
  final config = ref.watch(configProvider);
  final initialLocation = '/inbox';

  return GoRouter(
    initialLocation: initialLocation,
    refreshListenable: authService,
    redirect: (context, state) {
      final authStatus = authService.state.status;
      final path = state.uri.path;

      // Gallery, Calendar, and Tasks are allowed directly for inspection/preview
      if (path == '/gallery' || path == '/calendar' || path == '/tasks')
        return null;

      if (authStatus == AuthStatus.locked) {
        if (path != '/lock') return '/lock';
        return null;
      }

      if (authStatus == AuthStatus.unauthenticated) {
        if (path != '/welcome') return '/welcome';
        return null;
      }

      if (authStatus == AuthStatus.authenticated) {
        if (path == '/welcome' || path == '/lock') return '/inbox';
        return null;
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/welcome',
        name: 'welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/lock',
        name: 'lock',
        builder: (context, state) => const AppLockScreen(),
      ),
      GoRoute(
        path: '/inbox',
        name: 'inbox',
        builder: (context, state) => const InboxScreen(),
      ),
      GoRoute(
        path: '/conversation/:id',
        name: 'conversation',
        builder: (context, state) {
          final threadId = state.pathParameters['id'] ?? '';
          return ConversationScreen(threadId: threadId);
        },
      ),
      GoRoute(
        path: '/compose',
        name: 'compose',
        builder: (context, state) {
          final replyThreadId = state.uri.queryParameters['threadId'];
          final replyMessageId = state.uri.queryParameters['messageId'];
          final isReplyAll = state.uri.queryParameters['replyAll'] == 'true';
          final isForward = state.uri.queryParameters['forward'] == 'true';
          final draftId = state.uri.queryParameters['draftId'];
          final initialBody = state.uri.queryParameters['body'];
          final isAiGenerated =
              state.uri.queryParameters['isAiGenerated'] == 'true';

          return ComposeScreen(
            replyThreadId: replyThreadId,
            replyMessageId: replyMessageId,
            isReplyAll: isReplyAll,
            isForward: isForward,
            draftId: draftId,
            initialBody: initialBody,
            isAiGenerated: isAiGenerated,
          );
        },
      ),
      GoRoute(
        path: '/search',
        name: 'search',
        builder: (context, state) {
          final query = state.uri.queryParameters['q'];
          return SearchScreen(initialQuery: query);
        },
      ),
      GoRoute(
        path: '/calendar',
        name: 'calendar',
        builder: (context, state) => const AgendaCalendarScreen(),
      ),
      GoRoute(
        path: '/tasks',
        name: 'tasks',
        builder: (context, state) => const TasksScreen(),
      ),
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/gallery',
        name: 'gallery',
        builder: (context, state) {
          final themeMode = ref.watch(themeModeProvider);
          return ComponentGalleryScreen(
            currentThemeMode: themeMode,
            onToggleThemeMode: (mode) {
              ref.read(themeModeProvider.notifier).state = mode;
            },
          );
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('Page Not Found')),
      body: AppErrorState(
        title: '404 - Page Not Found',
        message: 'The requested route ${state.uri.toString()} does not exist.',
        retryLabel: 'Return Home',
        onRetry: () => context.go('/inbox'),
      ),
    ),
  );
});
