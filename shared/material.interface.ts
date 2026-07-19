/**
 * 素材模块 - 共享类型定义
 * 说明：这些类型是前后端共用的接口契约
 * 位置：shared/material.interface.ts
 * 用途：素材相关API的请求/响应数据结构定义
 * 命名规范：数据库字段驼峰命名，接口字段下划线命名（snake_case）
 */

// ========================================
// 素材列表 / 搜索相关
// ========================================

/**
 * 素材列表项（素材库列表页展示）
 */
export interface MaterialItem {
  /** 素材唯一ID（UUID） */
  id: string;
  /** 素材标题 */
  title: string;
  /** 素材类型：video(视频) / audio(音频) / sound(音效) */
  type: 'video' | 'audio' | 'sound';
  /** 分辨率（如 4K、1080P、720P） */
  resolution: string;
  /** 时长（秒） */
  duration: number;
  /** 封面图URL */
  cover_url: string;
  /** 预览视频/音频URL */
  preview_url: string;
  /** 标签数组 */
  tags: string[];
}

/**
 * 素材列表响应（分页）
 */
export interface MaterialListResponse {
  /** 当前页数据 */
  items: MaterialItem[];
  /** 总数量（用于分页计算） */
  total: number;
}

/**
 * 搜索结果项（搜索页展示，包含完整字段用于卡片渲染）
 */
export interface MaterialSearchItem {
  /** 素材ID */
  id: string;
  /** 素材标题 */
  title: string;
  /** 素材类型：video(视频) / audio(音频) / sound(音效) */
  type: 'video' | 'audio' | 'sound';
  /** 分辨率（如 4K、1080P、720P） */
  resolution: string;
  /** 时长（秒） */
  duration: number;
  /** 封面图URL */
  cover_url: string;
  /** 预览视频/音频URL */
  preview_url: string;
  /** 标签数组 */
  tags: string[];
}

/**
 * 搜索结果响应（分页）
 */
export interface MaterialSearchResponse {
  items: MaterialSearchItem[];
  total: number;
}

/**
 * 筛选条件响应
 * 用于素材库侧边栏的筛选器选项
 */
export interface MaterialFiltersResponse {
  /** 可用分辨率列表（去重排序） */
  resolutions: string[];
  /** 时长区间选项 */
  durations: Array<{ label: string; min: number; max: number }>;
  /** 所有标签列表（去重排序） */
  tags: string[];
}

// ========================================
// 素材详情 / 下载 / 相关推荐
// ========================================

/**
 * 素材完整详情（详情页展示）
 */
export interface MaterialDetail {
  id: string;
  title: string;
  /** 详细描述 */
  description: string;
  type: string;
  resolution: string;
  /** 时长（秒） */
  duration: number;
  /** 文件格式（如 mp4、mov、wav等） */
  format: string;
  /** 文件大小（字节） */
  file_size: number;
  /** 拍摄设备 */
  device: string;
  tags: string[];
  /** 预览地址 */
  preview_url: string;
  /** 封面地址 */
  cover_url: string;
  /** 下载次数 */
  download_count: number;
  /** 点赞次数 */
  like_count: number;
  /** 创作者用户ID */
  creator_id?: string;
  /** 创作者昵称 */
  creator_name?: string;
  /** 创作者头像 */
  creator_avatar_url?: string;
}

/**
 * 下载地址响应
 */
export interface MaterialDownloadResponse {
  /** 实际下载URL */
  download_url: string;
}

/**
 * 相关素材推荐项
 */
export interface MaterialRelatedItem {
  id: string;
  title: string;
  cover_url: string;
  duration: number;
}

/**
 * 相关素材推荐响应
 */
export interface MaterialRelatedResponse {
  items: MaterialRelatedItem[];
}

// ========================================
// 创建 / 上传素材
// ========================================

/**
 * 上传签名响应（对接文件存储服务时使用）
 */
export interface UploadSignatureResponse {
  /** 直传上传地址 */
  upload_url: string;
  /** 文件ID */
  file_id: string;
}

/**
 * 创建素材请求体
 * 上传文件后，调用此接口创建素材数据库记录
 */
export interface CreateMaterialRequest {
  title: string;
  description: string;
  type: string;
  resolution: string;
  duration: number;
  format: string;
  file_size: number;
  /** 拍摄设备（可选） */
  device?: string;
  tags: string[];
  preview_url: string;
  download_url: string;
  cover_url: string;
}

/**
 * 创建素材响应
 */
export interface CreateMaterialResponse {
  /** 新创建的素材ID */
  id: string;
}

// ========================================
// 我的素材
// ========================================

/**
 * 用户素材列表项（个人中心-我的素材）
 */
export interface UserMaterialItem {
  /** 关联记录ID */
  id: string;
  /** 素材ID */
  material_id: string;
  /** 素材标题 */
  title: string;
  /** 封面图 */
  cover_url: string;
  /** 上传时间（ISO字符串） */
  created_at: string;
}

/**
 * 我的素材列表响应
 */
export interface UserMaterialListResponse {
  items: UserMaterialItem[];
  total: number;
}

