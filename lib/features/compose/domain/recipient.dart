import 'package:equatable/equatable.dart';

/// Recipient representing a To, Cc, or Bcc email contact with RFC 5322 validation.
class Recipient extends Equatable {
  const Recipient({required this.email, this.name, this.avatarUrl});

  final String email;
  final String? name;
  final String? avatarUrl;

  /// RFC 5322 compliant email regex
  static final RegExp _emailRegex = RegExp(
    r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
  );

  bool get isValid => _emailRegex.hasMatch(email.trim());

  String? get validationError {
    final trimmed = email.trim();
    if (trimmed.isEmpty) return 'Email cannot be empty';
    if (!_emailRegex.hasMatch(trimmed)) return 'Invalid email address format';
    return null;
  }

  String get displayName => (name != null && name!.isNotEmpty) ? name! : email;

  Map<String, dynamic> toJson() => {
    'name': name,
    'email': email,
    'avatarUrl': avatarUrl,
  };

  factory Recipient.fromJson(Map<String, dynamic> json) => Recipient(
    email: json['email'] as String? ?? '',
    name: json['name'] as String?,
    avatarUrl: json['avatarUrl'] as String?,
  );

  @override
  List<Object?> get props => [email, name, avatarUrl];
}
