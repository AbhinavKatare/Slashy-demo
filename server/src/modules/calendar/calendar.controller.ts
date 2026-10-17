import { Controller, Get, Post, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto, ListEventsQueryDto } from './dto/calendar.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calendar/events')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'List calendar events in date range' })
  async listEvents(@Req() req: Request, @Query() query: ListEventsQueryDto) {
    return this.calendarService.listEvents(req.user!.userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a calendar event' })
  async createEvent(@Req() req: Request, @Body() dto: CreateCalendarEventDto) {
    return this.calendarService.createEvent(req.user!.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a calendar event' })
  async deleteEvent(@Req() req: Request, @Param('id') id: string) {
    return this.calendarService.deleteEvent(req.user!.userId, id);
  }
}
