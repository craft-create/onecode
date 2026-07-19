/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { bigint, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const userFollow = pgTable("user_follow", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: userProfile("follower_id").notNull(),
  followingId: userProfile("following_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  // Complex index: CREATE UNIQUE INDEX uq_user_follow ON user_follow USING btree (((follower_id).user_id), ((following_id).user_id)),
]);

export const favoriteFolderItem = pgTable("favorite_folder_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  folderId: uuid("folder_id").notNull(),
  materialId: uuid("material_id"),
  projectId: uuid("project_id"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const favoriteFolder = pgTable("favorite_folder", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: userProfile("user_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const commentLike = pgTable("comment_like", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").notNull().unique(),
  userId: userProfile("user_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uq_comment_like").on(table.commentId, table.userId),
]);

export const scriptLike = pgTable("script_like", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().unique(),
  userId: userProfile("user_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uq_script_like").on(table.projectId, table.userId),
]);

export const materialLike = pgTable("material_like", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialId: uuid("material_id").notNull().unique(),
  userId: userProfile("user_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uq_material_like").on(table.materialId, table.userId),
]);

export const materialComment = pgTable("material_comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialId: uuid("material_id").notNull(),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  author: userProfile("author").notNull(),
  likeCount: integer("like_count").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const scriptComment = pgTable("script_comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  contentId: uuid("content_id"),
  position: integer("position").notNull().default(0),
  comment: text("comment").notNull(),
  author: userProfile("author").notNull(),
  status: varchar("status", { length: 50 }).notNull().default('open'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const scriptContent = pgTable("script_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  content: text("content").notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  snapshotSummary: varchar("snapshot_summary", { length: 500 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const scriptProject = pgTable("script_project", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }),
  description: text("description"),
  coverUrl: text("cover_url"),
  collaborators: userProfileArray("collaborators").default(sql`'{}'::user_profile[]`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const userMaterial = pgTable("user_material", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialId: uuid("material_id").notNull(),
  userId: userProfile("user_id").notNull(),
  relationType: varchar("relation_type", { length: 50 }).notNull(),
  categoryId: uuid("category_id"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const favoriteCategory = pgTable("favorite_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: userProfile("user_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const material = pgTable("material", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  resolution: varchar("resolution", { length: 100 }),
  duration: integer("duration"),
  format: varchar("format", { length: 100 }),
  fileSize: bigint("file_size", { mode: 'number' }),
  device: varchar("device", { length: 255 }),
  tags: varchar("tags", { length: 255 }).array().default([]),
  previewUrl: text("preview_url"),
  downloadUrl: text("download_url"),
  coverUrl: text("cover_url"),
  downloadCount: integer("download_count").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

// table aliases
export const commentLikeTable = commentLike;
export const favoriteCategoryTable = favoriteCategory;
export const favoriteFolderTable = favoriteFolder;
export const favoriteFolderItemTable = favoriteFolderItem;
export const materialTable = material;
export const materialCommentTable = materialComment;
export const materialLikeTable = materialLike;
export const scriptCommentTable = scriptComment;
export const scriptContentTable = scriptContent;
export const scriptLikeTable = scriptLike;
export const scriptProjectTable = scriptProject;
export const userFollowTable = userFollow;
export const userMaterialTable = userMaterial;

// =============================================
// 通知系统
// =============================================
export const notification = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(), // 接收通知的用户
  type: varchar("type", { length: 50 }).notNull(), // like, favorite, comment, follow, system, message
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  sourceType: varchar("source_type", { length: 50 }), // material, script, user, comment
  sourceId: uuid("source_id"),
  fromUserId: userProfile("from_user_id"), // 触发通知的用户
  isRead: integer("is_read").notNull().default(0), // 0: unread, 1: read
  metadata: text("metadata"), // JSON格式，存储额外信息
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_notification_user").on(table.userId),
  index("idx_notification_is_read").on(table.isRead),
  index("idx_notification_created_at").on(table.createdAt),
]);

// =============================================
// 私信聊天系统
// =============================================
export const conversation = pgTable("conversation", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }), // 群聊标题，私聊为null
  type: varchar("type", { length: 50 }).notNull().default('private'), // private, group
  lastMessageId: uuid("last_message_id"),
  lastMessageAt: customTimestamptz("last_message_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const conversationMember = pgTable("conversation_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull(),
  userId: userProfile("user_id").notNull(),
  role: varchar("role", { length: 50 }).notNull().default('member'), // owner, admin, member
  lastReadMessageId: uuid("last_read_message_id"),
  unreadCount: integer("unread_count").notNull().default(0),
  isMuted: integer("is_muted").notNull().default(0), // 0: not muted, 1: muted
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_conversation_member_conversation").on(table.conversationId),
  index("idx_conversation_member_user").on(table.userId),
  uniqueIndex("uq_conversation_member").on(table.conversationId, table.userId),
]);

export const message = pgTable("message", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull(),
  senderId: userProfile("sender_id").notNull(),
  content: text("content"),
  type: varchar("type", { length: 50 }).notNull().default('text'), // text, image, file, system
  attachments: text("attachments"), // JSON格式，存储文件附件信息
  replyToMessageId: uuid("reply_to_message_id"), // 回复的消息ID
  mentions: text("mentions"), // JSON格式，@提及的用户ID列表
  isEdited: integer("is_edited").notNull().default(0), // 0: not edited, 1: edited
  isDeleted: integer("is_deleted").notNull().default(0), // 0: not deleted, 1: deleted
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_message_conversation").on(table.conversationId),
  index("idx_message_sender").on(table.senderId),
  index("idx_message_created_at").on(table.createdAt),
]);

// =============================================
// 内容版本管理
// =============================================
export const materialVersion = pgTable("material_version", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialId: uuid("material_id").notNull(),
  version: varchar("version", { length: 50 }).notNull(), // 版本号，如 1.0.0
  changeLog: text("change_log"), // 变更说明
  fileUrl: text("file_url"),
  coverUrl: text("cover_url"),
  fileSize: bigint("file_size", { mode: 'number' }),
  createdBy: userProfile("created_by").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_material_version_material").on(table.materialId),
  uniqueIndex("uq_material_version").on(table.materialId, table.version),
]);

export const scriptVersion = pgTable("script_version", {
  id: uuid("id").primaryKey().defaultRandom(),
  scriptId: uuid("script_id").notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  changeLog: text("change_log"),
  snapshotSummary: varchar("snapshot_summary", { length: 500 }),
  createdBy: userProfile("created_by").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_script_version_script").on(table.scriptId),
  uniqueIndex("uq_script_version").on(table.scriptId, table.version),
]);

// =============================================
// 团队协作系统
// =============================================
export const team = pgTable("team", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logo: text("logo"),
  ownerId: userProfile("owner_id").notNull(),
  memberCount: integer("member_count").notNull().default(1),
  isPublic: integer("is_public").notNull().default(0), // 0: private, 1: public
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const teamMember = pgTable("team_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull(),
  userId: userProfile("user_id").notNull(),
  role: varchar("role", { length: 50 }).notNull().default('member'), // owner, admin, editor, viewer
  permissions: text("permissions"), // JSON格式，存储自定义权限
  joinedAt: customTimestamptz("joined_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("uq_team_member").on(table.teamId, table.userId),
  index("idx_team_member_team").on(table.teamId),
  index("idx_team_member_user").on(table.userId),
]);

export const teamResource = pgTable("team_resource", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // material, script, folder
  resourceId: uuid("resource_id").notNull(),
  permission: varchar("permission", { length: 50 }).notNull().default('view'), // view, edit, admin
  sharedBy: userProfile("shared_by").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_team_resource_team").on(table.teamId),
  uniqueIndex("uq_team_resource").on(table.teamId, table.resourceType, table.resourceId),
]);

// =============================================
// 项目工作台
// =============================================
export const project = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  status: varchar("status", { length: 50 }).notNull().default('active'), // planning, active, completed, archived
  priority: varchar("priority", { length: 50 }).notNull().default('medium'), // low, medium, high, urgent
  startDate: customTimestamptz("start_date", { precision: 3 }),
  endDate: customTimestamptz("end_date", { precision: 3 }),
  ownerId: userProfile("owner_id").notNull(),
  teamId: uuid("team_id"),
  tags: varchar("tags", { length: 255 }).array().default([]),
  progress: integer("progress").notNull().default(0), // 0-100
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_project_owner").on(table.ownerId),
  index("idx_project_team").on(table.teamId),
  index("idx_project_status").on(table.status),
]);

export const projectMember = pgTable("project_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  userId: userProfile("user_id").notNull(),
  role: varchar("role", { length: 50 }).notNull().default('member'), // owner, admin, member, viewer
  joinedAt: customTimestamptz("joined_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("uq_project_member").on(table.projectId, table.userId),
]);

export const projectTask = pgTable("project_task", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default('todo'), // todo, in_progress, review, done
  priority: varchar("priority", { length: 50 }).notNull().default('medium'), // low, medium, high, urgent
  assigneeId: userProfile("assignee_id"),
  reporterId: userProfile("reporter_id").notNull(),
  dueDate: customTimestamptz("due_date", { precision: 3 }),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  tags: varchar("tags", { length: 255 }).array().default([]),
  attachments: text("attachments"), // JSON格式
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_project_task_project").on(table.projectId),
  index("idx_project_task_assignee").on(table.assigneeId),
  index("idx_project_task_status").on(table.status),
]);

