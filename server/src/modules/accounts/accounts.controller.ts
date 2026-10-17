import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AccountsService } from './accounts.service';
import { OAuthConnectService } from './oauth-connect.service';
import { ConnectCallbackDto, DisconnectAccountDto, GetConnectUrlQueryDto } from './dto/connect.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly connectService: OAuthConnectService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all connected accounts for authenticated user' })
  async listAccounts(@Req() req: Request) {
    return this.accountsService.listAccounts(req.user!.userId);
  }

  @Get('connect/url')
  @ApiOperation({ summary: 'Generate OAuth authorization URL with PKCE and requested scope tier' })
  getConnectUrl(@Req() req: Request, @Query() query: GetConnectUrlQueryDto) {
    return this.connectService.generateAuthorizeUrl(
      req.user!.userId,
      query.provider,
      query.tier,
      query.redirectUri,
    );
  }

  @Post('connect/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Exchange OAuth authorization code + PKCE verifier and store envelope-encrypted tokens',
  })
  async connectCallback(@Req() req: Request, @Body() dto: ConnectCallbackDto) {
    return this.connectService.handleCallback(req.user!.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a connected account' })
  async getAccount(@Param('id') id: string, @Req() req: Request) {
    return this.accountsService.getAccount(req.user!.userId, id);
  }

  @Post(':id/disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect account, revoke provider token, and optionally purge data' })
  async disconnect(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto?: DisconnectAccountDto,
  ) {
    return this.connectService.disconnectAccount(req.user!.userId, id, dto?.purgeData ?? true);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect and purge account data' })
  async disconnectAccount(@Param('id') id: string, @Req() req: Request) {
    return this.connectService.disconnectAccount(req.user!.userId, id, true);
  }
}
