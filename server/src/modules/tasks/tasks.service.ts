import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/tasks.dto';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class TasksService {
  constructor(private readonly db: DatabaseService) {}

  async listTasks(userId: string) {
    const res = await this.db.query(
      `SELECT t.id, t.thread_id, t.title, t.due_date, t.is_completed, t.created_at, t.updated_at,
              th.subject AS thread_subject
       FROM tasks t
       LEFT JOIN threads th ON t.thread_id = th.id
       WHERE t.user_id = $1
       ORDER BY t.is_completed ASC, t.due_date ASC NULLS LAST, t.created_at DESC;`,
      [userId],
      userId,
    );

    return res.rows.map((r) => ({
      id: r.id,
      threadId: r.thread_id,
      threadSubject: r.thread_subject || null,
      title: r.title,
      dueDate: r.due_date ? r.due_date.toISOString() : null,
      isCompleted: r.is_completed,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    }));
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    const id = uuidv7();
    const res = await this.db.query(
      `INSERT INTO tasks (id, user_id, thread_id, title, due_date, is_completed)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING id, title, thread_id, due_date, is_completed, created_at;`,
      [
        id,
        userId,
        dto.threadId || null,
        dto.title,
        dto.dueDate ? new Date(dto.dueDate).toISOString() : null,
      ],
      userId,
    );
    return res.rows[0];
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    const sets: string[] = ['updated_at = clock_timestamp()'];
    const params: any[] = [taskId, userId];

    if (dto.title !== undefined) {
      params.push(dto.title);
      sets.push(`title = $${params.length}`);
    }
    if (dto.isCompleted !== undefined) {
      params.push(dto.isCompleted);
      sets.push(`is_completed = $${params.length}`);
    }
    if (dto.dueDate !== undefined) {
      params.push(dto.dueDate ? new Date(dto.dueDate).toISOString() : null);
      sets.push(`due_date = $${params.length}`);
    }

    const res = await this.db.query(
      `UPDATE tasks
       SET ${sets.join(', ')}
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, is_completed, due_date, updated_at;`,
      params,
      userId,
    );

    if (!res.rows[0]) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    return res.rows[0];
  }

  async deleteTask(userId: string, taskId: string) {
    const res = await this.db.query(
      `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [taskId, userId],
      userId,
    );
    if (!res.rows[0]) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    return { success: true, message: 'Task deleted' };
  }
}
