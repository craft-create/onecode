import axios from 'axios';
import type {
  AnalyticsContentStatsResponse,
  AnalyticsDashboardData,
  AnalyticsTrackRequest,
} from '@shared/types';

// 获取配置好的 axios 实例
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器：自动添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== 通知系统 ====================
export const notificationApi = {
  // 获取通知列表
  list: (params?: { type?: string; isRead?: number; page?: number; limit?: number }) =>
    api.get('/notifications', { params }),

  // 获取未读数量
  getUnreadCount: () => api.get('/notifications/unread/count'),

  // 获取统计
  getStatistics: () => api.get('/notifications/statistics'),

  // 标为已读
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  // 全部标为已读
  markAllAsRead: (type?: string) => api.post('/notifications/read-all', {}, { params: { type } }),

  // 删除通知
  delete: (id: string) => api.delete(`/notifications/${id}`),

  // 批量删除
  batchDelete: (type?: string) => api.delete('/notifications', { params: { type } }),
};

// ==================== 聊天系统 ====================
export const chatApi = {
  // 创建会话
  createConversation: (data: { title?: string; type?: string; memberIds?: string[] }) =>
    api.post('/chat/conversations', data),

  // 获取会话列表
  getConversations: () => api.get('/chat/conversations'),

  // 获取会话详情
  getConversation: (id: string) => api.get(`/chat/conversations/${id}`),

  // 发送消息
  sendMessage: (data: { conversationId: string; content?: string; type?: string; attachments?: string; replyToMessageId?: string; mentions?: string }) =>
    api.post('/chat/messages', data),

  // 获取消息列表
  getMessages: (params: { conversationId: string; beforeId?: string; page?: number; limit?: number }) =>
    api.get(`/chat/conversations/${params.conversationId}/messages`, { params }),

  // 标记已读
  markAsRead: (conversationId: string) => api.post(`/chat/conversations/${conversationId}/read`),

  // 获取未读数
  getUnreadCount: () => api.get('/chat/unread/count'),

  // 删除消息
  deleteMessage: (id: string) => api.delete(`/chat/messages/${id}`),

  // 编辑消息
  editMessage: (id: string, content: string) => api.patch(`/chat/messages/${id}`, { content }),
};

// ==================== 团队协作 ====================
export const teamApi = {
  // 创建团队
  create: (data: { name: string; description?: string; logo?: string; isPublic?: number }) =>
    api.post('/teams', data),

  // 获取团队列表
  list: (isPublic?: boolean) => api.get('/teams', { params: { isPublic } }),

  // 获取团队详情
  get: (id: string) => api.get(`/teams/${id}`),

  // 更新团队
  update: (id: string, data: { name?: string; description?: string; logo?: string; isPublic?: number }) =>
    api.patch(`/teams/${id}`, data),

  // 删除团队
  delete: (id: string) => api.delete(`/teams/${id}`),

  // 添加成员
  addMember: (teamId: string, data: { userId: string; role?: string }) =>
    api.post(`/teams/${teamId}/members`, data),

  // 移除成员
  removeMember: (teamId: string, memberId: string) =>
    api.delete(`/teams/${teamId}/members/${memberId}`),

  // 更新成员角色
  updateMemberRole: (teamId: string, memberId: string, role: string) =>
    api.patch(`/teams/${teamId}/members/${memberId}/role`, { role }),

  // 分享资源
  shareResource: (teamId: string, data: { resourceType: string; resourceId: string; permission?: string }) =>
    api.post(`/teams/${teamId}/resources`, data),

  // 获取团队资源
  getResources: (teamId: string) => api.get(`/teams/${teamId}/resources`),
};

// ==================== 项目工作台 ====================
export const projectApi = {
  // 创建项目
  create: (data: { name: string; description?: string; coverUrl?: string; status?: string; priority?: string; startDate?: string; endDate?: string; teamId?: string; tags?: string[] }) =>
    api.post('/projects', data),

  // 获取项目列表
  list: (params?: { status?: string; teamId?: string }) =>
    api.get('/projects', { params }),

  // 获取项目详情
  get: (id: string) => api.get(`/projects/${id}`),

  // 更新项目
  update: (id: string, data: { name?: string; description?: string; coverUrl?: string; status?: string; priority?: string; progress?: number }) =>
    api.patch(`/projects/${id}`, data),

  // 删除项目
  delete: (id: string) => api.delete(`/projects/${id}`),

  // 创建任务
  createTask: (projectId: string, data: { title: string; description?: string; status?: string; priority?: string; assigneeId?: string; dueDate?: string; tags?: string[]; attachments?: string }) =>
    api.post(`/projects/${projectId}/tasks`, data),

  // 更新任务
  updateTask: (taskId: string, data: { title?: string; description?: string; status?: string; priority?: string; assigneeId?: string; dueDate?: string; tags?: string[] }) =>
    api.patch(`/projects/tasks/${taskId}`, data),

  // 删除任务
  deleteTask: (taskId: string) => api.delete(`/projects/tasks/${taskId}`),

  // 添加评论
  addComment: (projectId: string, data: { taskId?: string; parentId?: string; content: string }) =>
    api.post(`/projects/${projectId}/comments`, data),

  // 获取评论
  getComments: (projectId: string, taskId?: string) =>
    api.get(`/projects/${projectId}/comments`, { params: { taskId } }),

  // 更新进度
  updateProgress: (id: string) => api.post(`/projects/${id}/progress`),
};

