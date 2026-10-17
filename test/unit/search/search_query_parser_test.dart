import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/features/search/domain/search_query.dart';

void main() {
  group('SearchQuery Parser Unit Tests', () {
    test('Parses plain text queries into freeText keywords', () {
      final query = SearchQuery.parse('architecture review deliverables');

      expect(query.freeText, equals('architecture review deliverables'));
      expect(query.from, isNull);
      expect(query.to, isNull);
      expect(query.hasAttachment, isNull);
      expect(query.isUnread, isNull);
      expect(query.isStarred, isNull);
      expect(query.isEmpty, isFalse);
    });

    test('Parses sender and recipient operators', () {
      final query = SearchQuery.parse(
        'from:jordan.lee@acme.test to:alex status update',
      );

      expect(query.from, equals('jordan.lee@acme.test'));
      expect(query.to, equals('alex'));
      expect(query.freeText, equals('status update'));
    });

    test('Parses status boolean operators: is:unread, is:read, is:starred, has:attachment', () {
      final query1 = SearchQuery.parse(
        'is:unread is:starred has:attachment quarterly',
      );
      expect(query1.isUnread, isTrue);
      expect(query1.isStarred, isTrue);
      expect(query1.hasAttachment, isTrue);
      expect(query1.freeText, equals('quarterly'));

      final query2 = SearchQuery.parse('is:read is:unstarred is:archived');
      expect(query2.isUnread, isFalse);
      expect(query2.isStarred, isFalse);
      expect(query2.isArchived, isTrue);
      expect(query2.freeText, isEmpty);
    });

    test('Parses date boundaries before: and after:', () {
      final query = SearchQuery.parse(
        'after:2026-01-01 before:2026-12-31 audit',
      );

      expect(query.after, equals(DateTime(2026, 1, 1)));
      expect(query.before, equals(DateTime(2026, 12, 31)));
      expect(query.freeText, equals('audit'));
    });

    test('Parses label operator', () {
      final query = SearchQuery.parse('label:lbl_urgent invoice');

      expect(query.label, equals('lbl_urgent'));
      expect(query.freeText, equals('invoice'));
    });

    test('Handles empty and whitespace-only queries', () {
      final empty = SearchQuery.parse('');
      final spaces = SearchQuery.parse('     ');

      expect(empty.isEmpty, isTrue);
      expect(spaces.isEmpty, isTrue);
      expect(empty.freeText, isEmpty);
    });

    test('Tolerates multiple consecutive spaces and mixed casing', () {
      final query = SearchQuery.parse(
        '  FROM:jordan   IS:UNREAD   HAS:ATTACHMENT   Design Specs  ',
      );

      expect(query.from, equals('jordan'));
      expect(query.isUnread, isTrue);
      expect(query.hasAttachment, isTrue);
      expect(query.freeText, equals('Design Specs'));
    });
  });
}
