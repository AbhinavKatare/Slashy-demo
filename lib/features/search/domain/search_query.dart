import 'package:equatable/equatable.dart';

/// Parsed search query containing free text keywords and structured search operators.
class SearchQuery extends Equatable {
  const SearchQuery({
    this.rawText = '',
    this.freeText = '',
    this.from,
    this.to,
    this.hasAttachment,
    this.isUnread,
    this.isStarred,
    this.isArchived,
    this.before,
    this.after,
    this.label,
  });

  final String rawText;
  final String freeText;
  final String? from;
  final String? to;
  final bool? hasAttachment;
  final bool? isUnread;
  final bool? isStarred;
  final bool? isArchived;
  final DateTime? before;
  final DateTime? after;
  final String? label;

  bool get isEmpty =>
      freeText.isEmpty &&
      from == null &&
      to == null &&
      hasAttachment == null &&
      isUnread == null &&
      isStarred == null &&
      isArchived == null &&
      before == null &&
      after == null &&
      label == null;

  /// Parses a raw user search string into a structured SearchQuery
  static SearchQuery parse(String raw) {
    final tokens = raw.trim().split(RegExp(r'\s+'));
    final freeTextBuffer = StringBuffer();

    String? from;
    String? to;
    bool? hasAttachment;
    bool? isUnread;
    bool? isStarred;
    bool? isArchived;
    DateTime? before;
    DateTime? after;
    String? label;

    for (final token in tokens) {
      if (token.isEmpty) continue;

      final lower = token.toLowerCase();

      if (lower.startsWith('from:')) {
        from = token.substring(5).trim();
      } else if (lower.startsWith('to:')) {
        to = token.substring(3).trim();
      } else if (lower == 'has:attachment') {
        hasAttachment = true;
      } else if (lower == 'is:unread') {
        isUnread = true;
      } else if (lower == 'is:read') {
        isUnread = false;
      } else if (lower == 'is:starred') {
        isStarred = true;
      } else if (lower == 'is:unstarred') {
        isStarred = false;
      } else if (lower == 'is:archived' || lower == 'is:archive') {
        isArchived = true;
      } else if (lower.startsWith('before:')) {
        final dateStr = token.substring(7).trim();
        before = DateTime.tryParse(dateStr);
      } else if (lower.startsWith('after:')) {
        final dateStr = token.substring(6).trim();
        after = DateTime.tryParse(dateStr);
      } else if (lower.startsWith('label:')) {
        label = token.substring(6).trim();
      } else {
        if (freeTextBuffer.isNotEmpty) freeTextBuffer.write(' ');
        freeTextBuffer.write(token);
      }
    }

    return SearchQuery(
      rawText: raw,
      freeText: freeTextBuffer.toString(),
      from: from,
      to: to,
      hasAttachment: hasAttachment,
      isUnread: isUnread,
      isStarred: isStarred,
      isArchived: isArchived,
      before: before,
      after: after,
      label: label,
    );
  }

  SearchQuery copyWith({
    String? rawText,
    String? freeText,
    String? from,
    String? to,
    bool? hasAttachment,
    bool? isUnread,
    bool? isStarred,
    bool? isArchived,
    DateTime? before,
    DateTime? after,
    String? label,
  }) {
    return SearchQuery(
      rawText: rawText ?? this.rawText,
      freeText: freeText ?? this.freeText,
      from: from ?? this.from,
      to: to ?? this.to,
      hasAttachment: hasAttachment ?? this.hasAttachment,
      isUnread: isUnread ?? this.isUnread,
      isStarred: isStarred ?? this.isStarred,
      isArchived: isArchived ?? this.isArchived,
      before: before ?? this.before,
      after: after ?? this.after,
      label: label ?? this.label,
    );
  }

  @override
  List<Object?> get props => [
    rawText,
    freeText,
    from,
    to,
    hasAttachment,
    isUnread,
    isStarred,
    isArchived,
    before,
    after,
    label,
  ];
}
