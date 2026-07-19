import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, MessageCircle, Send, Search, Plus } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Card } from '@client/src/components/ui/card';
import { Avatar } from '@client/src/components/ui/avatar';
import { ScrollArea } from '@client/src/components/ui/scroll-area';
import { Separator } from '@client/src/components/ui/separator';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { toast } from 'sonner';
import { api, chatApi } from '@client/src/api';
import { UserDisplay } from '@client/src/components/business-ui/user-display';
import type { Conversation } from '@shared/types';
import type { FollowUserItem } from '@shared/follow.interface';
import { getFollowers, getFollowing } from '@client/src/api/follow';
import { useAuth } from '@client/src/hooks/useAuth';
import { PageFrame } from '../shared/PageShell';

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [creatingConversationTarget, setCreatingConversationTarget] = useState('');
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [contactListLoading, setContactListLoading] = useState(false);
  const [contactUsers, setContactUsers] = useState<FollowUserItem[]>([]);
  const [targetUserId, setTargetUserId] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = (await api.get<Conversation[] | { items?: Conversation[] }>('/chat/conversations')) as
        Conversation[]
        | { items?: Conversation[] };
      const list = Array.isArray(response)
        ? response
        : response?.items ?? [];
      setConversations(list);
    } catch {
      console.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadContactUsers = useCallback(async (): Promise<FollowUserItem[]> => {
    if (!user?.userId) {
      return [];
    }

    const normalizeList = (input: FollowUserItem[]): FollowUserItem[] => {
      const seenIds = new Set<string>();
      const output: FollowUserItem[] = [];

      for (const item of input) {
        if (!item.user_id || item.user_id === user.userId) {
          continue;
        }
        if (!item.name) {
          continue;
        }
        if (seenIds.has(item.user_id)) {
          continue;
        }
        seenIds.add(item.user_id);
        output.push(item);
      }

      return output;
    };

    try {
      const [followingRes, followersRes] = await Promise.all([
        getFollowing(user.userId),
        getFollowers(user.userId),
      ]);
      const normalized = normalizeList([
        ...followingRes.items,
        ...followersRes.items,
      ]);
      return normalized;
    } catch (_error) {
      console.error('Failed to load chat contacts');
      return [];
    }
  }, [user?.userId]);

  const openNewConversationDialog = useCallback(async () => {
    setNewChatDialogOpen(true);
    setContactListLoading(true);
    setTargetUserId('');
    setCreatingConversationTarget('');

    const users = await loadContactUsers();
    setContactUsers(users);
    setContactListLoading(false);
  }, [loadContactUsers]);

  const closeNewConversationDialog = useCallback(() => {
    setNewChatDialogOpen(false);
  }, []);

  const handleCreateConversation = async (targetId: string, targetName?: string) => {
    if (!targetId) {
      toast.error('请输入对方用户ID');
      return;
    }
    if (targetId === user?.userId) {
      toast.error('不能给自己创建私聊');
      return;
    }

    setCreatingConversation(true);
    setCreatingConversationTarget(targetId);
    try {
      const response = (await chatApi.createConversation({
        title: targetName
          ? `与 ${targetName} 的私聊`
          : `与 ${targetId} 的私聊`,
        type: 'private',
        memberIds: [targetId],
      })) as { id?: string } & { data?: { id?: string } };
      const newConversationId =
        response.id ??
        response.data?.id;

      if (!newConversationId) {
        console.error('Failed to create conversation: missing id in response');
        return;
      }
      await fetchConversations();
      toast.success(`已发起与 ${targetName || targetId} 的私聊`);
      navigate(`/chat/${newConversationId}`);
    } catch (_error) {
      console.error('Failed to create conversation');
      toast.error('发起私聊失败，请检查对方ID后重试');
    } finally {
      setCreatingConversation(false);
      setCreatingConversationTarget('');
      closeNewConversationDialog();
    }
  };

  const handleCreateConversationByInput = async () => {
    await handleCreateConversation(targetUserId.trim());
  };

  const handleCreateFromContact = async (item: FollowUserItem) => {
    await handleCreateConversation(item.user_id, item.name);
  };

  const filteredConversations = conversations.filter(c =>
    (c.title ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageFrame
      title="消息"
      description="管理你的聊天与通知"
      className="min-h-screen bg-background"
      containerClassName="app-container-shell"
      contentClassName="flex-1"
    >
      <div className="flex h-[calc(100vh-220px)] gap-4">
      {/* 会话列表 */}
      <div className="w-80 border rounded-lg flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              消息
            </h2>
            <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={openNewConversationDialog}
                  disabled={creatingConversation}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>发起私聊</DialogTitle>
                  <DialogDescription>
                    选择一个联系人或输入对方用户ID，确认后进入私聊。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">选择联系人</p>
                    {contactListLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-14 rounded-md border border-dashed border-gray-200 bg-gray-50"
                          />
                        ))}
                      </div>
                    ) : contactUsers.length === 0 ? (
                      <div className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500">
                        当前没有可选联系人，直接在下方输入用户ID即可创建
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {contactUsers.map((item: FollowUserItem) => (
                          <div
                            key={item.user_id}
                            className="flex items-center gap-3 rounded-md border p-2"
                          >
                            <UserDisplay
                              value={[item.user_id]}
                              size="small"
                              showLabel={false}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {item.user_id}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleCreateFromContact(item)}
                              disabled={
                                creatingConversation &&
                                creatingConversationTarget === item.user_id
                              }
                            >
                              {creatingConversation &&
                              creatingConversationTarget === item.user_id ? (
                                <span className="inline-flex items-center gap-1">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  创建中
                                </span>
                              ) : (
                                '创建'
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <p className="mb-1 text-sm text-gray-500">用户ID</p>
                      <Input
                        value={targetUserId}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          setTargetUserId(event.target.value);
                        }}
                        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void handleCreateConversationByInput();
                          }
                        }}
                        placeholder="输入对方用户ID"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      当前账号ID：
                      <span className="ml-1 font-mono text-gray-700">
                        {user?.userId}
                      </span>
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeNewConversationDialog}
                    disabled={creatingConversation}
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleCreateConversationByInput()}
                    disabled={
                      !targetUserId.trim() ||
                      targetUserId.trim() === user?.userId ||
                      creatingConversation
                    }
                  >
                    {creatingConversation ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        创建中
                      </span>
                    ) : (
                      '使用ID创建'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索会话..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>暂无会话</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <div key={conversation.id}>
                <div
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${conversationId === conversation.id ? 'bg-blue-50' : ''}`}
                  onClick={() => navigate(`/chat/${conversation.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                        {conversation.title?.[0] || '私'}
                      </div>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm truncate">
                          {conversation.title || '私聊'}
                        </h3>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(conversation.lastMessageAt).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {conversation.type === 'group' ? '群聊' : '私聊'}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* 聊天窗口 */}
      <div className="flex-1 border rounded-lg flex flex-col">
        {conversationId ? (
          <ChatDetail
            conversationId={conversationId}
            currentUserId={user?.userId}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>选择一个会话开始聊天</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </PageFrame>
  );
}

function ChatDetail({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId?: string;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesViewportRef = React.useRef<HTMLDivElement>(null);
  const [autoScrollToBottom, setAutoScrollToBottom] = useState(true);

  useEffect(() => {
    setLoading(true);
    setAutoScrollToBottom(true);
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!autoScrollToBottom) {
      return;
    }

    const viewport = messagesViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, autoScrollToBottom]);

  const fetchMessages = async () => {
    try {
      const response = (await chatApi.getMessages({
        conversationId,
        page: 1,
        limit: 200,
      })) as any[] | { items?: any[] };
      const list = Array.isArray(response)
        ? response
        : response?.items ?? [];
      setMessages(list);
    } catch (_error) {
      console.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      await chatApi.sendMessage({
        conversationId,
        content: input,
        type: 'text',
      });
      setAutoScrollToBottom(true);
      setInput('');
      fetchMessages();
    } catch (_error) {
      console.error('Failed to send message');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) {
      return;
    }
    e.preventDefault();
    void handleSend();
  };

  const handleMessageAreaScroll = () => {
    const viewport = messagesViewportRef.current;
    if (!viewport) {
      return;
    }

    const distanceToBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    setAutoScrollToBottom(distanceToBottom <= 48);
  };

  return (
    <>
      <div className="p-4 border-b">
        <h2 className="font-semibold">聊天</h2>
      </div>

      <ScrollArea
        className="flex-1 p-4"
        viewportRef={messagesViewportRef}
        onScroll={handleMessageAreaScroll}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              message && (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <Card className={`max-w-[70%] p-3 ${message.senderId === currentUserId ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === currentUserId
                        ? 'text-blue-100'
                        : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </Card>
              </div>
              )
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={2}
            placeholder="输入消息..."
            className="flex-1"
          />
          <Button onClick={handleSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
