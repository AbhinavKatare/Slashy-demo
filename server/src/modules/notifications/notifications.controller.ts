import {
  Controller,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import {
  RegisterNotificationTokenDto,
  UnregisterNotificationTokenDto,
} from './dto/notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register device push notification token' })
  async registerToken(@Req() req: Request, @Body() dto: RegisterNotificationTokenDto) {
    return this.notificationsService.registerToken(req.user!.userId, dto);
  }

  @Delete('token')
  @ApiOperation({ summary: 'Unregister device push notification token' })
  async unregisterToken(@Req() req: Request, @Body() dto: UnregisterNotificationTokenDto) {
    return this.notificationsService.unregisterToken(req.user!.userId, dto.token);
  }
}
