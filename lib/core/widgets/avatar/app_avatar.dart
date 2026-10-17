import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';

enum AppAvatarStatus {
  online(Color(0xFF22C55E)),
  busy(Color(0xFFEF4444)),
  away(Color(0xFFF59E0B)),
  offline(Color(0xFF94A3B8));

  const AppAvatarStatus(this.color);
  final Color color;
}

/// Accessible Avatar displaying user photo, initials fallback, and presence dot.
class AppAvatar extends StatelessWidget {
  const AppAvatar({
    super.key,
    required this.name,
    this.imageUrl,
    this.size = 40.0,
    this.status,
    this.onTap,
    this.semanticLabel,
  });

  final String name;
  final String? imageUrl;
  final double size;
  final AppAvatarStatus? status;
  final VoidCallback? onTap;
  final String? semanticLabel;

  String _getInitials(String input) {
    final parts = input.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) {
      return parts.first
          .substring(0, parts.first.length.clamp(1, 2))
          .toUpperCase();
    }
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  Color _generateTonalColor(String input, ColorScheme colorScheme) {
    final hash = input.codeUnits.fold<int>(0, (prev, elem) => prev + elem);
    final hues = [
      colorScheme.primary,
      colorScheme.secondary,
      colorScheme.tertiary,
      const Color(0xFF6366F1),
      const Color(0xFF0D9488),
      const Color(0xFF8B5CF6),
      const Color(0xFFEC4899),
    ];
    return hues[hash % hues.length];
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final initials = _getInitials(name);
    final bgColor = _generateTonalColor(name, colorScheme);

    Widget avatarContent = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bgColor.withValues(alpha: 0.15),
        shape: BoxShape.circle,
        border: Border.all(color: bgColor.withValues(alpha: 0.3), width: 1.5),
      ),
      alignment: Alignment.center,
      child: imageUrl != null && imageUrl!.isNotEmpty
          ? ClipOval(
              child: Image.network(
                imageUrl!,
                width: size,
                height: size,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) =>
                    _buildInitialsText(initials, bgColor, theme),
              ),
            )
          : _buildInitialsText(initials, bgColor, theme),
    );

    if (status != null) {
      final dotSize = (size * 0.28).clamp(8.0, 14.0);
      avatarContent = Stack(
        clipBehavior: Clip.none,
        children: [
          avatarContent,
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: dotSize,
              height: dotSize,
              decoration: BoxDecoration(
                color: status!.color,
                shape: BoxShape.circle,
                border: Border.all(color: colorScheme.surface, width: 2),
              ),
            ),
          ),
        ],
      );
    }

    Widget result = avatarContent;
    if (onTap != null) {
      result = ConstrainedBox(
        constraints: const BoxConstraints(
          minHeight: AppSpacing.minTouchTarget,
          minWidth: AppSpacing.minTouchTarget,
        ),
        child: Center(
          child: InkResponse(
            onTap: onTap,
            radius: size / 2 + 6,
            child: avatarContent,
          ),
        ),
      );
    }

    return Semantics(
      label: semanticLabel ?? '$name avatar',
      image: true,
      button: onTap != null,
      child: result,
    );
  }

  Widget _buildInitialsText(String initials, Color color, ThemeData theme) {
    return Text(
      initials,
      style: theme.textTheme.labelMedium?.copyWith(
        color: color,
        fontWeight: FontWeight.w700,
        fontSize: size * 0.4,
      ),
    );
  }
}
