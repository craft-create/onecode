import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  FileText,
  Users,
  Grid3X3,
  Bookmark,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { logger } from '@/compat/client-toolkit/logger';
import { UserDisplay } from '@/components/business-ui/user-display';
import FollowButton from '@/components/FollowButton';
import { toast } from 'sonner';
import {
  getFollowStatus,
  getFollowers,
  getFollowing,
} from '@client/src/api/follow';
import { getUserById, type PublicUser } from '@client/src/api/auth';
import { chatApi } from '@client/src/api';
import { getUserUploadsByUserId } from '@client/src/api/user-materials';
import { listProjects } from '@client/src/api/scripts';
import { Image } from '@client/src/components/ui/image';
import type { FollowUserItem } from '@shared/follow.interface';
import type { UserMaterialItem } from '@shared/material.interface';
import type { ScriptProjectItem } from '@shared/script.interface';
import { useAuth } from '@client/src/hooks/useAuth';

type TabKey = 'works' | 'favorites' | 'following' | 'followers';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'works', label: '作品', icon: <Grid3X3 className="w-4 h-4" /> },
  { key: 'favorites', label: '收藏', icon: <Bookmark className="w-4 h-4" /> },
  { key: 'following', label: '关注', icon: <Heart className="w-4 h-4" /> },
  { key: 'followers', label: '粉丝', icon: <Users className="w-4 h-4" /> },
];

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('works');

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [materialCount, setMaterialCount] = useState(0);
  const [scriptCount, setScriptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [profile, setProfile] = useState<PublicUser | null>(null);

  const [materials, setMaterials] = useState<UserMaterialItem[]>([]);
  const [scripts, setScripts] = useState<ScriptProjectItem[]>([]);
  const [followers, setFollowers] = useState<FollowUserItem[]>([]);
  const [following, setFollowing] = useState<FollowUserItem[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const buildUnknownProfile = useCallback((id: string): PublicUser => ({
    id,
    nickname: `未知用户 ${id}`,
    avatarUrl: null,
    createdAt: null,
  }), []);

  const isNotFoundError = useCallback((error: unknown): boolean => {
    return (error as { response?: { status?: number } })?.response?.status === 404;
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setProfileLoading(true);
    setProfileNotFound(false);
    try {
      const userInfo = await getUserById(userId);
      setProfile(userInfo);
      setProfileNotFound(false);
    } catch (err: unknown) {
      logger.error('获取用户资料失败:', err);
      if (isNotFoundError(err)) {
        setProfile(buildUnknownProfile(userId));
        setProfileNotFound(false);
      } else {
        setProfileNotFound(true);
        setProfile(null);
      }
    } finally {
      setProfileLoading(false);
    }
  }, [buildUnknownProfile, isNotFoundError, userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchStats = useCallback(async () => {
    if (!userId || !profile) return;
    setLoading(true);
    try {
      const [statusRes, uploadsRes, scriptsRes] = await Promise.all([
        getFollowStatus(userId),
        getUserUploadsByUserId({ userId, pageSize: 1 }),
        listProjects({ creatorId: userId, pageSize: 1 }),
      ]);
      setFollowerCount(statusRes.follower_count);
      setFollowingCount(statusRes.following_count);
      setMaterialCount(uploadsRes.total);
      setScriptCount(scriptsRes.total);
    } catch (err: unknown) {
      logger.error('获取用户统计失败:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, profile]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const fetchTabContent = useCallback(async () => {
    if (!userId || !profile) return;
    setTabLoading(true);
    try {
      switch (activeTab) {
        case 'works': {
          const [uploadsRes, scriptsRes] = await Promise.all([
            getUserUploadsByUserId({ userId, pageSize: 50 }),
            listProjects({ creatorId: userId, pageSize: 50 }),
          ]);
          setMaterials(uploadsRes.items);
          setScripts(scriptsRes.items);
          break;
        }
        case 'followers': {
          const res = await getFollowers(userId);
          setFollowers(res.items);
          break;
        }
        case 'following': {
          const res = await getFollowing(userId);
          setFollowing(res.items);
          break;
        }
        default:
          break;
      }
    } catch (err: unknown) {
      logger.error('获取标签页内容失败:', err);
    } finally {
      setTabLoading(false);
    }
  }, [userId, activeTab, profile]);

  useEffect(() => {
    fetchTabContent();
  }, [fetchTabContent]);

  const handleStartChat = useCallback(async () => {
    if (!user || !userId || user.userId === userId || startingChat) {
      return;
    }

    setStartingChat(true);
    try {
      try {
        const conversation = (await chatApi.createConversation({
          type: 'private',
          memberIds: [userId],
        })) as { id?: string };
        const conversationId = conversation?.id;
        if (!conversationId) {
          throw new Error('会话创建失败');
        }
        toast.success('已打开聊天');
        navigate(`/chat/${conversationId}`);
      } catch (createError: unknown) {
        logger.error('发起私聊失败，尝试发送聊天申请:', createError);
        try {
          await chatApi.createChatRequest({ toUserId: userId });
          toast.success('已发送聊天请求，等待对方同意');
        } catch (_error: unknown) {
          throw createError;
        }
      }
    } catch (err: unknown) {
      logger.error('发起聊天失败:', err);
      toast.error('发起聊天失败，请重试');
    } finally {
      setStartingChat(false);
    }
  }, [navigate, startingChat, user, userId]);

  if (!userId || profileNotFound) {
    return (
      <div className="min-h-screen bg-[hsl(228_15%_8%)] flex items-center justify-center">
        <p className="text-[hsl(220_10%_55%)]">用户不存在</p>
      </div>
    );
  }

  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen bg-[hsl(228_15%_8%)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const profileDisplay = [
    {
      user_id: profile.id,
      name: profile.nickname || '未知用户',
      avatar: profile.avatarUrl || '',
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(228_15%_8%)]">
      <div className="app-container-shell">
        {/* Profile header */}
        <div className="bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg p-6 mb-6">
          <div className="flex items-start gap-5">
            <UserDisplay value={profileDisplay} size="large" showLabel={false} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <UserDisplay value={profileDisplay} size="large" />
                  <p className="text-sm text-[hsl(220_10%_55%)] mt-1">
                    影视创作者
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {user && user.userId !== userId && (
                    <button
                      type="button"
                      onClick={handleStartChat}
                      disabled={startingChat}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        startingChat
                          ? 'bg-primary/40 text-primary-foreground border border-primary/30'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90 border border-primary'
                      }`}
                    >
                      {startingChat ? (
                        <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      ) : (
                        <MessageCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{startingChat ? '处理中...' : '发起聊天'}</span>
                    </button>
                  )}
                  <FollowButton userId={userId} className="ml-1" />
                </div>
              </div>

              {/* Stats */}
              {loading ? (
                <div className="flex gap-8 mt-5">
                  {Array.from({ length: 4 }).map((_, i: number) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-6 w-12 bg-[hsl(228_12%_18%)] rounded mb-1" />
                      <div className="h-3 w-10 bg-[hsl(228_12%_18%)] rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-8 mt-5">
                  <div className="text-center">
                    <p className="text-xl font-bold text-[hsl(220_15%_90%)] tabular-nums">
                      {materialCount}
                    </p>
                    <p className="text-xs text-[hsl(220_10%_55%)]">素材</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-[hsl(220_15%_90%)] tabular-nums">
                      {scriptCount}
                    </p>
                    <p className="text-xs text-[hsl(220_10%_55%)]">剧本</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-[hsl(220_15%_90%)] tabular-nums">
                      {followerCount}
                    </p>
                    <p className="text-xs text-[hsl(220_10%_55%)]">粉丝</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-[hsl(220_15%_90%)] tabular-nums">
                      {followingCount}
                    </p>
                    <p className="text-xs text-[hsl(220_10%_55%)]">关注</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[hsl(228_12%_18%)]">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)]'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tabLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i: number) => (
              <div
                key={i}
                className="rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] animate-pulse h-48"
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Works tab */}
              {activeTab === 'works' && (
                <div className="space-y-8">
                  {/* Materials */}
                  {materials.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[hsl(220_15%_90%)] mb-3 flex items-center gap-2">
                        <Film className="w-4 h-4 text-[hsl(220_10%_55%)]" />
                        上传的素材
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materials.map((item: UserMaterialItem) => (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() =>
                              navigate(`/materials/${item.material_id}`)
                            }
                            className="cursor-pointer rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] overflow-hidden hover:border-primary/30 transition-all"
                          >
                            <div className="aspect-video bg-gradient-to-br from-[hsl(228_14%_18%)] to-[hsl(228_14%_8%)] flex items-center justify-center">
                              {item.cover_url ? (
                                <Image
                                  src={item.cover_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Film className="w-8 h-8 text-[hsl(220_10%_30%)]" />
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-sm text-[hsl(220_15%_90%)] truncate">
                                {item.title}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scripts */}
                  {scripts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[hsl(220_15%_90%)] mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[hsl(220_10%_55%)]" />
                        创建的剧本
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {scripts.map((item: ScriptProjectItem) => (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => navigate(`/scripts/${item.id}`)}
                            className="cursor-pointer rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] overflow-hidden hover:border-primary/30 transition-all"
                          >
                            <div className="aspect-video bg-gradient-to-br from-[hsl(228_14%_18%)] to-[hsl(228_14%_8%)] flex items-center justify-center">
                              {item.cover_url ? (
                                <Image
                                  src={item.cover_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileText className="w-8 h-8 text-[hsl(220_10%_30%)]" />
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-sm text-[hsl(220_15%_90%)] truncate">
                                {item.title}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {materials.length === 0 && scripts.length === 0 && (
                    <div className="text-center py-16">
                      <Grid3X3 className="w-12 h-12 text-[hsl(220_10%_30%)] mx-auto mb-3" />
                      <p className="text-[hsl(220_10%_55%)] text-sm">
                        暂无作品
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Favorites tab */}
              {activeTab === 'favorites' && (
                <div className="text-center py-16">
                  <Bookmark className="w-12 h-12 text-[hsl(220_10%_30%)] mx-auto mb-3" />
                  <p className="text-[hsl(220_10%_55%)] text-sm">
                    收藏内容仅自己可见
                  </p>
                </div>
              )}

              {/* Following tab */}
              {activeTab === 'following' && (
                <div>
                  {following.length === 0 ? (
                    <div className="text-center py-16">
                      <Heart className="w-12 h-12 text-[hsl(220_10%_30%)] mx-auto mb-3" />
                      <p className="text-[hsl(220_10%_55%)] text-sm">
                        暂无关注
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {following.map((user: FollowUserItem) => (
                        <div
                          key={user.user_id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] hover:border-primary/30 transition-all cursor-pointer"
                          onClick={() =>
                            navigate(`/user/${user.user_id}`)
                          }
                        >
                          <UserDisplay
                            value={[{
                              user_id: user.user_id,
                              name: user.name,
                              avatar: user.avatar_url,
                            }]}
                            size="medium"
                            showLabel={false}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[hsl(220_15%_90%)] truncate">
                              {user.name}
                            </p>
                          </div>
                          <FollowButton userId={user.user_id} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Followers tab */}
              {activeTab === 'followers' && (
                <div>
                  {followers.length === 0 ? (
                    <div className="text-center py-16">
                      <Users className="w-12 h-12 text-[hsl(220_10%_30%)] mx-auto mb-3" />
                      <p className="text-[hsl(220_10%_55%)] text-sm">
                        暂无粉丝
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {followers.map((user: FollowUserItem) => (
                        <div
                          key={user.user_id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] hover:border-primary/30 transition-all cursor-pointer"
                          onClick={() =>
                            navigate(`/user/${user.user_id}`)
                          }
                        >
                          <UserDisplay
                            value={[{
                              user_id: user.user_id,
                              name: user.name,
                              avatar: user.avatar_url,
                            }]}
                            size="medium"
                            showLabel={false}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[hsl(220_15%_90%)] truncate">
                              {user.name}
                            </p>
                          </div>
                          <FollowButton userId={user.user_id} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
