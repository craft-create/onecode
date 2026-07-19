import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/compat/client-toolkit/logger';
import { chatApi } from '@client/src/api';
import type { ChatAccessResponse } from '@shared/api.interface';

const EMPTY_CHAT_ACCESS: ChatAccessResponse = { status: 'none' };

interface UseChatAccessResult {
  access: ChatAccessResponse;
  loading: boolean;
  refresh: () => Promise<ChatAccessResponse>;
}

const useChatAccess = (
  targetUserId?: string,
  currentUserId?: string,
): UseChatAccessResult => {
  const [access, setAccess] = useState<ChatAccessResponse>(EMPTY_CHAT_ACCESS);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async (): Promise<ChatAccessResponse> => {
    if (!targetUserId || !currentUserId || targetUserId === currentUserId) {
      setAccess(EMPTY_CHAT_ACCESS);
      return EMPTY_CHAT_ACCESS;
    }

    setLoading(true);
    try {
      const nextAccess: ChatAccessResponse = await chatApi.getChatAccess(
        targetUserId,
      );
      setAccess(nextAccess);
      return nextAccess;
    } catch (error: unknown) {
      logger.error('获取聊天关系状态失败:', error);
      setAccess(EMPTY_CHAT_ACCESS);
      return EMPTY_CHAT_ACCESS;
    } finally {
      setLoading(false);
    }
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { access, loading, refresh };
};

export { useChatAccess };
