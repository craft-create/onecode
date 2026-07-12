/**
 * 全局布局组件
 * 功能：提供整个应用的页面框架，包含顶部导航栏和页面内容区域
 * 包含：
 *   - 顶部导航栏（Logo、导航菜单、搜索框、上传按钮、用户菜单）
 *   - 移动端汉堡菜单
 *   - 路由切换进度条
 *   - 回到顶部按钮
 *   - 子路由内容渲染（Outlet）
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
// 平台Hook：获取应用信息
import { useAppInfo } from "@client/compat/client-toolkit/hooks/useAppInfo";
import { logger } from "@client/compat/client-toolkit/logger";
// 认证Hook + 登出API
import { useAuth } from "@client/src/hooks/useAuth";
import { logout } from "@client/src/api/auth";
// 图标组件
import {
  Film,
  User,
  Menu,
  X,
  Upload,
  LogOut,
  Settings,
  ChevronDown,
  Bell,
  MessageCircle,
  Users,
  FolderKanban,
  FileText,
  Briefcase,
  BarChart3,
  FolderOpen,
  Sparkles,
  Search,
  MoreHorizontal,
} from "lucide-react";
// 全局搜索组件
import GlobalSearch from "./GlobalSearch";
// 回到顶部按钮组件
import ScrollToTop from "./ScrollToTop";

/**
 * 导航菜单项配置
 * path: 路由路径
 * label: 菜单显示文字
 */
