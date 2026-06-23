/**
 * 逆向解析舱组件 / Reverse Parser Component
 * ================================================================
 * 上传已有 .pnt 文件，100% 准确反向解析并高保真还原，支持像素悬停染料名称。
 * Upload existing .pnt file, 100% accurate reverse parse with hover dye name.
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, FileX, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { 解析Pnt字节流, 粗略校验Pnt格式, type 解析结果类型 } from '../lib/Pnt二进制引擎';
import { 格式化字节 } from '../lib/图像工具';
import { 染料调色板, type 染料类型 } from '../lib/染料调色板';

export function 逆向解析舱() {
  const [解析结果, set解析结果] = useState<解析结果类型 | null>(null);
  const [加载中, set加载中] = useState(false);
  const [悬停染料, set悬停染料] = useState<{ 染料: 染料类型; x: number; y: number } | null>(null);
  const canvas引用 = useRef<HTMLCanvasElement>(null);

  // 处理 .pnt 文件 / Handle .pnt file
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const 文件 = acceptedFiles[0];

    set加载中(true);
    set悬停染料(null);

    try {
      // 读取文件为 ArrayBuffer / Read file as ArrayBuffer
      const 缓冲区 = await 文件.arrayBuffer();

      // 粗略校验 / Rough validation
      if (!粗略校验Pnt格式(缓冲区.byteLength)) {
        toast.error('文件格式无效', {
          description: `文件大小 ${格式化字节(缓冲区.byteLength)} 不符合 .pnt 规范`,
        });
        set加载中(false);
        return;
      }

      // 解析 .pnt / Parse .pnt
      const 结果 = 解析Pnt字节流(缓冲区);
      set解析结果(结果);

      toast.success('解析成功', {
        description: `${结果.宽度} × ${结果.高度} · ${格式化字节(结果.字节大小)}`,
      });
    } catch (错误) {
      toast.error('解析失败', {
        description: 错误 instanceof Error ? 错误.message : '未知错误',
      });
      set解析结果(null);
    } finally {
      set加载中(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.pnt'],
      '': ['.pnt'], // 兜底 / Fallback
    },
    multiple: false,
    noClick: false,
  });

  // 绘制解析结果到画布 / Draw parse result to canvas
  useEffect(() => {
    if (!解析结果 || !canvas引用.current) return;
    const 画布 = canvas引用.current;
    画布.width = 解析结果.宽度;
    画布.height = 解析结果.高度;
    const 上下文 = 画布.getContext('2d')!;
    const 图像数据 = new ImageData(解析结果.像素.数据, 解析结果.宽度, 解析结果.高度);
    上下文.putImageData(图像数据, 0, 0);
  }, [解析结果]);

  // 鼠标悬停 / Mouse hover
  const 处理鼠标移动 = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!解析结果 || !canvas引用.current) return;
      const 画布 = canvas引用.current;
      const 边界矩形 = 画布.getBoundingClientRect();
      const x = Math.floor(((event.clientX - 边界矩形.left) / 边界矩形.width) * 解析结果.宽度);
      const y = Math.floor(((event.clientY - 边界矩形.top) / 边界矩形.height) * 解析结果.高度);

      if (x < 0 || x >= 解析结果.宽度 || y < 0 || y >= 解析结果.高度) {
        set悬停染料(null);
        return;
      }

      const 索引 = (y * 解析结果.宽度 + x) * 4;
      const R = 解析结果.像素.数据[索引 + 0];
      const G = 解析结果.像素.数据[索引 + 1];
      const B = 解析结果.像素.数据[索引 + 2];
      const A = 解析结果.像素.数据[索引 + 3];

      if (A === 0) {
        set悬停染料({
          染料: { 编号: 0, 中文名: '透明', 英文名: 'Transparent', 红: 0, 绿: 0, 蓝: 0 },
          x: event.clientX - 边界矩形.left,
          y: event.clientY - 边界矩形.top,
        });
        return;
      }

      const 匹配染料 = 染料调色板.find((d) => d.红 === R && d.绿 === G && d.蓝 === B);
      if (匹配染料) {
        set悬停染料({
          染料: 匹配染料,
          x: event.clientX - 边界矩形.left,
          y: event.clientY - 边界矩形.top,
        });
      }
    },
    [解析结果]
  );

  return (
    <div className="space-y-4">
      {/* 上传区 / Upload area */}
      <div
        {...getRootProps()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed
          transition-all duration-300 ease-apple
          glass-panel
          flex flex-col items-center justify-center
          px-4 py-8
          ${isDragActive ? 'dropzone-active' : 'border-gray-300 hover:border-blue-400'}
        `}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ rotate: 加载中 ? 360 : 0 }}
          transition={{ duration: 0.8, repeat: 加载中 ? Infinity : 0, ease: 'linear' }}
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500"
        >
          {加载中 ? (
            <Loader2 className="h-5 w-5" />
          ) : (
            <FileUp className="h-5 w-5" />
          )}
        </motion.div>
        <p className="text-center text-sm font-medium text-gray-800">
          {加载中 ? '正在解析...' : '上传 .pnt 文件逆向查看'}
        </p>
        <p className="mt-1 text-center text-xs text-gray-500">
          点击或拖拽 .pnt 文件到此处
        </p>
      </div>

      {/* 解析结果展示 / Parse result display */}
      <AnimatePresence mode="wait">
        {解析结果 ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* 元数据 / Metadata */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">宽度</p>
                <p className="text-base font-semibold text-gray-900">{解析结果.宽度}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">高度</p>
                <p className="text-base font-semibold text-gray-900">{解析结果.高度}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">字节</p>
                <p className="text-base font-semibold text-gray-900">
                  {格式化字节(解析结果.字节大小).split(' ')[0]}
                </p>
              </div>
            </div>

            {/* 画布 / Canvas */}
            <div className="relative flex items-center justify-center rounded-2xl bg-gray-50 p-4">
              <div className="relative" style={{ width: 256, height: 256 }}>
                <canvas
                  ref={canvas引用}
                  onMouseMove={处理鼠标移动}
                  onMouseLeave={() => set悬停染料(null)}
                  className="pixel-canvas h-full w-full rounded-lg border border-gray-200 shadow-sm"
                  style={{ imageRendering: 'pixelated', cursor: 'crosshair' }}
                />

                {/* 悬停提示 / Hover tooltip */}
                {悬停染料 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pointer-events-none absolute z-10 flex items-center gap-2 rounded-lg bg-gray-900/90 px-2.5 py-1.5 backdrop-blur-apple"
                    style={{
                      left: Math.min(悬停染料.x + 12, 256 - 140),
                      top: Math.max(悬停染料.y - 32, 0),
                    }}
                  >
                    <div
                      className="h-3 w-3 rounded-sm border border-white/30"
                      style={{
                        backgroundColor: `rgb(${悬停染料.染料.红}, ${悬停染料.染料.绿}, ${悬停染料.染料.蓝})`,
                      }}
                    />
                    <span className="text-xs font-medium text-white">
                      {悬停染料.染料.中文名}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      #{悬停染料.染料.编号}
                    </span>
                  </motion.div>
                )}

                {/* 提示条 / Hint bar */}
                <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gray-900/80 px-3 py-1 backdrop-blur-apple">
                  <Eye className="h-3 w-3 text-white" />
                  <span className="text-[10px] text-white">悬停像素查看染料</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          !加载中 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 py-12 text-gray-400"
            >
              <FileX className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">尚未加载 .pnt 文件</p>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
