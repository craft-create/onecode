/**
 * 剧本模块 - 共享类型定义
 * 说明：这些类型是前后端共用的接口契约
 * 位置：shared/script.interface.ts
 * 用途：剧本相关API的请求/响应数据结构定义
 * 核心特性：版本管理（每次保存生成新版本）、批注式评论、角色分析
 */

// ========================================
// 剧本项目列表 / 搜索
// ========================================

/**
 * 剧本项目列表项
 */
export interface ScriptProjectItem {
  /** 项目ID */
  id: string;
  /** 剧本标题 */
  title: string;
  /** 剧本类型（短片、长片、广告、MV等） */
  type: string;
  /** 项目描述 */
  description: string;
  /** 封面图URL */
  cover_url: string;
  /** 协作者数量 */
  collaborator_count: number;
  /** 最后更新时间 */
  updated_at: string;
  /** 创建者用户ID */
  creator_id?: string;
}

/**
 * 剧本项目列表响应（分页）
 */
export interface ScriptProjectListResponse {
  items: ScriptProjectItem[];
  total: number;
}

/**
 * 创建剧本项目请求
 */
export interface CreateScriptProjectRequest {
  title: string;
  type: string;
  description: string;
  /** 封面图（可选） */
  cover_url?: string;
}

export interface CreateScriptProjectResponse {
  /** 新项目ID */
  id: string;
}

/**
 * 搜索结果项
 */
export interface ScriptProjectSearchItem {
  id: string;
  title: string;
  cover_url: string;
  updated_at: string;
}

export interface ScriptProjectSearchResponse {
  items: ScriptProjectSearchItem[];
  total: number;
}

// ========================================
// 剧本项目详情 / 协作者
// ========================================

/**
 * 协作者信息
 */
export interface ScriptCollaborator {
  /** 用户ID */
  id: string;
  /** 用户名称 */
  name: string;
  /** 头像URL */
  avatar_url: string;
}

/**
 * 剧本项目详情
 */
export interface ScriptProjectDetail {
  id: string;
  title: string;
  type: string;
  description: string;
  cover_url: string;
  /** 协作者列表 */
  collaborators: ScriptCollaborator[];
}

// ========================================
// 剧本内容 / 版本管理
// ========================================

/**
 * 最新剧本内容响应
 * 包含内容文本和统计信息
 */
export interface ScriptContentLatest {
  /** 内容版本记录ID */
  id: string;
  /** 剧本正文内容（纯文本） */
  content: string;
  /** 版本号（v1, v2, v3...） */
  version: string;
  /** 总字数（去除空白字符） */
  word_count: number;
  /** 估算页数（按每页250字计算） */
  page_count: number;
  /** 场景数量（匹配"数字. 标题"格式） */
  scene_count: number;
}

/**
 * 保存剧本内容请求
 * 每次保存都会生成新版本，不会覆盖
 */
export interface SaveScriptContentRequest {
  /** 剧本正文 */
  content: string;
  /** 版本摘要/备注（可选，描述本次修改内容） */
  snapshot_summary?: string;
}

export interface SaveScriptContentResponse {
  /** 新生成的版本号 */
  version: string;
}

// ========================================
// 剧本大纲
// ========================================

/**
 * 大纲条目
 * 从剧本正文中自动提取的场景标题
 */
export interface ScriptOutlineItem {
  /** 场景序号 */
  index: number;
  /** 场景标题 */
  scene_header: string;
  /** 预估时长（预留字段） */
  duration: number;
  /** 在正文中的字符位置偏移，用于编辑器跳转 */
  position: number;
}

export interface ScriptOutlineResponse {
  items: ScriptOutlineItem[];
}

// ========================================
// 剧本评论（批注式，定位到字符位置）
// ========================================

/**
 * 剧本批注评论项
 * 与素材评论不同，剧本评论是定位到具体字符位置的批注
 */
export interface ScriptCommentItem {
  /** 评论ID */
  id: string;
  /** 在正文中的字符位置（定位批注位置） */
  position: number;
  /** 评论内容 */
  comment: string;
  /** 作者名称 */
  author_name: string;
  /** 作者头像 */
  author_avatar: string;
  /** 状态：open(待解决) / resolved(已解决) */
  status: string;
  created_at: string;
}

export interface ScriptCommentListResponse {
  items: ScriptCommentItem[];
}

/**
 * 创建剧本批注请求
 */
export interface CreateScriptCommentRequest {
  /** 批注位置（字符偏移） */
  position: number;
  /** 批注内容 */
  comment: string;
}

export interface CreateScriptCommentResponse {
  id: string;
}

// ========================================
// 版本历史 / 回退
// ========================================

/**
 * 版本历史项
 */
export interface ScriptVersionItem {
  /** 版本记录ID */
  id: string;
  /** 版本号（v1, v2...） */
  version: string;
  /** 版本摘要 */
  snapshot_summary: string;
  /** 保存者名称 */
  author_name: string;
  /** 保存时间 */
  created_at: string;
}

export interface ScriptVersionListResponse {
  items: ScriptVersionItem[];
  total: number;
}

/**
 * 回退版本请求
 */
export interface RevertVersionRequest {
  /** 要回退到的版本ID */
  version_id: string;
}

export interface RevertVersionResponse {
  /** 回退后生成的新版本号（不删除历史，而是复制为新版本） */
  new_version: string;
}

// ========================================
// 角色分析
// ========================================

/**
 * 角色统计项
 * 自动从剧本内容中识别角色并统计
 */
export interface RoleAnalysisItem {
  /** 角色名称 */
  role_name: string;
  /** 出场场景数 */
  scene_count: number;
  /** 台词行数 */
  line_count: number;
  /** 台词占比（百分比，保留两位小数） */
  line_ratio: number;
}

export interface RoleAnalysisResponse {
  items: RoleAnalysisItem[];
}

// ========================================
// 协作者 / 导出
// ========================================

/**
 * 邀请协作者请求
 */
export interface InviteCollaboratorRequest {
  /** 被邀请用户ID */
  user_id: string;
}

export interface InviteCollaboratorResponse {
  success: boolean;
}

/**
 * 导出剧本请求
 * 支持多种导出格式
 */
export interface ExportScriptRequest {
  /** 导出格式 */
  format: 'pdf' | 'word' | 'fountain' | 'storyboard' | 'call-sheet' | 'txt';
  /** 导出选项 */
  options: {
    /** 是否包含场景编号 */
    include_scene_number?: boolean;
    /** 是否包含角色列表 */
    include_character_list?: boolean;
    /** 是否显示修订标记 */
    include_revision_marks?: boolean;
  };
}

export interface ExportScriptResponse {
  /** 下载地址 */
  download_url: string;
  /** 文件名 */
  filename: string;
}

// ========================================
// 剧本点赞
// ========================================

/**
 * 剧本点赞状态响应
 */
export interface ScriptLikeStatusResponse {
  /** 是否已点赞 */
  liked: boolean;
  /** 总点赞数 */
  like_count: number;
}
