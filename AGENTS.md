# UI 设计指南

> **设计类型**: App 设计（应用架构设计）
> **确认检查**: 本指南适用于可交互的应用/网站/工具。

> ℹ️ Section 1 为设计意图与决策上下文。Code agent 实现时以 Section 2 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解

-   **目标用户**: 影视创作者（导演/编剧/剪辑师），在暗光环境下高频使用，追求沉浸感与专业度
-   **核心目的**: 高效管理素材资产 + 沉浸式剧本创作协作，兼顾灵感激发与工程严谨
-   **情绪基调**: 专注沉浸 / 精致流畅；避免刺眼眩光、廉价塑料感、操作打断

### 1.2 设计方向

-   **Design Style**: Frosted Glass 毛玻璃 + GitHub Precision — 深色基底上通过半透明层级区分信息，配合精准微交互还原“GitHub级”质感
-   **Application Type**: Creative SaaS Platform — 决定采用高视口利用率+沉浸式内容区布局
-   **Aesthetic Direction**: 影院级暗黑美学：深邃背景承载光影内容，紫蓝霓虹作为数字时代的“场记板”标记关键行动

## 2. Color System (色彩系统)

**色彩关系**: 深空灰蓝基底 + 低饱和中性层 + 电光紫蓝强调色
**配色设计理由**: 影视创作需长时间暗色环境工作，低对比度底色减少眼疲劳；紫蓝光晕模拟片场灯光氛围，区别于通用SaaS冷蓝
**主色推导**: Primary 取自后期调色软件中的“高光渲染色”，用于下载/导出/新建等核心创作行动，兼具科技感与艺术性
**使用比例**: 70% 深色背景 / 20% 卡片容器 / 10% 交互强调；Primary 仅用于一级按钮与激活态，禁止大面积铺陈

### 2.1 主题颜色

| Token                | HSL 值             | 说明                                     |
| -------------------- | ------------------ | ---------------------------------------- |
| `background`         | hsl(228 15% 8%)    | 页面深底，近似影院幕布黑                 |
| `card`               | hsl(228 14% 12%)   | 卡片/面板容器，比背景微亮形成层级        |
| `foreground`         | hsl(220 15% 90%)   | 主文字，Off-white 避免纯白刺眼           |
| `muted-foreground`   | hsl(220 10% 55%)   | 次要文字/元数据                          |
| `primary`            | hsl(252 85% 60%)   | 主交互色，电光紫蓝                       |
| `primary-foreground` | hsl(0 0% 100%)     | 主按钮文字                               |
| `accent`             | hsl(252 30% 18%)   | Hover/Focus 背景，极低饱和度同色系       |
| `accent-foreground`  | hsl(220 15% 85%)   | Accent 上的文字                          |
| `border`             | hsl(228 12% 18%)   | 分割线/边框，融入暗色背景                |

### 2.2 导航区配色

-   **基调关系**: 复用主配色系统，滚动后叠加 `bg-background/80 backdrop-blur-md` 毛玻璃效果
-   **关键状态**: 激活项使用 `text-primary` + 底部 2px 指示条；Hover 态 `bg-accent` 过渡
-   **边界与背景**: 非透明底色防止内容穿透干扰；底部 1px `border-border` 分隔

### 2.3 语义颜色

| 用途       | HSL 值              | 衍生逻辑                     |
| ---------- | ------------------- | ---------------------------- |
| Success    | hsl(152 65% 45%)    | 翠绿，用于上传完成/版本恢复  |
| Warning    | hsl(38 90% 55%)     | 琥珀黄，用于未保存提示       |
| Destructive| hsl(0 72% 55%)      | 警示红，用于删除/覆盖确认    |
| Info       | hsl(210 80% 60%)    | 天蓝，用于协作光标/批注链接  |

## 3. Typography (字体排版)

-   **Heading**: Space Grotesk, system-ui, sans-serif — 几何宽体字重，契合影视标题张力
-   **Body**: Inter, -apple-system, sans-serif — 屏幕阅读基准，保证长文舒适度
-   **Mono**: JetBrains Mono, Courier New, monospace — 剧本编辑器专用，符合行业标准格式
-   **字体策略**: 标题使用 Variable Font 调整字重；剧本正文强制等宽对齐；中文回退 PingFang SC/Noto Sans SC

## 4. Layout Strategy (布局策略)

-   **导航意图**: 顶部全局导航承载素材库/剧本两大板块切换；编辑器页面隐藏全局导航进入沉浸模式
-   **页面架构**: 流式响应布局，内容区 `max-w-7xl` 居中；编辑器页面无最大宽度限制全幅铺展
-   **响应式**: 移动端筛选栏折叠为抽屉；瀑布流网格自动适配列数；编辑器桌面优先，移动端仅预览

## 5. Visual Language (视觉语言)

-   **形态参数**: 圆角 `rounded-lg (8px)` · 阴影 `shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]` · 间距基调 `standard`
-   **识别签名**: 1px 内发光边框(`ring-1 ring-inset`)、悬停光晕扩散、液态滑块指示器
-   **装饰策略**: 仅用渐变光斑与模糊遮罩，禁用具象插画纹理
-   **动效原则**: Spring 弹性曲线 200-300ms；页面切换 Fade+Slide 复合动画
-   **可及性**: 对比度 ≥ 4.5:1；视频预览区加暗色遮罩保文字可读；Focus Ring 明显可见

## 6. Component Principles (组件原则)

-   **状态完整性**: 所有按钮含 Loading 态（spinner替换文字）；拖拽区含 Active/DragOver/Error 三态
-   **层级清晰**: Primary 按钮带微弱外发光；Secondary 按钮透明描边；Ghost 按钮无边框
-   **一致性**: 标签统一 Capsule 样式；表格行 Hover 背景色固定为 `bg-accent/50`；弹窗统一 Backdrop Blur

## 7. Image Direction (图片与视觉资产)

-   **Image Role**: 首页 Hero 轮播图 / 素材库封面 / 项目卡片缩略图
-   **Image Art Direction**: 电影感宽画幅构图，高动态范围光影，颗粒感胶片质感，冷暖对比色调
-   **Image Prompt Keywords**: cinematic lighting, anamorphic lens flare, color graded, film grain, moody atmosphere, shallow depth of field, neon noir
-   **Image Avoidance**: 过度饱和HDR、卡通渲染、无焦点杂乱构图、通用商务图库人像

## 8. 应避免 (Anti-patterns)

-   ❌ 纯黑 #000000 背景导致 OLED 拖影与层次丢失
-   ❌ 编辑器界面出现任何彩色装饰元素干扰文字专注
-   ❌ 视频预览自动播放时带有声音或未提供暂停控制