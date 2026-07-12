import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, Send, Search, Plus } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Card } from '@client/src/components/ui/card';
import { Avatar } from '@client/src/components/ui/avatar';
import { ScrollArea } from '@client/src/components/ui/scroll-area';
import { Separator } from '@client/src/components/ui/separator';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { api } from '@client/src/api';
import type { Conversation } from '@shared/types';

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data || []);
    } catch (error) {
      console.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* 会话列表 */}
      <div className="w-80 border rounded-lg flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              消息
            </h2>
            <Button size="sm" variant="ghost">
              <Plus className="w-4 h-4" />
            </Button>
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
          <ChatDetail conversationId={conversationId} />
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
  );
}

function ChatDetail({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(res.data.items || []);
    } catch (error) {
      console.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      await api.post('/chat/messages', {
        conversationId,
        content: input,
        type: 'text',
      });
      setInput('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message');
    }
  };

  return (
    <>
      <div className="p-4 border-b">
        <h2 className="font-semibold">聊天</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[70%] p-3 ${message.senderId === 'current-user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.senderId === 'current-user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
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
