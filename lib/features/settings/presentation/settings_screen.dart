import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';
import 'package:inbox_companion/features/ai/presentation/ai_privacy_consent_dialog.dart';
import 'package:inbox_companion/features/ai/presentation/thread_summary_card.dart';
import 'package:inbox_companion/features/settings/presentation/privacy_transparency_dialog.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  String _leftSwipeAction = 'archive';
  String _rightSwipeAction = 'trash';
  bool _blockRemoteImages = true;
  bool _confirmExternalLinks = true;
  bool _isAiEnabled = false;
  bool _quietHoursEnabled = true;

  final _signatureController = TextEditingController(
    text: 'Sent from Inbox Companion',
  );

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final aiService = ref.read(aiServiceProvider);
    final aiEnabled = await aiService.isAiEnabled();
    if (mounted) {
      setState(() {
        _isAiEnabled = aiEnabled;
      });
    }
  }

  @override
  void dispose() {
    _signatureController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = ref.watch(authServiceProvider).state;
    final authService = ref.read(authServiceProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // Account Summary
          if (authState.currentAccount != null) ...[
            ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text(
                authState.currentAccount!.displayName,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(authState.currentAccount!.email),
              trailing: authState.isDemoMode
                  ? Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.tertiaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'DEMO',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.onTertiaryContainer,
                        ),
                      ),
                    )
                  : null,
            ),
            const Divider(),
          ],

          // 1. Swipe Actions Configuration
          _buildSectionHeader('Swipe Gestures'),
          ListTile(
            title: const Text('Left Swipe Action'),
            subtitle: Text('Currently: ${_leftSwipeAction.toUpperCase()}'),
            trailing: DropdownButton<String>(
              value: _leftSwipeAction,
              underline: const SizedBox(),
              items: const [
                DropdownMenuItem(value: 'archive', child: Text('Archive')),
                DropdownMenuItem(value: 'trash', child: Text('Trash')),
                DropdownMenuItem(value: 'star', child: Text('Star')),
                DropdownMenuItem(value: 'read', child: Text('Mark Read')),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _leftSwipeAction = val);
              },
            ),
          ),
          ListTile(
            title: const Text('Right Swipe Action'),
            subtitle: Text('Currently: ${_rightSwipeAction.toUpperCase()}'),
            trailing: DropdownButton<String>(
              value: _rightSwipeAction,
              underline: const SizedBox(),
              items: const [
                DropdownMenuItem(value: 'trash', child: Text('Trash')),
                DropdownMenuItem(value: 'archive', child: Text('Archive')),
                DropdownMenuItem(value: 'star', child: Text('Star')),
                DropdownMenuItem(value: 'read', child: Text('Mark Read')),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _rightSwipeAction = val);
              },
            ),
          ),
          const Divider(),

          // 2. Signature Editor
          _buildSectionHeader('Email Signature'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _signatureController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: 'Default Signature',
                helperText:
                    'Appended automatically to new messages and replies',
              ),
            ),
          ),
          const Divider(),

          // 3. Privacy & Security
          _buildSectionHeader('Privacy & Link Security'),
          ListTile(
            leading: const Icon(Icons.shield_outlined, color: Colors.blue),
            title: const Text('Data Flow & Privacy Transparency'),
            subtitle: const Text(
              'Detailed breakdown of local SQLite caching, token security & AI boundaries',
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => PrivacyTransparencyDialog.show(context),
          ),
          ListTile(
            leading: const Icon(
              Icons.verified_user_outlined,
              color: Colors.green,
            ),
            title: const Text('Human-Approved Send Guarantee'),
            subtitle: const Text(
              'Strict policy: AI and background tasks can never dispatch emails without review',
            ),
            trailing: const Icon(
              Icons.check_circle,
              color: Colors.green,
              size: 20,
            ),
            onTap: () => PrivacyTransparencyDialog.show(context),
          ),
          SwitchListTile(
            title: const Text('Block Remote Images'),
            subtitle: const Text(
              'Protects your IP address and blocks email tracking pixels',
            ),
            value: _blockRemoteImages,
            onChanged: (val) => setState(() => _blockRemoteImages = val),
          ),
          SwitchListTile(
            title: const Text('Confirm External Links'),
            subtitle: const Text(
              'Warns against deceptive phishing URLs before browser launch',
            ),
            value: _confirmExternalLinks,
            onChanged: (val) => setState(() => _confirmExternalLinks = val),
          ),
          const Divider(),

          // 4. AI Features & Consent
          _buildSectionHeader('AI Assistance'),
          SwitchListTile(
            title: const Text('Enable AI Features'),
            subtitle: Text(
              _isAiEnabled
                  ? 'Active (Summarization and draft assistance enabled)'
                  : 'Disabled (Explicit privacy consent required)',
            ),
            value: _isAiEnabled,
            onChanged: (val) async {
              final aiService = ref.read(aiServiceProvider);
              if (val) {
                final consent = await AiPrivacyConsentDialog.show(context);
                if (consent == true) {
                  await aiService.enableWithConsent();
                  setState(() => _isAiEnabled = true);
                }
              } else {
                await aiService.disableAi();
                setState(() => _isAiEnabled = false);
              }
            },
          ),
          const Divider(),

          // 5. Notifications & Quiet Hours
          _buildSectionHeader('Notifications & Quiet Hours'),
          SwitchListTile(
            title: const Text('Quiet Hours (10:00 PM – 7:00 AM)'),
            subtitle: const Text('Silences high-importance alerts overnight'),
            value: _quietHoursEnabled,
            onChanged: (val) => setState(() => _quietHoursEnabled = val),
          ),
          const Divider(),

          // 6. Data Management & Export
          _buildSectionHeader('Data Management'),
          ListTile(
            leading: const Icon(Icons.download_rounded),
            title: const Text('Export Local Data (JSON)'),
            subtitle: const Text(
              'Save a copy of local messages, tasks, and drafts',
            ),
            onTap: () => _exportLocalData(context),
          ),
          ListTile(
            leading: const Icon(Icons.delete_forever, color: Colors.red),
            title: const Text(
              'Disconnect & Wipe All Local Data',
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
            ),
            subtitle: const Text(
              'Completely purges all local SQLite databases and stored tokens',
            ),
            onTap: () => _confirmFullWipe(context, authService),
          ),
          const Divider(),

          // 7. About & Licenses
          _buildSectionHeader('About'),
          ListTile(
            title: const Text('Inbox Companion'),
            subtitle: const Text(
              'Version 1.0.0+1 • Production-grade architecture',
            ),
            trailing: const Icon(Icons.info_outline),
            onTap: () {
              showLicensePage(
                context: context,
                applicationName: 'Inbox Companion',
                applicationVersion: '1.0.0+1',
                applicationLegalese: 'Copyright 2026. All rights reserved.',
              );
            },
          ),
          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, top: 12, bottom: 4),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }

  Future<void> _exportLocalData(BuildContext context) async {
    final db = ref.read(appDatabaseProvider);
    final threads = await db.watchThreads().first;
    final tasks = await db.watchTasks().first;
    final drafts = await db.watchDrafts().first;

    final exportJson = {
      'exportedAt': DateTime.now().toUtc().toIso8601String(),
      'threadsCount': threads.length,
      'tasksCount': tasks.length,
      'draftsCount': drafts.length,
      'threads': threads
          .map((t) => {'id': t.id, 'subject': t.subject})
          .toList(),
      'tasks': tasks.map((t) => {'id': t.id, 'title': t.title}).toList(),
    };

    final jsonStr = const JsonEncoder.withIndent('  ').convert(exportJson);

    if (context.mounted) {
      unawaited(
        showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Local Data Export'),
            content: SingleChildScrollView(
              child: Text(
                jsonStr,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
              ),
            ),
            actions: [
              AppButton(
                label: 'Done',
                onPressed: () => Navigator.of(ctx).pop(),
              ),
            ],
          ),
        ),
      );
    }
  }

  void _confirmFullWipe(BuildContext context, dynamic authService) {
    showDialog<void>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Wipe All Data?'),
        content: const Text(
          'This action will permanently delete all local SQLite databases, stored credentials, drafts, and tasks. You will be returned to the Welcome screen.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Cancel'),
          ),
          AppButton(
            label: 'Wipe Everything',
            variant: AppButtonVariant.destructive,
            onPressed: () async {
              Navigator.of(dialogCtx).pop();
              final authState = ref.read(authServiceProvider).state;
              if (authState.currentAccount != null) {
                await authService.disconnectAndDeleteAccount(
                  authState.currentAccount!.id,
                );
              }
              await authService.signOut();
              if (context.mounted) {
                context.go('/welcome');
              }
            },
          ),
        ],
      ),
    );
  }
}
