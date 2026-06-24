/**
 * 方舟画布预览组件 / ARK Canvas Preview Component
 * ================================================================
 * 实时显示抖动量化后的方舟像素画，支持鼠标悬停查看染料名称。
 * Real-time display of dithered ARK pixel art, with hover dye name tooltip.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import type { 像素矩阵类型 } from '../lib/Pnt二进制引擎';
import { 方舟颜色列表, type 方舟颜色类型 } from '../lib/染料调色板';

/**
 * RGB → 颜色对象 快速映射表 / Fast RGB → color object map
 * 键格式 "r,g,b"，用于 O(1) 悬停查找。
 * Key format "r,g,b", for O(1) hover lookup.
 * 注意：重复 RGB 会取第一个匹配（如白色有多个 ID）。
 * Note: Duplicate RGB takes first match (e.g., white has multiple IDs).
 */
const RGB到颜色映射: Map<string, 方舟颜色类型> = new Map(
  方舟颜色列表.map((颜色) => [`${颜色.红},${颜色.绿},${颜色.蓝}`, 颜色])
);

// 透明色常量 / Transparent color constant
const 透明色: 方舟颜色类型 = {
  编号: 0,
  中文名: '透明',
  英文名: 'Transparent',
  红: 0,
  绿: 0,
  蓝: 0,
  透明: true,
};

interface 方舟画布预览属性 {
  像素矩阵: 像素矩阵类型 | null;    // 量化后的像素矩阵 / Quantized pixel matrix
  显示尺寸?: number;                // 显示边长（默认 256）/ Display size
}

