import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/tasks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List all tasks for authenticated user' })
  async listTasks(@Req() req: Request) {
    return this.tasksService.listTasks(req.user!.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(@Req() req: Request, @Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(req.user!.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update or complete a task' })
  async updateTask(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.updateTask(req.user!.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(@Req() req: Request, @Param('id') id: string) {
    return this.tasksService.deleteTask(req.user!.userId, id);
  }
}
