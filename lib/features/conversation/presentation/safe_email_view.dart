import 'package:flutter/material.dart';
import 'package:inbox_companion/core/html/html_email_sanitizer.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';

class SafeEmailView extends StatefulWidget {
  const SafeEmailView({
    super.key,
    required this.htmlBody,
    required this.senderEmail,
    this.initialAllowRemoteImages = false,
    this.onToggleAllowSender,
  });

  final String htmlBody;
  final String senderEmail;
  final bool initialAllowRemoteImages;
  final void Function(String sender, bool allow)? onToggleAllowSender;

  @override
  State<SafeEmailView> createState() => _SafeEmailViewState();
}

class _SafeEmailViewState extends State<SafeEmailView> {
  late bool _allowRemoteImages;
  bool _showQuotedText = false;

  @override
  void initState() {
    super.initState();
    _allowRemoteImages = widget.initialAllowRemoteImages;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final sanitized = HtmlEmailSanitizer.sanitize(
      rawHtml: widget.htmlBody,
      allowRemoteImages: _allowRemoteImages,
      isDarkMode: isDark,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Privacy Banner if remote images were blocked
        if (sanitized.hasBlockedImages && !_allowRemoteImages)
          Container(
            margin: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: theme.colorScheme.outlineVariant),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.shield_outlined,
                      size: 18,
                      color: theme.colorScheme.primary,
                    ),
                    AppSpacing.gapHorizontalSm,
                    Expanded(
                      child: Text(
                        'Remote images blocked (${sanitized.blockedImageCount}) to protect your privacy.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                AppSpacing.gapVerticalSm,
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.xs,
                  children: [
                    TextButton(
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () {
                        setState(() {
                          _allowRemoteImages = true;
                        });
                      },
                      child: const Text('Load Images Once'),
                    ),
                    TextButton(
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () {
                        setState(() {
                          _allowRemoteImages = true;
                        });
                        widget.onToggleAllowSender?.call(
                          widget.senderEmail,
                          true,
                        );
                      },
                      child: const Text('Always Load from Sender'),
                    ),
                  ],
                ),
              ],
            ),
          ),

        // Main Email Content (safely rendered plain / formatted text)
        Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: _renderSanitizedContent(context, sanitized.cleanedHtml),
        ),

        // Collapsed Quoted History Accordion
        if (sanitized.quotedHtml != null) ...[
          const Divider(height: 1),
          ListTile(
            dense: true,
            leading: Icon(
              _showQuotedText ? Icons.expand_less : Icons.more_horiz,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            title: Text(
              _showQuotedText ? 'Hide quoted text' : 'Show quoted text',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.bold,
              ),
            ),
            onTap: () {
              setState(() {
                _showQuotedText = !_showQuotedText;
              });
            },
          ),
          if (_showQuotedText)
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(8),
                border: Border(
                  left: BorderSide(color: theme.colorScheme.outline, width: 3),
                ),
              ),
              child: _renderSanitizedContent(context, sanitized.quotedHtml!),
            ),
        ],
      ],
    );
  }

  Widget _renderSanitizedContent(BuildContext context, String html) {
    final theme = Theme.of(context);
    // Strip simple tags to render safely in native RichText
    final text = html
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n\n')
        .replaceAll(RegExp(r'<[^>]*>'), '');

    return SelectableText(
      text.trim(),
      style: theme.textTheme.bodyMedium?.copyWith(
        height: 1.5,
        color: theme.colorScheme.onSurface,
      ),
    );
  }
}
