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
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.chatService.findAll(req.user?.userId);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.chatService.create(data, req.user?.userId);
  }

  @Get('conversations')
  findConversations(@Req() req: any) {
    return this.chatService.findAll(req.user?.userId);
  }

  @Post('conversations')
  createConversation(@Body() data: any, @Req() req: any) {
    return this.chatService.create(data, req.user?.userId);
  }

  @Get('requests')
  getChatRequests(
    @Req() req: any,
    @Query('direction') direction?: 'incoming' | 'outgoing' | 'all',
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
  ) {
    return this.chatService.getChatRequests(req.user?.userId, {
      direction: direction || 'all',
      status,
    });
  }

  @Post('requests')
  createChatRequest(@Body() data: { toUserId: string; reason?: string }, @Req() req: any) {
    return this.chatService.createChatRequest(data, req.user?.userId);
  }

  @Post('requests/:id/approve')
  approveChatRequest(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.chatService.approveChatRequest(id, req.user?.userId);
  }

  @Post('requests/:id/reject')
  rejectChatRequest(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.chatService.rejectChatRequest(id, req.user?.userId);
  }

  @Get('unread/count')
  getUnreadCount(@Req() req: any) {
    return this.chatService.getUnreadCount(req.user?.userId);
  }

  @Get('conversations/:id')
  findConversation(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.chatService.findOne(id, req.user?.userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('beforeId') beforeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.findMessages(id, {
      beforeId,
      page,
      limit,
    });
  }

  @Post('messages')
  sendMessage(@Body() data: any, @Req() req: any) {
    return this.chatService.sendMessage(req.user?.userId, data);
  }

  @Post('conversations/:id/read')
  markAsRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    return this.chatService.markConversationRead(id, req.user?.userId);
  }

  @Patch('messages/:id')
  editMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: { content?: string },
    @Req() req: any,
  ) {
    return this.chatService.editMessage(id, req.user?.userId, data?.content);
  }

  @Delete('messages/:id')
  deleteMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    return this.chatService.deleteMessage(id, req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.chatService.findOne(id, req.user?.userId);
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
