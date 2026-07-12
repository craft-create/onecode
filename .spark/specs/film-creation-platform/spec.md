# 技术方案

## 开发元信息

- 开发模式: 全栈应用
- 涉及层级: [数据库, 服务端, 前端]

## 页面路由与导航

### 页面路由
```
/ → 首页
/materials → 影音素材库
/materials/:id → 素材详情页
/materials/upload → 素材上传页
/account/materials → 个人中心-素材管理
/scripts → 剧本项目列表
/scripts/:id → 剧本编辑器
/scripts/:id/export → 剧本导出中心
```

### 导航设计

- 导航机制：页面路由
- 导航项：
  - 首页
  - 影音素材库
  - 剧本创作
  - 个人中心

## 业务组件

| 组件 | 来源 | 关联页面 | 对应功能点 |
|------|------|---------|-----------|
| 上传组件 | 官方内置组件 | 素材上传页 | 拖拽上传、批量上传、进度展示 |
| 表格组件 | 官方内置组件 | 个人中心-素材管理、剧本编辑器 | 下载历史展示、分场大纲编辑 |
| 表单组件 | 官方内置组件 | 素材上传页、剧本项目列表 | 素材元信息填写、新建项目向导 |
| 模态框组件 | 官方内置组件 | 全页面 | 删除确认、邀请协作者、版本对比 |
| 柱状图组件 | 官方内置组件 | 剧本协作与分析面板 | 角色戏份统计展示 |
| 轮播组件 | 官方内置组件 | 首页 | 精选素材轮播展示 |
| 视频播放器 | 官方内置组件 | 素材详情页 | 高清素材预览播放 |

## 数据模型

### 数据库设计

#### 素材表（material）
用途：存储音视频素材的基础信息与元数据，对应素材库全流程功能。
核心字段：
- title: varchar (素材标题)
- description: text (素材描述)
- type: varchar ['video', 'audio', 'sound'] (素材类型：视频/音频/音效)
- resolution: varchar (分辨率，如3840×2160)
- duration: int (时长，单位秒)
- format: varchar (文件格式，如ProRes 422)
- file_size: bigint (文件大小，单位字节)
- device: varchar (拍摄设备)
- tags: varchar[] (标签数组，包含风格/场景/情绪三类)
- preview_url: text (预览文件地址)
- download_url: text (高清源文件地址)
- cover_url: text (封面缩略图地址)
关联关系：与用户素材关系表是一对多关系。

#### 用户素材关系表（user_material）
用途：存储用户与素材的关联关系，包含上传、收藏、下载三类记录。
核心字段：
- material_id: varchar (关联 -> material.id)
- user_id: user_profile (关联用户)
- relation_type: varchar ['upload', 'favorite', 'download'] (关联类型)
- category_id: varchar (关联 -> favorite_category.id，收藏时使用)
关联关系：与素材表、收藏分类表是多对一关系。

#### 收藏分类表（favorite_category）
用途：存储用户自定义的收藏夹分类。
核心字段：
- name: varchar (分类名称)
- user_id: user_profile (所属用户)
关联关系：与用户素材关系表是一对多关系。

#### 剧本项目表（script_project）
用途：存储剧本项目的基础信息。
核心字段：
- title: varchar (项目标题)
- type: varchar (项目类型，如悬疑/科幻/爱情)
- description: text (项目简介)
- cover_url: text (项目封面地址)
- collaborators: user_profile[] (协作者列表)
关联关系：与剧本内容表是一对多关系。

#### 剧本内容表（script_content）
用途：存储剧本的版本化内容。
核心字段：
- project_id: varchar (关联 -> script_project.id)
- content: text (剧本完整内容)
- version: varchar (版本号)
- snapshot_summary: varchar (版本快照说明)
关联关系：与剧本项目表是多对一关系。

#### 剧本批注表（script_comment）
用途：存储剧本的评论批注信息。
核心字段：
- project_id: varchar (关联 -> script_project.id)
- content_id: varchar (关联 -> script_content.id)
- position: int (批注在内容中的位置偏移量)
- comment: text (批注内容)
- author: user_profile (批注作者)
- status: varchar ['open', 'resolved'] (批注状态)
关联关系：与剧本项目表、剧本内容表是多对一关系。

## 业务模型

### API 设计

