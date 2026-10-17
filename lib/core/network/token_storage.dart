/// Storage abstraction for JWT access & refresh tokens
abstract class ITokenStorage {
  Future<String?> getAccessToken();
  Future<String?> getRefreshToken();
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  });
  Future<void> clearTokens();
  Future<bool> hasValidToken();
}

/// In-memory token storage (with option to bridge to secure storage in production)
class InMemoryTokenStorage implements ITokenStorage {
  InMemoryTokenStorage({
    String? initialAccessToken,
    String? initialRefreshToken,
  }) : _accessToken = initialAccessToken,
       _refreshToken = initialRefreshToken;

  String? _accessToken;
  String? _refreshToken;

  @override
  Future<String?> getAccessToken() async => _accessToken;

  @override
  Future<String?> getRefreshToken() async => _refreshToken;

  @override
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
  }

  @override
  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
  }

  @override
  Future<bool> hasValidToken() async {
    return _accessToken != null && _accessToken!.isNotEmpty;
  }
}
