import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { DraftsService } from './drafts.service';
import { SendingService } from './sending.service';
import { CreateDraftDto, UpdateDraftDto } from './dto/drafts.dto';
import { SendDraftDto, UploadAttachmentDto } from './dto/send.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Drafts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drafts')
export class DraftsController {
  constructor(
    private readonly draftsService: DraftsService,
    private readonly sendingService: SendingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all message drafts' })
  async listDrafts(@Req() req: Request, @Query('accountId') accountId?: string) {
    return this.draftsService.listDrafts(req.user!.userId, accountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get draft by ID' })
  async getDraft(@Req() req: Request, @Param('id') id: string) {
    return this.draftsService.getDraft(req.user!.userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new draft' })
  async createDraft(@Req() req: Request, @Body() dto: CreateDraftDto) {
    return this.draftsService.createDraft(req.user!.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing draft' })
  async updateDraft(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateDraftDto) {
    return this.draftsService.updateDraft(req.user!.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft' })
  async deleteDraft(@Req() req: Request, @Param('id') id: string) {
    return this.draftsService.deleteDraft(req.user!.userId, id);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Explicitly send a draft with user review hash, undo window, and scheduled send support',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Unique client key to prevent double submissions',
  })
  async sendDraft(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SendDraftDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    dto.draftId = id;
    return this.sendingService.sendDraft(req.user!.userId, dto, idempotencyKey);
  }

  @Post('send/:sendId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a pending send during the undo window or before scheduled time',
  })
  async cancelSend(@Req() req: Request, @Param('sendId') sendId: string) {
    return this.sendingService.cancelSend(req.user!.userId, sendId);
  }

  @Post('attachments/upload')
  @ApiOperation({ summary: 'Upload draft attachment with size, type limits and malware scanning' })
  async uploadAttachment(@Req() req: Request, @Body() dto: UploadAttachmentDto) {
    return this.sendingService.uploadAttachment(req.user!.userId, dto);
  }
}