// ==================== 用户设置 ====================
export interface UserProfileData {
  nickname?: string;
  email?: string;
  phone?: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  avatarUrl?: string;
}

export interface StorageStats {
  used: number;
  quota: number;
  remaining: number;
  usagePercent: number;
  formattedUsed: string;
  formattedQuota: string;
  formattedRemaining: string;
}

const formatBytes = (bytes: number): string => {
  const normalizedBytes = Math.max(0, bytes);
  if (normalizedBytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.max(0, Math.floor(Math.log(normalizedBytes) / Math.log(k)));
  const value = normalizedBytes / Math.pow(k, i);
  return `${parseFloat(value.toFixed(2))} ${sizes[i]}`;
};

export interface UserPasswordData {
  currentPassword: string;
  newPassword: string;
}

export const settingApi = {
  // 获取用户资料
  getProfile: async (): Promise<UserProfileData> => {
    return (await api.get<UserProfileData>('/settings/profile')) as UserProfileData;
  },

  // 更新用户资料
  updateProfile: (data: UserProfileData) =>
    api.patch('/settings/profile', data),

  // 修改密码
  changePassword: (data: UserPasswordData) =>
    api.post('/settings/password', data),

  // 获取存储统计
  getStorageStats: async (): Promise<StorageStats> => {
    const response = (await api.get<StorageStats | { data: StorageStats } | { used: number }>(
      '/settings/storage/stats'
    )) as unknown as StorageStats | { data: StorageStats } | Record<string, unknown>;
    const raw = (response as { data?: StorageStats }).data ?? response;
    const toNumber = (v: unknown): number => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string') {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };
    const used = toNumber((raw as Partial<StorageStats>).used);
    const quota = toNumber((raw as Partial<StorageStats>).quota);
    const remaining = Number.isFinite(toNumber((raw as Partial<StorageStats>).remaining))
      ? toNumber((raw as Partial<StorageStats>).remaining)
      : quota - used;
    const normalizedRemaining = Math.max(0, remaining);
    const usagePercent = Number.isFinite(toNumber((raw as Partial<StorageStats>).usagePercent))
      ? toNumber((raw as Partial<StorageStats>).usagePercent)
      : quota > 0
        ? (used / quota) * 100
        : 0;

    return {
      used,
      quota,
      remaining: normalizedRemaining,
      usagePercent: Math.max(0, Math.min(100, usagePercent)),
      formattedUsed: (raw as Partial<StorageStats>).formattedUsed || formatBytes(used),
      formattedQuota: (raw as Partial<StorageStats>).formattedQuota || formatBytes(quota),
      formattedRemaining: (raw as Partial<StorageStats>).formattedRemaining || formatBytes(normalizedRemaining),
    };
  },

  // 获取设置
  getSettings: () => api.get('/settings'),

  // 更新设置
  updateSettings: (data: { theme?: string; language?: string; timezone?: string; emailNotifications?: number; pushNotifications?: number; notificationTypes?: string }) =>
    api.patch('/settings', data),
};

// ==================== 数据分析 ====================
export const analyticsApi = {
  // 记录用户行为
  track: (data: AnalyticsTrackRequest) =>
    api.post('/analytics/track', data),

  // 获取内容统计
  getContentStats: (type: string, id: string, days?: number): Promise<AnalyticsContentStatsResponse> =>
    api.get(`/analytics/content/${type}/${id}`, { params: { days } }) as Promise<AnalyticsContentStatsResponse>,

  // 获取用户数据面板
  getDashboard: (): Promise<AnalyticsDashboardData> => api.get('/analytics/dashboard') as Promise<AnalyticsDashboardData>,
};

// ==================== 标签 ====================
export const tagApi = {
  // 获取标签列表
  list: (type?: string) => api.get('/tags', { params: { type } }),

  // 创建标签
  create: (name: string, type: string) => api.post('/tags', { name, type }),
};

// ==================== 模板 ====================
export const templateApi = {
  // 获取模板列表
  list: (category?: string) => api.get('/templates', { params: { category } }),

  // 获取模板详情
  get: (id: string) => api.get(`/templates/${id}`),

  // 创建模板
  create: (data: { title: string; description?: string; coverUrl?: string; category?: string; tags?: string[]; structure?: string; preview?: string; isPremium?: number; price?: number }) =>
    api.post('/templates', data),

  // 使用模板
  use: (id: string) => api.post(`/templates/${id}/use`),
};

// ==================== 支付 ====================
export const paymentApi = {
  // 设置付费内容
  setPaidContent: (data: { resourceType: string; resourceId: string; price: number; licenseType?: string }) =>
    api.post('/payment/paid-content', data),

  // 购买
  purchase: (data: { resourceType: string; resourceId: string; paidContentId: string; amount: number }) =>
    api.post('/payment/purchase', data),

  // 打赏
  tip: (data: { toUserId: string; amount: number; message?: string; resourceType?: string; resourceId?: string }) =>
    api.post('/payment/tip', data),

  // 获取收到的打赏
  getTipsReceived: (page?: number) => api.get('/payment/tips/received', { params: { page } }),
};

// ==================== 需求 ====================
export const requirementApi = {
  // 创建需求
  create: (data: { title: string; description: string; type: string; budget?: number; deadline?: string; attachments?: string }) =>
    api.post('/requirements', data),

  // 获取需求列表
  list: (status?: string) => api.get('/requirements', { params: { status } }),

  // 申请需求
  apply: (id: string, data: { proposal: string; quote?: number; estimatedDays?: number; message?: string }) =>
    api.post(`/requirements/${id}/apply`, data),

  // 创建订单
  createOrder: (data: any) => api.post('/requirements/orders', data),
};

// ==================== AI ====================
export const aiApi = {
  // 记录生成
  recordGeneration: (data: { type: string; input: string; output?: string; model?: string; tokensUsed?: number; processingTime?: number; isSuccess?: number; errorMessage?: string }) =>
    api.post('/ai/generate', data),

  // 获取历史
  getHistory: (type?: string) => api.get('/ai/history', { params: { type } }),
};

// ==================== 审核 ====================
export const auditApi = {
  // 提交举报
  createReport: (data: { resourceType: string; resourceId: string; reason: string; description?: string }) =>
    api.post('/audit/reports', data),

  // 获取举报列表
  getReports: (status?: string) => api.get('/audit/reports', { params: { status } }),

  // 处理举报
  handleReport: (id: string, note: string, status: string) =>
    api.patch(`/audit/reports/${id}`, { note, status }),

  // 记录操作日志
  logAction: (data: { action: string; resourceType?: string; resourceId?: string; oldValue?: string; newValue?: string; ipAddress?: string; userAgent?: string }) =>
    api.post('/audit/logs', data),

  // 获取日志
  getLogs: (params?: { userId?: string; action?: string }) =>
    api.get('/audit/logs', { params }),
};

// ==================== 分享 ====================
export const shareApi = {
  // 记录分享
  record: (data: { resourceType: string; resourceId: string; platform: string }) =>
    api.post('/share', data),

  // 获取分享统计
  getStats: (type: string, id: string) => api.get(`/share/stats/${type}/${id}`),
};

// ==================== 文件管理 ====================
export const fileApi = {
  // 获取文件夹列表
  getFolders: (parentId?: string) => api.get('/files/folders', { params: { parentId } }),

  // 创建文件夹
  createFolder: (data: { name: string; parentId?: string; color?: string; icon?: string }) =>
    api.post('/files/folders', data),

  // 更新文件夹
  updateFolder: (folderId: string, data: { name?: string; color?: string; icon?: string }) =>
    api.patch(`/files/folders/${folderId}`, data),

  // 删除文件夹
  deleteFolder: (folderId: string) => api.delete(`/files/folders/${folderId}`),

  // 获取文件列表
  getFiles: (params?: { folderId?: string; starred?: boolean; type?: string; tags?: string[]; page?: number; pageSize?: number }) =>
    api.get('/files', { params }),

  // 创建文件记录
  createFile: (data: any) => api.post('/files', data),

  // 更新文件
  updateFile: (fileId: string, data: { name?: string; description?: string; tags?: string[]; folderId?: string }) =>
    api.patch(`/files/${fileId}`, data),

  // 删除文件
  deleteFile: (fileId: string) => api.delete(`/files/${fileId}`),

  // 批量删除
  batchDelete: (fileIds: string[]) => api.post('/files/batch/delete', { fileIds }),

  // 批量移动
  batchMove: (fileIds: string[], folderId?: string) => api.post('/files/batch/move', { fileIds, folderId }),

  // 收藏/取消收藏
  toggleStar: (fileId: string) => api.post(`/files/${fileId}/star`),

  // 分享文件
  shareFile: (data: { fileId: string; expiresIn?: number; maxDownloads?: number; password?: string }) =>
    api.post<{ shareToken: string; shareUrl: string; expiresAt: string | null }>(
      '/files/share',
      data,
    ),

  // 获取分享文件
  getSharedFile: (shareToken: string, password?: string) => api.get(`/files/share/${shareToken}`, { params: { password } }),

  // 取消分享
  unshareFile: (fileId: string) => api.delete(`/files/${fileId}/share`),

  // 获取回收站
  getRecycleBin: () => api.get('/files/recycle-bin'),

  // 恢复文件
  restoreFile: (recycleId: string) => api.post(`/files/recycle-bin/${recycleId}/restore`),

  // 永久删除
  permanentlyDelete: (recycleId: string) => api.delete(`/files/recycle-bin/${recycleId}`),

  // 清空回收站
  clearRecycleBin: () => api.delete('/files/recycle-bin/clear'),
};
