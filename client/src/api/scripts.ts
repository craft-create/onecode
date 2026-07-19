/**
 * 剧本API调用层
 * 功能：封装剧本项目相关的所有后端接口调用
 * 使用平台提供的axiosForBackend自动处理鉴权和跨域
 */
import { axiosForBackend } from '@/compat/client-toolkit/utils/getAxiosForBackend';
import type {
  ScriptProjectListResponse,
  CreateScriptProjectRequest,
  CreateScriptProjectResponse,
  ScriptProjectSearchResponse,
  ScriptProjectDetail,
  ScriptContentLatest,
  SaveScriptContentRequest,
  SaveScriptContentResponse,
  ScriptOutlineResponse,
  ScriptCommentListResponse,
  CreateScriptCommentRequest,
  CreateScriptCommentResponse,
  ScriptVersionListResponse,
  RevertVersionRequest,
  RevertVersionResponse,
  RoleAnalysisResponse,
  InviteCollaboratorRequest,
  InviteCollaboratorResponse,
  ExportScriptRequest,
  ExportScriptResponse,
  ScriptLikeStatusResponse,
  ScriptCollaborationConfig,
  ScriptCollaborationSyncResult,
} from '@shared/script.interface';

/**
 * 获取剧本项目列表
 * @param params.sort - 排序方式：updated(更新时间) / title(标题)
 * @param params.page - 页码
 * @param params.pageSize - 每页数量
 * @param params.creatorId - 可选，筛选特定创建者的项目
 */
export async function listProjects(params: {
  sort?: string;
  page?: number;
  pageSize?: number;
  creatorId?: string;
}): Promise<ScriptProjectListResponse> {
  const searchParams = new URLSearchParams();
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.creatorId) searchParams.set('creatorId', params.creatorId);
  const qs = searchParams.toString();
  const { data } = await axiosForBackend({
    url: `/api/script-projects${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
  return data;
}

/**
 * 获取当前用户创建的剧本列表
 * 需要登录
 * @param params.sort - 排序方式
 * @param params.page - 页码
 * @param params.pageSize - 每页数量
 */
export async function listMyProjects(params: {
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<ScriptProjectListResponse> {
  const searchParams = new URLSearchParams();
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  const qs = searchParams.toString();
  const { data } = await axiosForBackend({
    url: `/api/script-projects/my${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
  return data;
}

/**
 * 搜索剧本项目（按标题+描述模糊匹配）
 * @param params.keyword - 搜索关键词
 * @param params.page - 页码
 * @param params.pageSize - 每页数量
 */
export async function searchProjects(params: {
  keyword: string;
  page?: number;
  pageSize?: number;
}): Promise<ScriptProjectSearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('keyword', params.keyword);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  const { data } = await axiosForBackend({
    url: `/api/script-projects/search?${searchParams.toString()}`,
    method: 'GET',
  });
  return data;
}

/**
 * 创建新剧本项目
 * 创建后自动生成v1初始空版本
 * 需要登录
 * @param dto - 项目表单数据
 */
export async function createProject(
  dto: CreateScriptProjectRequest,
): Promise<CreateScriptProjectResponse> {
  const { data } = await axiosForBackend({
    url: '/api/script-projects',
    method: 'POST',
    data: dto,
  });
  return data;
}

/**
 * 获取剧本项目详情
 * @param id - 项目ID
 */
export async function getProjectDetail(
  id: string,
): Promise<ScriptProjectDetail> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${id}`,
    method: 'GET',
  });
  return data;
}

/**
 * 获取最新版本的剧本内容
 * 返回内容 + 版本号 + 字数/页数/场景数统计
 * @param projectId - 项目ID
 */
export async function getLatestContent(
  projectId: string,
): Promise<ScriptContentLatest> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/content/latest`,
    method: 'GET',
  });
  return data;
}

/**
 * 获取剧本协作配置
 * 未配置 Etherpad 时返回本地模式
 * @param projectId - 项目ID
 */
export async function getScriptCollaborationConfig(
  projectId: string,
): Promise<ScriptCollaborationConfig> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/collaboration`,
    method: 'GET',
  });
  return data;
}

/**
 * 从 Etherpad 回写最新文本到版本库
 * 仅编辑者可用
 * @param projectId - 项目ID
 */
export async function syncScriptFromCollaboration(
  projectId: string,
): Promise<ScriptCollaborationSyncResult> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/collaboration/sync`,
    method: 'POST',
  });
  return data;
}

