import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2, FileText, Clapperboard } from 'lucide-react';
import { motion } from 'framer-motion';
import ScriptTemplates, { type ScriptTemplate } from '@/components/ScriptTemplates';
import type { CreateScriptProjectRequest } from '@shared/script.interface';

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '悬疑', label: '悬疑' },
  { value: '科幻', label: '科幻' },
  { value: '爱情', label: '爱情' },
  { value: '惊悚', label: '惊悚' },
  { value: '喜剧', label: '喜剧' },
  { value: '其他', label: '其他' },
];

interface ScriptsPageCreateDialogProps {
  open: boolean;
  dialogStep: number;
  useTemplate: boolean;
  selectedTemplate: ScriptTemplate | null;
  formData: CreateScriptProjectRequest;
  titleError: string;
  setTitleError: React.Dispatch<React.SetStateAction<string>>;
  creating: boolean;
  coverPreview: string;
  coverUploading: boolean;
  onOpenChange: (open: boolean) => void;
  setUseTemplate: React.Dispatch<React.SetStateAction<boolean>>;
  setDialogStep: React.Dispatch<React.SetStateAction<number>>;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<ScriptTemplate | null>>;
  setFormData: React.Dispatch<React.SetStateAction<CreateScriptProjectRequest>>;
  onNextStep: () => void;
  onPrevStep: () => void;
  onCreate: () => void;
  onCoverSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveCover: () => void;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
}

