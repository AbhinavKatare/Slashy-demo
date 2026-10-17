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
import 'package:inbox_companion/data/mock/mock_seed_data.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  String _filter = 'pending'; // 'pending', 'completed', 'all'

  @override
  void initState() {
    super.initState();
    _seedTasks();
  }

  Future<void> _seedTasks() async {
    try {
      final db = ref.read(appDatabaseProvider);
      final accountId =
          ref.read(authServiceProvider).state.currentAccount?.id ??
              'acc_work_01';
      final now = DateTime.now();

      for (final tsk in MockSeedData.tasks) {
        await db.upsertTask(
          TasksCompanion(
            id: Value(tsk['id'] as String),
            accountId: Value(accountId),
            threadId: Value(tsk['threadId'] as String?),
            title: Value(tsk['title'] as String),
            notes: const Value('High priority item from email triage.'),
            dueDate: Value(now.add(const Duration(days: 1))),
            isCompleted: Value(tsk['isCompleted'] as bool? ?? false),
            createdAt: Value(now),
          ),
        );
      }
    } catch (_) {
      // Non-fatal — stream shows whatever is currently in the DB.
    }
  }

  @override
  Widget build(BuildContext context) {
    final db = ref.watch(appDatabaseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tasks & Action Items'),
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
          IconButton(
            icon: const Icon(Icons.add_task),
            tooltip: 'Add Task',
            onPressed: () => _showAddTaskDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: SpacingTokens.md,
              vertical: SpacingTokens.xs,
            ),
            child: Row(
              children: [
                ChoiceChip(
                  label: const Text('Pending'),
                  selected: _filter == 'pending',
                  onSelected: (_) => setState(() => _filter = 'pending'),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('Completed'),
                  selected: _filter == 'completed',
                  onSelected: (_) => setState(() => _filter = 'completed'),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('All Tasks'),
                  selected: _filter == 'all',
                  onSelected: (_) => setState(() => _filter = 'all'),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Content
          Expanded(
            child: StreamBuilder<List<Task>>(
              stream: db.watchTasks(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting &&
                    !snapshot.hasData) {
                  return const Center(
                    child: CircularProgressIndicator.adaptive(),
                  );
                }

                final allTasks = snapshot.data ?? [];
                final filtered = allTasks.where((t) {
                  if (_filter == 'pending') return !t.isCompleted;
                  if (_filter == 'completed') return t.isCompleted;
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AppEmptyState(
                          title: _filter == 'completed'
                              ? 'No completed tasks'
                              : 'No pending tasks',
                          message: _filter == 'completed'
                              ? 'Finished tasks will appear here after completion.'
                              : 'You are all caught up! Tap + to create a new task.',
                          icon: Icons.task_alt,
                        ),
                        const SizedBox(height: SpacingTokens.md),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            AppButton(
                              label: 'Restore Tasks',
                              variant: AppButtonVariant.secondary,
                              icon: Icons.refresh,
                              onPressed: () => _seedTasks(),
                            ),
                            const SizedBox(width: SpacingTokens.sm),
                            AppButton(
                              label: 'Add Task',
                              variant: AppButtonVariant.primary,
                              icon: Icons.add,
                              onPressed: () => _showAddTaskDialog(context),
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
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (ctx, i) =>
                      _buildTaskTile(context, filtered[i], db),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddTaskDialog(context),
        tooltip: 'Add Task',
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildTaskTile(
    BuildContext context,
    Task task,
    AppDatabase db,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: SpacingTokens.sm,
        vertical: SpacingTokens.xs,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2230) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: ElevationTokens.elevation1,
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.4),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Checkbox(
            value: task.isCompleted,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4),
            ),
            onChanged: (val) async {
              if (val != null) {
                await db.upsertTask(
                  TasksCompanion(
                    id: Value(task.id),
                    accountId: Value(task.accountId),
                    threadId: Value(task.threadId),
                    title: Value(task.title),
                    notes: Value(task.notes),
                    dueDate: Value(task.dueDate),
                    isCompleted: Value(val),
                    createdAt: Value(task.createdAt),
                  ),
                );
              }
            },
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.title,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    decoration:
                        task.isCompleted ? TextDecoration.lineThrough : null,
                    color: task.isCompleted
                        ? theme.colorScheme.onSurfaceVariant
                        : theme.colorScheme.onSurface,
                  ),
                ),
                if (task.notes != null && task.notes!.isNotEmpty)
                  Text(
                    task.notes!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                if (task.dueDate != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 12,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Due ${DateFormat('MMM d, yyyy').format(task.dueDate!.toLocal())}',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          if (task.threadId != null)
            IconButton(
              icon: const Icon(Icons.link, size: 20),
              tooltip: 'Open Linked Thread',
              onPressed: () => context.push('/conversation/${task.threadId}'),
            ),
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 18),
            tooltip: 'Delete Task',
            onPressed: () => _confirmDeleteTask(context, db, task.id),
          ),
        ],
      ),
    );
  }

  void _showAddTaskDialog(BuildContext context) {
    final titleCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    DateTime? dueDate;

    showDialog<void>(
      context: context,
      builder: (dlg) => StatefulBuilder(
        builder: (ctx, setDlg) => AlertDialog(
          title: const Text('Add Task'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleCtrl,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: 'Task Title',
                  hintText: 'e.g. Follow up on design tokens',
                ),
              ),
              const SizedBox(height: SpacingTokens.sm),
              TextField(
                controller: notesCtrl,
                decoration: const InputDecoration(
                  labelText: 'Notes (optional)',
                ),
              ),
              const SizedBox(height: SpacingTokens.md),
              Row(
                children: [
                  Icon(
                    Icons.event,
                    size: 18,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    dueDate == null
                        ? 'No due date set'
                        : 'Due: ${DateFormat('MMM d, yyyy').format(dueDate!)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate:
                            DateTime.now().add(const Duration(days: 1)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (picked != null) {
                        setDlg(() => dueDate = picked);
                      }
                    },
                    child: const Text('Pick Date'),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dlg).pop(),
              child: const Text('Cancel'),
            ),
            AppButton(
              label: 'Save Task',
              onPressed: () async {
                final title = titleCtrl.text.trim();
                if (title.isNotEmpty) {
                  final db = ref.read(appDatabaseProvider);
                  final accountId =
                      ref.read(authServiceProvider).state.currentAccount?.id ??
                          'acc_work_01';
                  final taskId = 'tsk_${const Uuid().v4().substring(0, 8)}';
                  await db.upsertTask(
                    TasksCompanion(
                      id: Value(taskId),
                      accountId: Value(accountId),
                      title: Value(title),
                      notes: Value(notesCtrl.text.trim()),
                      dueDate: Value(dueDate),
                      isCompleted: const Value(false),
                      createdAt: Value(DateTime.now()),
                    ),
                  );
                  if (dlg.mounted) Navigator.of(dlg).pop();
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDeleteTask(BuildContext context, AppDatabase db, String taskId) {
    showDialog<void>(
      context: context,
      builder: (dlg) => AlertDialog(
        title: const Text('Delete Task?'),
        content: const Text(
            'Are you sure you want to permanently delete this task?'),
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
              await db.deleteTask(taskId);
              if (context.mounted) {
                AppSnackbar.show(
                  context,
                  message: 'Task deleted.',
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