#### 首页 相关

**页面路径**: /

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 精选素材轮播展示 | API | GET /api/home/featured-materials |
| 热门剧本列表展示 | API | GET /api/home/popular-scripts |
| 优秀创作者推荐 | API | GET /api/home/top-creators |
| 平台统计数据展示 | API | GET /api/home/statistics |

**所需 API**:
```typescript
// 获取精选素材列表 [领域模型: Material] [对应页面功能: 精选素材轮播展示]
GET /api/home/featured-materials
Response: {
  items: Array<{
    id: string;
    title: string;
    cover_url: string;
    description: string;
  }>;
}

// 获取热门剧本列表 [领域模型: ScriptProject] [对应页面功能: 热门剧本列表展示]
GET /api/home/popular-scripts
Response: {
  items: Array<{
    id: string;
    title: string;
    type: string;
    cover_url: string;
    like_count: number;
    author_name: string;
  }>;
}

// 获取优秀创作者列表 [领域模型: UserProfile] [对应页面功能: 优秀创作者推荐]
GET /api/home/top-creators
Response: {
  items: Array<{
    id: string;
    name: string;
    avatar_url: string;
    representative_work: string;
  }>;
}

// 获取平台统计数据 [领域模型: 聚合统计] [对应页面功能: 平台统计数据展示]
GET /api/home/statistics
Response: {
  material_count: number;
  script_count: number;
  creator_count: number;
}
```

#### 影音素材库 相关

**页面路径**: /materials

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 素材列表分页查询 | API | GET /api/materials |
| 多级筛选素材 | API | GET /api/materials |
| 关键词搜索素材 | API | GET /api/materials/search |
| 获取筛选维度选项 | API | GET /api/materials/filters |

**所需 API**:
```typescript
// 分页查询素材列表，支持分类、筛选参数 [领域模型: Material] [对应页面功能: 素材列表分页查询、多级筛选素材]
GET /api/materials?type=xxx&resolution=xxx&durationMin=xxx&durationMax=xxx&tags=xxx&page=1&pageSize=20
Response: {
  items: Array<{
    id: string;
    title: string;
    type: string;
    resolution: string;
    duration: number;
    cover_url: string;
    preview_url: string;
    tags: string[];
  }>;
  total: number;
}

// 关键词搜索素材 [领域模型: Material] [对应页面功能: 关键词搜索素材]
GET /api/materials/search?keyword=xxx&page=1&pageSize=10
Response: {
  items: Array<{
    id: string;
    title: string;
    cover_url: string;
  }>;
  total: number;
}

// 获取筛选维度选项列表 [领域模型: 聚合统计] [对应页面功能: 获取筛选维度选项]
GET /api/materials/filters
Response: {
  resolutions: string[];
  durations: Array<{label: string, min: number, max: number}>;
  tags: string[];
}
```

#### 素材详情页 相关

**页面路径**: /materials/:id

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取素材详细信息 | API | GET /api/materials/:id |
| 下载高清素材文件 | API | GET /api/materials/:id/download |
| 一键收藏素材 | API | POST /api/user/materials/favorite |
| 获取相关素材推荐 | API | GET /api/materials/:id/related |

**所需 API**:
```typescript
// 获取素材详细信息 [领域模型: Material] [对应页面功能: 获取素材详细信息]
GET /api/materials/:id
Response: {
  id: string;
  title: string;
  description: string;
  type: string;
  resolution: string;
  duration: number;
  format: string;
  file_size: number;
  device: string;
  tags: string[];
  preview_url: string;
  cover_url: string;
}

// 获取素材下载地址 [领域模型: Material] [对应页面功能: 下载高清素材文件]
GET /api/materials/:id/download
Response: {
  download_url: string;
}

// 收藏/取消收藏素材 [领域模型: UserMaterial] [对应页面功能: 一键收藏素材]
POST /api/user/materials/favorite
Request Body: {
  material_id: string;
  category_id?: string;
  action: 'add' | 'remove';
}
Response: {
  success: boolean;
}

// 获取相关素材列表 [领域模型: Material] [对应页面功能: 获取相关素材推荐]
GET /api/materials/:id/related?page=1&pageSize=8
Response: {
  items: Array<{
    id: string;
    title: string;
    cover_url: string;
    duration: number;
  }>;
}
```

