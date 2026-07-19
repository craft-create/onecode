import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  lt,
  type SQLWrapper,
  sql,
  or,
  count,
} from 'drizzle-orm';
import { conversation, conversationMember, message, chatRequest } from '@server/database/schema';
import { localUsers } from '@server/database/local-schema';
import type {
  ChatMessageRequest,
  CreateChatRequestRequest,
  CreateConversationRequest,
} from '@shared/api.interface';
import type {
  ChatRequest as SharedChatRequest,
  Conversation as SharedConversation,
} from '@shared/types';
import { ChatGateway } from './chat.gateway';

const CHAT_REQUEST_APPROVED_MESSAGE = '好友申请已通过，现在可以开始聊天了';

type MessageFilter = {
  beforeId?: string;
  page?: number;
  limit?: number;
};

type ChatRequestStatus = 'pending' | 'approved' | 'rejected';

type ChatRequestFilter = {
  direction?: 'incoming' | 'outgoing' | 'all';
  status?: ChatRequestStatus;
};

type ConversationMemberSummary = {
  userId: string;
  nickname?: string;
  role: 'owner' | 'admin' | 'member';
};

type ChatServiceConversationDbRow = {
  id: string;
  title: string | null;
  type: string;
  lastMessageId: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
};

type ConversationWithMembers = SharedConversation & {
  members: ConversationMemberSummary[];
  peerId?: string;
  peerName?: string;
};

type ChatRequestDbRow = typeof chatRequest.$inferSelect;

