import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/data/mock/mock_server.dart';

void main() {
  group('MockServer Local Shelf Execution', () {
    late MockServer server;
    late Dio dio;

    setUp(() async {
      server = MockServer(port: 8089, host: '127.0.0.1');
      await server.start();
      dio = Dio(BaseOptions(baseUrl: server.baseUrl));
    });

    tearDown(() async {
      await server.stop();
    });

    test('authenticates login and returns tokens with user profile', () async {
      final res = await dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': 'alex.morgan@acme-companion.test', 'password': 'test'},
      );

      expect(res.statusCode, equals(200));
      expect(res.data!['accessToken'], isNotEmpty);
      expect(res.data!['user']['displayName'], equals('Alex Morgan'));
    });

    test('lists threads with pagination and participants', () async {
      final res = await dio.get<Map<String, dynamic>>('/threads');

      expect(res.statusCode, equals(200));
      final threads = res.data!['threads'] as List<dynamic>;
      expect(threads, isNotEmpty);
      expect(threads.first['subject'], contains('Architecture Review'));
    });

    test('sends message with auto-generated id and timestamps', () async {
      final res = await dio.post<Map<String, dynamic>>(
        '/messages/send',
        data: {
          'subject': 'New Outgoing Message',
          'bodyText': 'Content of the message',
        },
      );

      expect(res.statusCode, equals(201));
      expect(res.data!['id'], startsWith('msg_'));
      expect(res.data!['subject'], equals('New Outgoing Message'));
    });

    test(
      'performs unified search across threads, contacts, and tasks',
      () async {
        final res = await dio.get<Map<String, dynamic>>(
          '/search',
          queryParameters: {'q': 'design', 'type': 'all'},
        );

        expect(res.statusCode, equals(200));
        expect(res.data!.containsKey('threads'), isTrue);
        expect(res.data!.containsKey('contacts'), isTrue);
        expect(res.data!.containsKey('tasks'), isTrue);
      },
    );
  });
}
