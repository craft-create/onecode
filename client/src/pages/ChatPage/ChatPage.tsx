import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { MessageCircle, Send, Search } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Card } from '@client/src/components/ui/card';
import { Avatar } from '@client/src/components/ui/avatar';
import { ScrollArea } from '@client/src/components/ui/scroll-area';
import { Separator } from '@client/src/components/ui/separator';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Textarea } from '@client/src/components/ui/textarea';
import { api, chatApi } from '@client/src/api';
import type { ChatMessageEvent, ChatTypingEvent, Conversation } from '@shared/types';
import { toast } from 'sonner';
import { useAuth } from '@client/src/hooks/useAuth';
import { PageFrame } from '../shared/PageShell';

type SendMessageViaSocketResult = {
  success: boolean;
  error?: string;
};

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredConversations = conversations.filter(c =>
    getConversationDisplayName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find(c => c.id === conversationId);

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
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p>暂无会话</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <div key={conversation.id}>
                <div
                  className={`p-4 hover:bg-accent/70 cursor-pointer transition-colors ${
                    conversationId === conversation.id
                      ? 'bg-accent/60 border-l-4 border-primary'
                      : ''
                  }`}
                  onClick={() => navigate(`/chat/${conversation.id}`)}
                >
                  <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                          {getConversationDisplayName(conversation).charAt(0) || '私'}
                        </div>
                      </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm truncate">
                          {getConversationDisplayName(conversation)}
                        </h3>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(conversation.lastMessageAt).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {conversation.type === 'group' ? (conversation.title || '群聊') : getConversationDisplayName(conversation)}
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
            conversation={activeConversation}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
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
  conversation,
}: {
  conversationId: string;
  currentUserId?: string;
  conversation?: Conversation;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesViewportRef = React.useRef<HTMLDivElement>(null);
  const [autoScrollToBottom, setAutoScrollToBottom] = useState(true);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const socketRef = React.useRef<Socket | null>(null);
  const typingTimerRef = React.useRef<number | null>(null);
  const peerTypingClearTimerRef = React.useRef<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setAutoScrollToBottom(true);
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    return () => {
      const socket = socketRef.current;
      if (!socket) {
        return;
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !currentUserId) {
      const existingSocket = socketRef.current;
      if (existingSocket) {
        existingSocket.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const ensureSocket = (): Socket => {
      if (socketRef.current) {
        return socketRef.current;
      }
      const nextSocket = io('', {
        path: '/api/chat-ws',
        transports: ['websocket'],
        auth: { token },
        withCredentials: true,
      });
      socketRef.current = nextSocket;
      return nextSocket;
    };

    const socket = ensureSocket();

    const clearTypingTimers = (): void => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (peerTypingClearTimerRef.current) {
        clearTimeout(peerTypingClearTimerRef.current);
        peerTypingClearTimerRef.current = null;
      }
    };

    const joinConversation = (): void => {
      if (!conversationId) {
        return;
      }
      socket.emit('chat:join', { conversationId });
      setIsPeerTyping(false);
    };

    const leaveCurrentConversation = (): void => {
      if (!conversationId) {
        return;
      }
      socket.emit('chat:leave', { conversationId });
      socket.emit('chat:typing', { conversationId, isTyping: false });
    };

    const handleNewMessage = (event: ChatMessageEvent) => {
      if (!event || event.conversationId !== conversationId) {
        return;
      }
      const next = event.message;
      if (!next?.id) {
        return;
      }
      setMessages((prevMessages) => {
        if (prevMessages.some((item) => item?.id === next.id)) {
          return prevMessages;
        }
        return [...prevMessages, next];
      });
      setAutoScrollToBottom(true);
    };

    const handleTyping = (payload: ChatTypingEvent) => {
      if (
        !payload ||
        payload.conversationId !== conversationId ||
        payload.userId === currentUserId
      ) {
        return;
      }
      setIsPeerTyping(payload.isTyping);

      if (peerTypingClearTimerRef.current) {
        clearTimeout(peerTypingClearTimerRef.current);
      }
      if (payload.isTyping) {
        peerTypingClearTimerRef.current = window.setTimeout(() => {
          setIsPeerTyping(false);
          peerTypingClearTimerRef.current = null;
        }, 3500);
      }
    };

    const handleConnect = (): void => {
      joinConversation();
    };

    socket.on('connect', handleConnect);
    socket.on('chat:new-message', handleNewMessage);
    socket.on('chat:typing', handleTyping);
    joinConversation();

    clearTypingTimers();
    setIsPeerTyping(false);

    return () => {
      leaveCurrentConversation();
      clearTypingTimers();
      setIsPeerTyping(false);
      socket.off('connect', handleConnect);
      socket.off('chat:new-message', handleNewMessage);
      socket.off('chat:typing', handleTyping);
    };
  }, [conversationId, currentUserId]);

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

    const trimmedInput = input.trim();
    const socket = socketRef.current;
    let socketFailureMessage: string | undefined;

    if (socket?.connected) {
      const socketResult = await sendMessageViaSocket(trimmedInput);
      if (socketResult.success) {
        setAutoScrollToBottom(true);
        setInput('');
        notifyTyping(false);
        return;
      }
      socketFailureMessage = socketResult.error;
      console.error('Failed to send message via WebSocket:', socketResult.error);
    }

    try {
      await chatApi.sendMessage({
        conversationId,
        content: trimmedInput,
        type: 'text',
      });
      setAutoScrollToBottom(true);
      setInput('');
      notifyTyping(false);
      if (!socketRef.current?.connected) {
        fetchMessages();
      }
      if (socketFailureMessage) {
        toast.success(`已通过 HTTP 发送（网络通道回退）`);
      }
    } catch (_error) {
      console.error('Failed to send message');
      toast.error(socketFailureMessage || '发送失败，请重试');
    }
  };

  const sendMessageViaSocket = (content: string): Promise<SendMessageViaSocketResult> => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !conversationId) {
      return Promise.resolve({ success: false, error: 'socket 未连接' });
    }

    return new Promise<SendMessageViaSocketResult>((resolve) => {
      let finished = false;
      const finish = (value: SendMessageViaSocketResult) => {
        if (finished) {
          return;
        }
        finished = true;
        resolve(value);
      };

      const timeout = window.setTimeout(() => {
        finish({ success: false, error: '发送超时' });
      }, 2000);

      socket.emit(
        'chat:send-message',
        {
          conversationId,
          content,
          type: 'text',
        },
        (response?: SendMessageViaSocketResult) => {
          clearTimeout(timeout);
          if (response?.success) {
            finish({ success: true });
            return;
          }
          finish({
            success: false,
            error: response?.error || '发送失败',
          });
        },
      );
    });
  };

  const notifyTyping = (isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      return;
    }
    socket.emit('chat:typing', { conversationId, isTyping });
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    if (!value.trim()) {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      notifyTyping(false);
      return;
    }

    notifyTyping(true);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      notifyTyping(false);
      typingTimerRef.current = null;
    }, 1200);
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
        <h2 className="font-semibold">
          {conversation?.type === 'group'
            ? (conversation.title || '群聊')
            : getConversationDisplayName(conversation)}
        </h2>
        {isPeerTyping && conversation?.type !== 'group' && (
          <p className="text-xs text-muted-foreground mt-1">对方正在输入...</p>
        )}
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
                <Card
                  className={`max-w-[70%] p-3 border ${
                    message.senderId === currentUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === currentUserId
                        ? 'text-blue-100'
                        : 'text-muted-foreground'
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
            onChange={e => handleInputChange(e.target.value)}
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

function getConversationDisplayName(conversation?: Conversation) {
  if (!conversation) {
    return '聊天';
  }
  if (conversation.type === 'group') {
    return conversation.title || '群聊';
  }
  return conversation.peerName || conversation.title || '私聊';
}