#### 素材上传页 相关

**页面路径**: /materials/upload

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 文件上传至平台存储 | 平台能力 | 内置文件服务 |
| 创建素材记录 | API | POST /api/materials |
| 获取上传预签名地址 | API | GET /api/materials/upload-signature |

**所需 API**:
```typescript
// 获取文件上传预签名地址 [领域模型: Material] [对应页面功能: 文件上传至平台存储]
GET /api/materials/upload-signature?filename=xxx&file_type=xxx
Response: {
  upload_url: string;
  file_id: string;
}

// 创建素材记录 [领域模型: Material] [对应页面功能: 创建素材记录]
POST /api/materials
Request Body: {
  title: string;
  description: string;
  type: string;
  resolution: string;
  duration: number;
  format: string;
  file_size: number;
  device?: string;
  tags: string[];
  preview_url: string;
  download_url: string;
  cover_url: string;
}
Response: {
  id: string;
}
```

#### 个人中心-素材管理 相关

**页面路径**: /account/materials

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取我的上传素材列表 | API | GET /api/user/materials/upload |
| 获取我的收藏素材列表 | API | GET /api/user/materials/favorite |
| 获取我的下载历史列表 | API | GET /api/user/materials/download |
| 管理收藏分类 | API | POST /api/user/favorite-categories |
| 删除已上传素材 | API | DELETE /api/materials/:id |

**所需 API**:
```typescript
// 获取我的上传素材列表 [领域模型: UserMaterial] [对应页面功能: 获取我的上传素材列表]
GET /api/user/materials/upload?page=1&pageSize=20
Response: {
  items: Array<{
    id: string;
    material_id: string;
    title: string;
    cover_url: string;
    created_at: string;
  }>;
  total: number;
}

// 获取我的收藏素材列表 [领域模型: UserMaterial] [对应页面功能: 获取我的收藏素材列表]
GET /api/user/materials/favorite?category_id=xxx&page=1&pageSize=20
Response: {
  items: Array<{
    id: string;
    material_id: string;
    title: string;
    cover_url: string;
    category_name: string;
    created_at: string;
  }>;
  total: number;
}

// 获取我的下载历史列表 [领域模型: UserMaterial] [对应页面功能: 获取我的下载历史列表]
GET /api/user/materials/download?page=1&pageSize=20
Response: {
  items: Array<{
    id: string;
    material_id: string;
    title: string;
    format: string;
    file_size: number;
    download_url: string;
    created_at: string;
  }>;
  total: number;
}

// 管理收藏分类（新增/重命名/删除） [领域模型: FavoriteCategory] [对应页面功能: 管理收藏分类]
POST /api/user/favorite-categories
Request Body: {
  action: 'create' | 'update' | 'delete';
  id?: string;
  name?: string;
}
Response: {
  success: boolean;
}

// 删除已上传素材 [领域模型: Material] [对应页面功能: 删除已上传素材]
DELETE /api/materials/:id
Response: {
  success: boolean;
}
```

#### 剧本项目列表 相关

**页面路径**: /scripts

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取我的剧本项目列表 | API | GET /api/script-projects |
| 创建新项目 | API | POST /api/script-projects |
| 搜索项目 | API | GET /api/script-projects/search |

**所需 API**:
```typescript
// 获取我的剧本项目列表 [领域模型: ScriptProject] [对应页面功能: 获取我的剧本项目列表]
GET /api/script-projects?sort=updateTime&page=1&pageSize=12
Response: {
  items: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
    cover_url: string;
    collaborator_count: number;
    updated_at: string;
  }>;
  total: number;
}

// 创建新剧本项目 [领域模型: ScriptProject] [对应页面功能: 创建新项目]
POST /api/script-projects
Request Body: {
  title: string;
  type: string;
  description: string;
  cover_url?: string;
}
Response: {
  id: string;
}

// 搜索剧本项目 [领域模型: ScriptProject] [对应页面功能: 搜索项目]
GET /api/script-projects/search?keyword=xxx&page=1&pageSize=10
Response: {
  items: Array<{
    id: string;
    title: string;
    cover_url: string;
    updated_at: string;
  }>;
  total: number;
}
```

#### 剧本编辑器 相关

