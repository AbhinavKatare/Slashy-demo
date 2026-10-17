import 'package:equatable/equatable.dart';

/// Attachment model with size enforcement and security extension filtering.
class AttachmentItem extends Equatable {
  const AttachmentItem({
    required this.id,
    required this.name,
    required this.sizeBytes,
    required this.mimeType,
    this.localPath,
  });

  final String id;
  final String name;
  final int sizeBytes;
  final String mimeType;
  final String? localPath;

  /// Max single attachment size: 10 MB
  static const int kMaxSingleAttachmentBytes = 10 * 1024 * 1024;

  /// Max cumulative attachments size: 25 MB
  static const int kMaxTotalAttachmentsBytes = 25 * 1024 * 1024;

  /// Blocked executable and potentially malicious extensions
  static const Set<String> kBlockedExtensions = {
    '.exe',
    '.bat',
    '.cmd',
    '.sh',
    '.vbs',
    '.js',
    '.scr',
    '.msi',
    '.apk',
    '.jar',
  };

  String get extension {
    final dotIndex = name.lastIndexOf('.');
    if (dotIndex == -1) return '';
    return name.substring(dotIndex).toLowerCase();
  }

  bool get isBlockedExtension => kBlockedExtensions.contains(extension);

  bool get isUnderSingleLimit => sizeBytes <= kMaxSingleAttachmentBytes;

  String? get validationError {
    if (isBlockedExtension) {
      return 'File type "$extension" is blocked for security reasons.';
    }
    if (!isUnderSingleLimit) {
      return 'Attachment exceeds 10 MB limit ($formattedSize).';
    }
    return null;
  }

  String get formattedSize {
    if (sizeBytes < 1024) return '$sizeBytes B';
    if (sizeBytes < 1024 * 1024) {
      return '${(sizeBytes / 1024).toStringAsFixed(1)} KB';
    }
    return '${(sizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'filename': name,
    'sizeBytes': sizeBytes,
    'mimeType': mimeType,
    'localPath': localPath,
  };

  factory AttachmentItem.fromJson(Map<String, dynamic> json) => AttachmentItem(
    id: json['id'] as String? ?? '',
    name: (json['filename'] ?? json['name'] ?? 'attachment') as String,
    sizeBytes: json['sizeBytes'] as int? ?? 0,
    mimeType: json['mimeType'] as String? ?? 'application/octet-stream',
    localPath: json['localPath'] as String?,
  );

  @override
  List<Object?> get props => [id, name, sizeBytes, mimeType, localPath];
}
