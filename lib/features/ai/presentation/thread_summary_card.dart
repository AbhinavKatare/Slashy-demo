import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inbox_companion/core/theme/tokens/elevation_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/snackbar/app_snackbar.dart';
import 'package:inbox_companion/features/ai/application/ai_service.dart';
import 'package:inbox_companion/features/ai/presentation/ai_privacy_consent_dialog.dart';

final aiServiceProvider = Provider<AiService>((ref) {
  return AiService();
});

class ThreadSummaryCard extends ConsumerStatefulWidget {
  const ThreadSummaryCard({
    super.key,
    required this.threadText,
    required this.threadSubject,
  });

  final String threadText;
  final String threadSubject;

  @override
  ConsumerState<ThreadSummaryCard> createState() => _ThreadSummaryCardState();
}

class _ThreadSummaryCardState extends ConsumerState<ThreadSummaryCard> {
  bool _isExpanded = false;
  bool _isLoading = false;
  String _summaryContent = '';
  StreamSubscription<String>? _streamSub;

  @override
  void dispose() {
    _streamSub?.cancel();
    super.dispose();
  }

  Future<void> _generateSummary() async {
    final aiService = ref.read(aiServiceProvider);
    final isEnabled = await aiService.isAiEnabled();

    if (!isEnabled) {
      if (!mounted) return;
      final consent = await AiPrivacyConsentDialog.show(context);
      if (consent == true) {
        await aiService.enableWithConsent();
      } else {
        return;
      }
    }

    setState(() {
      _isLoading = true;
      _isExpanded = true;
      _summaryContent = '';
    });

    try {
      await _streamSub?.cancel();
      _streamSub = aiService
          .streamSummary(widget.threadText)
          .listen(
            (chunk) {
              if (mounted) {
                setState(() {
                  _summaryContent += chunk;
                });
              }
            },
            onDone: () {
              if (mounted) setState(() => _isLoading = false);
            },
            onError: (Object err) {
              if (mounted) {
                setState(() => _isLoading = false);
                AppSnackbar.show(
                  context,
                  message: err.toString(),
                  variant: AppSnackbarVariant.warning,
                );
              }
            },
          );
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        AppSnackbar.show(
          context,
          message: e.toString(),
          variant: AppSnackbarVariant.warning,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (!_isExpanded && _summaryContent.isEmpty) {
      return Container(
        margin: const EdgeInsets.symmetric(
          horizontal: SpacingTokens.md,
          vertical: 8,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: theme.colorScheme.primary.withValues(alpha: 0.2),
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.auto_awesome,
              size: 18,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(width: SpacingTokens.sm),
            Expanded(
              child: Text(
                'Generate instant AI summary of this conversation',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
            TextButton(
              onPressed: _generateSummary,
              child: const Text('Summarize'),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: SpacingTokens.md,
        vertical: 8,
      ),
      padding: const EdgeInsets.all(SpacingTokens.md),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2230) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: ElevationTokens.elevation2,
        border: Border.all(
          color: theme.colorScheme.primary.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.auto_awesome,
                size: 18,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: SpacingTokens.xs),
              Text(
                'AI Conversation Summary',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Advisory only',
                  style: theme.textTheme.labelSmall?.copyWith(
                    fontSize: 10,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
              const Spacer(),
              if (_isLoading)
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else
                IconButton(
                  icon: const Icon(Icons.refresh, size: 18),
                  tooltip: 'Regenerate summary',
                  onPressed: _generateSummary,
                ),
              IconButton(
                icon: const Icon(Icons.keyboard_arrow_up, size: 20),
                tooltip: 'Collapse',
                onPressed: () => setState(() => _isExpanded = false),
              ),
            ],
          ),
          const SizedBox(height: SpacingTokens.xs),
          const Divider(height: 1),
          const SizedBox(height: SpacingTokens.sm),
          Text(
            _summaryContent.isNotEmpty
                ? _summaryContent
                : 'Analyzing thread conversation...',
            style: theme.textTheme.bodySmall?.copyWith(height: 1.5),
          ),
        ],
      ),
    );
  }
}