**页面路径**: /scripts/:id

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取剧本项目信息 | API | GET /api/script-projects/:id |
| 获取剧本最新内容 | API | GET /api/script-projects/:id/content/latest |
| 保存剧本内容 | API | POST /api/script-projects/:id/content |
| 获取分场大纲 | API | GET /api/script-projects/:id/outline |
| 获取批注列表 | API | GET /api/script-projects/:id/comments |
| 添加批注 | API | POST /api/script-projects/:id/comments |
| 获取版本历史 | API | GET /api/script-projects/:id/versions |
| 回退版本 | API | POST /api/script-projects/:id/versions/revert |
| 获取角色戏份分析 | API | GET /api/script-projects/:id/analysis/roles |
| 邀请协作者 | API | POST /api/script-projects/:id/collaborators |
| 获取当前用户信息 | 平台能力 | 内置用户系统 |

**所需 API**:
```typescript
// 获取剧本项目基础信息 [领域模型: ScriptProject] [对应页面功能: 获取剧本项目信息]
GET /api/script-projects/:id
Response: {
  id: string;
  title: string;
  type: string;
  description: string;
  cover_url: string;
  collaborators: Array<{
    id: string;
    name: string;
    avatar_url: string;
  }>;
}

// 获取剧本最新内容 [领域模型: ScriptContent] [对应页面功能: 获取剧本最新内容]
GET /api/script-projects/:id/content/latest
Response: {
  id: string;
  content: string;
  version: string;
  word_count: number;
  page_count: number;
  scene_count: number;
}

// 保存剧本内容 [领域模型: ScriptContent] [对应页面功能: 保存剧本内容]
POST /api/script-projects/:id/content
Request Body: {
  content: string;
  snapshot_summary?: string;
}
Response: {
  version: string;
}

// 获取分场大纲 [领域模型: 聚合统计] [对应页面功能: 获取分场大纲]
GET /api/script-projects/:id/outline
Response: {
  items: Array<{
    index: number;
    scene_header: string;
    duration: number;
    position: number;
  }>;
}

// 获取批注列表 [领域模型: ScriptComment] [对应页面功能: 获取批注列表]
GET /api/script-projects/:id/comments
Response: {
  items: Array<{
    id: string;
    position: number;
    comment: string;
    author_name: string;
    author_avatar: string;
    status: string;
    created_at: string;
  }>;
}

// 添加新批注 [领域模型: ScriptComment] [对应页面功能: 添加批注]
POST /api/script-projects/:id/comments
Request Body: {
  position: number;
  comment: string;
}
Response: {
  id: string;
}

// 获取版本历史列表 [领域模型: ScriptContent] [对应页面功能: 获取版本历史]
GET /api/script-projects/:id/versions?page=1&pageSize=20
Response: {
  items: Array<{
    id: string;
    version: string;
    snapshot_summary: string;
    author_name: string;
    created_at: string;
  }>;
  total: number;
}

// 回退到指定版本 [领域模型: ScriptContent] [对应页面功能: 回退版本]
POST /api/script-projects/:id/versions/revert
Request Body: {
  version_id: string;
}
Response: {
  new_version: string;
}

// 获取角色戏份分析数据 [领域模型: 聚合统计] [对应页面功能: 获取角色戏份分析]
GET /api/script-projects/:id/analysis/roles
Response: {
  items: Array<{
    role_name: string;
    scene_count: number;
    line_count: number;
    line_ratio: number;
  }>;
}

// 邀请协作者加入项目 [领域模型: ScriptProject] [对应页面功能: 邀请协作者]
POST /api/script-projects/:id/collaborators
Request Body: {
  user_id: string;
}
Response: {
  success: boolean;
}
```

#### 剧本导出中心 相关

**页面路径**: /scripts/:id/export

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 导出剧本为指定格式 | API | POST /api/script-projects/:id/export |

**所需 API**:
```typescript
// 导出剧本为指定格式 [领域模型: ScriptProject] [对应页面功能: 导出剧本为指定格式]
POST /api/script-projects/:id/export
Request Body: {
  format: 'pdf' | 'word' | 'fountain' | 'storyboard' | 'call-sheet';
  options: {
    include_scene_number?: boolean;
    include_character_list?: boolean;
    include_revision_marks?: boolean;
  };
}
Response: {
  download_url: string;
  filename: string;
}