export const projectComment = pgTable("project_comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  taskId: uuid("task_id"),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  author: userProfile("author").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

// =============================================
// 付费内容与交易系统
// =============================================
export const paidContent = pgTable("paid_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // material, script
  resourceId: uuid("resource_id").notNull(),
  price: integer("price").notNull().default(0), // 价格（分）
  currency: varchar("currency", { length: 10 }).notNull().default('CNY'),
  salesCount: integer("sales_count").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // 总收入（分）
  licenseType: varchar("license_type", { length: 50 }).notNull().default('standard'), // standard, extended, exclusive
  isActive: integer("is_active").notNull().default(1),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("uq_paid_content_resource").on(table.resourceType, table.resourceId),
]);

export const purchase = pgTable("purchase", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  resourceId: uuid("resource_id").notNull(),
  paidContentId: uuid("paid_content_id").notNull(),
  amount: integer("amount").notNull(), // 支付金额（分）
  currency: varchar("currency", { length: 10 }).notNull().default('CNY'),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, completed, failed, refunded
  paymentMethod: varchar("payment_method", { length: 50 }), // alipay, wechat, stripe
  transactionId: varchar("transaction_id", { length: 255 }),
  purchasedAt: customTimestamptz("purchased_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_purchase_user").on(table.userId),
  index("idx_purchase_status").on(table.status),
]);