interface NavItem {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// 主导航项（显示在导航栏）
const primaryNavItems: NavItem[] = [
  { path: "/", label: "首页" },
  { path: "/materials", label: "素材库" },
  { path: "/scripts", label: "剧本" },
];

// 次要导航项（收纳在"更多"下拉菜单）
const secondaryNavItems: NavItem[] = [
  { path: "/templates", label: "模板市场" },
  { path: "/teams", label: "团队协作" },
  { path: "/projects", label: "项目工作台" },
  { path: "/requirements", label: "需求大厅" },
  { path: "/analytics", label: "数据中心" },
  { path: "/files", label: "文件管理", icon: FolderOpen },
];

/**
 * 布局主组件
 */
const Layout = () => {
  // ===== 状态定义 =====
  // 页面是否滚动（用于导航栏毛玻璃效果）
  const [scrolled, setScrolled] = useState(false);
  // 移动端菜单展开状态
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 用户下拉菜单展开状态
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // 更多导航下拉菜单
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  // 用户菜单 ref，用于点击外部关闭
  const userMenuRef = useRef<HTMLDivElement>(null);
  // 更多菜单 ref
  const moreMenuRef = useRef<HTMLDivElement>(null);
  // 应用名称（从平台获取）
  const { appName } = useAppInfo();
  // 当前路由位置
  const location = useLocation();
  // 路由导航
  const navigate = useNavigate();
  // 路由切换加载条状态
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  // 从 AuthContext 获取当前登录用户
  const { user, refreshUser } = useAuth();

  /**
   * 监听页面滚动，超过20px时导航栏添加毛玻璃背景
   * passive: true 提升滚动性能
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * 点击用户菜单外部时关闭下拉菜单
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    if (userMenuOpen || moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, moreMenuOpen]);

  /**
   * 路由变化时自动关闭移动端菜单
   */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /**
   * 路由切换时显示顶部进度条（模拟NProgress效果）
   * 400ms后自动消失，提供视觉反馈
   */
  useEffect(() => {
    setIsRouteChanging(true);
    const timer = setTimeout(() => {
      setIsRouteChanging(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  /**
   * 退出登录处理
   * 调用自定义auth登出接口，成功后刷新用户状态
   */
  const handleLogout = async () => {
    try {
      await logout();
      await refreshUser();
      setUserMenuOpen(false);
      navigate("/");
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      logger.error(`退出登录失败: ${msg}`);
    }
  };

  // 是否已登录
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== 顶部导航栏 ===== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        {/* 路由切换进度条 */}
        <AnimatePresence>
          {isRouteChanging && (
            <motion.div
              initial={{ width: "0%", opacity: 0 }}
              animate={{ width: "60%", opacity: 1 }}
              exit={{ width: "100%", opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute bottom-0 left-0 h-0.5 bg-primary z-50"
            />
          )}
        </AnimatePresence>

        {/* 导航栏内容容器 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* ===== 左侧：Logo + 核心导航 ===== */}
          <div className="flex items-center gap-6 lg:gap-8">
            {/* Logo区域 */}
            <NavLink to="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
              <Film className="w-6 h-6 text-primary" />
              <span className="hidden sm:inline">{appName || "光影工坊"}</span>
            </NavLink>

            {/* 核心导航菜单 */}
            <nav className="hidden lg:flex items-center gap-1">
              {primaryNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {/* 更多下拉菜单 */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    moreMenuOpen
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  更多
                </button>

                {/* 更多菜单下拉 */}
                <AnimatePresence>
                  {moreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] py-1.5 z-50"
                    >
                      {secondaryNavItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMoreMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                              isActive
                                ? 'text-primary bg-accent'
                                : 'text-foreground hover:bg-accent'
                            }`
                          }
                        >
                          {item.icon && <item.icon className="w-4 h-4 text-muted-foreground" />}
                          {item.label}
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
          </div>

          {/* ===== 中间：搜索框 ===== */}
          <div className="hidden md:block flex-1 max-w-md">
            <GlobalSearch />
          </div>

          {/* ===== 右侧：操作按钮 + 用户菜单 ===== */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 上传素材按钮 */}
            <NavLink
              to="/materials/upload"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-[0_0_12px_-2px_rgba(124_92_255_0.4)] hover:shadow-[0_0_16px_-2px_rgba(124_92_255_0.6)]"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden lg:inline">上传素材</span>
            </NavLink>

            {/* 用户菜单（已登录显示头像下拉，未登录显示登录按钮） */}
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                    userMenuOpen ? 'bg-accent' : 'hover:bg-accent'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 ring-1 ring-inset ring-primary/20 flex items-center justify-center overflow-hidden">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user?.nickname || '用户头像'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 用户下拉菜单 */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] py-1.5 z-50 overflow-hidden"
                    >
                      {/* 用户信息头部 */}
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user?.nickname}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">影视创作者</p>
                      </div>

                      {/* 菜单项 */}
                      <div className="py-1">
                        <NavLink
                          to="/notifications"
                          onClick={() => setUserMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                              isActive
                                ? 'text-primary bg-accent'
                                : 'text-foreground hover:bg-accent'
                            }`
                          }
                        >
                          <Bell className="w-4 h-4 text-muted-foreground" />
                          通知中心
                        </NavLink>
                        <NavLink
                          to="/chat"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 text-muted-foreground" />
                          私信
                        </NavLink>
                        <div className="border-t border-border my-1" />
                        <NavLink
                          to="/files"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                          文件管理
                        </NavLink>
                        <NavLink
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          账户设置
                        </NavLink>
                        <NavLink
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          个人主页
                        </NavLink>
                      </div>

                      {/* 分隔线 + 退出登录 */}
                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          退出登录
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_0_12px_-2px_rgba(124_92_255_0.4)]"
              >
                登录
              </NavLink>
            )}

            {/* 移动端菜单按钮 - 始终显示 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* ===== 移动端展开菜单 ===== */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-background border-b border-border overflow-hidden"
            >
              <nav className="px-4 py-4 space-y-2">
                {/* 核心导航 */}
                {primaryNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}

                {/* 次要导航 */}
                <div className="border-t border-border my-2 pt-2">
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">更多功能</p>
                  {secondaryNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>

                {/* 用户相关 */}
                {isLoggedIn && (
                  <div className="border-t border-border my-2 pt-2">
                    <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">个人中心</p>
                    <NavLink
                      to="/notifications"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      通知中心
                    </NavLink>
                    <NavLink
                      to="/chat"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      私信
                    </NavLink>
                    <NavLink
                      to="/files"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      文件管理
                    </NavLink>
                    <NavLink
                      to="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      账户设置
                    </NavLink>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-destructive hover:bg-accent transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ===== 页面主内容区域 ===== */}
      <main className="pt-16">
        {/* Outlet渲染子路由的内容 */}
        <Outlet />
      </main>

      {/* 回到顶部按钮 */}
      <ScrollToTop />
    </div>
  );
};

export default Layout;
