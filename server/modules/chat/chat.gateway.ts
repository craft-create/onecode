import {
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import type { PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  eq,
  and,
} from 'drizzle-orm';
import type { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import { DRIZZLE_DATABASE } from '@server/common/compat/fullstack-nestjs-core';
import { ChatService } from './chat.service';
import { AuthService } from '../auth/auth.service';
import { conversationMember } from '@server/database/schema';
import { sql } from 'drizzle-orm';
import { WsException } from '@nestjs/websockets';

interface ConversationJoinPayload {
  conversationId?: string;
}

interface ChatTypingPayload {
  conversationId?: string;
  isTyping?: boolean;
}

interface ChatSendMessagePayload {
  conversationId?: string;
  content?: string;
  type?: 'text' | 'image' | 'file' | 'system';
  attachments?: string;
  replyToMessageId?: string;
  mentions?: string;
}

export interface ChatNewMessagePayload {
  conversationId: string;
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    content?: string;
    type?: string;
    createdAt: Date;
  };
}

type ChatSocket = Socket & {
  data: {
    userId?: string;
  };
};

@WebSocketGateway({
  path: '/api/chat-ws',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: ChatSocket) {
    const userId = await this.resolveUserId(client);
    if (!userId) {
      this.logger.warn(`WebSocket 连接被拒绝，未提供有效 token: ${client.id}`);
      client.disconnect();
      return;
    }
    client.data.userId = userId;
    this.logger.log(`WebSocket connected: ${client.id}, userId=${userId}`);
  }

  handleDisconnect(client: ChatSocket) {
    this.logger.log(`WebSocket disconnected: ${client.id}`);
  }

  @SubscribeMessage('chat:join')
  async joinConversation(
    @MessageBody() payload: ConversationJoinPayload,
    @ConnectedSocket() client: ChatSocket,
  ) {
    const userId = await this.resolveUserId(client);
    if (!userId) {
      return;
    }

    const conversationId = this.normalizeConversationId(payload?.conversationId);
    if (!conversationId) {
      throw new WsException('会话ID不能为空');
    }

    const isMember = await this.hasConversationPermission(conversationId, userId);
    if (!isMember) {
      throw new WsException('无权访问该会话');
    }

    await client.join(conversationId);
    this.logger.log(`User ${userId} join conversation ${conversationId}`);
  }

  @SubscribeMessage('chat:leave')
  async leaveConversation(
    @MessageBody() payload: ConversationJoinPayload,
    @ConnectedSocket() client: ChatSocket,
  ) {
    const conversationId = this.normalizeConversationId(payload?.conversationId);
    if (!conversationId) {
      return;
    }
    await client.leave(conversationId);
  }

  @SubscribeMessage('chat:typing')
  async handleTyping(
    @MessageBody() payload: ChatTypingPayload,
    @ConnectedSocket() client: ChatSocket,
  ) {
    const userId = await this.resolveUserId(client);
    if (!userId) {
      return;
    }

    const conversationId = this.normalizeConversationId(payload?.conversationId);
    if (!conversationId) {
      return;
    }

    const isMember = await this.hasConversationPermission(conversationId, userId);
    if (!isMember) {
      return;
    }

    this.server.to(conversationId).emit('chat:typing', {
      conversationId,
      userId,
      isTyping: payload.isTyping ?? false,
    });
  }

  @SubscribeMessage('chat:send-message')
  async handleSendMessage(
    @MessageBody() payload: ChatSendMessagePayload,
    @ConnectedSocket() client: ChatSocket,
  ): Promise<{
    success: boolean;
    message?: {
      id: string;
      conversationId: string;
      senderId: string;
      content?: string;
      type?: string;
      createdAt: Date;
    };
    error?: string;
  }> {
    const userId = await this.resolveUserId(client);
    if (!userId) {
      return { success: false, error: '未登录' };
    }

    const conversationId = this.normalizeConversationId(payload?.conversationId);
    if (!conversationId) {
      return { success: false, error: '会话ID不能为空' };
    }

    const isMember = await this.hasConversationPermission(conversationId, userId);
    if (!isMember) {
      return { success: false, error: '无权在该会话发送消息' };
    }

    try {
      const created = await this.chatService.sendMessage(userId, {
        conversationId,
        content: payload?.content,
        type: payload?.type,
        attachments: payload?.attachments,
        replyToMessageId: payload?.replyToMessageId,
        mentions: payload?.mentions,
      });
      return {
        success: true,
        message: {
          id: created.id,
          conversationId: created.conversationId,
          senderId: created.senderId ?? '',
          content: created.content ?? undefined,
          type: created.type,
          createdAt: created.createdAt,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '发送失败';
      return { success: false, error: message };
    }
  }

  broadcastNewMessage(payload: ChatNewMessagePayload) {
    this.server.to(payload.conversationId).emit('chat:new-message', payload);
  }

  private normalizeConversationId(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }
    return value.trim();
  }

  private async resolveUserId(client: ChatSocket): Promise<string | undefined> {
    const token =
      this.extractTokenFromAuth(client) ||
      this.extractTokenFromQuery(client) ||
      this.extractTokenFromHeaders(client);
    if (!token) {
      return undefined;
    }

    const payload = await this.authService.validateToken(token);
    return payload?.userId;
  }

  private async hasConversationPermission(conversationId: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: conversationMember.id })
      .from(conversationMember)
      .where(
        and(
          eq(conversationMember.conversationId, conversationId),
          eq(sql<string>`(${conversationMember.userId}).user_id`, userId),
        ),
      )
      .limit(1);

    return Boolean(row);
  }

  private extractTokenFromAuth(client: ChatSocket): string | undefined {
    const authValue = client.handshake.auth?.token;
    if (typeof authValue === 'string') {
      return authValue.trim() || undefined;
    }
    if (Array.isArray(authValue) && authValue.length > 0) {
      return String(authValue[0]).trim() || undefined;
    }
    return undefined;
  }

  private extractTokenFromQuery(client: ChatSocket): string | undefined {
    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken.trim() || undefined;
    }
    if (Array.isArray(queryToken) && queryToken.length > 0) {
      return String(queryToken[0]).trim() || undefined;
    }
    return undefined;
  }

  private extractTokenFromHeaders(client: ChatSocket): string | undefined {
    const token = client.handshake.headers.authorization;
    if (!token || typeof token !== 'string' || !token.startsWith('Bearer ')) {
      return undefined;
    }
    return token.substring(7).trim();
  }
}