export function 方舟画布预览({ 像素矩阵, 显示尺寸 = 256 }: 方舟画布预览属性) {
  const canvas引用 = useRef<HTMLCanvasElement>(null);
  // 悬停的颜色信息 / Hovered color info
  const [悬停染料, set悬停染料] = useState<{
    染料: 方舟颜色类型;
    x: number;
    y: number;
  } | null>(null);

  // 绘制像素到画布 / Draw pixels to canvas
  const 绘制画布 = useCallback(() => {
    const 画布 = canvas引用.current;
    if (!画布 || !像素矩阵) return;

    画布.width = 像素矩阵.宽度;
    画布.height = 像素矩阵.高度;
    const 上下文 = 画布.getContext('2d')!;
    const 图像数据 = new ImageData(像素矩阵.数据, 像素矩阵.宽度, 像素矩阵.高度);
    上下文.putImageData(图像数据, 0, 0);
  }, [像素矩阵]);

  // 像素矩阵变化时重绘 / Redraw on pixel matrix change
  useEffect(() => {
    绘制画布();
  }, [绘制画布]);

  // 鼠标悬停查找染料 / Mouse hover to find dye
  const 处理鼠标移动 = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!像素矩阵 || !canvas引用.current) return;
      const 画布 = canvas引用.current;
      const 边界矩形 = 画布.getBoundingClientRect();
      // 计算像素坐标 / Compute pixel coordinates
      const x = Math.floor(((event.clientX - 边界矩形.left) / 边界矩形.width) * 像素矩阵.宽度);
      const y = Math.floor(((event.clientY - 边界矩形.top) / 边界矩形.height) * 像素矩阵.高度);

      if (x < 0 || x >= 像素矩阵.宽度 || y < 0 || y >= 像素矩阵.高度) {
        set悬停染料(null);
        return;
      }

      const 索引 = (y * 像素矩阵.宽度 + x) * 4;
      const R = 像素矩阵.数据[索引 + 0];
      const G = 像素矩阵.数据[索引 + 1];
      const B = 像素矩阵.数据[索引 + 2];
      const A = 像素矩阵.数据[索引 + 3];

      // 透明像素 / Transparent pixel
      if (A === 0) {
        set悬停染料({
          染料: 透明色,
          x: event.clientX - 边界矩形.left,
          y: event.clientY - 边界矩形.top,
        });
        return;
      }

      // 通过 RGB 映射表快速查找颜色 / Fast color lookup via RGB map
      const 匹配颜色 = RGB到颜色映射.get(`${R},${G},${B}`);
      if (匹配颜色) {
        set悬停染料({
          染料: 匹配颜色,
          x: event.clientX - 边界矩形.left,
          y: event.clientY - 边界矩形.top,
        });
      }
    },
    [像素矩阵]
  );

  const 处理鼠标离开 = useCallback(() => {
    set悬停染料(null);
  }, []);

  return (
    <div className="space-y-3">
      {/* 标题栏 / Title bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">方舟画布预览</span>
        </div>
        {像素矩阵 && (
          <span className="text-xs text-gray-400">
            {像素矩阵.宽度} × {像素矩阵.高度}
          </span>
        )}
      </div>

      {/* 画布容器 / Canvas container */}
      <div className="relative flex items-center justify-center rounded-2xl bg-gray-50 p-4">
        {像素矩阵 ? (
          <motion.div
            key={`${像素矩阵.宽度}-${像素矩阵.高度}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
            style={{ width: 显示尺寸, height: 显示尺寸 }}
          >
            <canvas
              ref={canvas引用}
              onMouseMove={处理鼠标移动}
              onMouseLeave={处理鼠标离开}
              className="pixel-canvas h-full w-full rounded-lg border border-gray-200 shadow-sm"
              style={{
                imageRendering: 'pixelated',
                cursor: 'crosshair',
              }}
            />

            {/* 悬停染料提示框 / Hover dye tooltip */}
            {悬停染料 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-none absolute z-10 flex items-center gap-2 rounded-lg bg-gray-900/90 px-2.5 py-1.5 backdrop-blur-apple"
                style={{
                  left: Math.min(悬停染料.x + 12, 显示尺寸 - 140),
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
          </motion.div>
        ) : (
          // 空状态 / Empty state
          <div className="flex h-48 flex-col items-center justify-center text-gray-400">
            <Palette className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">上传图片后此处显示量化预览</p>
          </div>
        )}
      </div>

      {/* 染料使用统计 / Dye usage stats */}
      {像素矩阵 && <染料使用统计 像素矩阵={像素矩阵} />}
    </div>
  );
}

/**
 * 染料使用统计子组件 / Dye usage statistics sub-component
 */
function 染料使用统计({ 像素矩阵 }: { 像素矩阵: 像素矩阵类型 }) {
  const 统计 = useCallback(() => {
    const 计数 = new Map<string, number>();
    for (let i = 0; i < 像素矩阵.数据.length; i += 4) {
      const A = 像素矩阵.数据[i + 3];
      if (A === 0) continue;
      const R = 像素矩阵.数据[i + 0];
      const G = 像素矩阵.数据[i + 1];
      const B = 像素矩阵.数据[i + 2];
      const 键 = `${R},${G},${B}`;
      计数.set(键, (计数.get(键) ?? 0) + 1);
    }

    // 转换为颜色列表 / Convert to color list
    const 列表 = Array.from(计数.entries())
      .map(([键, 数量]) => {
        const 染料 = RGB到颜色映射.get(键);
        return { 染料, 数量 };
      })
      .filter((项) => 项.染料)
      .sort((a, b) => b.数量 - a.数量);

    return 列表.slice(0, 8); // 仅显示前 8 种 / Show top 8
  }, [像素矩阵]);

  const 染料列表 = 统计();
  const 总像素 = 像素矩阵.宽度 * 像素矩阵.高度;

  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="mb-2 text-xs font-medium text-gray-500">
        染料使用 Top {染料列表.length}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {染料列表.map(({ 染料, 数量 }) => (
          <div
            key={染料!.编号}
            className="group relative flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm"
            title={`${染料!.中文名} · ${((数量 / 总像素) * 100).toFixed(1)}%`}
          >
            <div
              className="h-3 w-3 rounded-full border border-gray-200"
              style={{ backgroundColor: `rgb(${染料!.红}, ${染料!.绿}, ${染料!.蓝})` }}
            />
            <span className="text-[10px] text-gray-600">{染料!.中文名}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
