import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/theme/tokens/elevation_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';
import 'package:inbox_companion/core/widgets/snackbar/app_snackbar.dart';
import 'package:inbox_companion/features/ai/application/speech_dictation_service.dart';
import 'package:inbox_companion/features/ai/domain/ai_tone.dart';
import 'package:inbox_companion/features/ai/presentation/ai_privacy_consent_dialog.dart';
import 'package:inbox_companion/features/ai/presentation/thread_summary_card.dart';

final speechDictationServiceProvider = Provider<SpeechDictationService>((ref) {
  return SpeechDictationService();
});

class AiDraftReplySheet extends ConsumerStatefulWidget {
  const AiDraftReplySheet({
    super.key,
    required this.threadId,
    required this.messageId,
    required this.threadText,
    required this.senderName,
  });

  final String threadId;
  final String messageId;
  final String threadText;
  final String senderName;

  static Future<void> show(
    BuildContext context, {
    required String threadId,
    required String messageId,
    required String threadText,
    required String senderName,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => AiDraftReplySheet(
        threadId: threadId,
        messageId: messageId,
        threadText: threadText,
        senderName: senderName,
      ),
    );
  }

  @override
  ConsumerState<AiDraftReplySheet> createState() => _AiDraftReplySheetState();
}

class _AiDraftReplySheetState extends ConsumerState<AiDraftReplySheet> {
  AiTone _selectedTone = AiTone.friendlier;
  String _generatedText = '';
  bool _isStreaming = false;
  bool _isDictating = false;
  StreamSubscription<String>? _streamSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _startGeneration());
  }

  @override
  void dispose() {
    _streamSub?.cancel();
    super.dispose();
  }

  Future<void> _startGeneration() async {
    final aiService = ref.read(aiServiceProvider);
    final isEnabled = await aiService.isAiEnabled();

    if (!isEnabled) {
      if (!mounted) return;
      final consent = await AiPrivacyConsentDialog.show(context);
      if (consent == true) {
        await aiService.enableWithConsent();
      } else {
        if (!mounted) return;
        Navigator.of(context).pop();
        return;
      }
    }

    setState(() {
      _isStreaming = true;
      _generatedText = '';
    });

    try {
      await _streamSub?.cancel();
      _streamSub = aiService
          .streamDraftReply(threadText: widget.threadText, tone: _selectedTone)
          .listen(
            (chunk) {
              if (mounted) {
                setState(() {
                  _generatedText += chunk;
                });
              }
            },
            onDone: () {
              if (mounted) setState(() => _isStreaming = false);
            },
            onError: (Object err) {
              if (mounted) {
                setState(() => _isStreaming = false);
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
        setState(() => _isStreaming = false);
        AppSnackbar.show(
          context,
          message: e.toString(),
          variant: AppSnackbarVariant.warning,
        );
      }
    }
  }

  Future<void> _toggleVoiceDictation() async {
    final speechService = ref.read(speechDictationServiceProvider);

    if (_isDictating) {
      speechService.stopListening();
      setState(() => _isDictating = false);
    } else {
      setState(() => _isDictating = true);
      await speechService.startListening(
        onTranscription: (text) {
          if (mounted) {
            setState(() {
              _generatedText = text;
            });
          }
        },
        onComplete: () {
          if (mounted) setState(() => _isDictating = false);
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(SpacingTokens.lg),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2230) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: ElevationTokens.elevation4,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: SpacingTokens.md),
                decoration: BoxDecoration(
                  color: isDark ? Colors.grey[700] : Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                Icon(Icons.auto_awesome, color: theme.colorScheme.primary),
                const SizedBox(width: SpacingTokens.xs),
                Text(
                  'Draft Reply with AI',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.tertiaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'AI-generated',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onTertiaryContainer,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: SpacingTokens.md),

            // Tone Selection Chips
            Row(
              children: AiTone.values.map((tone) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(tone.label),
                    selected: _selectedTone == tone,
                    onSelected: (selected) {
                      if (selected && !_isStreaming) {
                        setState(() => _selectedTone = tone);
                        _startGeneration();
                      }
                    },
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: SpacingTokens.md),

            // Generated Output Area
            Container(
              constraints: const BoxConstraints(minHeight: 140, maxHeight: 220),
              width: double.infinity,
              padding: const EdgeInsets.all(SpacingTokens.md),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withValues(
                  alpha: 0.4,
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: theme.colorScheme.outlineVariant.withValues(
                    alpha: 0.5,
                  ),
                ),
              ),
              child: SingleChildScrollView(
                child: Text(
                  _generatedText.isNotEmpty
                      ? _generatedText
                      : 'Drafting reply for ${widget.senderName}...',
                  style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
                ),
              ),
            ),
            const SizedBox(height: SpacingTokens.md),

            // Controls & Action Bar
            Row(
              children: [
                IconButton.filledTonal(
                  icon: Icon(_isDictating ? Icons.mic : Icons.mic_none),
                  tooltip: _isDictating ? 'Stop dictation' : 'Voice dictation',
                  color: _isDictating ? Colors.red : null,
                  onPressed: _toggleVoiceDictation,
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  icon: const Icon(Icons.refresh),
                  tooltip: 'Regenerate',
                  onPressed: _isStreaming ? null : _startGeneration,
                ),
                const Spacer(),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 8),
                AppButton(
                  label: 'Use as Draft',
                  icon: Icons.edit_note,
                  variant: AppButtonVariant.primary,
                  onPressed: _generatedText.isNotEmpty
                      ? () {
                          Navigator.of(context).pop();
                          final encoded = Uri.encodeComponent(_generatedText);
                          context.push(
                            '/compose?threadId=${widget.threadId}&messageId=${widget.messageId}&body=$encoded&isAiGenerated=true',
                          );
                        }
                      : null,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
