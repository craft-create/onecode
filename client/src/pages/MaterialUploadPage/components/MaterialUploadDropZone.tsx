import React from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

interface MaterialUploadDropZoneProps {
  isDragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onSelectFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MaterialUploadDropZone: React.FC<MaterialUploadDropZoneProps> = ({
  isDragOver,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectFile,
}) => {
  return (
    <motion.div
      animate={
        isDragOver
          ? { borderColor: 'hsl(252 85% 60%)', scale: 1.01 }
          : { borderColor: 'hsl(228 12% 18%)', scale: 1 }
      }
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-foreground/20'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        onChange={onSelectFile}
        className="hidden"
      />
      <motion.div
        animate={isDragOver ? { y: -4 } : { y: 0 }}
        className="flex flex-col items-center gap-3"
      >
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
            isDragOver ? 'bg-primary/20' : 'bg-accent'
          }`}
        >
          <Upload className={`w-7 h-7 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {isDragOver ? '释放以上传文件' : '拖拽文件到此处或点击选择'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            支持视频、音频、图片格式，文件将自动上传
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MaterialUploadDropZone;
