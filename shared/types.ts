// 通知相关接口
export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'favorite' | 'comment' | 'follow' | 'system' | 'message';
  title: string;
  content?: string;
  sourceType?: string;
  sourceId?: string;
  fromUserId?: string;
  isRead: 0 | 1;
  metadata?: string;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface ChatRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  conversationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
  createdBy?: string;
}

// 聊天相关接口
export interface Conversation {
  id: string;
  title?: string;
  type: 'private' | 'group';
  lastMessageId?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
  members?: ConversationMemberSummary[];
  peerId?: string;
  peerName?: string;
}

export interface ConversationMemberSummary {
  userId: string;
  nickname?: string | null;
  role: 'owner' | 'admin' | 'member';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: string;
  replyToMessageId?: string;
  mentions?: string;
  isEdited: 0 | 1;
  isDeleted: 0 | 1;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface ChatTypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ChatMessageEvent {
  conversationId: string;
  message: Message;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  lastReadMessageId?: string;
  unreadCount: number;
  isMuted: 0 | 1;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

// 团队相关接口
export interface Team {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  ownerId: string;
  memberCount: number;
  isPublic: 0 | 1;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions?: string;
  joinedAt: Date;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface TeamResource {
  id: string;
  teamId: string;
  resourceType: 'material' | 'script' | 'folder';
  resourceId: string;
  permission: 'view' | 'edit' | 'admin';
  sharedBy: string;
  createdAt: Date;
}

// 项目相关接口
export interface Project {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: Date;
  endDate?: Date;
  ownerId: string;
  teamId?: string;
  tags?: string[];
  progress: number;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  reporterId: string;
  dueDate?: Date;
  completedAt?: Date;
  tags?: string[];
  attachments?: string;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  taskId?: string;
  parentId?: string;
  content: string;
  author: string;
  createdAt: Date;
  createdBy?: string;
}

// 用户设置
export interface UserSetting {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailNotifications: 0 | 1;
  pushNotifications: 0 | 1;
  notificationTypes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 数据分析
export interface ContentStat {
  id: string;
  resourceType: 'material' | 'script';
  resourceId: string;
  date: string;
  views: number;
  likes: number;
  favorites: number;
  downloads: number;
  shares: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBehavior {
  id: string;
  userId?: string;
  sessionId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  duration?: number;
  metadata?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AnalyticsTimeSeriesPoint {
  date: string;
  views: number;
  likes: number;
  downloads: number;
  shares: number;
}

export interface AnalyticsCategoryPoint {
  name: string;
  value: number;
}

export interface AnalyticsTopContentItem {
  id: string;
  type: string;
  title: string;
  views: number;
  likes: number;
  downloads: number;
  shares: number;
  total: number;
}

export interface AnalyticsDashboardData {
  totalViews: number;
  totalLikes: number;
  totalDownloads: number;
  totalShares: number;
  totalFavorites: number;
  totalContents: number;
  weeklyTrend: AnalyticsTimeSeriesPoint[];
  categoryDistribution: AnalyticsCategoryPoint[];
  topContents: AnalyticsTopContentItem[];
}

export interface AnalyticsContentPoint {
  date: string;
  views: number;
  likes: number;
  downloads: number;
  shares: number;
  favorites: number;
  comments: number;
}

export interface AnalyticsContentStatsResponse {
  resourceType: string;
  resourceId: string;
  total: {
    views: number;
    likes: number;
    favorites: number;
    downloads: number;
    shares: number;
    comments: number;
  };
  timeline: AnalyticsContentPoint[];
}

export interface AnalyticsTrackRequest {
  action: string;
  resourceType?: string;
  resourceId?: string;
  duration?: number;
  metadata?: string;
}

// 分享
export interface ShareRecord {
  id: string;
  userId?: string;
  resourceType: string;
  resourceId: string;
  platform: string;
  createdAt: Date;
}

// 标签
export interface Tag {
  id: string;
  name: string;
  type: string;
  usageCount: number;
  isOfficial: 0 | 1;
  createdAt: Date;
}

// 剧本模板
export interface ScriptTemplate {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  category?: string;
  tags?: string[];
  structure?: string;
  preview?: string;
  authorId?: string;
  usageCount: number;
  rating: number;
  isPremium: 0 | 1;
  price: number;
  isOfficial: 0 | 1;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateComment {
  id: string;
  templateId: string;
  userId: string;
  rating: number;
  content?: string;
  createdAt: Date;
}