const ScriptsPageCreateDialog: React.FC<ScriptsPageCreateDialogProps> = ({
  open,
  dialogStep,
  useTemplate,
  selectedTemplate,
  formData,
  titleError,
  setTitleError,
  creating,
  coverPreview,
  coverUploading,
  onOpenChange,
  setUseTemplate,
  setDialogStep,
  setSelectedTemplate,
  setFormData,
  onNextStep,
  onPrevStep,
  onCreate,
  onCoverSelect,
  onRemoveCover,
  coverInputRef,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(228_14%_12%)] border-[hsl(228_12%_18%)] text-[hsl(220_15%_90%)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[hsl(220_15%_90%)]">新建剧本项目</DialogTitle>
          <DialogDescription className="text-[hsl(220_10%_55%)]">
            {dialogStep === 0
              ? '选择创建方式'
              : dialogStep === 1
                ? useTemplate
                  ? '选择剧本模板'
                  : '步骤 1/2：基本信息'
                : useTemplate
                  ? '步骤 2/2：项目类型'
                  : '步骤 2/2：项目类型'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <div
            className={`h-1 flex-1 rounded-full ${
              dialogStep >= 0 ? 'bg-primary' : 'bg-[hsl(228_12%_18%)]'
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full ${
              dialogStep >= 1 ? 'bg-primary' : 'bg-[hsl(228_12%_18%)]'
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full ${
              dialogStep >= 2 ? 'bg-primary' : 'bg-[hsl(228_12%_18%)]'
            }`}
          />
        </div>

        {dialogStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                onClick={() => {
                  setUseTemplate(false);
                  setDialogStep(1);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] hover:border-primary/50 transition-all duration-300"
              >
                <FileText className="size-8 text-[hsl(220_10%_55%)]" />
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-[hsl(220_15%_90%)]">空白项目</h3>
                  <p className="text-[11px] text-[hsl(220_10%_55%)] mt-0.5">从空白剧本开始创作</p>
                </div>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => {
                  setUseTemplate(true);
                  setDialogStep(1);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] hover:border-primary/50 transition-all duration-300"
              >
                <Clapperboard className="size-8 text-[hsl(220_10%_55%)]" />
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-[hsl(220_15%_90%)]">从模板创建</h3>
                  <p className="text-[11px] text-[hsl(220_10%_55%)] mt-0.5">使用预设剧本模板快速开始</p>
                </div>
              </motion.button>
            </div>
          </div>
        )}

        {dialogStep === 1 && useTemplate && (
          <div className="space-y-4">
            <ScriptTemplates
              onSelect={(tpl: ScriptTemplate) => {
                setSelectedTemplate(tpl);
              }}
              selectedKey={selectedTemplate?.key}
            />
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setDialogStep(0)}
                className="text-[hsl(220_10%_55%)]"
              >
                上一步
              </Button>
              <Button
                onClick={() => {
                  if (!selectedTemplate) return;
                  setFormData((f) => ({
                    ...f,
                    title: selectedTemplate.label,
                    description: selectedTemplate.description,
                  }));
                  setDialogStep(2);
                }}
                disabled={!selectedTemplate}
                className="app-btn-primary"
              >
                下一步
              </Button>
            </div>
          </div>
        )}

        {dialogStep === 1 && !useTemplate && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[hsl(220_10%_55%)] mb-1.5 block">项目名称</label>
                <Input
                  placeholder="输入剧本名称..."
                  value={formData.title}
                  onChange={(event) => {
                    setFormData((f) => ({ ...f, title: event.target.value }));
                    if (event.target.value.trim()) {
                      setTitleError('');
                    }
                  }}
                className={`bg-[hsl(228_15%_8%)] text-[hsl(220_15%_90%)] placeholder:text-[hsl(220_10%_55%)] ${
                  titleError
                    ? 'border-destructive ring-1 ring-destructive'
                    : 'border-[hsl(228_12%_18%)]'
                }`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onNextStep();
                  }
                }}
              />
              {titleError ? <p className="text-xs text-destructive mt-1">{titleError}</p> : null}
            </div>
            <div>
              <label className="text-sm text-[hsl(220_10%_55%)] mb-1.5 block">项目描述</label>
              <Input
                placeholder="简要描述剧本内容..."
                value={formData.description}
                onChange={(event) => {
                  setFormData((f) => ({ ...f, description: event.target.value }));
                }}
                className="bg-[hsl(228_15%_8%)] border-[hsl(228_12%_18%)] text-[hsl(220_15%_90%)] placeholder:text-[hsl(220_10%_55%)]"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={onNextStep}
                disabled={!formData.title.trim()}
                className="app-btn-primary"
              >
                下一步
              </Button>
            </div>
          </div>
        )}

        {dialogStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[hsl(220_10%_55%)] mb-2 block">项目类型</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map((option: { value: string; label: string }) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((f) => ({ ...f, type: option.value }))
                    }
                    className={`px-3 py-2 rounded-md text-sm border transition-all duration-200 ${
                      formData.type === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-[hsl(228_12%_18%)] text-[hsl(220_10%_55%)] hover:border-[hsl(220_10%_40%)]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-[hsl(220_10%_55%)] mb-1.5 block">封面图片</label>
              {coverPreview ? (
                <div className="relative group/cover rounded-lg overflow-hidden border border-[hsl(228_12%_18%)]">
                  <img
                    src={coverPreview}
                    alt="封面预览"
                    className="w-full aspect-[16/10] object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={onRemoveCover}
                      className="p-2 rounded-full bg-destructive/80 text-white hover:bg-destructive transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  {coverUploading ? (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="size-6 text-primary animate-spin" />
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className="w-full aspect-[16/10] rounded-lg border-2 border-dashed border-[hsl(228_12%_18%)] hover:border-primary/50 bg-[hsl(228_15%_8%)] flex flex-col items-center justify-center gap-2 transition-colors duration-200"
                >
                  {coverUploading ? (
                    <Loader2 className="size-8 text-primary animate-spin" />
                  ) : (
                    <>
                      <Upload className="size-8 text-[hsl(220_10%_30%)]" />
                      <span className="text-xs text-[hsl(220_10%_55%)]">点击上传封面</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(event): void => {
                  void onCoverSelect(event);
                }}
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={onPrevStep}
                className="text-[hsl(220_10%_55%)]"
              >
                上一步
              </Button>
              <Button onClick={onCreate} disabled={creating} className="app-btn-primary">
                {creating ? '创建中...' : '创建项目'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScriptsPageCreateDialog;
