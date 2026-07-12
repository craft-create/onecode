import React from 'react';
import { motion } from 'framer-motion';
import {
  Clapperboard,
  Film,
  Smartphone,
  Megaphone,
} from 'lucide-react';

export interface ScriptTemplate {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  content: string;
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    key: 'short-drama',
    label: '短剧模板',
    description: '5分钟短剧，含场景标题和角色对话格式',
    icon: <Clapperboard className="size-6" />,
    content: `1. INT. 客厅 - 白天

【角色A】
（神情紧张地看向门口）
你终于来了...我等了你很久。

【角色B】
（推开门，语气冷淡）
我们之间没什么好说的了。

2. EXT. 街道 - 傍晚

【角色A】
（追出门外，声音颤抖）
等等！至少听我解释...

【角色B】
（停下脚步，没有回头）
已经太迟了。

3. INT. 咖啡馆 - 夜晚

【角色A】
（坐在角落，独自搅动咖啡）
也许...这就是结局了。

（灯光渐暗）

—— 完 ——`,
  },
  {
    key: 'film',
    label: '电影模板',
    description: '标准电影剧本格式，含场次标记',
    icon: <Film className="size-6" />,
    content: `场次 1

INT. 警察局 - 白天

昏暗的灯光下，桌上散落着案件卷宗。

李警官
（翻看文件，眉头紧锁）
这个案子不对劲...所有的线索都指向同一个方向。

王探员
（推门进来，手里拿着新的报告）
队长，法医那边有新发现。

李警官
（抬起头，眼神锐利）
说。

场次 2

EXT. 案发现场 - 闪回

雨水冲刷着地面。警戒线在风中摇晃。

（画外音 - 李警官）
三天前，这里还只是一个普通的居民区...

场次 3

INT. 审讯室 - 白天

嫌疑人坐在桌前，面无表情。

李警官
（将照片推过去）
认识这个人吗？

嫌疑人
（嘴角微微上扬）
认识。但不是我杀的。`,
  },
  {
    key: 'short-video',
    label: '短视频模板',
    description: '1分钟快节奏分镜格式',
    icon: <Smartphone className="size-6" />,
    content: `【分镜 1 | 0-5秒 | 特写】
画面：快速切换的城市夜景霓虹灯
音效：电子节奏渐强
字幕：这座城市从不睡觉

【分镜 2 | 5-15秒 | 中景】
画面：主角在屋顶奔跑，身后灯光闪烁
音效：急促脚步声 + 心跳声
主角（喘息）：快到了...

【分镜 3 | 15-30秒 | 广角】
画面：主角站在楼顶边缘，俯瞰城市
音效：风声 + 音乐高潮
主角（坚定）：就是现在！

【分镜 4 | 30-45秒 | 特写】
画面：主角纵身一跃，慢动作
音效：音乐骤停，心跳声放大
字幕：有些选择，一旦做出就无法回头

【分镜 5 | 45-60秒 | 黑屏】
画面：纯黑背景
音效：落地声
字幕：TO BE CONTINUED`,
  },
  {
    key: 'ad-copy',
    label: '广告文案模板',
    description: '30秒广告，含画面描述和旁白',
    icon: <Megaphone className="size-6" />,
    content: `【画面 1 | 0-5秒】
场景：清晨的城市天际线，阳光穿透薄雾
旁白：每一天，都是新的开始。

【画面 2 | 5-12秒】
场景：主角打开窗户，深呼吸，露出微笑
旁白：用最好的状态，迎接每一个挑战。

【画面 3 | 12-20秒】
场景：产品特写——精致的包装在阳光下闪耀
旁白：（产品名），为你的每一天注入能量。

【画面 4 | 20-27秒】
场景：主角使用产品后，自信地走出家门
旁白：不止是选择，更是一种态度。

【画面 5 | 27-30秒】
场景：品牌LOGO + 标语
旁白：（品牌名）—— 活出你的精彩。
标语：即刻体验，开启全新生活。`,
  },
];

interface ScriptTemplatesProps {
  onSelect: (template: ScriptTemplate) => void;
  selectedKey?: string;
}

const ScriptTemplates: React.FC<ScriptTemplatesProps> = ({
  onSelect,
  selectedKey,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SCRIPT_TEMPLATES.map((template: ScriptTemplate) => {
        const isSelected = selectedKey === template.key;
        return (
          <motion.button
            key={template.key}
            type="button"
            onClick={() => onSelect(template)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 text-left ${
              isSelected
                ? 'border-primary bg-primary/5 shadow-[0_0_20px_-4px_rgba(124_92_255_0.3)]'
                : 'border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] hover:border-[hsl(220_10%_40%)]'
            }`}
          >
            <div
              className={`${
                isSelected ? 'text-primary' : 'text-[hsl(220_10%_55%)]'
              }`}
            >
              {template.icon}
            </div>
            <div className="text-center">
              <h3
                className={`text-sm font-semibold ${
                  isSelected
                    ? 'text-primary'
                    : 'text-[hsl(220_15%_90%)]'
                }`}
              >
                {template.label}
              </h3>
              <p className="text-[11px] text-[hsl(220_10%_55%)] mt-0.5 leading-tight">
                {template.description}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ScriptTemplates;