/**
 * 获取指定版本的内容
 * @param projectId - 项目ID
 * @param versionId - 内容版本记录ID
 */
export async function getContentByVersion(
  projectId: string,
  versionId: string,
): Promise<{ content: string }> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/content/${versionId}`,
    method: 'GET',
  });
  return data;
}

/**
 * 保存剧本内容（自动生成新版本，不覆盖历史）
 * 需要登录
 * @param projectId - 项目ID
 * @param dto - 内容 + 版本摘要
 */
export async function saveContent(
  projectId: string,
  dto: SaveScriptContentRequest,
): Promise<SaveScriptContentResponse> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/content`,
    method: 'POST',
    data: dto,
  });
  return data;
}

/**
 * 获取剧本大纲（自动从内容中提取场景标题）
 * @param projectId - 项目ID
 */
export async function getOutline(
  projectId: string,
): Promise<ScriptOutlineResponse> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/outline`,
    method: 'GET',
  });
  return data;
}

/**
 * 获取剧本评论（批注式，定位到字符位置）
 * @param projectId - 项目ID
 */
export async function getComments(
  projectId: string,
): Promise<ScriptCommentListResponse> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/comments`,
    method: 'GET',
  });
  return data;
}

/**
 * 创建剧本批注评论
 * 需要登录
 * @param projectId - 项目ID
 * @param dto - 评论内容 + 字符位置
 */
export async function createComment(
  projectId: string,
  dto: CreateScriptCommentRequest,
): Promise<CreateScriptCommentResponse> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/comments`,
    method: 'POST',
    data: dto,
  });
  return data;
}

/**
 * 获取版本历史列表
 * @param projectId - 项目ID
 * @param params.page - 页码
 * @param params.pageSize - 每页数量
 */
export async function getVersions(
  projectId: string,
  params?: { page?: number; pageSize?: number },
): Promise<ScriptVersionListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  const qs = searchParams.toString();
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/versions${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
  return data;
}

/**
 * 回退到指定历史版本
 * 不会删除历史，而是复制旧内容生成新版本
 * 需要登录
 * @param projectId - 项目ID
 * @param dto - 要回退的版本ID
 */
export async function revertVersion(
  projectId: string,
  dto: RevertVersionRequest,
): Promise<RevertVersionResponse> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/versions/revert`,
    method: 'POST',
    data: dto,
  });
  return data;
}

/**
 * 角色分析（自动识别剧本中的角色并统计出场/台词）
 * @param projectId - 项目ID
 */
export async function getRoleAnalysis(
  projectId: string,
): Promise<RoleAnalysisResponse> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/analysis/roles`,
    method: 'GET',
  });
  return data;
}

/**
 * 邀请协作者加入项目
 * 需要登录
 * @param projectId - 项目ID
 * @param dto - 被邀请用户ID
 */
export async function inviteCollaborator(
  projectId: string,
  dto: InviteCollaboratorRequest,
): Promise<InviteCollaboratorResponse> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/collaborators`,
    method: 'POST',
    data: dto,
  });
  return data;
}

/**
 * 导出剧本（生成下载链接）
 * 支持多种格式：pdf/word/fountain/storyboard/call-sheet/txt
 * 需要登录
 * @param projectId - 项目ID
 * @param dto - 导出格式 + 选项
 */
export async function exportScript(
  projectId: string,
  dto: ExportScriptRequest,
): Promise<ExportScriptResponse> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/export`,
    method: 'POST',
    data: dto,
  });
  return data;
}

/**
 * 删除剧本项目
 * 需要登录 + 作者校验（只能删自己创建的）
 * 删除时自动级联清理内容版本、评论、点赞
 * @param id - 项目ID
 */
export async function deleteProject(id: string): Promise<void> {
  await axiosForBackend({
    url: `/api/script-projects/${id}`,
    method: 'DELETE',
  });
}

/**
 * 切换剧本点赞状态
 * 需要登录
 * @param projectId - 项目ID
 */
export async function toggleScriptLike(
  projectId: string,
): Promise<ScriptLikeStatusResponse> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/like`,
    method: 'POST',
  });
  return data;
}

/**
 * 查询剧本点赞状态
 * 未登录只返回总数，已登录同时返回是否已点赞
 * @param projectId - 项目ID
 */
export async function getScriptLikeStatus(
  projectId: string,
): Promise<ScriptLikeStatusResponse> {
  const { data } = await axiosForBackend({
    url: `/api/script-projects/${projectId}/like/status`,
    method: 'GET',
  });
  return data;
}