export const tip = pgTable("tip", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromUserId: userProfile("from_user_id").notNull(),
  toUserId: userProfile("to_user_id").notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: uuid("resource_id"),
  amount: integer("amount").notNull(), // 打赏金额（分）
  currency: varchar("currency", { length: 10 }).notNull().default('CNY'),
  message: text("message"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_tip_from_user").on(table.fromUserId),
  index("idx_tip_to_user").on(table.toUserId),
]);

// =============================================
// 需求大厅与订单系统
// =============================================
export const requirement = pgTable("requirement", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // material, script, production
  budget: integer("budget"), // 预算（分）
  currency: varchar("currency", { length: 10 }).notNull().default('CNY'),
  status: varchar("status", { length: 50 }).notNull().default('open'), // open, in_progress, completed, cancelled
  publisherId: userProfile("publisher_id").notNull(),
  assignedTo: userProfile("assigned_to"),
  deadline: customTimestamptz("deadline", { precision: 3 }),
  attachments: text("attachments"), // JSON格式
  views: integer("views").notNull().default(0),
  applications: integer("applications").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_requirement_publisher").on(table.publisherId),
  index("idx_requirement_status").on(table.status),
  index("idx_requirement_type").on(table.type),
]);

export const requirementApplication = pgTable("requirement_application", {
  id: uuid("id").primaryKey().defaultRandom(),
  requirementId: uuid("requirement_id").notNull(),
  applicantId: userProfile("applicant_id").notNull(),
  proposal: text("proposal").notNull(),
  quote: integer("quote"), // 报价（分）
  estimatedDays: integer("estimated_days"),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, accepted, rejected, withdrawn
  message: text("message"), // 申请留言
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_requirement_application_req").on(table.requirementId),
  index("idx_requirement_application_applicant").on(table.applicantId),
  uniqueIndex("uq_requirement_application").on(table.requirementId, table.applicantId),
]);

