export interface FollowStatusResponse {
  is_following: boolean;
  follower_count: number;
  following_count: number;
}

export interface FollowUserItem {
  /** 用户ID */
  user_id: string;
  /** 用户昵称 */
  name: string;
  /** 用户头像URL */
  avatar_url: string;
  /** 关注时间 */
  created_at: string;
  /** 是否正在关注 */
  is_following?: boolean;
}

export interface FollowListResponse {
  items: FollowUserItem[];
  total: number;
}
