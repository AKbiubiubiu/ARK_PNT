/**
 * 拖拽上传区组件 / Dropzone Component
 * ================================================================
 * 苹果风拖拽上传区域，支持拖拽与点击选择，含悬停放大动效。
 * Apple-style dropzone with drag & click support and hover scale animation.
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface 拖拽上传区属性 {
  onFileAccepted: (file: File) => void;  // 文件被接受时的回调 / Callback when file accepted
}

export function 拖拽上传区({ onFileAccepted }: 拖拽上传区属性) {
  // 文件拖入回调 / File drop callback
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // 处理被拒绝的文件 / Handle rejected files
      if (rejectedFiles.length > 0) {
        const 拒绝原因 = rejectedFiles[0].errors[0];
        if (拒绝原因.code === 'file-invalid-type') {
          toast.error('文件类型无效', {
            description: '请上传图片文件（PNG / JPG / WebP / GIF）',
          });
        } else if (拒绝原因.code === 'file-too-large') {
          toast.error('文件过大', {
            description: '请上传小于 20MB 的图片',
          });
        } else {
          toast.error('文件无法上传', { description: 拒绝原因.message });
        }
        return;
      }

      // 处理接受的文件 / Handle accepted files
      if (acceptedFiles.length > 0) {
        const 文件 = acceptedFiles[0];
        toast.success('图片已加载', {
          description: `${文件.name} · ${(文件.size / 1024).toFixed(1)} KB`,
        });
        onFileAccepted(文件);
      }
    },
    [onFileAccepted]
  );

  // 配置 react-dropzone / Configure react-dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB 上限 / 20MB limit
    multiple: false,            // 单文件 / Single file
    noClick: false,
    noKeyboard: false,
  });

  return (
    <motion.div
      {...(getRootProps() as any)}
      className={`
        relative cursor-pointer rounded-3xl border-2 border-dashed
        transition-all duration-300 ease-apple
        bg-white/5 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl
        flex flex-col items-center justify-center
        px-6 py-12 md:py-16
        ${isDragActive ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]' : 'border-white/20 hover:border-cyan-400/50'}
        ${isDragReject ? 'border-red-400 bg-red-500/10' : ''}
      `}
      whileHover={{ scale: isDragActive ? 1.01 : 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      <input {...getInputProps()} />

      {/* 图标区域 / Icon area */}
      <motion.div
        className={`
          mb-4 flex h-16 w-16 items-center justify-center rounded-2xl
          transition-colors duration-300
          ${isDragActive ? 'bg-cyan-500 text-white' : 'bg-white/10 text-cyan-400'}
        `}
        animate={{
          scale: isDragActive ? 1.1 : 1,
          rotate: isDragActive ? 5 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {isDragActive ? (
          <Upload className="h-7 w-7" strokeWidth={2} />
        ) : (
          <ImageIcon className="h-7 w-7" strokeWidth={2} />
        )}
      </motion.div>

      {/* 文案 / Text */}
      <p className="text-center text-base font-medium text-white md:text-lg">
        {isDragActive
          ? '松开鼠标即可上传'
          : '拖拽图片到此处，或点击选择文件'}
      </p>
      <p className="mt-2 text-center text-sm text-zinc-400">
        支持 PNG · JPG · WebP · GIF · BMP · 最大 20MB
      </p>

      {/* 拖拽时的脉冲提示 / Pulse hint when dragging */}
      {isDragActive && (
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-cyan-400"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
