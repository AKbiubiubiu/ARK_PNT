/**
 * 高级图像编辑器组件 / Advanced Image Editor Component
 * ================================================================
 * 面向 ARK Survival Evolved PNT 绘画转换流程的专业图像编辑器。
 * Professional image editor for the ARK Survival Evolved PNT pipeline.
 *
 * 三大能力 / Three capabilities:
 *   1. 调整 — 亮度/对比度/饱和度/色相/棕褐色/模糊/反色（CSS filter 实时渲染）
 *      Adjustments via CSS filter rendered in real-time.
 *   2. 文字 — 多层文字叠加，支持拖拽定位、字号/颜色/粗细编辑
 *      Multi-layer text overlay with draggable positioning.
 *   3. 裁剪 — react-easy-crop 正方形裁剪 + 缩放控制
 *      Square cropping via react-easy-crop with zoom control.
 *
 * 渲染管线 / Render pipeline:
 *   白色背景 → 裁剪后图像（应用 ctx.filter）→ 文字层（ctx.fillText）
 *   → getImageData → onEdit(像素矩阵)
 *   White bg → cropped image (ctx.filter) → text layers (ctx.fillText)
 *   → getImageData → onEdit(pixel matrix)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { Sliders, Type, Crop, RotateCcw, Plus, Trash2, GripVertical } from 'lucide-react';
import type { 像素矩阵类型 } from '../lib/Pnt二进制引擎';

// ---- 类型定义 / Type definitions ----

/** 图像调整参数 / Image adjustment parameters（对应 CSS filter 函数 / maps to CSS filter functions） */
interface 调整参数类型 {
  brightness: number;   // 亮度 0-200
  contrast: number;     // 对比度 0-200
  saturate: number;     // 饱和度 0-200
  hue: number;          // 色相旋转 0-360
  sepia: number;        // 棕褐色 0-100
  blur: number;         // 模糊 0-10
  invert: number;       // 反色 0-100
}

/** 文字层 / Text layer */
interface 文字层类型 {
  id: number;
  文本: string;
  字号: number;        // 12-120
  颜色: string;        // hex 颜色 / hex color
  粗体: boolean;
  x: number;           // canvas 坐标（目标尺寸坐标系）/ canvas coords (target-size space)
  y: number;
}

/** 裁剪区域（百分比）/ Crop area (percentage of natural image) */
interface 裁剪区域类型 {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface 图像编辑器属性 {
  图像源: HTMLImageElement;
  目标尺寸: number;
  onEdit: (像素: 像素矩阵类型) => void;
}

// ---- 常量 / Constants ----

const 默认参数: 调整参数类型 = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hue: 0,
  sepia: 0,
  blur: 0,
  invert: 0,
};

interface 调整项配置 {
  key: keyof 调整参数类型;
  标签: string;
  min: number;
  max: number;
  step: number;
  单位: string;
}

/** 调整项滑块配置 / Slider config for each adjustment */
const 调整项列表: 调整项配置[] = [
  { key: 'brightness', 标签: '亮度', min: 0, max: 200, step: 1, 单位: '%' },
  { key: 'contrast', 标签: '对比度', min: 0, max: 200, step: 1, 单位: '%' },
  { key: 'saturate', 标签: '饱和度', min: 0, max: 200, step: 1, 单位: '%' },
  { key: 'hue', 标签: '色相旋转', min: 0, max: 360, step: 1, 单位: '°' },
  { key: 'sepia', 标签: '棕褐色', min: 0, max: 100, step: 1, 单位: '%' },
  { key: 'blur', 标签: '模糊', min: 0, max: 10, step: 0.1, 单位: 'px' },
  { key: 'invert', 标签: '反色', min: 0, max: 100, step: 1, 单位: '%' },
];

type 标签页类型 = '调整' | '文字' | '裁剪';

/** 统一字体栈 / Unified font stack（与全局保持一致 / matches global stack） */
const 字体栈 = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif';

