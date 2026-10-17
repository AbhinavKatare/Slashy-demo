import {
  Controller,
  Get,
  Delete,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { AuditLogQueryDto } from './dto/admin.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin & Privacy')
@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness health check endpoint' })
  getHealth() {
    return {
      status: 'ok',
      service: 'inbox-companion-server',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe checking database and redis connectivity' })
  async getReadiness() {
    return this.adminService.getMetrics();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/metrics')
  @ApiOperation({ summary: 'Get aggregated system metrics' })
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/audit-logs')
  @ApiOperation({ summary: 'Get security and access audit logs for current user' })
  async getAuditLogs(@Req() req: Request, @Query() query: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(req.user!.userId, query.limit);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('users/me/export')
  @ApiOperation({ summary: 'GDPR Data Portability: Export all user data as JSON' })
  async exportUserData(@Req() req: Request) {
    return this.adminService.exportUserData(req.user!.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('users/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'GDPR Right to Erasure: Permanent cascading account purge' })
  async deleteUserAccount(@Req() req: Request) {
    return this.adminService.deleteUserAccount(req.user!.userId);
  }
}
