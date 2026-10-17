/// Redacts sensitive information such as tokens, passwords, secrets, and PII from logs and telemetry payloads.
class SensitiveDataRedactor {
  const SensitiveDataRedactor();

  static const Set<String> _sensitiveKeys = {
    'password',
    'pass',
    'token',
    'access_token',
    'refresh_token',
    'accesstoken',
    'refreshtoken',
    'authorization',
    'auth',
    'secret',
    'apikey',
    'api_key',
    'client_secret',
    'session',
    'cookie',
    'credit_card',
    'card_number',
    'cvv',
    'ssn',
    'pin',
  };

  static final RegExp _jwtPattern = RegExp(
    r'^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$',
  );

  static final RegExp _emailPattern = RegExp(
    r'([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})',
  );

  /// Recursively scrubs dynamic objects (Maps, Lists, Strings, Objects)
  dynamic redact(dynamic data, {bool redactEmailPii = true}) {
    if (data == null) {
      return null;
    }
    if (data is Map) {
      return _redactMap(data, redactEmailPii: redactEmailPii);
    }
    if (data is List) {
      return data
          .map((item) => redact(item, redactEmailPii: redactEmailPii))
          .toList();
    }
    if (data is String) {
      return _redactString(data, redactEmailPii: redactEmailPii);
    }
    return data;
  }

  Map<String, dynamic> _redactMap(
    Map<dynamic, dynamic> map, {
    required bool redactEmailPii,
  }) {
    final sanitized = <String, dynamic>{};
    for (final entry in map.entries) {
      final key = entry.key.toString();
      final lowerKey = key.toLowerCase();

      final isSensitive = _sensitiveKeys.any(
        (pattern) =>
            lowerKey == pattern ||
            lowerKey.contains('password') ||
            lowerKey.contains('token') ||
            lowerKey.contains('secret'),
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = redact(entry.value, redactEmailPii: redactEmailPii);
      }
    }
    return sanitized;
  }

  String _redactString(String value, {required bool redactEmailPii}) {
    if (value.length > 30 && _jwtPattern.hasMatch(value)) {
      return '[REDACTED_JWT]';
    }

    if (redactEmailPii) {
      return value.replaceAllMapped(_emailPattern, (match) {
        final user = match.group(1) ?? '';
        final domain = match.group(2) ?? '';
        final tld = match.group(3) ?? '';
        final maskedUser = user.isEmpty
            ? '***'
            : '${user[0]}***${user.length > 2 ? user[user.length - 1] : ''}';
        return '$maskedUser@$domain.$tld';
      });
    }

    return value;
  }
}