export const order = pgTable("order", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNo: varchar("order_no", { length: 100 }).notNull().unique(),
  buyerId: userProfile("buyer_id").notNull(),
  sellerId: userProfile("seller_id").notNull(),
  requirementId: uuid("requirement_id"),
  type: varchar("type", { length: 50 }).notNull(), // purchase, requirement, custom
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, confirmed, in_progress, completed, cancelled, disputed
  totalAmount: integer("total_amount").notNull(), // 总金额（分）
  platformFee: integer("platform_fee").notNull().default(0), // 平台手续费（分）
  sellerAmount: integer("seller_amount").notNull(), // 卖家实收（分）
  description: text("description"),
  attachments: text("attachments"), // JSON格式
  deliveryUrl: text("delivery_url"),
  deliveryNote: text("delivery_note"),
  deliveredAt: customTimestamptz("delivered_at", { precision: 3 }),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_order_buyer").on(table.buyerId),
  index("idx_order_seller").on(table.sellerId),
  index("idx_order_status").on(table.status),
]);

// =============================================
// 内容审核与举报
// =============================================
export const report = pgTable("report", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: userProfile("reporter_id").notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // material, script, comment, user, message
  resourceId: uuid("resource_id").notNull(),
  reason: varchar("reason", { length: 100 }).notNull(), // spam, inappropriate, copyright, fraud, other
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // pending, reviewing, resolved, rejected
  handlerId: userProfile("handler_id"),
  handleNote: text("handle_note"),
  handledAt: customTimestamptz("handled_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_report_resource").on(table.resourceType, table.resourceId),
  index("idx_report_status").on(table.status),
]);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // create, update, delete, review, ban
  resourceType: varchar("resource_type", { length: 50 }), // material, script, user, order
  resourceId: uuid("resource_id"),
  oldValue: text("old_value"), // JSON格式
  newValue: text("new_value"), // JSON格式
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_audit_log_user").on(table.userId),
  index("idx_audit_log_resource").on(table.resourceType, table.resourceId),
  index("idx_audit_log_action").on(table.action),
]);

// =============================================
// AI 功能记录
// =============================================
export const aiGeneration = pgTable("ai_generation", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // script_outline, tag_suggestion, content_recommendation, script_score
  input: text("input").notNull(), // JSON格式，输入参数
  output: text("output"), // JSON格式，AI输出结果
  model: varchar("model", { length: 100 }), // 使用的AI模型
  tokensUsed: integer("tokens_used"), // 消耗的token数
  processingTime: integer("processing_time"), // 处理时间（毫秒）
  isSuccess: integer("is_success").notNull().default(1), // 0: failed, 1: success
  errorMessage: text("error_message"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_ai_generation_user").on(table.userId),
  index("idx_ai_generation_type").on(table.type),
]);

// =============================================
// 用户设置与偏好
// =============================================
export const userSetting = pgTable("user_setting", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull().unique(),
  theme: varchar("theme", { length: 50 }).notNull().default('light'), // light, dark, system
  language: varchar("language", { length: 50 }).notNull().default('zh-CN'),
  timezone: varchar("timezone", { length: 100 }).default('Asia/Shanghai'),
  emailNotifications: integer("email_notifications").notNull().default(1),
  pushNotifications: integer("push_notifications").notNull().default(1),
  notificationTypes: text("notification_types"), // JSON格式，要接收的通知类型列表
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// =============================================
// 用户行为分析
// =============================================
export const userBehavior = pgTable("user_behavior", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id"),
  sessionId: varchar("session_id", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(), // view, click, download, like, favorite, share, search
  resourceType: varchar("resource_type", { length: 50 }), // material, script, user
  resourceId: uuid("resource_id"),
  duration: integer("duration"), // 停留时长（秒）
  metadata: text("metadata"), // JSON格式，额外数据
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_user_behavior_user").on(table.userId),
  index("idx_user_behavior_action").on(table.action),
  index("idx_user_behavior_resource").on(table.resourceType, table.resourceId),
  index("idx_user_behavior_created_at").on(table.createdAt),
]);

// =============================================
// 内容统计
// =============================================
export const contentStat = pgTable("content_stat", {
  id: uuid("id").primaryKey().defaultRandom(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // material, script
  resourceId: uuid("resource_id").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  favorites: integer("favorites").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("uq_content_stat").on(table.resourceType, table.resourceId, table.date),
  index("idx_content_stat_date").on(table.date),
]);

// =============================================
// 分享记录
// =============================================
export const shareRecord = pgTable("share_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id"),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  resourceId: uuid("resource_id").notNull(),
  platform: varchar("platform", { length: 50 }), // wechat, weibo, qq, copy_link, qr_code
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_share_record_resource").on(table.resourceType, table.resourceId),
  index("idx_share_record_platform").on(table.platform),
]);

