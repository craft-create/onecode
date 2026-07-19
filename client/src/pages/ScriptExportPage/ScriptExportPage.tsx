import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FileType,
  FileCode,
  File,
  Check,
  Download,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { logger } from '@/compat/client-toolkit/logger';
import { useAuth } from '@client/src/hooks/useAuth';
import { exportScript, getLatestContent } from '@/api/scripts';
import type { ExportScriptRequest, ExportScriptResponse, ScriptContentLatest } from '@shared/script.interface';
import { UniversalLink } from '@/compat/client-toolkit/components/UniversalLink';

interface FormatOption {
  key: ExportScriptRequest['format'];
  label: string;
  description: string;
  icon: React.ReactNode;
  ext: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    key: 'pdf',
    label: 'PDF',
    description: '通用文档格式，适合打印与分发',
    icon: <FileText className="size-8" />,
    ext: '.pdf',
  },
  {
    key: 'word',
    label: 'Word',
    description: '可编辑文档，便于协作修改',
    icon: <FileType className="size-8" />,
    ext: '.docx',
  },
  {
    key: 'fountain',
    label: 'Fountain',
    description: '行业标准剧本标记语言',
    icon: <FileCode className="size-8" />,
    ext: '.fountain',
  },
  {
    key: 'txt',
    label: 'TXT',
    description: '纯文本格式，保留段落结构',
    icon: <File className="size-8" />,
    ext: '.txt',
  },
];

const ADVANCED_OPTIONS = [
  {
    key: 'include_scene_number' as const,
    label: '包含场景编号',
  },
  {
    key: 'include_character_list' as const,
    label: '包含角色列表',
  },
  {
    key: 'include_revision_marks' as const,
    label: '包含修订标记',
  },
];

const ScriptExportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // 未登录时重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const [selectedFormat, setSelectedFormat] =
    useState<ExportScriptRequest['format']>('pdf');
  const [options, setOptions] = useState({
    include_scene_number: true,
    include_character_list: true,
    include_revision_marks: false,
  });

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportScriptResponse | null>(null);
  const [error, setError] = useState('');
  const [contentEmpty, setContentEmpty] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);

  const checkContent = useCallback(async () => {
    if (!id) return;
    setContentLoading(true);
    try {
      const data: ScriptContentLatest = await getLatestContent(id);
      if (!data.content || !data.content.trim()) {
        setContentEmpty(true);
      }
    } catch (err: unknown) {
      logger.error('Failed to check content:', String(err));
    } finally {
      setContentLoading(false);
    }
  }, [id]);

  useEffect(() => {
    checkContent();
  }, [checkContent]);

  const handleExport = async () => {
    if (!id) return;
    if (contentEmpty) {
      setError('剧本内容为空，无法导出');
      return;
    }
    setExporting(true);
    setProgress(0);
    setResult(null);
    setError('');

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 300);

    try {
      const res = await exportScript(id, {
        format: selectedFormat,
        options,
      });
      clearInterval(progressTimer);
      setProgress(100);
      setResult(res);
    } catch (err: unknown) {
      clearInterval(progressTimer);
      setProgress(0);
      setError('导出失败，请重试');
      logger.error('Export failed:', String(err));
    } finally {
      setExporting(false);
    }
  };

  const toggleOption = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const _handleReset = () => {
    setExporting(false);
    setProgress(0);
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[hsl(228_15%_8%)]">
      <div className="app-container-shell">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/scripts/${id}`)}
            className="text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)]"
          >
            <ArrowLeft className="size-4 mr-1" />
            返回编辑器
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(220_15%_90%)] font-['Space_Grotesk']">
              剧本导出
            </h1>
            <p className="text-[hsl(220_10%_55%)] mt-1 text-sm">
              选择导出格式与选项
            </p>
          </div>
        </div>

        {/* Content Empty Warning */}
        {!contentLoading && contentEmpty && (
          <div className="mb-8 bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="text-[hsl(220_15%_90%)] text-sm font-medium mb-1">
              剧本内容为空，无法导出
            </p>
            <p className="text-[hsl(220_10%_55%)] text-xs">
              请先在编辑器中编写剧本内容后再导出
            </p>
          </div>
        )}

        {/* Format Cards */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[hsl(220_10%_55%)] mb-4 uppercase tracking-wider">
            导出格式
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {FORMAT_OPTIONS.map((fmt) => {
              const isSelected = selectedFormat === fmt.key;
              return (
                <motion.button
                  key={fmt.key}
                  type="button"
                  onClick={() => setSelectedFormat(fmt.key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-[0_0_24px_-4px_rgba(124_92_255_0.3)]'
                      : 'border-[hsl(228_12%_18%)] bg-[hsl(228_14%_12%)] hover:border-[hsl(220_10%_40%)]'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 size-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="size-3.5 text-primary-foreground" />
                    </motion.div>
                  )}
                  <div
                    className={`${
                      isSelected
                        ? 'text-primary'
                        : 'text-[hsl(220_10%_55%)]'
                    }`}
                  >
                    {fmt.icon}
                  </div>
                  <div className="text-center">
                    <h3
                      className={`font-semibold text-lg ${
                        isSelected
                          ? 'text-primary'
                          : 'text-[hsl(220_15%_90%)]'
                      }`}
                    >
                      {fmt.label}
                    </h3>
                    <p className="text-xs text-[hsl(220_10%_55%)] mt-1">
                      {fmt.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-[hsl(220_10%_40%)]">
                    {fmt.ext}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[hsl(220_10%_55%)] mb-4 uppercase tracking-wider">
            高级选项
          </h2>
          <div className="bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg p-5 space-y-3">
            {ADVANCED_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Checkbox
                  checked={options[opt.key]}
                  onCheckedChange={() => toggleOption(opt.key)}
                  className="border-[hsl(228_12%_18%)] data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm text-[hsl(220_15%_90%)] group-hover:text-[hsl(220_15%_100%)] transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleExport}
            disabled={exporting || contentEmpty}
            className="app-btn-primary-lg gap-2 shadow-[0_0_24px_-4px_rgba(124_92_255_0.4)] text-base"
          >
            {exporting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="size-5" />
                开始导出
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 text-center">
            <p className="text-sm text-[hsl(0_72%_55%)]">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 text-center">
            {selectedFormat === 'txt' ? (
              <button
                onClick={() => {
                  window.open(result.download_url, '_blank');
                }}
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
              >
                <Download className="size-4" />
                下载 {result.filename}
              </button>
            ) : (
              <UniversalLink
                to={result.download_url}
                download={result.filename}
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
              >
                <Download className="size-4" />
                下载 {result.filename}
              </UniversalLink>
            )}
          </div>
        )}
      </div>

      {/* Progress Overlay */}
      <AnimatePresence>
        {exporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Circular Progress */}
              <div className="relative size-32">
                <svg
                  className="size-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="hsl(228,12%,18%)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="hsl(252,85%,60%)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 42 * (1 - progress / 100),
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    key={Math.round(progress)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold text-[hsl(220_15%_90%)] font-['Space_Grotesk']"
                  >
                    {Math.round(progress)}%
                  </motion.span>
                </div>
              </div>

              <p className="text-[hsl(220_10%_55%)] text-sm">
                正在生成 {FORMAT_OPTIONS.find((f) => f.key === selectedFormat)?.label} 文件...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScriptExportPage;
