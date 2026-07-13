import React from 'react';
import { Film, Play, Music, Volume2 } from 'lucide-react';
import type { MaterialFiltersResponse } from '@shared/material.interface';

const TYPE_TABS = [
  { key: '', label: '全部', icon: Film },
  { key: 'video', label: '视频', icon: Play },
  { key: 'audio', label: '音频', icon: Music },
  { key: 'sound', label: '音效', icon: Volume2 },
] as const;

interface MaterialFilterPanelProps {
  filters: MaterialFiltersResponse | null;
  activeType: string;
  selectedResolutions: string[];
  selectedDuration: { min: number; max: number } | null;
  selectedTags: string[];
  onTypeChange: (type: string) => void;
  onToggleResolution: (res: string) => void;
  onToggleDuration: (d: { min: number; max: number }) => void;
  onToggleTag: (tag: string) => void;
  onClear: () => void;
}

const MaterialFilterPanel: React.FC<MaterialFilterPanelProps> = ({
  filters,
  activeType,
  selectedResolutions,
  selectedDuration,
  selectedTags,
  onTypeChange,
  onToggleResolution,
  onToggleDuration,
  onToggleTag,
  onClear,
}) => {
  const hasActive =
    activeType ||
    selectedResolutions.length > 0 ||
    selectedDuration ||
    selectedTags.length > 0;

  return (
    <div className="w-[240px] space-y-5">
      {/* Type Tabs */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          素材类型
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTypeChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resolution */}
      {filters && filters.resolutions.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            分辨率
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {filters.resolutions.map((res: string) => (
              <button
                key={res}
                onClick={() => onToggleResolution(res)}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  selectedResolutions.includes(res)
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Duration */}
      {filters && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            时长
          </h3>
          <div className="space-y-1">
            {filters.durations.map((d) => {
              const isActive =
                selectedDuration?.min === d.min &&
                selectedDuration?.max === d.max;
              return (
                <button
                  key={d.label}
                  onClick={() =>
                    onToggleDuration(
                      isActive
                        ? { min: 0, max: 0 }
                        : { min: d.min, max: d.max },
                    )
                  }
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-all ${
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {filters && filters.tags.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            标签
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {filters.tags.slice(0, 20).map((tag: string) => (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasActive && (
        <button
          onClick={onClear}
          className="text-xs text-primary hover:underline"
        >
          清除所有筛选
        </button>
      )}
    </div>
  );
};

export default MaterialFilterPanel;
