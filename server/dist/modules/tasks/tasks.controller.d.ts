import { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/tasks.dto';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    listTasks(req: Request): Promise<{
        id: any;
        threadId: any;
        threadSubject: any;
        title: any;
        dueDate: any;
        isCompleted: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    createTask(req: Request, dto: CreateTaskDto): Promise<any>;
    updateTask(req: Request, id: string, dto: UpdateTaskDto): Promise<any>;
    deleteTask(req: Request, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
