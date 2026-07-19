import React, { useCallback, useEffect, useState } from 'react';
import { Check, UserRoundPlus, X } from 'lucide-react';
import { logger } from '@/compat/client-toolkit/logger';
import { chatApi } from '@client/src/api';
import { Button } from '@client/src/components/ui/button';
import type { ChatRequest } from '@shared/types';
import { toast } from 'sonner';

interface ChatRequestsPanelProps {
  onApproved: (conversationId: string) => void;
}

const ChatRequestsPanel: React.FC<ChatRequestsPanelProps> = ({ onApproved }) => {
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async (): Promise<void> => {
    try {
      const pendingRequests: ChatRequest[] = await chatApi.getChatRequests({
        direction: 'incoming',
        status: 'pending',
      });
      setRequests(pendingRequests);
    } catch (error: unknown) {
      logger.error('获取好友申请失败:', error);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
    const timerId: number = window.setInterval(() => {
      void fetchRequests();
    }, 5000);
    return () => window.clearInterval(timerId);
  }, [fetchRequests]);

  const handleApprove = async (requestId: string): Promise<void> => {
    setProcessingId(requestId);
    try {
      const approvedRequest: ChatRequest = await chatApi.approveChatRequest(requestId);
      if (!approvedRequest.conversationId) {
        throw new Error('好友申请已通过，但未返回会话');
      }
      setRequests((currentRequests: ChatRequest[]) =>
        currentRequests.filter((request: ChatRequest) => request.id !== requestId),
      );
      toast.success('已通过好友申请，现在可以聊天了');
      onApproved(approvedRequest.conversationId);
    } catch (error: unknown) {
      logger.error('通过好友申请失败:', error);
      toast.error('处理失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string): Promise<void> => {
    setProcessingId(requestId);
    try {
      await chatApi.rejectChatRequest(requestId);
      setRequests((currentRequests: ChatRequest[]) =>
        currentRequests.filter((request: ChatRequest) => request.id !== requestId),
      );
      toast.success('已拒绝好友申请');
    } catch (error: unknown) {
      logger.error('拒绝好友申请失败:', error);
      toast.error('处理失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-border bg-accent/20 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-medium">
        <UserRoundPlus className="size-4 text-primary" />
        <span>好友申请</span>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
          {requests.length}
        </span>
      </div>
      <div className="space-y-2" data-ai-section-type="card-list">
        {requests.map((request: ChatRequest) => (
          <div
            key={request.id}
            className="rounded-lg border border-border bg-card/80 p-2.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/5"
          >
            <p className="truncate text-sm font-medium">
              {request.fromUserName || '未知用户'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {request.reason || '申请添加你为好友并开始聊天'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void handleApprove(request.id)}
                disabled={processingId === request.id}
                data-ai-section-type="button"
              >
                <Check className="size-4" />
                通过
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleReject(request.id)}
                disabled={processingId === request.id}
                data-ai-section-type="button"
              >
                <X className="size-4" />
                拒绝
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { ChatRequestsPanel };
