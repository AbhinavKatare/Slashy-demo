import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';

/// Modal bottom sheet breaking down exact data flow and privacy protections for founders & security auditors
class PrivacyTransparencyDialog extends StatelessWidget {
  const PrivacyTransparencyDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const PrivacyTransparencyDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2230) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[700] : Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.sm,
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.verified_user_rounded,
                    color: theme.colorScheme.primary,
                    size: 26,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      'Data Flow & Trust Transparency',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  _buildTrustItem(
                    context,
                    icon: Icons.key_off_outlined,
                    iconColor: Colors.blue,
                    title: '1. Zero Password Storage',
                    body: 'Inbox Companion never requests or sees your email password. Authentication uses OAuth 2.0 with PKCE via your native system browser. Session tokens are hardware-encrypted in Android Keystore / iOS Keychain.',
                  ),
                  _buildTrustItem(
                    context,
                    icon: Icons.storage_rounded,
                    iconColor: Colors.teal,
                    title: '2. Local-First SQLite Database',
                    body: 'Your threads, drafts, messages, and labels are stored in a local SQLite database (Drift). All inbox scrolling, searching, and triaging happens on-device with zero network latency.',
                  ),
                  _buildTrustItem(
                    context,
                    icon: Icons.security_rounded,
                    iconColor: Colors.amber.shade800,
                    title: '3. AI Isolation & Untrusted Delimiters',
                    body: 'Email text is sent to the AI service only when you explicitly tap "Summarize" or "Draft Reply". Content is wrapped in <untrusted_email_body> XML tags to neutralize prompt injection attacks. It is never used to train foundational models.',
                  ),
                  _buildTrustItem(
                    context,
                    icon: Icons.touch_app_outlined,
                    iconColor: Colors.green,
                    title: '4. Human-Approved Send Guarantee',
                    body: 'Strict architectural boundary: The AI service has zero tools or API permissions to send emails, delete messages, or mutate your calendar. Every email requires an explicit tap by you on the verified review sheet.',
                  ),
                  _buildTrustItem(
                    context,
                    icon: Icons.shield_outlined,
                    iconColor: Colors.indigo,
                    title: '5. Remote Tracker & Pixel Blocking',
                    body: 'External images (<img src="http...">) are blocked by default. This stops invisible 1x1 tracking pixels from leaking your IP address, device location, or email open timestamps without your knowledge.',
                  ),
                  _buildTrustItem(
                    context,
                    icon: Icons.delete_forever_outlined,
                    iconColor: Colors.red,
                    title: '6. Cascading Account Purge (GDPR)',
                    body: 'Tapping "Disconnect & Wipe Data" executes a permanent, atomic purge of all local SQLite databases and sends a cascading deletion request to the server to purge all server records and vector embeddings.',
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: AppButton(
                label: 'Got it, Close',
                variant: AppButtonVariant.primary,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrustItem(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String body,
  }) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 22, color: iconColor),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
