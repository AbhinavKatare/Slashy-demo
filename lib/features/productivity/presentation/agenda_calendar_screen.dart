import 'package:drift/drift.dart' hide Column;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/tokens/elevation_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/button/app_button.dart';
import 'package:inbox_companion/core/widgets/empty_state/app_empty_state.dart';
import 'package:inbox_companion/core/widgets/snackbar/app_snackbar.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

class AgendaCalendarScreen extends ConsumerStatefulWidget {
  const AgendaCalendarScreen({super.key});

  @override
  ConsumerState<AgendaCalendarScreen> createState() =>
      _AgendaCalendarScreenState();
}

class _AgendaCalendarScreenState extends ConsumerState<AgendaCalendarScreen> {
  String _viewMode = 'day'; // 'day', 'week', 'all'
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _seedEvents();
  }

  Future<void> _seedEvents() async {
    try {
      final db = ref.read(appDatabaseProvider);
      final accountId =
          ref.read(authServiceProvider).state.currentAccount?.id ??
          'acc_work_01';
      final now = DateTime.now();

      // Seed events fixed to the current calendar day in local time
      final todayMorning = DateTime(now.year, now.month, now.day, 10, 0);
      final todayAfternoon = DateTime(now.year, now.month, now.day, 13, 30);
      final todayEvening = DateTime(now.year, now.month, now.day, 16, 0);
      final tomorrow = now.add(const Duration(days: 1));
      final tomorrowMidday = DateTime(tomorrow.year, tomorrow.month, tomorrow.day, 11, 0);
      final dayAfter = now.add(const Duration(days: 2));
      final dayAfterAfternoon = DateTime(dayAfter.year, dayAfter.month, dayAfter.day, 14, 0);

      await db.upsertEvent(
        EventsCompanion(
          id: const Value('evt_01'),
          accountId: Value(accountId),
          title: const Value('Design System & Component Gallery Walkthrough'),
          description: const Value('Walkthrough and review discussion.'),
          startTime: Value(todayMorning),
          endTime: Value(todayMorning.add(const Duration(hours: 1))),
          location: const Value('Virtual Conf Room Alpha'),
          conferenceUrl: const Value('https://meet.google.com/abc-demo-xyz'),
          organizerEmail: const Value('alex.morgan@acme-companion.test'),
          isAllDay: const Value(false),
        ),
      );
      await db.upsertEvent(
        EventsCompanion(
          id: const Value('evt_02'),
          accountId: Value(accountId),
          title: const Value('Sprint Planning & Architecture Alignment'),
          description: const Value('Weekly engineering team alignment.'),
          startTime: Value(todayAfternoon),
          endTime: Value(todayAfternoon.add(const Duration(hours: 1))),
          location: const Value('Main Conference Room B'),
          conferenceUrl: const Value('https://meet.google.com/sprint-42-align'),
          organizerEmail: const Value('samira@orbital-systems.test'),
          isAllDay: const Value(false),
        ),
      );
      await db.upsertEvent(
        EventsCompanion(
          id: const Value('evt_03'),
          accountId: Value(accountId),
          title: const Value('Q4 Product Roadmap Review'),
          description: const Value(
            'Cross-functional review of Q4 priorities and milestones.',
          ),
          startTime: Value(todayEvening),
          endTime: Value(todayEvening.add(const Duration(hours: 1))),
          location: const Value('Zoom — link in invite'),
          conferenceUrl: const Value('https://zoom.us/j/demo-roadmap-q4'),
          organizerEmail: const Value('priya@orbital-systems.test'),
          isAllDay: const Value(false),
        ),
      );
      await db.upsertEvent(
        EventsCompanion(
          id: const Value('evt_04'),
          accountId: Value(accountId),
          title: const Value('Security & PII Redaction Audit'),
          description: const Value('Sanitization verification before release.'),
          startTime: Value(tomorrowMidday),
          endTime: Value(tomorrowMidday.add(const Duration(hours: 1))),
          location: const Value('Audit Room C'),
          conferenceUrl: const Value('https://meet.google.com/audit-sec-pii'),
          organizerEmail: const Value('marcus@vance-legal.test'),
          isAllDay: const Value(false),
        ),
      );
      await db.upsertEvent(
        EventsCompanion(
          id: const Value('evt_05'),
          accountId: Value(accountId),
          title: const Value('Client Demo & Showcase Walkthrough'),
          description: const Value('Interactive walkthrough for stakeholders.'),
          startTime: Value(dayAfterAfternoon),
          endTime: Value(dayAfterAfternoon.add(const Duration(hours: 1, minutes: 30))),
          location: const Value('Main Presentation Suite'),
          conferenceUrl: const Value('https://meet.google.com/showcase-demo'),
          organizerEmail: const Value('jordan@design-tokens.test'),
          isAllDay: const Value(false),
        ),
      );
    } catch (_) {
      // Non-fatal fallback
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final db = ref.watch(appDatabaseProvider);
    final tz = DateTime.now().timeZoneName;
    final offset = DateTime.now().timeZoneOffset;
    final offsetHours = offset.inHours.abs().toString().padLeft(2, '0');
    final offsetMins = (offset.inMinutes.abs() % 60).toString().padLeft(2, '0');
    final sign = offset.isNegative ? '-' : '+';
    final tzOffsetStr = 'UTC$sign$offsetHours:$offsetMins';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agenda & Calendar'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Back',
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else {
              context.go('/inbox');
            }
          },
        ),
        actions: [
          SegmentedButton<String>(
            segments: const [
              ButtonSegment<String>(value: 'day', label: Text('Day')),
              ButtonSegment<String>(value: 'week', label: Text('Week')),
              ButtonSegment<String>(value: 'all', label: Text('All')),
            ],
            selected: {_viewMode},
            onSelectionChanged: (set) =>
                setState(() => _viewMode = set.first),
          ),
          const SizedBox(width: SpacingTokens.md),
        ],
      ),
      body: Column(
        children: [
          // Timezone Header
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: SpacingTokens.md,
              vertical: SpacingTokens.sm,
            ),
            color: theme.colorScheme.surfaceContainerHighest.withValues(
              alpha: 0.5,
            ),
            child: Row(
              children: [
                Icon(
                  Icons.public,
                  size: 16,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 8),
                Text(
                  'Timezone: $tz ($tzOffsetStr)',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const Spacer(),
                Text(
                  DateFormat('MMMM yyyy').format(_selectedDate),
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          // Date Navigator
          if (_viewMode != 'all')
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => setState(() {
                    _selectedDate = _selectedDate.subtract(
                      Duration(days: _viewMode == 'week' ? 7 : 1),
                    );
                  }),
                ),
                TextButton(
                  onPressed: () => setState(() => _selectedDate = DateTime.now()),
                  child: Text(
                    _viewMode == 'week'
                        ? 'Week of ${DateFormat('MMM d').format(_selectedDate)}'
                        : DateFormat('EEE, MMM d, yyyy').format(_selectedDate),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () => setState(() {
                    _selectedDate = _selectedDate.add(
                      Duration(days: _viewMode == 'week' ? 7 : 1),
                    );
                  }),
                ),
              ],
            ),
          const Divider(height: 1),

          // Content
          Expanded(
            child: StreamBuilder<List<Event>>(
              stream: db.watchEvents(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting &&
                    !snapshot.hasData) {
                  return const Center(
                    child: CircularProgressIndicator.adaptive(),
                  );
                }

                final allEvents = snapshot.data ?? [];
                final filtered = allEvents.where((e) {
                  final eventLocal = e.startTime.toLocal();
                  if (_viewMode == 'all') {
                    return true;
                  } else if (_viewMode == 'week') {
                    final selectedMidnight = DateTime(
                      _selectedDate.year,
                      _selectedDate.month,
                      _selectedDate.day,
                    );
                    final startOfWeek = selectedMidnight.subtract(
                      Duration(days: _selectedDate.weekday - 1),
                    );
                    final endOfWeek = startOfWeek.add(const Duration(days: 7));
                    return !eventLocal.isBefore(startOfWeek) &&
                        eventLocal.isBefore(endOfWeek);
                  } else {
                    return eventLocal.year == _selectedDate.year &&
                        eventLocal.month == _selectedDate.month &&
                        eventLocal.day == _selectedDate.day;
                  }
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AppEmptyState(
                          title: 'No events scheduled',
                          message: _viewMode == 'week'
                              ? 'You have a clear week with no meetings or calendar events.'
                              : _viewMode == 'all'
                                  ? 'No events in your calendar.'
                                  : 'No events for ${DateFormat('EEE, MMM d').format(_selectedDate)}.',
                          icon: Icons.event_available,
                        ),
                        const SizedBox(height: SpacingTokens.md),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            AppButton(
                              label: 'Today',
                              variant: AppButtonVariant.secondary,
                              icon: Icons.today,
                              onPressed: () => setState(() {
                                _selectedDate = DateTime.now();
                                _viewMode = 'day';
                              }),
                            ),
                            const SizedBox(width: SpacingTokens.sm),
                            AppButton(
                              label: 'Reset Events',
                              variant: AppButtonVariant.primary,
                              icon: Icons.refresh,
                              onPressed: () => _seedEvents(),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(SpacingTokens.md),
                  itemCount: filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (ctx, i) => _buildEventCard(context, filtered[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEventCard(BuildContext context, Event event) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final fmt = DateFormat('h:mm a');
    final dateFmt = DateFormat('EEE, MMM d');

    return Container(
      padding: const EdgeInsets.all(SpacingTokens.md),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2230) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: ElevationTokens.elevation1,
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 14,
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${dateFmt.format(event.startTime.toLocal())} • ${fmt.format(event.startTime.toLocal())} – ${fmt.format(event.endTime.toLocal())}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (event.location != null)
                Flexible(
                  child: Text(
                    event.location!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
          ),
          const SizedBox(height: SpacingTokens.sm),
          Text(
            event.title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          if (event.description != null) ...[
            const SizedBox(height: 4),
            Text(
              event.description!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
          if (event.conferenceUrl != null) ...[
            const SizedBox(height: SpacingTokens.md),
            Row(
              children: [
                AppButton(
                  label: 'Join Meeting',
                  icon: Icons.video_call,
                  variant: AppButtonVariant.primary,
                  onPressed: () async {
                    final uri = Uri.parse(event.conferenceUrl!);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(
                        uri,
                        mode: LaunchMode.externalApplication,
                      );
                    } else if (context.mounted) {
                      AppSnackbar.show(
                        context,
                        message: 'Could not open: ${event.conferenceUrl}',
                        variant: AppSnackbarVariant.warning,
                      );
                    }
                  },
                ),
                const SizedBox(width: SpacingTokens.sm),
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 20),
                  tooltip: 'Delete Event',
                  onPressed: () => _confirmDelete(context, event.id),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, String eventId) {
    showDialog<void>(
      context: context,
      builder: (dlg) => AlertDialog(
        title: const Text('Delete Event?'),
        content: const Text(
          'Are you sure you want to remove this event from your calendar?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dlg).pop(),
            child: const Text('Cancel'),
          ),
          AppButton(
            label: 'Delete',
            variant: AppButtonVariant.destructive,
            onPressed: () async {
              Navigator.of(dlg).pop();
              await ref.read(appDatabaseProvider).deleteEvent(eventId);
              if (context.mounted) {
                AppSnackbar.show(
                  context,
                  message: 'Event deleted.',
                  variant: AppSnackbarVariant.info,
                );
              }
            },
          ),
        ],
      ),
    );
  }
}
