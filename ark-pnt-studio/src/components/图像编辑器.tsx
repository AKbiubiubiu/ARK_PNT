/**
 * 高端图像编辑器组件 / Premium Image Editor Component
 * ================================================================
 * 三标签页专业编辑：调整（7 种滤镜）/ 文字叠加（多层可拖拽）/ 裁剪。
 * Three-tab pro editor: Adjust (7 filters) / Text overlay (multi-layer draggable) / Crop.
 *
 * 渲染管线：Canvas API + ctx.filter 滤镜 + ctx.fillText 文字 + react-easy-crop 裁剪。
 * Render pipeline: Canvas API + ctx.filter filters + ctx.fillText text + react-easy-crop crop.
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper, { type Area } from 'react-easy-crop';
import {
  Sliders,
  Type,
  Crop as CropIcon,
  Plus,
  Trash2,
  Bold,
  RotateCcw,
  GripVertical,
} from 'lucide-react';
import type { 像素矩阵类型 } from '../lib/Pnt二进制引擎';

// ================================================================
// 类型定义 / Type definitions
// ================================================================

interface 图像编辑器属性 {
  图像源: HTMLImageElement;            // 已加载的图像元素 / Loaded image element
  目标尺寸: number;                    // 目标输出边长（正方形）/ Target output size (square)
  onEdit: (像素: 像素矩阵类型) => void; // 编辑结果回调 / Edit result callback
}

interface 滤镜参数 {
  亮度: number;   // 0-200, 100 = 原始 / Brightness
  对比度: number; // 0-200, 100 = 原始 / Contrast
  饱和度: number; // 0-200, 100 = 原始 / Saturation
  色相: number;   // 0-360 / Hue rotation
  棕褐色: number; // 0-100 / Sepia amount
  模糊: number;   // 0-20 px / Blur radius
  反相: number;   // 0-100 / Invert amount
}

interface 文字图层 {
  id: string;
  内容: string;
  x: number;       // 相对画布比例 0-1 / Relative X ratio 0-1
  y: number;       // 相对画布比例 0-1 / Relative Y ratio 0-1
  字号: number;    // 12-120 / Font size
  颜色: string;    // HEX 颜色 / Hex color
  加粗: boolean;
}

type 标签页类型 = '调整' | '文字' | '裁剪';

const 默认滤镜: 滤镜参数 = {
  亮度: 100,
  对比度: 100,
  饱和度: 100,
  色相: 0,
  棕褐色: 0,
  模糊: 0,
  反相: 0,
};

const 预设颜色 = [
  '#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00',
  '#34C759', '#00C7BE', '#007AFF', '#5856D6', '#AF52DE',
];

// ================================================================
// 主组件 / Main component
// ================================================================

export function 图像编辑器({ 图像源, 目标尺寸, onEdit }: 图像编辑器属性) {
  const [当前标签页, set当前标签页] = useState<标签页类型>('调整');
  const [滤镜, set滤镜] = useState<滤镜参数>(默认滤镜);
  const [文字图层, set文字图层] = useState<文字图层[]>([]);
  const [选中图层ID, set选中图层ID] = useState<string | null>(null);
  const [裁剪区域, set裁剪区域] = useState<Area | null>(null);
  const [裁剪缩放, set裁剪缩放] = useState(1);
  const [裁剪位置, set裁剪位置] = useState({ x: 0, y: 0 });

  const canvas引用 = useRef<HTMLCanvasElement>(null);
  const 预览尺寸 = 360;

  // 构建 CSS filter 字符串 / Build CSS filter string
  const 滤镜字符串 = useMemo(() => {
    return [
      `brightness(${滤镜.亮度}%)`,
      `contrast(${滤镜.对比度}%)`,
      `saturate(${滤镜.饱和度}%)`,
      `hue-rotate(${滤镜.色相}deg)`,
      `sepia(${滤镜.棕褐色}%)`,
      `blur(${滤镜.模糊}px)`,
      `invert(${滤镜.反相}%)`,
    ].join(' ');
  }, [滤镜]);

  // ---- 核心渲染：在画布上合成图像 + 滤镜 + 文字 ----
  // Core render: composite image + filters + text on canvas
  const 渲染画布 = useCallback(() => {
    const 画布 = canvas引用.current;
    if (!画布) return;

    // 输出画布使用正方形目标尺寸，保证导出像素一致
    // Output canvas uses square target size for consistent export pixels
    画布.width = 目标尺寸;
    画布.height = 目标尺寸;
    const 上下文 = 画布.getContext('2d')!;
    上下文.imageSmoothingEnabled = true;
    上下文.imageSmoothingQuality = 'high';

    // 白色背景填充（避免透明像素导致游戏内显示空白）
    // White background fill (avoid transparent pixels causing blank in-game)
    上下文.fillStyle = '#FFFFFF';
    上下文.fillRect(0, 0, 目标尺寸, 目标尺寸);

    // 计算图像绘制区域（考虑裁剪 + 等比适配）
    // Compute image draw area (consider crop + aspect fit)
    const 原宽 = 图像源.naturalWidth;
    const 原高 = 图像源.naturalHeight;

    // 裁剪映射：react-easy-crop 返回的是绝对像素裁剪框
    // Crop mapping: react-easy-crop returns absolute pixel crop box
    let 源X = 0, 源Y = 0, 源W = 原宽, 源H = 原高;
    if (裁剪区域 && 当前标签页 !== '调整') {
      源X = 裁剪区域.x;
      源Y = 裁剪区域.y;
      源W = 裁剪区域.width;
      源H = 裁剪区域.height;
    }

    // 等比适配到目标正方形（contain 模式，居中）
    // Aspect-fit to target square (contain mode, centered)
    const 适配比例 = Math.min(目标尺寸 / 源W, 目标尺寸 / 源H);
    const 绘制宽 = 源W * 适配比例;
    const 绘制高 = 源H * 适配比例;
    const 偏移X = (目标尺寸 - 绘制宽) / 2;
    const 偏移Y = (目标尺寸 - 绘制高) / 2;

    // 应用滤镜并绘制图像 / Apply filter and draw image
    上下文.save();
    上下文.filter = 滤镜字符串;
    上下文.drawImage(图像源, 源X, 源Y, 源W, 源H, 偏移X, 偏移Y, 绘制宽, 绘制高);
    上下文.restore();

    // 绘制文字图层 / Draw text layers
    文字图层.forEach((图层) => {
      上下文.save();
      上下文.fillStyle = 图层.颜色;
      上下文.font = `${图层.加粗 ? 'bold ' : ''}${图层.字号}px "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif`;
      上下文.textBaseline = 'middle';
      上下文.textAlign = 'center';
      const px = 图层.x * 目标尺寸;
      const py = 图层.y * 目标尺寸;
      // 文字描边增强可读性 / Text stroke for readability
      上下文.lineWidth = Math.max(2, 图层.字号 / 12);
      上下文.strokeStyle = 'rgba(0,0,0,0.35)';
      上下文.strokeText(图层.内容, px, py);
      上下文.fillText(图层.内容, px, py);
      上下文.restore();
    });
  }, [图像源, 目标尺寸, 滤镜字符串, 文字图层, 裁剪区域, 当前标签页]);

  // 渲染 + 导出像素 / Render + export pixels
  useEffect(() => {
    渲染画布();
    const 画布 = canvas引用.current;
    if (!画布) return;
    try {
      const 数据 = 画布.getContext('2d')!.getImageData(0, 0, 画布.width, 画布.height);
      onEdit({
        宽度: 画布.width,
        高度: 画布.height,
        数据: 数据.data,
      });
    } catch (错误) {
      console.error('读取画布像素失败 / Read canvas pixels failed:', 错误);
    }
  }, [渲染画布, onEdit]);

  // ---- 文字图层操作 / Text layer operations ----
  const 添加文字图层 = useCallback(() => {
    const 新图层: 文字图层 = {
      id: `text_${Date.now()}`,
      内容: '双击编辑文字',
      x: 0.5,
      y: 0.5,
      字号: 32,
      颜色: '#FFFFFF',
      加粗: false,
    };
    set文字图层((prev) => [...prev, 新图层]);
    set选中图层ID(新图层.id);
    set当前标签页('文字');
  }, []);

  const 删除文字图层 = useCallback((id: string) => {
    set文字图层((prev) => prev.filter((l) => l.id !== id));
    set选中图层ID((prev) => (prev === id ? null : prev));
  }, []);

  const 更新文字图层 = useCallback((id: string, 部分: Partial<文字图层>) => {
    set文字图层((prev) => prev.map((l) => (l.id === id ? { ...l, ...部分 } : l)));
  }, []);

  // 画布上拖拽文字 / Drag text on canvas
  const 拖拽信息 = useRef<{ id: string; 起始X: number; 起始Y: number; 原X: number; 原Y: number } | null>(null);

  const 处理文字拖拽开始 = useCallback(
    (e: React.PointerEvent, 图层: 文字图层) => {
      if (当前标签页 !== '文字') return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      拖拽信息.current = {
        id: 图层.id,
        起始X: e.clientX,
        起始Y: e.clientY,
        原X: 图层.x,
        原Y: 图层.y,
      };
      set选中图层ID(图层.id);
    },
    [当前标签页]
  );

  const 处理文字拖拽移动 = useCallback(
    (e: React.PointerEvent) => {
      const 信息 = 拖拽信息.current;
      if (!信息) return;
      const 画布 = canvas引用.current;
      if (!画布) return;
      const 矩形 = 画布.getBoundingClientRect();
      const dx = (e.clientX - 信息.起始X) / 矩形.width;
      const dy = (e.clientY - 信息.起始Y) / 矩形.height;
      const 新x = Math.max(0, Math.min(1, 信息.原X + dx));
      const 新y = Math.max(0, Math.min(1, 信息.原Y + dy));
      更新文字图层(信息.id, { x: 新x, y: 新y });
    },
    [更新文字图层]
  );

  const 处理文字拖拽结束 = useCallback(() => {
    拖拽信息.current = null;
  }, []);

  // ---- 重置 / Reset ----
  const 重置滤镜 = useCallback(() => set滤镜(默认滤镜), []);

  const 重置裁剪 = useCallback(() => {
    set裁剪区域(null);
    set裁剪缩放(1);
    set裁剪位置({ x: 0, y: 0 });
  }, []);

  // ================================================================
  // 渲染 / Render
  // ================================================================

  return (
    <div className="space-y-4">
      {/* 标签页 / Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-zinc-900/60 p-1 ring-1 ring-white/10">
        {(
          [
            { 键: '调整', 图标: Sliders, 文字: '调整' },
            { 键: '文字', 图标: Type, 文字: '文字' },
            { 键: '裁剪', 图标: CropIcon, 文字: '裁剪' },
          ] as const
        ).map(({ 键, 图标, 文字 }) => {
          const 激活 = 当前标签页 === 键;
          return (
            <button
              key={键}
              onClick={() => set当前标签页(键)}
              className={`
                flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all
                ${激活
                  ? 'bg-gradient-to-r from-cyan-500/90 to-blue-500/90 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <图标 className="h-3.5 w-3.5" />
              {文字}
            </button>
          );
        })}
      </div>

      {/* 画布预览区 / Canvas preview area */}
      <div className="relative flex items-center justify-center rounded-2xl bg-zinc-950/60 p-4 ring-1 ring-white/5">
        <div className="relative" style={{ width: 预览尺寸, height: 预览尺寸 }}>
          {/* 裁剪模式时显示 react-easy-crop，否则显示 canvas */}
          {当前标签页 === '裁剪' ? (
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <Cropper
                image={图像源.src}
                crop={裁剪位置}
                zoom={裁剪缩放}
                aspect={1}
                onCropChange={set裁剪位置}
                onZoomChange={set裁剪缩放}
                onCropComplete={(_, areaPixels) => set裁剪区域(areaPixels)}
                cropShape="rect"
                showGrid
              />
            </div>
          ) : (
            <>
              <canvas
                ref={canvas引用}
                onPointerMove={处理文字拖拽移动}
                onPointerUp={处理文字拖拽结束}
                onPointerLeave={处理文字拖拽结束}
                className="h-full w-full rounded-lg border border-white/10 shadow-lg"
                style={{
                  imageRendering: 'auto',
                  cursor: 当前标签页 === '文字' && 选中图层ID ? 'move' : 'default',
                  touchAction: 'none',
                }}
              />
              {/* 文字图层覆盖层（用于拖拽）/ Text layer overlay (for dragging) */}
              {当前标签页 === '文字' &&
                文字图层.map((图层) => {
                  const 选中 = 选中图层ID === 图层.id;
                  return (
                    <div
                      key={图层.id}
                      onPointerDown={(e) => 处理文字拖拽开始(e, 图层)}
                      onClick={() => set选中图层ID(图层.id)}
                      className={`
                        absolute -translate-x-1/2 -translate-y-1/2 cursor-move select-none
                        rounded px-1 py-0.5 text-center font-sans transition-shadow
                        ${选中 ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/30' : 'ring-1 ring-transparent hover:ring-white/30'}
                      `}
                      style={{
                        left: `${图层.x * 100}%`,
                        top: `${图层.y * 100}%`,
                        color: 图层.颜色,
                        fontSize: `${(图层.字号 / 目标尺寸) * 预览尺寸}px`,
                        fontWeight: 图层.加粗 ? 700 : 400,
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {图层.内容}
                    </div>
                  );
                })}
            </>
          )}
        </div>
      </div>

      {/* 控制面板 / Control panel */}
      <div className="rounded-2xl bg-zinc-900/40 p-4 ring-1 ring-white/5">
        <AnimatePresence mode="wait">
          {/* ===== 调整标签页 / Adjust tab ===== */}
          {当前标签页 === '调整' && (
            <motion.div
              key="adjust"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">滤镜调整</span>
                <button
                  onClick={重置滤镜}
                  className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" />
                  重置
                </button>
              </div>
              {(
                [
                  { 键: '亮度' as const, 标签: '亮度', 最小: 0, 最大: 200, 单位: '%' },
                  { 键: '对比度' as const, 标签: '对比度', 最小: 0, 最大: 200, 单位: '%' },
                  { 键: '饱和度' as const, 标签: '饱和度', 最小: 0, 最大: 200, 单位: '%' },
                  { 键: '色相' as const, 标签: '色相', 最小: 0, 最大: 360, 单位: '°' },
                  { 键: '棕褐色' as const, 标签: '棕褐色', 最小: 0, 最大: 100, 单位: '%' },
                  { 键: '模糊' as const, 标签: '模糊', 最小: 0, 最大: 20, 单位: 'px' },
                  { 键: '反相' as const, 标签: '反相', 最小: 0, 最大: 100, 单位: '%' },
                ]
              ).map(({ 键, 标签, 最小, 最大, 单位 }) => (
                <滑块行
                  key={键}
                  标签={标签}
                  值={滤镜[键]}
                  最小={最小}
                  最大={最大}
                  单位={单位}
                  onChange={(v) => set滤镜((prev) => ({ ...prev, [键]: v }))}
                />
              ))}
            </motion.div>
          )}

          {/* ===== 文字标签页 / Text tab ===== */}
          {当前标签页 === '文字' && (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">文字图层 ({文字图层.length})</span>
                <button
                  onClick={添加文字图层}
                  className="flex items-center gap-1 rounded-lg bg-cyan-500/90 px-2.5 py-1 text-[11px] font-medium text-white transition-all hover:bg-cyan-400"
                >
                  <Plus className="h-3 w-3" />
                  添加文字
                </button>
              </div>

              {文字图层.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl bg-black/20 py-6 text-zinc-500">
                  <Type className="mb-1.5 h-6 w-6 opacity-40" />
                  <p className="text-xs">点击「添加文字」创建文字图层</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {文字图层.map((图层) => (
                    <div
                      key={图层.id}
                      className={`rounded-xl p-3 ring-1 transition-all ${
                        选中图层ID === 图层.id
                          ? 'bg-cyan-500/10 ring-cyan-400/40'
                          : 'bg-white/5 ring-white/10'
                      }`}
                    >
                      {/* 图层头 / Layer header */}
                      <div className="mb-2 flex items-center gap-2">
                        <GripVertical className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <input
                          value={图层.内容}
                          onChange={(e) => 更新文字图层(图层.id, { 内容: e.target.value })}
                          onFocus={() => set选中图层ID(图层.id)}
                          className="min-w-0 flex-1 rounded-md bg-zinc-950/60 px-2 py-1 text-xs text-white ring-1 ring-white/10 outline-none focus:ring-cyan-400/50"
                          placeholder="输入文字..."
                        />
                        <button
                          onClick={() => 删除文字图层(图层.id)}
                          className="shrink-0 rounded-md bg-red-500/10 p-1 text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* 字号 + 加粗 / Font size + bold */}
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={12}
                          max={120}
                          value={图层.字号}
                          onChange={(e) => 更新文字图层(图层.id, { 字号: Number(e.target.value) })}
                          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
                        />
                        <span className="w-9 shrink-0 text-right text-[10px] text-zinc-400">{图层.字号}px</span>
                        <button
                          onClick={() => 更新文字图层(图层.id, { 加粗: !图层.加粗 })}
                          className={`shrink-0 rounded-md p-1.5 ring-1 transition-all ${
                            图层.加粗
                              ? 'bg-cyan-500/20 text-cyan-300 ring-cyan-400/40'
                              : 'bg-white/5 text-zinc-400 ring-white/10 hover:text-white'
                          }`}
                        >
                          <Bold className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="color"
                          value={图层.颜色}
                          onChange={(e) => 更新文字图层(图层.id, { 颜色: e.target.value })}
                          className="h-7 w-7 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0"
                        />
                      </div>

                      {/* 预设色 / Preset colors */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {预设颜色.map((色) => (
                          <button
                            key={色}
                            onClick={() => 更新文字图层(图层.id, { 颜色: 色 })}
                            className="h-4 w-4 rounded-full ring-1 ring-white/20 transition-transform hover:scale-110"
                            style={{ backgroundColor: 色 }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== 裁剪标签页 / Crop tab ===== */}
          {当前标签页 === '裁剪' && (
            <motion.div
              key="crop"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">裁剪与缩放</span>
                <button
                  onClick={重置裁剪}
                  className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" />
                  重置
                </button>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] text-zinc-400">缩放 {裁剪缩放.toFixed(2)}×</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={裁剪缩放}
                  onChange={(e) => set裁剪缩放(Number(e.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
                />
              </div>
              {裁剪区域 && (
                <div className="rounded-lg bg-black/20 px-3 py-2 text-[11px] text-zinc-400">
                  裁剪区域：{Math.round(裁剪区域.width)} × {Math.round(裁剪区域.height)} px
                </div>
              )}
              <p className="text-[10px] leading-relaxed text-zinc-500">
                拖动调整裁剪框位置，滚轮或滑块调整缩放。裁剪结果将以正方形输出。
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ================================================================
// 滑块行子组件 / Slider row sub-component
// ================================================================

interface 滑块行属性 {
  标签: string;
  值: number;
  最小: number;
  最大: number;
  单位: string;
  onChange: (值: number) => void;
}

function 滑块行({ 标签, 值, 最小, 最大, 单位, onChange }: 滑块行属性) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400">{标签}</span>
        <span className="text-[11px] font-medium text-cyan-300">
          {值}{单位}
        </span>
      </div>
      <input
        type="range"
        min={最小}
        max={最大}
        value={值}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
      />
    </div>
  );
}
