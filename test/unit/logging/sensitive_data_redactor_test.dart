import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/logging/sensitive_data_redactor.dart';

void main() {
  group('SensitiveDataRedactor', () {
    const redactor = SensitiveDataRedactor();

    test('redacts sensitive keys in maps', () {
      final input = {
        'id': '123',
        'email': 'alex.morgan@acme-companion.test',
        'password': 'SuperSecretPassword!',
        'access_token': 'secret_jwt_token',
        'refreshToken': 'refresh_token_value',
        'nested': {'api_key': 'abc123secret', 'publicField': 'safe'},
      };

      final result = redactor.redact(input) as Map<String, dynamic>;

      expect(result['id'], equals('123'));
      expect(result['password'], equals('[REDACTED]'));
      expect(result['access_token'], equals('[REDACTED]'));
      expect(result['refreshToken'], equals('[REDACTED]'));
      expect((result['nested'] as Map)['api_key'], equals('[REDACTED]'));
      expect((result['nested'] as Map)['publicField'], equals('safe'));
    });

    test('redacts JWT tokens in plain strings', () {
      const jwt =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      final result = redactor.redact(jwt) as String;

      expect(result, equals('[REDACTED_JWT]'));
    });

    test(
      'masks email addresses to prevent PII leakage while preserving domain',
      () {
        const email = 'alex.morgan@acme-companion.test';
        final result = redactor.redact(email, redactEmailPii: true) as String;

        expect(result, isNot(contains('alex.morgan')));
        expect(result, contains('@acme-companion.test'));
      },
    );

    test('handles nulls and primitives without modification', () {
      expect(redactor.redact(null), isNull);
      expect(redactor.redact(42), equals(42));
      expect(redactor.redact(true), isTrue);
    });
  });
}
