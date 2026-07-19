import React from 'react';
import { Image, X, Plus } from 'lucide-react';

export interface MaterialUploadFormData {
  title: string;
  description: string;
  type: string;
  resolution: string;
  duration: number;
  tags: string;
  cover_url: string;
}

export interface MaterialUploadFormErrors {
  title?: string;
  type?: string;
}

interface MaterialUploadFormDialogProps {
  open: boolean;
  showSubmitPreviewUrl?: string;
  previewNode: React.ReactNode;
  formData: MaterialUploadFormData;
  formErrors: MaterialUploadFormErrors;
  submitting: boolean;
  coverPreviewUrl: string;
  onClose: () => void;
  onSubmit: () => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onTypeChange: (type: string) => void;
  onResolutionChange: (resolution: string) => void;
  onDurationChange: (duration: number) => void;
  onTagsChange: (tags: string) => void;
  onCoverSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const MaterialUploadFormDialog: React.FC<MaterialUploadFormDialogProps> = ({
  open,
  showSubmitPreviewUrl,
  previewNode,
  formData,
  formErrors,
  submitting,
  coverPreviewUrl,
  onClose,
  onSubmit,
  onTitleChange,
  onDescriptionChange,
  onTypeChange,
  onResolutionChange,
  onDurationChange,
  onTagsChange,
  onCoverSelect,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 bg-card border border-border rounded-xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">素材信息</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          {previewNode}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              标题
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(event) => onTitleChange(event.target.value)}
              className={`w-full h-9 px-3 rounded-lg bg-background border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                formErrors.title ? 'border-destructive ring-1 ring-destructive' : 'border-border'
              }`}
            />
            {formErrors.title && <p className="text-xs text-destructive mt-1">{formErrors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                类型
              </label>
              <select
                value={formData.type}
                onChange={(event) => onTypeChange(event.target.value)}
                className={`w-full h-9 px-3 rounded-lg bg-background border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                  formErrors.type ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                }`}
              >
                <option value="video">视频</option>
                <option value="audio">音频</option>
                <option value="sound">音效</option>
              </select>
              {formErrors.type && <p className="text-xs text-destructive mt-1">{formErrors.type}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                分辨率
              </label>
              <input
                type="text"
                value={formData.resolution}
                onChange={(event) => onResolutionChange(event.target.value)}
                placeholder="如 1920x1080"
                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                时长（秒）
              </label>
              <input
                type="number"
                min="0"
                value={formData.duration}
                onChange={(event) => onDurationChange(Math.max(0, Number(event.target.value || 0)))}
                placeholder="自动识别"
                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              标签（逗号分隔）
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(event) => onTagsChange(event.target.value)}
              placeholder="如 风景, 城市, 航拍"
              className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              封面图片（视频素材已自动截取，可按需更换）
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-sm text-foreground cursor-pointer hover:border-primary/50 transition-colors flex items-center">
                <Image className="w-4 h-4 mr-2 text-muted-foreground" />
                选择封面图片
                <input type="file" accept="image/*" onChange={onCoverSelect} className="hidden" />
              </label>
              {(coverPreviewUrl || formData.cover_url) && (
                <img
                  src={coverPreviewUrl || formData.cover_url}
                  alt="封面预览"
                  className="w-9 h-9 rounded object-cover border border-border"
                />
              )}
            </div>
          </div>

          {showSubmitPreviewUrl && (
            <div className="rounded-lg bg-accent/30 border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">文件地址（上传成功）</p>
              <p className="text-xs text-foreground break-all font-mono">{showSubmitPreviewUrl}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !formData.title.trim()}
            className="flex-1 app-btn-primary disabled:opacity-50 disabled:cursor-not-allowed gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                确认创建
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialUploadFormDialog;