// ========================================
// 收藏相关（旧版分类系统）
// ========================================

/**
 * 收藏素材项
 */
export interface FavoriteMaterialItem {
  id: string;
  material_id: string;
  title: string;
  cover_url: string;
  /** 所属分类名称 */
  category_name: string;
  created_at: string;
}

export interface FavoriteMaterialListResponse {
  items: FavoriteMaterialItem[];
  total: number;
}

// ========================================
// 下载历史
// ========================================

/**
 * 下载历史记录项
 */
export interface DownloadHistoryItem {
  id: string;
  material_id: string;
  title: string;
  format: string;
  file_size: number;
  download_url: string;
  created_at: string;
}

export interface DownloadHistoryListResponse {
  items: DownloadHistoryItem[];
  total: number;
}

// ========================================
// 收藏分类（旧版）
// ========================================

/**
 * 收藏分类操作请求
 */
export interface FavoriteCategoryRequest {
  /** 操作类型：创建/更新/删除 */
  action: 'create' | 'update' | 'delete';
  /** 分类ID（更新/删除时需要） */
  id?: string;
  /** 分类名称（创建/更新时需要） */
  name?: string;
}

export interface FavoriteCategoryResponse {
  success: boolean;
}

/**
 * 收藏素材操作请求
 */
export interface FavoriteMaterialRequest {
  material_id: string;
  category_id?: string;
  /** 操作：添加/移除 */
  action: 'add' | 'remove';
}

export interface FavoriteMaterialResponse {
  success: boolean;
}

// ========================================
// 素材评论（支持二级回复）
// ========================================

/**
 * 素材评论项
 * 树形结构：一级评论包含replies数组存放二级回复
 */
export interface MaterialCommentItem {
  /** 评论ID */
  id: string;
  /** 所属素材ID */
  material_id: string;
  /** 父评论ID（一级评论为null，回复则有值） */
  parent_id: string | null;
  /** 评论内容 */
  content: string;
  /** 作者用户ID */
  author: string;
  /** 作者名称（可选，展示用） */
  author_name?: string;
  /** 点赞数量 */
  like_count: number;
  /** 当前用户是否已点赞 */
  is_liked: boolean;
  /** 二级回复数组 */
  replies: MaterialCommentItem[];
  /** 评论时间 */
  created_at: string;
}

export interface MaterialCommentListResponse {
  items: MaterialCommentItem[];
  total: number;
}

/**
 * 发表评论请求
 */
export interface CreateMaterialCommentRequest {
  /** 评论内容 */
  content: string;
  /** 父评论ID（回复时传，不传则为一级评论） */
  parent_id?: string;
}

export interface CreateMaterialCommentResponse {
  id: string;
}

// ========================================
// 点赞相关
// ========================================

/**
 * 素材点赞状态响应
 */
export interface MaterialLikeStatusResponse {
  /** 是否已点赞 */
  liked: boolean;
  /** 总点赞数 */
  like_count: number;
}

/**
 * 评论点赞状态响应
 */
export interface CommentLikeStatusResponse {
  liked: boolean;
}

// ========================================
// 收藏夹（新系统，替代旧的分类系统）
// ========================================

/**
 * 收藏夹项
 */
export interface FavoriteFolderItem {
  /** 收藏夹ID */
  id: string;
  /** 收藏夹名称 */
  name: string;
  /** 收藏夹内的项目数量 */
  item_count: number;
  created_at: string;
}

export interface FavoriteFolderListResponse {
  items: FavoriteFolderItem[];
}

/**
 * 创建收藏夹请求
 */
export interface CreateFavoriteFolderRequest {
  name: string;
}

export interface CreateFavoriteFolderResponse {
  id: string;
}

/**
 * 更新收藏夹请求
 */
export interface UpdateFavoriteFolderRequest {
  name: string;
}

/**
 * 收藏夹内容项
 * 支持收藏素材和剧本两种类型
 */
export interface FavoriteFolderContentItem {
  /** 收藏记录ID */
  id: string;
  /** 素材ID（类型为material时有值） */
  material_id: string | null;
  /** 项目ID（类型为project时有值） */
  project_id: string | null;
  /** 标题 */
  title: string;
  /** 封面图 */
  cover_url: string;
  /** 收藏类型：素材 / 剧本项目 */
  type: 'material' | 'project';
  created_at: string;
}

export interface FavoriteFolderContentResponse {
  items: FavoriteFolderContentItem[];
}

/**
 * 添加收藏项请求
 */
export interface AddFavoriteItemRequest {
  /** 素材ID（收藏素材时传） */
  material_id?: string;
  /** 项目ID（收藏剧本时传） */
  project_id?: string;
}

export interface AddFavoriteItemResponse {
  id: string;
}

/**
 * 更新素材请求
 */
export interface UpdateMaterialRequest {
  title?: string;
  description?: string;
  type?: string;
  resolution?: string;
  duration?: number;
  format?: string;
  file_size?: number;
  device?: string;
  tags?: string[];
  preview_url?: string;
  download_url?: string;
  cover_url?: string;
}