// =============================================
// 标签管理
// =============================================
export const tag = pgTable("tag", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(), // material, script, general
  usageCount: integer("usage_count").notNull().default(0),
  isOfficial: integer("is_official").notNull().default(0), // 0: user tag, 1: official tag
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_tag_type").on(table.type),
  index("idx_tag_usage").on(table.usageCount),
]);

// =============================================
// 素材分类
// =============================================
export const materialCategory = pgTable("material_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: uuid("parent_id"),
  icon: varchar("icon", { length: 100 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_material_category_parent").on(table.parentId),
]);

// =============================================
// 剧本模板
// =============================================
export const scriptTemplate = pgTable("script_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  category: varchar("category", { length: 100 }),
  tags: varchar("tags", { length: 255 }).array().default([]),
  structure: text("structure"), // JSON格式，模板结构定义
  preview: text("preview"), // 预览内容
  authorId: userProfile("author_id"),
  usageCount: integer("usage_count").notNull().default(0),
  rating: integer("rating").notNull().default(0), // 评分 1-5
  isPremium: integer("is_premium").notNull().default(0), // 0: free, 1: premium
  price: integer("price").notNull().default(0), // 价格（分）
  isOfficial: integer("is_official").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_script_template_category").on(table.category),
  index("idx_script_template_author").on(table.authorId),
  index("idx_script_template_usage").on(table.usageCount),
]);

export const scriptTemplateComment = pgTable("script_template_comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").notNull(),
  userId: userProfile("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  content: text("content"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_template_comment_template").on(table.templateId),
  uniqueIndex("uq_template_comment").on(table.templateId, table.userId),
]);

// =============================================
// 性能监控
// =============================================
export const performanceMetric = pgTable("performance_metric", {
  id: uuid("id").primaryKey().defaultRandom(),
  page: varchar("page", { length: 255 }).notNull(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // fcp, lcp, fid, cls, ttfb
  value: integer("value").notNull(), // 毫秒
  deviceType: varchar("device_type", { length: 50 }), // mobile, desktop, tablet
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  connectionType: varchar("connection_type", { length: 50 }),
  userId: userProfile("user_id"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_performance_metric_page").on(table.page),
  index("idx_performance_metric_created_at").on(table.createdAt),
]);

// =============================================
// 文件管理系统
// =============================================
export const fileFolder = pgTable("file_folder", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: uuid("parent_id"), // null for root folders
  color: varchar("color", { length: 50 }).default('#3b82f6'),
  icon: varchar("icon", { length: 50 }),
  isStarred: integer("is_starred").notNull().default(0),
  itemCount: integer("item_count").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_file_folder_user").on(table.userId),
  index("idx_file_folder_parent").on(table.parentId),
]);

export const fileItem = pgTable("file_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  folderId: uuid("folder_id"),
  name: varchar("name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull(), // file, folder
  mimeType: varchar("mime_type", { length: 100 }),
  size: bigint("size", { mode: 'number' }),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  description: text("description"),
  tags: varchar("tags", { length: 255 }).array().default([]),
  isStarred: integer("is_starred").notNull().default(0),
  isShared: integer("is_shared").notNull().default(0),
  shareToken: varchar("share_token", { length: 100 }).unique(),
  shareExpiresAt: timestamp('share_expires_at', { withTimezone: true }),
  downloadCount: integer("download_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_file_item_user").on(table.userId),
  index("idx_file_item_folder").on(table.folderId),
  index("idx_file_item_shared").on(table.isShared),
  index("idx_file_item_share_token").on(table.shareToken),
]);

export const fileShare = pgTable("file_share", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileId: uuid("file_id").notNull(),
  userId: uuid("user_id").notNull(),
  shareToken: varchar("share_token", { length: 100 }).unique().notNull(),
  password: varchar("password", { length: 255 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  maxDownloads: integer("max_downloads"),
  downloadCount: integer("download_count").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_file_share_token").on(table.shareToken),
  index("idx_file_share_user").on(table.userId),
]);

export const fileRecycleBin = pgTable("file_recycle_bin", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  fileId: uuid("file_id"),
  folderId: uuid("folder_id"),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // file, folder
  size: bigint("size", { mode: 'number' }),
  deletedAt: customTimestamptz("deleted_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => [
  index("idx_recycle_bin_user").on(table.userId),
  index("idx_recycle_bin_expires").on(table.expiresAt),
]);

// =============================================
// 素材分类表别名
// =============================================
export const materialCategoryTable = materialCategory;
export const tagTable = tag;
