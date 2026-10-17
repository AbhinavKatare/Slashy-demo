"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const uuid_1 = require("uuid");
let TasksService = class TasksService {
    db;
    constructor(db) {
        this.db = db;
    }
    async listTasks(userId) {
        const res = await this.db.query(`SELECT t.id, t.thread_id, t.title, t.due_date, t.is_completed, t.created_at, t.updated_at,
              th.subject AS thread_subject
       FROM tasks t
       LEFT JOIN threads th ON t.thread_id = th.id
       WHERE t.user_id = $1
       ORDER BY t.is_completed ASC, t.due_date ASC NULLS LAST, t.created_at DESC;`, [userId], userId);
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
    async createTask(userId, dto) {
        const id = (0, uuid_1.v7)();
        const res = await this.db.query(`INSERT INTO tasks (id, user_id, thread_id, title, due_date, is_completed)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING id, title, thread_id, due_date, is_completed, created_at;`, [
            id,
            userId,
            dto.threadId || null,
            dto.title,
            dto.dueDate ? new Date(dto.dueDate).toISOString() : null,
        ], userId);
        return res.rows[0];
    }
    async updateTask(userId, taskId, dto) {
        const sets = ['updated_at = clock_timestamp()'];
        const params = [taskId, userId];
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
        const res = await this.db.query(`UPDATE tasks
       SET ${sets.join(', ')}
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, is_completed, due_date, updated_at;`, params, userId);
        if (!res.rows[0]) {
            throw new common_1.NotFoundException(`Task ${taskId} not found`);
        }
        return res.rows[0];
    }
    async deleteTask(userId, taskId) {
        const res = await this.db.query(`DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id;`, [taskId, userId], userId);
        if (!res.rows[0]) {
            throw new common_1.NotFoundException(`Task ${taskId} not found`);
        }
        return { success: true, message: 'Task deleted' };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map