/**
 * 计算滑块填充背景 / Compute slider fill background
 * 用于自定义滑块的已填充进度渐变 / Drives the filled-portion gradient of custom sliders.
 */
function 滑块填充(值: number, min: number, max: number): string {
  const pct = ((值 - min) / (max - min)) * 100;
  return `linear-gradient(to right, #22d3ee 0%, #22d3ee ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`;
}

export function 图像编辑器({ 图像源, 目标尺寸, onEdit }: 图像编辑器属性) {
  const canvas引用 = useRef<HTMLCanvasElement>(null);
  // 保持最新的 onEdit 引用，避免其变化触发重渲染 / Keep latest onEdit without re-render
  const onEdit引用 = useRef(onEdit);
  useEffect(() => {
    onEdit引用.current = onEdit;
  }, [onEdit]);

  // ID 生成器 / ID generator for text layers
  const 下一个ID引用 = useRef(1);
  // rAF 句柄 / requestAnimationFrame handle（防抖渲染 / debounce renders）
  const raf引用 = useRef<number | null>(null);

  // ---- 状态 / State ----
  const [参数, set参数] = useState<调整参数类型>(默认参数);
  const [文字层列表, set文字层列表] = useState<文字层类型[]>([]);
  const [选中文字ID, set选中文字ID] = useState<number | null>(null);
  const [当前标签页, set当前标签页] = useState<标签页类型>('调整');
  const [文字输入, set文字输入] = useState('');

  // 裁剪状态 / Crop state
  const [裁剪位置, set裁剪位置] = useState({ x: 0, y: 0 });
  const [缩放, set缩放] = useState(1);
  const [裁剪区域, set裁剪区域] = useState<裁剪区域类型 | null>(null);

  // 拖拽状态 / Drag state
  const [拖拽, set拖拽] = useState<{ id: number; 偏移x: number; 偏移y: number } | null>(null);

  const 选中层 = 文字层列表.find((l) => l.id === 选中文字ID) ?? null;
  const 已调整 = JSON.stringify(参数) !== JSON.stringify(默认参数);

  // ---- 渲染画布 / Render canvas ----
  const 渲染画布 = useCallback(() => {
    const 画布 = canvas引用.current;
    if (!画布) return;
    画布.width = 目标尺寸;
    画布.height = 目标尺寸;
    const ctx = 画布.getContext('2d');
    if (!ctx) return;

    // 1. 白色背景 / White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 目标尺寸, 目标尺寸);

    // 2. 计算裁剪源区域（像素）/ Compute crop source region in pixels
    const 自然宽 = 图像源.naturalWidth || 图像源.width;
    const 自然高 = 图像源.naturalHeight || 图像源.height;
    let sx: number, sy: number, sw: number, sh: number;
    if (裁剪区域) {
      sx = 裁剪区域.x * 自然宽;
      sy = 裁剪区域.y * 自然高;
      sw = 裁剪区域.width * 自然宽;
      sh = 裁剪区域.height * 自然高;
    } else {
      // 未裁剪时取居中正方形 / Centered square when no crop set
      const 边 = Math.min(自然宽, 自然高);
      sx = (自然宽 - 边) / 2;
      sy = (自然高 - 边) / 2;
      sw = 边;
      sh = 边;
    }

    // 3. 应用滤镜绘制图像 / Draw image with CSS filter
    ctx.filter =
      `brightness(${参数.brightness}%) contrast(${参数.contrast}%) ` +
      `saturate(${参数.saturate}%) hue-rotate(${参数.hue}deg) ` +
      `sepia(${参数.sepia}%) blur(${参数.blur}px) invert(${参数.invert}%)`;
    ctx.drawImage(图像源, sx, sy, sw, sh, 0, 0, 目标尺寸, 目标尺寸);
    ctx.filter = 'none';

    // 4. 绘制文字层 / Draw text layers
    for (const 层 of 文字层列表) {
      ctx.font = `${层.粗体 ? 'bold ' : ''}${层.字号}px ${字体栈}`;
      ctx.fillStyle = 层.颜色;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(层.文本, 层.x, 层.y);
    }

    // 5. 输出像素矩阵（须在绘制选区之前取像素）/ Output pixels before drawing selection overlay
    const 图像数据 = ctx.getImageData(0, 0, 目标尺寸, 目标尺寸);
    onEdit引用.current({
      宽度: 目标尺寸,
      高度: 目标尺寸,
      数据: 图像数据.data,
    });

    // 6. 绘制选中文字层选区（仅显示，不进入输出）/ Selection overlay (display only)
    if (选中文字ID !== null) {
      const 层 = 文字层列表.find((l) => l.id === 选中文字ID);
      if (层) {
        ctx.font = `${层.粗体 ? 'bold ' : ''}${层.字号}px ${字体栈}`;
        const 宽 = ctx.measureText(层.文本).width;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(层.x - 2, 层.y - 2, 宽 + 4, 层.字号 + 4);
        ctx.setLineDash([]);
      }
    }
  }, [目标尺寸, 图像源, 裁剪区域, 参数, 文字层列表, 选中文字ID]);

  // ---- 参数变化时通过 rAF 防抖重渲染 / Debounce re-render via rAF ----
  useEffect(() => {
    if (raf引用.current !== null) cancelAnimationFrame(raf引用.current);
    raf引用.current = requestAnimationFrame(() => {
      raf引用.current = null;
      渲染画布();
    });
    return () => {
      if (raf引用.current !== null) {
        cancelAnimationFrame(raf引用.current);
        raf引用.current = null;
      }
    };
  }, [渲染画布]);

  // ---- 裁剪完成回调 / Crop complete callback ----
  // react-easy-crop 返回百分比区域 croppedArea 与像素区域 croppedAreaPixels
  // 此处使用百分比区域，像素区域仅作参考故加下划线前缀
  const 处理裁剪完成 = useCallback(
    (区域: 裁剪区域类型, _区域像素: 裁剪区域类型) => {
      set裁剪区域(区域);
    },
    []
  );

  // ---- 文字层操作 / Text layer operations ----
  const 添加文字层 = useCallback(() => {
    const 默认字号 = Math.min(120, Math.max(12, Math.round(目标尺寸 * 0.12)));
    const 新层: 文字层类型 = {
      id: 下一个ID引用.current++,
      文本: 文字输入.trim() || '双击编辑文字',
      字号: 默认字号,
      颜色: '#ffffff',
      粗体: false,
      x: Math.round(目标尺寸 * 0.2),
      y: Math.round(目标尺寸 * 0.42),
    };
    set文字层列表((prev) => [...prev, 新层]);
    set选中文字ID(新层.id);
    set文字输入('');
  }, [文字输入, 目标尺寸]);

  const 删除文字层 = useCallback((id: number) => {
    set文字层列表((prev) => prev.filter((l) => l.id !== id));
    set选中文字ID((cur) => (cur === id ? null : cur));
  }, []);

  const 更新文字层 = useCallback((id: number, 更新: Partial<文字层类型>) => {
    set文字层列表((prev) => prev.map((l) => (l.id === id ? { ...l, ...更新 } : l)));
  }, []);

  const 重置参数 = useCallback(() => set参数(默认参数), []);

  const 处理参数变化 = useCallback((key: keyof 调整参数类型, 值: number) => {
    set参数((prev) => ({ ...prev, [key]: 值 }));
  }, []);

  // ---- 文字拖拽 / Text dragging ----
  const 取画布坐标 = useCallback((clientX: number, clientY: number) => {
    const 画布 = canvas引用.current;
    if (!画布) return { x: 0, y: 0 };
    const rect = 画布.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 画布.width,
      y: ((clientY - rect.top) / rect.height) * 画布.height,
    };
  }, []);

  const 命中文字层 = useCallback((x: number, y: number): number | null => {
    const 画布 = canvas引用.current;
    const ctx = 画布?.getContext('2d');
    if (!画布 || !ctx) return null;
    // 从顶层（数组末尾）往下命中 / Top-most layer first
    for (let i = 文字层列表.length - 1; i >= 0; i--) {
      const 层 = 文字层列表[i];
      ctx.font = `${层.粗体 ? 'bold ' : ''}${层.字号}px ${字体栈}`;
      const 宽 = ctx.measureText(层.文本).width;
      if (x >= 层.x && x <= 层.x + 宽 && y >= 层.y && y <= 层.y + 层.字号) {
        return 层.id;
      }
    }
    return null;
  }, [文字层列表]);

  const 处理画布按下 = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (当前标签页 !== '文字') return;
    const { x, y } = 取画布坐标(e.clientX, e.clientY);
    const id = 命中文字层(x, y);
    if (id !== null) {
      set选中文字ID(id);
      const 层 = 文字层列表.find((l) => l.id === id);
      if (层) {
        set拖拽({ id, 偏移x: x - 层.x, 偏移y: y - 层.y });
      }
    } else {
      set选中文字ID(null);
    }
  }, [当前标签页, 取画布坐标, 命中文字层, 文字层列表]);

  // 拖拽期间监听全局 mousemove/mouseup / Global listeners while dragging
  useEffect(() => {
    if (!拖拽) return;
    const 移动 = (e: MouseEvent) => {
      const { x, y } = 取画布坐标(e.clientX, e.clientY);
      set文字层列表((prev) =>
        prev.map((l) =>
          l.id === 拖拽.id ? { ...l, x: x - 拖拽.偏移x, y: y - 拖拽.偏移y } : l
        )
      );
    };
    const 抬起 = () => set拖拽(null);
    window.addEventListener('mousemove', 移动);
    window.addEventListener('mouseup', 抬起);
    return () => {
      window.removeEventListener('mousemove', 移动);
      window.removeEventListener('mouseup', 抬起);
    };
  }, [拖拽, 取画布坐标]);

  // ---- 渲染 / Render ----
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4 shadow-2xl backdrop-blur-xl md:p-5">
      {/* 自定义滑块样式 / Custom slider styles（组件自包含 / self-contained） */}
      <style>{`
        .editor-range{ -webkit-appearance:none; appearance:none; height:4px; border-radius:9999px; background:rgba(255,255,255,0.12); outline:none; cursor:pointer; }
        .editor-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:14px; height:14px; border-radius:50%; background:#22d3ee; cursor:grab; border:none; box-shadow:0 0 0 3px rgba(34,211,238,0.18), 0 2px 6px rgba(0,0,0,0.5); transition:transform .15s ease, box-shadow .15s ease; }
        .editor-range::-webkit-slider-thumb:hover{ transform:scale(1.18); box-shadow:0 0 0 5px rgba(34,211,238,0.22), 0 2px 8px rgba(0,0,0,0.55); }
        .editor-range::-webkit-slider-thumb:active{ cursor:grabbing; transform:scale(1.1); }
        .editor-range::-moz-range-thumb{ width:14px; height:14px; border-radius:50%; background:#22d3ee; cursor:grab; border:none; box-shadow:0 0 0 3px rgba(34,211,238,0.18), 0 2px 6px rgba(0,0,0,0.5); }
        .editor-range::-moz-range-track{ background:transparent; }
      `}</style>

      {/* 标题栏 / Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/20">
            <Sliders className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">图像编辑器</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          {已调整 && (
            <span className="flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              已调整
            </span>
          )}
          {文字层列表.length > 0 && (
            <span className="rounded-full bg-white/5 px-2 py-0.5">
              {文字层列表.length} 文字层
            </span>
          )}
          <span className="font-mono tabular-nums">{目标尺寸}×{目标尺寸}</span>
        </div>
      </div>

      {/* 画布舞台 / Canvas stage */}
      <div className="relative mx-auto mb-4 aspect-square w-full max-w-[340px]">
        {/* 辉光 / Glow */}
        <div className="absolute -inset-3 rounded-[1.75rem] bg-cyan-500/10 blur-2xl" />
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
          <canvas
            ref={canvas引用}
            onMouseDown={处理画布按下}
            className="block h-full w-full select-none"
            style={{
              imageRendering: 'auto',
              cursor: 当前标签页 === '文字' ? (拖拽 ? 'grabbing' : 'move') : 'default',
            }}
          />
          {/* 尺寸徽章 / Size badge */}
          <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            <span className="font-mono text-[10px] tabular-nums text-zinc-300">
              {目标尺寸}×{目标尺寸}
            </span>
          </div>
          {/* 文字模式提示 / Text-mode hint */}
          {当前标签页 === '文字' && 文字层列表.length > 0 && (
            <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur">
              <span className="text-[10px] text-zinc-300">拖拽文字调整位置</span>
            </div>
          )}
        </div>
      </div>

      {/* 标签栏 / Tab bar */}
      <div className="mb-4 flex gap-1 rounded-xl bg-white/5 p-1">
        {([
          { key: '调整' as const, 标签: '调整' },
          { key: '文字' as const, 标签: '文字' },
          { key: '裁剪' as const, 标签: '裁剪' },
        ]).map((t) => {
          const 激活 = 当前标签页 === t.key;
          return (
            <button
              key={t.key}
              onClick={() => set当前标签页(t.key)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                激活 ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {激活 && (
                <motion.div
                  layoutId="editor-tab"
                  className="absolute inset-0 rounded-lg bg-white/10 ring-1 ring-inset ring-white/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {t.key === '调整' && <Sliders className="h-3.5 w-3.5" />}
                {t.key === '文字' && <Type className="h-3.5 w-3.5" />}
                {t.key === '裁剪' && <Crop className="h-3.5 w-3.5" />}
                {t.标签}
              </span>
            </button>
          );
        })}
      </div>

      {/* 标签内容 / Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={当前标签页}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {/* ===== 调整 / Adjust ===== */}
          {当前标签页 === '调整' && (
            <div className="space-y-3.5">
              {调整项列表.map((项) => {
                const 值 = 参数[项.key];
                return (
                  <div key={项.key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-400">{项.标签}</label>
                      <span className="font-mono text-xs tabular-nums text-cyan-300">
                        {项.step < 1 ? 值.toFixed(1) : 值}
                        {项.单位}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={项.min}
                      max={项.max}
                      step={项.step}
                      value={值}
                      onChange={(e) => 处理参数变化(项.key, parseFloat(e.target.value))}
                      className="editor-range w-full"
                      style={{ background: 滑块填充(值, 项.min, 项.max) }}
                    />
                  </div>
                );
              })}
              <motion.button
                onClick={重置参数}
                disabled={!已调整}
                whileTap={{ scale: 0.97 }}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium transition-all ${
                  已调整
                    ? 'bg-white/5 text-zinc-200 hover:bg-white/10'
                    : 'cursor-not-allowed bg-white/5 text-zinc-600'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重置全部参数
              </motion.button>
            </div>
          )}

          {/* ===== 文字 / Text ===== */}
          {当前标签页 === '文字' && (
            <div className="space-y-3">
              {/* 添加文字 / Add text */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={文字输入}
                  onChange={(e) => set文字输入(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') 添加文字层();
                  }}
                  placeholder="输入文字后添加..."
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                />
                <motion.button
                  onClick={添加文字层}
                  whileTap={{ scale: 0.95 }}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加
                </motion.button>
              </div>

              {/* 选中层编辑控件 / Selected layer controls */}
              {选中层 ? (
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <input
                    type="text"
                    value={选中层.文本}
                    onChange={(e) => 更新文字层(选中层.id, { 文本: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-zinc-950/50 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-cyan-400/50 focus:outline-none"
                  />

                  {/* 字号 / Font size */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-400">字号</label>
                      <span className="font-mono text-xs tabular-nums text-cyan-300">
                        {选中层.字号}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={120}
                      step={1}
                      value={选中层.字号}
                      onChange={(e) =>
                        更新文字层(选中层.id, { 字号: parseInt(e.target.value, 10) })
                      }
                      className="editor-range w-full"
                      style={{ background: 滑块填充(选中层.字号, 12, 120) }}
                    />
                  </div>

                  {/* 颜色 + 粗细 / Color + weight */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-400">颜色</span>
                      <input
                        type="color"
                        value={选中层.颜色}
                        onChange={(e) => 更新文字层(选中层.id, { 颜色: e.target.value })}
                        className="h-8 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent p-0.5"
                      />
                    </label>
                    <div className="flex rounded-lg bg-white/5 p-0.5">
                      {([false, true] as const).map((粗) => (
                        <button
                          key={String(粗)}
                          onClick={() => 更新文字层(选中层.id, { 粗体: 粗 })}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                            选中层.粗体 === 粗
                              ? 'bg-cyan-500 text-white'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {粗 ? '粗体' : '正常'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    提示：在画布上拖拽文字调整位置
                  </p>
                </div>
              ) : (
                <p className="rounded-xl bg-white/5 p-3 text-center text-xs text-zinc-500">
                  添加或选中文字层以编辑属性
                </p>
              )}

              {/* 文字层列表 / Layer list */}
              {文字层列表.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-zinc-400">
                    文字层（{文字层列表.length}）
                  </p>
                  <div className="space-y-1.5">
                    {文字层列表.map((层) => {
                      const 选中 = 层.id === 选中文字ID;
                      return (
                        <div
                          key={层.id}
                          onClick={() => set选中文字ID(层.id)}
                          className={`group flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors ${
                            选中
                              ? 'border-cyan-400/40 bg-cyan-500/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <GripVertical className="h-4 w-4 shrink-0 text-zinc-500" />
                          <span
                            className="h-3 w-3 shrink-0 rounded-sm border border-white/20"
                            style={{ backgroundColor: 层.颜色 }}
                          />
                          <span className="flex-1 truncate text-xs text-zinc-200">
                            {层.文本 || '(空文字)'}
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                            {层.字号}px
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              删除文字层(层.id);
                            }}
                            className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== 裁剪 / Crop ===== */}
          {当前标签页 === '裁剪' && (
            <div className="space-y-3">
              <div className="relative h-56 w-full overflow-hidden rounded-xl bg-zinc-950">
                <Cropper
                  image={图像源.src}
                  crop={裁剪位置}
                  zoom={缩放}
                  aspect={1}
                  onCropChange={set裁剪位置}
                  onZoomChange={set缩放}
                  onCropComplete={处理裁剪完成}
                  cropShape="rect"
                  showGrid
                  restrictPosition
                />
                <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur">
                  <Crop className="h-3 w-3 text-cyan-400" />
                  <span className="text-[10px] text-zinc-300">拖动调整裁剪区域</span>
                </div>
              </div>

              {/* 缩放 / Zoom */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-400">缩放</label>
                  <span className="font-mono text-xs tabular-nums text-cyan-300">
                    {缩放.toFixed(1)}×
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={缩放}
                  onChange={(e) => set缩放(parseFloat(e.target.value))}
                  className="editor-range w-full"
                  style={{ background: 滑块填充(缩放, 1, 3) }}
                />
              </div>

              <p className="text-[11px] leading-relaxed text-zinc-500">
                裁剪结果实时同步至上方预览，正方形比例锁定为 1:1。
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
