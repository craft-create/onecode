CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profile') THEN
    CREATE TYPE user_profile AS (user_id text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_attachment') THEN
    CREATE TYPE file_attachment AS (bucket_id text, file_path text);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS local_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname varchar(100) UNIQUE NOT NULL,
  password_hash text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_follow (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id user_profile NOT NULL,
  following_id user_profile NOT NULL,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_follow
  ON user_follow (((follower_id).user_id), ((following_id).user_id));

CREATE TABLE IF NOT EXISTS favorite_folder (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(255) NOT NULL,
  user_id user_profile NOT NULL,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS favorite_folder_item (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid NOT NULL,
  material_id uuid,
  project_id uuid,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS favorite_category (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(255) NOT NULL,
  user_id user_profile NOT NULL,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS material (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255) NOT NULL,
  description text,
  type varchar(50) NOT NULL,
  resolution varchar(100),
  duration integer,
  format varchar(100),
  file_size bigint,
  device varchar(255),
  tags varchar(255)[] DEFAULT '{}',
  preview_url text,
  download_url text,
  cover_url text,
  download_count integer NOT NULL DEFAULT 0,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS material_comment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id uuid NOT NULL,
  parent_id uuid,
  content text NOT NULL,
  author user_profile NOT NULL,
  like_count integer NOT NULL DEFAULT 0,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS material_like (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id uuid NOT NULL UNIQUE,
  user_id user_profile NOT NULL,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_material_like ON material_like (material_id);

CREATE TABLE IF NOT EXISTS comment_like (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL UNIQUE,
  user_id user_profile NOT NULL,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_comment_like ON comment_like (comment_id);

CREATE TABLE IF NOT EXISTS script_project (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255) NOT NULL,
  type varchar(100),
  description text,
  cover_url text,
  collaborators user_profile[] DEFAULT '{}',
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS script_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  content text NOT NULL,
  version varchar(50) NOT NULL,
  snapshot_summary varchar(500),
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS script_comment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  content_id uuid,
  position integer NOT NULL DEFAULT 0,
  comment text NOT NULL,
  author user_profile NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'open',
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS script_like (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL UNIQUE,
  user_id user_profile NOT NULL,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_script_like ON script_like (project_id);

CREATE TABLE IF NOT EXISTS user_material (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id uuid NOT NULL,
  user_id user_profile NOT NULL,
  relation_type varchar(50) NOT NULL,
  category_id uuid,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);
-- 通知系统
CREATE TABLE IF NOT EXISTS notification (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id user_profile NOT NULL,
  type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  content text,
  source_type varchar(50),
  source_id uuid,
  from_user_id user_profile,
  is_read integer NOT NULL DEFAULT 0,
  metadata text,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON notification (((user_id).user_id));
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification (is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification (_created_at);