@Injectable()
export class ChatService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  private normalizeConversationType(value: unknown): 'private' | 'group' {
    return value === 'group' ? 'group' : 'private';
  }

  private normalizeMemberIds(members: unknown): string[] {
    if (!Array.isArray(members)) {
      return [];
    }

    return members
      .map((memberId) => (typeof memberId === 'string' ? memberId.trim() : ''))
      .filter((memberId): memberId is string => Boolean(memberId))
      .filter((memberId, index, list) => list.indexOf(memberId) === index);
  }

  private normalizeChatRequestStatus(value: unknown): ChatRequestStatus {
    if (value === 'approved' || value === 'rejected') {
      return value;
    }
    return 'pending';
  }

  private normalizeChatRequestDirection(
    direction: ChatRequestFilter['direction'],
  ): 'incoming' | 'outgoing' | 'all' {
    if (direction === 'incoming' || direction === 'outgoing') {
      return direction;
    }
    return 'all';
  }

  private normalizeChatRequestFilter(
    filters?: ChatRequestFilter,
  ): ChatRequestFilter {
    if (!filters) {
      return { direction: 'all' };
    }

    return {
      direction: this.normalizeChatRequestDirection(filters.direction),
      status: filters.status ? this.normalizeChatRequestStatus(filters.status) : undefined,
    };
  }

  private async ensureLoggedIn(userId?: string): Promise<string> {
    if (!userId) {
      throw new BadRequestException('请先登录');
    }
    return userId;
  }

  private async ensureTargetUserExists(targetUserId: string): Promise<void> {
    const [target] = await this.db
      .select({ id: localUsers.id })
      .from(localUsers)
      .where(eq(localUsers.id, targetUserId))
      .limit(1);
    if (!target) {
      throw new BadRequestException('对方用户不存在');
    }
  }

  private async findChatRequestById(requestId: string) {
    const [result] = await this.db
      .select()
      .from(chatRequest)
      .where(eq(chatRequest.id, requestId))
      .limit(1);
    return result || null;
  }

  private async findApprovedRequestBetween(
    firstUserId: string,
    secondUserId: string,
  ): Promise<ChatRequestDbRow | null> {
    const [result] = await this.db
      .select()
      .from(chatRequest)
      .where(
        and(
          eq(chatRequest.status, 'approved'),
          or(
            and(
              eq(chatRequest.fromUserId, firstUserId),
              eq(chatRequest.toUserId, secondUserId),
            ),
            and(
              eq(chatRequest.fromUserId, secondUserId),
              eq(chatRequest.toUserId, firstUserId),
            ),
          ),
        ),
      )
      .orderBy(desc(chatRequest.updatedAt))
      .limit(1);
    return result || null;
  }

  private async isPrivateConversationApproved(
    conversationId: string,
  ): Promise<boolean> {
    const [approvedRequest] = await this.db
      .select({ id: chatRequest.id })
      .from(chatRequest)
      .where(
        and(
          eq(chatRequest.conversationId, conversationId),
          eq(chatRequest.status, 'approved'),
        ),
      )
      .limit(1);
    return Boolean(approvedRequest);
  }

  private async enrichChatRequests(
    rows: ChatRequestDbRow[],
  ): Promise<SharedChatRequest[]> {
    const userIds: string[] = [...new Set(
      rows.flatMap((row: ChatRequestDbRow) => [row.fromUserId, row.toUserId]),
    )];
    const userNames = new Map<string, string>();

    if (userIds.length > 0) {
      const users: { id: string; nickname: string }[] = await this.db
        .select({ id: localUsers.id, nickname: localUsers.nickname })
        .from(localUsers)
        .where(inArray(localUsers.id, userIds));
      for (const user of users) {
        userNames.set(user.id, user.nickname);
      }
    }

    return rows.map((row: ChatRequestDbRow) => ({
      ...row,
      status: this.normalizeChatRequestStatus(row.status),
      reason: row.reason ?? undefined,
      conversationId: row.conversationId ?? undefined,
      createdBy: row.createdBy ?? undefined,
      updatedBy: row.updatedBy ?? undefined,
      fromUserName: userNames.get(row.fromUserId) || '未知用户',
      toUserName: userNames.get(row.toUserId) || '未知用户',
    }));
  }

  async getChatRequests(userId?: string, filters?: ChatRequestFilter) {
    if (!userId) {
      return [];
    }

    const normalized = this.normalizeChatRequestFilter(filters);
    const directionCondition =
      normalized.direction === 'incoming'
        ? eq(chatRequest.toUserId, userId)
        : normalized.direction === 'outgoing'
          ? eq(chatRequest.fromUserId, userId)
          : or(eq(chatRequest.fromUserId, userId), eq(chatRequest.toUserId, userId));

    if (normalized.status) {
      const rows: ChatRequestDbRow[] = await this.db
        .select()
        .from(chatRequest)
        .where(and(directionCondition, eq(chatRequest.status, normalized.status)))
        .orderBy(desc(chatRequest.createdAt));
      return this.enrichChatRequests(rows);
    }

    const rows: ChatRequestDbRow[] = await this.db
      .select()
      .from(chatRequest)
      .where(directionCondition)
      .orderBy(desc(chatRequest.createdAt));
    return this.enrichChatRequests(rows);
  }

  private async fetchConversationMembers(
    conversationIds: string[],
  ): Promise<Map<string, ConversationMemberSummary[]>> {
    const normalizedIds = conversationIds
      .map((id: string) => id.trim())
      .filter(Boolean);
    const memberMap = new Map<string, ConversationMemberSummary[]>();

    if (normalizedIds.length === 0) {
      return memberMap;
    }

    const rows = await this.db
      .select({
        conversationId: conversationMember.conversationId,
        userId: sql<string>`(${conversationMember.userId}).user_id`.as('user_id'),
        role: conversationMember.role,
        nickname: localUsers.nickname,
      })
      .from(conversationMember)
      .leftJoin(localUsers, eq(sql<string>`(${conversationMember.userId}).user_id`, localUsers.id))
      .where(inArray(conversationMember.conversationId, normalizedIds))
      .orderBy(conversationMember.createdAt);

    for (const row of rows) {
      const exists = memberMap.get(row.conversationId) ?? [];
      exists.push({
        userId: row.userId,
        nickname: row.nickname || undefined,
        role: row.role as 'owner' | 'admin' | 'member',
      });
      memberMap.set(row.conversationId, exists);
    }

    return memberMap;
  }

  private resolveConversationPeer(
    members: ConversationMemberSummary[],
    viewerId?: string,
  ): ConversationMemberSummary | undefined {
    if (members.length === 0) {
      return undefined;
    }
    if (!viewerId) {
      return members[0];
    }
    return members.find((member) => member.userId !== viewerId) || members[0];
  }

  private async enrichConversations(
    rows: SharedConversation[],
    viewerId?: string,
  ): Promise<ConversationWithMembers[]> {
    const conversationIds = rows.map((item) => item.id);
    const memberMap = await this.fetchConversationMembers(conversationIds);

    return rows.map((row) => {
      const members = memberMap.get(row.id) ?? [];
      const peer = this.resolveConversationPeer(members, viewerId);
      const peerName = peer?.nickname || peer?.userId || '私聊';
      const title = row.type === 'group' ? row.title || '群聊' : peerName;

      return {
        ...row,
        members,
        peerId: peer?.userId,
        peerName,
        title,
      } as ConversationWithMembers;
    });
  }

  private normalizeConversationRows(rows: ChatServiceConversationDbRow[]): SharedConversation[] {
    return rows.map((row: ChatServiceConversationDbRow) => ({
      id: row.id,
      title: row.title ?? undefined,
      type: row.type === 'group' ? 'group' : 'private',
      lastMessageId: row.lastMessageId ?? undefined,
      lastMessageAt: row.lastMessageAt ?? undefined,
      createdAt: row.createdAt,
      createdBy: row.createdBy ?? undefined,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy ?? undefined,
    }));
  }

  async createChatRequest(
    payload: CreateChatRequestRequest,
    fromUserId?: string,
  ) {
    const requestData: CreateChatRequestRequest = payload || { toUserId: '' };
    const sender = await this.ensureLoggedIn(fromUserId);
    const toUserId = requestData.toUserId?.trim();

    if (!toUserId) {
      throw new BadRequestException('请填写对方用户ID');
    }
    if (toUserId === sender) {
      throw new BadRequestException('不能向自己发送聊天申请');
    }

    await this.ensureTargetUserExists(toUserId);

    const approvedRequest = await this.findApprovedRequestBetween(sender, toUserId);
    if (approvedRequest?.conversationId) {
      return approvedRequest;
    }

    const [existing] = await this.db
      .select({ id: chatRequest.id })
      .from(chatRequest)
      .where(
        and(
          eq(chatRequest.status, 'pending'),
          eq(chatRequest.fromUserId, sender),
          eq(chatRequest.toUserId, toUserId),
        ),
      )
      .limit(1);
    if (existing) {
      const pendingRequest = await this.findChatRequestById(existing.id);
      return pendingRequest;
    }

    const [reverseExisting] = await this.db
      .select({ id: chatRequest.id })
      .from(chatRequest)
      .where(
        and(
          eq(chatRequest.status, 'pending'),
          eq(chatRequest.fromUserId, toUserId),
          eq(chatRequest.toUserId, sender),
        ),
      )
      .limit(1);
    if (reverseExisting) {
      throw new BadRequestException('对方已向你提交聊天申请，请先处理该申请');
    }

    const [result] = await this.db
      .insert(chatRequest)
      .values({
        fromUserId: sender,
        toUserId,
        reason: requestData.reason?.trim() || null,
        status: 'pending',
        createdBy: sender,
      })
      .returning();
    return result || null;
  }

  async updateChatRequestStatus(
    requestId: string,
    status: ChatRequestStatus,
    userId?: string,
    conversationId?: string,
  ) {
    const operator = await this.ensureLoggedIn(userId);
    const request = await this.findChatRequestById(requestId);
    if (!request) {
      throw new NotFoundException('申请不存在');
    }
    if (request.status === status) {
      return request;
    }

    if (status === 'approved' && request.toUserId !== operator) {
      throw new ForbiddenException('只有对方能处理该申请');
    }

    if (status === 'rejected' && request.toUserId !== operator) {
      throw new ForbiddenException('只有对方能处理该申请');
    }

    const [result] = await this.db
      .update(chatRequest)
      .set({
        status,
        conversationId,
        updatedBy: operator,
        updatedAt: new Date(),
      })
      .where(eq(chatRequest.id, requestId))
      .returning();

    return result || null;
  }

  async approveChatRequest(requestId: string, approverId?: string) {
    const operator = await this.ensureLoggedIn(approverId);
    const request = await this.findChatRequestById(requestId);
    if (!request) {
      throw new NotFoundException('聊天申请不存在');
    }
    if (request.toUserId !== operator) {
      throw new ForbiddenException('只有对方可以处理该申请');
    }
    if (request.status === 'approved') {
      if (request.conversationId) {
        await this.ensureApprovalSystemMessage(request.conversationId, operator);
      }
      return request;
    }

    if (request.status === 'rejected') {
      throw new BadRequestException('该申请已被拒绝');
    }

    const existingConversation = request.conversationId
      ? await this.findOne(request.conversationId)
      : null;

    const createdConversation = existingConversation
      ?? await this.createApprovedPrivateConversation(
        operator,
        request.fromUserId,
      );

    if (!createdConversation) {
      throw new BadRequestException('创建会话失败');
    }

    const approvedRequest = await this.updateChatRequestStatus(
      request.id,
      'approved',
      operator,
      createdConversation.id,
    );
    await this.ensureApprovalSystemMessage(createdConversation.id, operator);
    return approvedRequest;
  }

  async rejectChatRequest(requestId: string, approverId?: string) {
    const operator = await this.ensureLoggedIn(approverId);
    const request = await this.findChatRequestById(requestId);
    if (!request) {
      throw new NotFoundException('聊天申请不存在');
    }
    if (request.toUserId !== operator) {
      throw new ForbiddenException('只有对方可以处理该申请');
    }
    if (request.status === 'approved') {
      throw new BadRequestException('该申请已通过，不能再拒绝');
    }
    if (request.status === 'rejected') {
      return request;
    }

    return this.updateChatRequestStatus(
      request.id,
      'rejected',
      operator,
      request.conversationId ?? undefined,
    );
  }

  async findAll(_userId?: string) {
    if (!_userId) {
      return [];
    }

    const myConversationIdsRows = await this.db
      .select({ conversationId: conversationMember.conversationId })
      .from(conversationMember)
      .where(eq(sql<string>`(${conversationMember.userId}).user_id`, _userId));

    const uniqueConversationIds = [...new Set(myConversationIdsRows.map((row) => row.conversationId))];
    if (uniqueConversationIds.length === 0) {
      return [];
    }

    const list = await this.db
      .select()
      .from(conversation)
      .where(inArray(conversation.id, uniqueConversationIds))
      .orderBy(desc(conversation.createdAt));
    const approvedPrivateRows: { conversationId: string | null }[] = await this.db
      .select({ conversationId: chatRequest.conversationId })
      .from(chatRequest)
      .where(
        and(
          eq(chatRequest.status, 'approved'),
          inArray(chatRequest.conversationId, uniqueConversationIds),
        ),
      );
    const approvedPrivateIds = new Set<string>(
      approvedPrivateRows
        .map((row: { conversationId: string | null }) => row.conversationId)
        .filter((id: string | null): id is string => Boolean(id)),
    );
    const visibleRows: ChatServiceConversationDbRow[] = (
      list as ChatServiceConversationDbRow[]
    ).filter((row: ChatServiceConversationDbRow) => (
      row.type === 'group' || approvedPrivateIds.has(row.id)
    ));
    const normalizedList = this.normalizeConversationRows(visibleRows);
    return this.enrichConversations(normalizedList, _userId);
  }

  async findOne(id: string, viewerId?: string) {
    const [result] = await this.db
      .select()
      .from(conversation)
      .where(eq(conversation.id, id))
      .limit(1);
    if (!result) {
      return null;
    }

    if (viewerId) {
      const isMember = await this.isConversationMember(id, viewerId);
      if (!isMember) {
        return null;
      }
    }

    const [enriched] = await this.enrichConversations(
      this.normalizeConversationRows([result as ChatServiceConversationDbRow]),
      viewerId,
    );
    return enriched || null;
  }

  private async createApprovedPrivateConversation(
    creatorId: string,
    peerId: string,
  ) {
    const [created] = await this.db
      .insert(conversation)
      .values({
        type: 'private',
        createdBy: creatorId,
      })
      .returning();

    if (!created) {
      return null;
    }

    await this.db.insert(conversationMember).values([
      {
        conversationId: created.id,
        userId: creatorId,
        role: 'owner',
      },
      {
        conversationId: created.id,
        userId: peerId,
        role: 'member',
      },
    ]);
    return created;
  }

  private async ensureApprovalSystemMessage(
    conversationId: string,
    approverId: string,
  ): Promise<void> {
    const [existingMessage] = await this.db
      .select({ id: message.id })
      .from(message)
      .where(
        and(
          eq(message.conversationId, conversationId),
          eq(message.type, 'system'),
          eq(message.content, CHAT_REQUEST_APPROVED_MESSAGE),
          eq(message.isDeleted, 0),
        ),
      )
      .limit(1);
    if (existingMessage) {
      return;
    }

    const [createdMessage] = await this.db
      .insert(message)
      .values({
        conversationId,
        senderId: approverId,
        content: CHAT_REQUEST_APPROVED_MESSAGE,
        type: 'system',
        createdBy: approverId,
      })
      .returning();
    if (!createdMessage) {
      throw new BadRequestException('好友申请已通过，但系统消息发送失败');
    }

    await this.db
      .update(conversation)
      .set({
        lastMessageId: createdMessage.id,
        lastMessageAt: createdMessage.createdAt,
        updatedAt: new Date(),
        updatedBy: approverId,
      })
      .where(eq(conversation.id, conversationId));

    this.chatGateway.broadcastNewMessage({
      conversationId,
      message: {
        id: createdMessage.id,
        conversationId,
        senderId: createdMessage.senderId,
        content: createdMessage.content ?? undefined,
        type: createdMessage.type,
        createdAt: createdMessage.createdAt,
      },
    });
  }

  async create(data: CreateConversationRequest, userId?: string) {
    const conversationType = this.normalizeConversationType(data?.type);
    const creatorId = await this.ensureLoggedIn(userId);
    const membersFromRequest = this.normalizeMemberIds(data?.memberIds);

    const memberIds = new Set<string>();

    if (creatorId) {
      memberIds.add(creatorId);
    }
    for (const memberId of membersFromRequest) {
      memberIds.add(memberId);
    }

    if (conversationType === 'private') {
      const peerIds: string[] = Array.from(memberIds).filter(
        (memberId: string) => memberId !== creatorId,
      );
      if (peerIds.length !== 1) {
        throw new BadRequestException('私聊至少需要一个对方用户');
      }
      const approvedRequest = await this.findApprovedRequestBetween(
        creatorId,
        peerIds[0],
      );
      if (!approvedRequest?.conversationId) {
        throw new ForbiddenException('请先发送好友申请，等待对方通过后再聊天');
      }
      const approvedConversation = await this.findOne(
        approvedRequest.conversationId,
        creatorId,
      );
      if (!approvedConversation) {
        throw new NotFoundException('已通过的聊天会话不存在');
      }
      return approvedConversation;
    }

    const result: ChatServiceConversationDbRow[] = await this.db
      .insert(conversation)
      .values({
        title: data?.title?.trim() || null,
        type: conversationType,
        createdBy: creatorId,
      })
      .returning();

    const created = result[0];
    if (!created) {
      return null;
    }

    const memberIdsToCreate = new Set(memberIds);

    const members = [...memberIdsToCreate].map((memberId: string) => ({
      conversationId: created.id,
      userId: memberId,
      role: memberId === creatorId ? 'owner' : 'member',
    }));

    if (members.length > 0) {
      await this.db.insert(conversationMember).values(members);
    }

    return created;
  }

  async update(id: string, data: any) {
    const result = await this.db
      .update(conversation)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(conversation.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(conversation).where(eq(conversation.id, id));
  }

  async findMessages(
    conversationId: string,
    viewerId?: string,
    filters?: MessageFilter,
  ) {
    const currentUserId = await this.ensureLoggedIn(viewerId);
    const conversationExists = await this.findOne(conversationId, currentUserId);
    if (!conversationExists) {
      throw new ForbiddenException('无权查看该会话消息');
    }
    if (
      conversationExists.type === 'private'
      && !await this.isPrivateConversationApproved(conversationId)
    ) {
      throw new ForbiddenException('好友申请通过后才能查看私聊消息');
    }

    const limit = this.clampInt(filters?.limit, 50, 1, 200);
    const page = Math.max(1, this.clampInt(filters?.page, 1, 1, 100));
    const offset = (page - 1) * limit;

    const conditions: SQLWrapper[] = [
      eq(message.conversationId, conversationId),
      eq(message.isDeleted, 0),
    ];

    if (filters?.beforeId) {
      const beforeMessage = await this.db
        .select({ createdAt: message.createdAt })
        .from(message)
        .where(and(eq(message.id, filters.beforeId), eq(message.conversationId, conversationId)))
        .limit(1);
      if (beforeMessage.length > 0 && beforeMessage[0]?.createdAt) {
        conditions.push(lt(message.createdAt, beforeMessage[0].createdAt));
      }
    }

    return this.db
      .select()
      .from(message)
      .where(and(...conditions))
      .orderBy(asc(message.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async sendMessage(
    senderId: string | undefined,
    payload: ChatMessageRequest,
  ) {
    if (!senderId) {
      throw new BadRequestException('未登录');
    }

    if (!payload?.conversationId) {
      throw new BadRequestException('会话ID不能为空');
    }

    const conversationExists = await this.findOne(payload.conversationId, senderId);
    if (!conversationExists) {
      throw new NotFoundException('会话不存在');
    }
    if (
      conversationExists.type === 'private'
      && !await this.isPrivateConversationApproved(payload.conversationId)
    ) {
      throw new ForbiddenException('好友申请通过后才能发送消息');
    }
    const isMember = await this.isConversationMember(payload.conversationId, senderId);
    if (!isMember) {
      throw new ForbiddenException('无权在该会话发送消息');
    }

    if (!payload.content?.trim() && payload.type !== 'image') {
      throw new BadRequestException('消息内容不能为空');
    }

    const [created] = await this.db
      .insert(message)
      .values({
        conversationId: payload.conversationId,
        senderId,
        content: payload.content,
        type: payload.type ?? 'text',
        attachments: payload.attachments,
        replyToMessageId: payload.replyToMessageId,
        mentions: payload.mentions,
      })
      .returning();

    if (!created) {
      throw new BadRequestException('发送失败');
    }

    await this.db
      .update(conversation)
      .set({
        lastMessageId: created.id,
        lastMessageAt: created.createdAt,
        updatedAt: new Date(),
      })
      .where(eq(conversation.id, payload.conversationId));

    this.chatGateway.broadcastNewMessage({
      conversationId: created.conversationId,
      message: {
        id: created.id,
        conversationId: created.conversationId,
        senderId: created.senderId,
        content: created.content ?? undefined,
        type: created.type,
        createdAt: created.createdAt,
      },
    });

    return created;
  }

  private async isConversationMember(conversationId: string, userId: string) {
    const [member] = await this.db
      .select({ id: conversationMember.id })
      .from(conversationMember)
      .where(
        and(
          eq(conversationMember.conversationId, conversationId),
          eq(sql<string>`(${conversationMember.userId}).user_id`, userId),
        ),
      )
      .limit(1);
    return Boolean(member);
  }

  async markConversationRead(conversationId: string, _userId?: string) {
    if (!conversationId) {
      throw new BadRequestException('会话ID不能为空');
    }
    return { conversationId, success: true };
  }

  async getUnreadCount(userId?: string) {
    if (!userId) {
      return 0;
    }

    const [row] = await this.db
      .select({ count: count() })
      .from(message)
      .where(and(eq(message.isDeleted, 0), sql`(${message.senderId}).user_id != ${userId}`));

    return Number(row?.count ?? 0);
  }

  async deleteMessage(messageId: string, userId?: string) {
    const conditions: SQLWrapper[] = [eq(message.id, messageId), eq(message.isDeleted, 0)];
    if (userId) {
      conditions.push(eq(message.senderId, userId));
    }

    const result = await this.db
      .update(message)
      .set({ isDeleted: 1, updatedAt: new Date() })
      .where(and(...conditions))
      .returning({ id: message.id });

    return result[0] || null;
  }

  async editMessage(messageId: string, userId: string | undefined, content?: string) {
    if (!content?.trim()) {
      throw new BadRequestException('消息内容不能为空');
    }

    const conditions: SQLWrapper[] = [eq(message.id, messageId), eq(message.isDeleted, 0)];
    if (userId) {
      conditions.push(eq(message.senderId, userId));
    }

    const result = await this.db
      .update(message)
      .set({ content, isEdited: 1, updatedAt: new Date() })
      .where(and(...conditions))
      .returning();

    return result[0] || null;
  }

  private clampInt(
    value: number | string | undefined,
    defaultValue: number,
    min: number,
    max: number,
  ): number {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
      return defaultValue;
    }
    const safeValue = Math.floor(parsed);
    if (safeValue < min) {
      return min;
    }
    if (safeValue > max) {
      return max;
    }
    return safeValue;
  }
}
