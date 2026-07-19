/* 前后端共享的类型写在这里 */

export interface CreateConversationRequest {
  title?: string;
  type?: 'private' | 'group';
  memberIds?: string[];
}

export interface CreateChatRequestRequest {
  toUserId: string;
  reason?: string;
}

export interface ChatAccessResponse {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  direction?: 'incoming' | 'outgoing';
  conversationId?: string;
}

export interface ChatMessageRequest {
  conversationId: string;
  content?: string;
  type?: 'text' | 'image' | 'file';
  attachments?: string;
  replyToMessageId?: string;
  mentions?: string;
}
