import { DatabaseService } from '../../database/database.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/tasks.dto';
export declare class TasksService {
    private readonly db;
    constructor(db: DatabaseService);
    listTasks(userId: string): Promise<{
        id: any;
        threadId: any;
        threadSubject: any;
        title: any;
        dueDate: any;
        isCompleted: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    createTask(userId: string, dto: CreateTaskDto): Promise<any>;
    updateTask(userId: string, taskId: string, dto: UpdateTaskDto): Promise<any>;
    deleteTask(userId: string, taskId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
