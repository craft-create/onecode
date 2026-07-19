import {
  Body,
  Query,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NeedLogin } from '@server/common/compat/fullstack-nestjs-core';
import { getLocalUserId } from '@server/common/utils/auth.helper';
import type {
  ChatMessageRequest,
  CreateChatRequestRequest,
  CreateConversationRequest,
} from '@shared/api.interface';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.chatService.findAll(getLocalUserId(req));
  }

  @NeedLogin()
  @Post()
  create(@Body() data: CreateConversationRequest, @Req() req: Request) {
    return this.chatService.create(data, getLocalUserId(req));
  }

  @Get('conversations')
  findConversations(@Req() req: Request) {
    return this.chatService.findAll(getLocalUserId(req));
  }

  @NeedLogin()
  @Post('conversations')
  createConversation(
    @Body() data: CreateConversationRequest,
    @Req() req: Request,
  ) {
    return this.chatService.create(data, getLocalUserId(req));
  }

  @Get('requests')
  getChatRequests(
    @Req() req: Request,
    @Query('direction') direction?: 'incoming' | 'outgoing' | 'all',
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
  ) {
    return this.chatService.getChatRequests(getLocalUserId(req), {
      direction: direction || 'all',
      status,
    });
  }

  @NeedLogin()
  @Post('requests')
  createChatRequest(
    @Body() data: CreateChatRequestRequest,
    @Req() req: Request,
  ) {
    return this.chatService.createChatRequest(data, getLocalUserId(req));
  }

  @NeedLogin()
  @Post('requests/:id/approve')
  approveChatRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.chatService.approveChatRequest(id, getLocalUserId(req));
  }

  @NeedLogin()
  @Post('requests/:id/reject')
  rejectChatRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.chatService.rejectChatRequest(id, getLocalUserId(req));
  }

  @Get('unread/count')
  getUnreadCount(@Req() req: Request) {
    return this.chatService.getUnreadCount(getLocalUserId(req));
  }

  @Get('conversations/:id')
  findConversation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.chatService.findOne(id, getLocalUserId(req));
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
    @Query('beforeId') beforeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.findMessages(id, getLocalUserId(req), {
      beforeId,
      page,
      limit,
    });
  }

  @NeedLogin()
  @Post('messages')
  sendMessage(@Body() data: ChatMessageRequest, @Req() req: Request) {
    return this.chatService.sendMessage(getLocalUserId(req), data);
  }

  @NeedLogin()
  @Post('conversations/:id/read')
  markAsRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.chatService.markConversationRead(id, getLocalUserId(req));
  }

  @NeedLogin()
  @Patch('messages/:id')
  editMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: { content?: string },
    @Req() req: Request,
  ) {
    return this.chatService.editMessage(id, getLocalUserId(req), data?.content);
  }

  @NeedLogin()
  @Delete('messages/:id')
  deleteMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.chatService.deleteMessage(id, getLocalUserId(req));
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request) {
    return this.chatService.findOne(id, getLocalUserId(req));
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: any) {
    return this.chatService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.chatService.delete(id);
  }
}
