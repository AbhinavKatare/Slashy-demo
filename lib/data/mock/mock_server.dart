import 'dart:convert';
import 'dart:io';

import 'package:inbox_companion/data/mock/mock_seed_data.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;
import 'package:shelf_router/shelf_router.dart';

/// Local embedded mock HTTP server implementing the Inbox Companion OpenAPI spec.
class MockServer {
  MockServer({this.port = 8080, this.host = '127.0.0.1'});

  final int port;
  final String host;
  HttpServer? _server;

  bool get isRunning => _server != null;
  String get baseUrl => 'http://$host:${_server?.port ?? port}/v1';

  Future<void> start() async {
    if (_server != null) return;

    final appRouter = Router();

    // CORS & JSON Helpers
    Response jsonOk(dynamic data) => Response.ok(
      jsonEncode(data),
      headers: {'content-type': 'application/json'},
    );

    Response jsonCreated(dynamic data) => Response(
      201,
      body: jsonEncode(data),
      headers: {'content-type': 'application/json'},
    );

    Response noContent() => Response(204);

    // Auth endpoints
    appRouter.post('/v1/auth/login', (Request request) async {
      return jsonOk(MockSeedData.authTokens);
    });

    appRouter.post('/v1/auth/refresh', (Request request) async {
      return jsonOk({
        'accessToken':
            'mock_refreshed_access_token_${DateTime.now().millisecondsSinceEpoch}',
        'refreshToken':
            'mock_refreshed_refresh_token_${DateTime.now().millisecondsSinceEpoch}',
        'tokenType': 'Bearer',
        'expiresIn': 3600,
        'user': MockSeedData.currentUser,
      });
    });

    appRouter.post('/v1/auth/logout', (Request request) async {
      return noContent();
    });

    // Accounts
    appRouter.get('/v1/accounts', (Request request) async {
      return jsonOk(MockSeedData.accounts);
    });

    appRouter.get('/v1/accounts/<id>', (Request request, String id) async {
      final account = MockSeedData.accounts.firstWhere(
        (a) => a['id'] == id,
        orElse: () => MockSeedData.accounts.first,
      );
      return jsonOk(account);
    });

    // Threads
    appRouter.get('/v1/threads', (Request request) async {
      final folder = request.url.queryParameters['folder'] ?? 'inbox';
      final filtered = MockSeedData.threads
          .where((t) => t['folder'] == folder || folder == 'all')
          .toList();
      return jsonOk({
        'threads': filtered.isNotEmpty ? filtered : MockSeedData.threads,
        'nextCursor': null,
        'totalCount': MockSeedData.threads.length,
      });
    });

    appRouter.get('/v1/threads/<id>', (Request request, String id) async {
      final thread = MockSeedData.threads.firstWhere(
        (t) => t['id'] == id,
        orElse: () => MockSeedData.threads.first,
      );
      return jsonOk({'thread': thread, 'messages': MockSeedData.messages});
    });

    appRouter.patch('/v1/threads/<id>', (Request request, String id) async {
      final body = await request.readAsString();
      final patchData = body.isNotEmpty
          ? jsonDecode(body) as Map<String, dynamic>
          : <String, dynamic>{};
      final thread = Map<String, dynamic>.from(MockSeedData.threads.first);
      thread.addAll(patchData);
      return jsonOk(thread);
    });

    appRouter.delete('/v1/threads/<id>', (Request request, String id) async {
      return noContent();
    });

    // Messages
    appRouter.get('/v1/messages/<id>', (Request request, String id) async {
      final message = MockSeedData.messages.firstWhere(
        (m) => m['id'] == id,
        orElse: () => MockSeedData.messages.first,
      );
      return jsonOk(message);
    });

    appRouter.post('/v1/messages/send', (Request request) async {
      final body = await request.readAsString();
      final data = body.isNotEmpty
          ? jsonDecode(body) as Map<String, dynamic>
          : <String, dynamic>{};
      final sentMessage = Map<String, dynamic>.from(MockSeedData.messages.first)
        ..['id'] = 'msg_${DateTime.now().millisecondsSinceEpoch}'
        ..['subject'] = data['subject'] ?? 'Message Subject'
        ..['bodyText'] = data['bodyText'] ?? ''
        ..['sentAt'] = DateTime.now().toIso8601String();
      return jsonCreated(sentMessage);
    });

    // Labels
    appRouter.get('/v1/labels', (Request request) async {
      return jsonOk(MockSeedData.labels);
    });

    appRouter.post('/v1/labels', (Request request) async {
      final body = await request.readAsString();
      final data = body.isNotEmpty
          ? jsonDecode(body) as Map<String, dynamic>
          : <String, dynamic>{};
      final newLabel = {
        'id': 'lbl_${DateTime.now().millisecondsSinceEpoch}',
        'name': data['name'] ?? 'Custom Label',
        'colorHex': data['colorHex'] ?? '#6366F1',
        'isSystem': false,
        'unreadCount': 0,
        'totalCount': 0,
      };
      return jsonCreated(newLabel);
    });

    // Drafts
    appRouter.get('/v1/drafts', (Request request) async {
      return jsonOk(MockSeedData.drafts);
    });

    appRouter.post('/v1/drafts', (Request request) async {
      final body = await request.readAsString();
      final data = body.isNotEmpty
          ? jsonDecode(body) as Map<String, dynamic>
          : <String, dynamic>{};
      final draft = {
        'id': 'drf_${DateTime.now().millisecondsSinceEpoch}',
        'threadId': data['threadId'],
        'subject': data['subject'] ?? 'Draft Subject',
        'bodyText': data['bodyText'] ?? '',
        'updatedAt': DateTime.now().toIso8601String(),
        'recipients': data['recipients'] ?? <dynamic>[],
      };
      return jsonCreated(draft);
    });

    appRouter.put('/v1/drafts/<id>', (Request request, String id) async {
      final body = await request.readAsString();
      final data = body.isNotEmpty
          ? jsonDecode(body) as Map<String, dynamic>
          : <String, dynamic>{};
      final draft = Map<String, dynamic>.from(MockSeedData.drafts.first)
        ..addAll(data)
        ..['id'] = id
        ..['updatedAt'] = DateTime.now().toIso8601String();
      return jsonOk(draft);
    });

    appRouter.delete('/v1/drafts/<id>', (Request request, String id) async {
      return noContent();
    });

    // Reminders
    appRouter.get('/v1/reminders', (Request request) async {
      return jsonOk(MockSeedData.reminders);
    });

    appRouter.post('/v1/reminders', (Request request) async {
      final body = await request.readAsString();
      final data = body.isNotEmpty
          ? jsonDecode(body) as Map<String, dynamic>
          : <String, dynamic>{};
      final reminder = {
        'id': 'rem_${DateTime.now().millisecondsSinceEpoch}',
        'threadId': data['threadId'] ?? 'th_101',
        'title': data['title'] ?? 'Follow up reminder',
        'dueAt':
            data['dueAt'] ??
            DateTime.now().add(const Duration(days: 1)).toIso8601String(),
        'isCompleted': false,
      };
      return jsonCreated(reminder);
    });

    // Scheduled Sends
    appRouter.get('/v1/scheduled-sends', (Request request) async {
      return jsonOk(MockSeedData.scheduledSends);
    });

    appRouter.post('/v1/scheduled-sends', (Request request) async {
      final body = await request.readAsString();
      final data = body.isNotEmpty
          ? jsonDecode(body) as Map<String, dynamic>
          : <String, dynamic>{};
      final scheduled = {
        'id': 'sch_${DateTime.now().millisecondsSinceEpoch}',
        'threadId': data['threadId'] ?? 'th_101',
        'scheduledFor':
            data['scheduledFor'] ??
            DateTime.now().add(const Duration(hours: 12)).toIso8601String(),
        'status': 'pending',
      };
      return jsonCreated(scheduled);
    });

    appRouter.delete('/v1/scheduled-sends/<id>', (
      Request request,
      String id,
    ) async {
      return noContent();
    });

    // Search
    appRouter.get('/v1/search', (Request request) async {
      return jsonOk({
        'threads': MockSeedData.threads,
        'contacts': MockSeedData.threads.first['participants'],
        'events': MockSeedData.calendarEvents,
        'tasks': MockSeedData.tasks,
      });
    });

    // Calendar
    appRouter.get('/v1/calendar/events', (Request request) async {
      return jsonOk(MockSeedData.calendarEvents);
    });

    appRouter.post('/v1/calendar/events', (Request request) async {
      final body = await request.readAsString();
      final data = body.isNotEmpty
          ? jsonDecode(body) as Map<String, dynamic>
          : <String, dynamic>{};
      final event = {
        'id': 'evt_${DateTime.now().millisecondsSinceEpoch}',
        'title': data['title'] ?? 'New Event',
        'startAt': data['startAt'] ?? DateTime.now().toIso8601String(),
        'endAt':
            data['endAt'] ??
            DateTime.now().add(const Duration(hours: 1)).toIso8601String(),
        'isAllDay': data['isAllDay'] ?? false,
        'location': data['location'],
        'meetingUrl': data['meetingUrl'],
      };
      return jsonCreated(event);
    });

    // Tasks
    appRouter.get('/v1/tasks', (Request request) async {
      return jsonOk(MockSeedData.tasks);
    });

    appRouter.post('/v1/tasks', (Request request) async {
      final body = await request.readAsString();
      final data = body.isNotEmpty
          ? jsonDecode(body) as Map<String, dynamic>
          : <String, dynamic>{};
      final task = {
        'id': 'tsk_${DateTime.now().millisecondsSinceEpoch}',
        'title': data['title'] ?? 'Task',
        'threadId': data['threadId'],
        'dueAt': data['dueAt'],
        'isCompleted': false,
        'priority': data['priority'] ?? 'medium',
      };
      return jsonCreated(task);
    });

    appRouter.patch('/v1/tasks/<id>', (Request request, String id) async {
      final body = await request.readAsString();
      final data = body.isNotEmpty
          ? jsonDecode(body) as Map<String, dynamic>
          : <String, dynamic>{};
      final task = Map<String, dynamic>.from(MockSeedData.tasks.first)
        ..addAll(data)
        ..['id'] = id;
      return jsonOk(task);
    });

    appRouter.delete('/v1/tasks/<id>', (Request request, String id) async {
      return noContent();
    });

    // AI
    appRouter.post('/v1/ai/draft-reply', (Request request) async {
      return jsonOk(MockSeedData.aiDraftReply);
    });

    appRouter.post('/v1/ai/summarize-thread', (Request request) async {
      return jsonOk(MockSeedData.aiSummary);
    });

    // Middleware: CORS & logging
    final handler = const Pipeline()
        .addMiddleware((innerHandler) {
          return (request) async {
            if (request.method == 'OPTIONS') {
              return Response.ok(
                '',
                headers: {
                  'access-control-allow-origin': '*',
                  'access-control-allow-methods':
                      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                  'access-control-allow-headers': '*',
                },
              );
            }
            final response = await innerHandler(request);
            return response.change(
              headers: {'access-control-allow-origin': '*'},
            );
          };
        })
        .addHandler(appRouter.call);

    _server = await io.serve(handler, host, port);
  }

  Future<void> stop() async {
    await _server?.close(force: true);
    _server = null;
  }
}
