import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { SchedulingService } from './scheduling.service';
import { ScheduleDraftDto } from './dto/scheduling.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schedule an email draft to be sent at a future timestamp' })
  async scheduleDraft(@Req() req: Request, @Body() dto: ScheduleDraftDto) {
    return this.schedulingService.scheduleDraft(req.user!.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all pending scheduled messages' })
  async listScheduled(@Req() req: Request) {
    return this.schedulingService.listScheduled(req.user!.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a pending scheduled message' })
  async cancelScheduled(@Req() req: Request, @Param('id') id: string) {
    return this.schedulingService.cancelScheduled(req.user!.userId, id);
  }
}
