/**
 * 交互式裁剪预览组件 / Interactive Crop & Preview Component
 * ================================================================
 * 集成 react-easy-crop 裁剪器，实时输出裁剪后像素矩阵并触发量化预览。
 * Integrates react-easy-crop, outputs cropped pixels in real-time
 * and triggers quantization preview.
 */

import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'framer-motion';
import { Crop, ZoomIn } from 'lucide-react';
import type { 像素矩阵类型 } from '../lib/Pnt二进制引擎';
import { 裁剪像素矩阵 } from '../lib/图像工具';

interface 裁剪预览属性 {
  图像源: HTMLImageElement;                          // 待裁剪图像 / Image to crop
  目标尺寸: number;                                  // 目标边长（正方形）/ Target side length
  抖动强度: number;                                  // 抖动强度 0-1 / Dithering strength
  onCropped: (像素: 像素矩阵类型) => void;           // 裁剪结果回调 / Crop result callback
}

/**
 * 从裁剪区域生成像素矩阵 / Generate pixel matrix from crop area
 * react-easy-crop 的 croppedArea 是百分比坐标，需转换为像素坐标。
 * react-easy-crop's croppedArea is in percentage, convert to pixel.
 */
async function 生成裁剪像素(
  图像: HTMLImageElement,
  裁剪区域: { x: number; y: number; width: number; height: number }
): Promise<像素矩阵类型> {
  // 将百分比转为像素 / Convert percentage to pixels
  const x = 裁剪区域.x * 图像.naturalWidth;
  const y = 裁剪区域.y * 图像.naturalHeight;
  const 宽度 = 裁剪区域.width * 图像.naturalWidth;
  const 高度 = 裁剪区域.height * 图像.naturalHeight;

  // 先绘制到画布提取像素 / Draw to canvas to extract pixels
  const 画布 = document.createElement('canvas');
  画布.width = 图像.naturalWidth;
  画布.height = 图像.naturalHeight;
  const 上下文 = 画布.getContext('2d')!;
  上下文.drawImage(图像, 0, 0);
  const 完整像素 = 上下文.getImageData(0, 0, 画布.width, 画布.height);

  // 裁剪 / Crop
  return 裁剪像素矩阵(
    { 宽度: 画布.width, 高度: 画布.height, 数据: 完整像素.data },
    x, y, 宽度, 高度
  );
}

export function 裁剪预览({
  图像源,
  目标尺寸,
  抖动强度,
  onCropped,
}: 裁剪预览属性) {
  // 裁剪位置 / Crop position
  const [裁剪位置, set裁剪位置] = useState({ x: 0, y: 0 });
  // 缩放比例 / Zoom level
  const [缩放, set缩放] = useState(1);
  // 裁剪区域（百分比）/ Cropped area (percentage)
  const [裁剪区域, set裁剪区域] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // 裁剪完成回调 / Crop complete callback
  // react-easy-crop 返回两个值：croppedArea（百分比）与 croppedAreaPixels（像素）
  // 此处使用百分比坐标 croppedArea，croppedAreaPixels 仅作调试参考故加下划线前缀
  const onCropComplete = useCallback(
    (croppedArea: { x: number; y: number; width: number; height: number }, _croppedAreaPixels: any) => {
      set裁剪区域(croppedArea);
    },
    []
  );

  // 当裁剪区域、目标尺寸或抖动强度变化时，重新生成像素 / Regenerate pixels on change
  useEffect(() => {
    if (!裁剪区域) return;

    // 异步生成裁剪像素 / Async generate cropped pixels
    let 取消 = false;
    (async () => {
      try {
        const 像素 = await 生成裁剪像素(图像源, 裁剪区域);
        if (!取消) {
          onCropped(像素);
        }
      } catch (错误) {
        console.error('裁剪失败 / Crop failed:', 错误);
      }
    })();

    return () => { 取消 = true; };
  }, [裁剪区域, 图像源, 目标尺寸, 抖动强度, onCropped]);

  return (
    <div className="space-y-4">
      {/* 裁剪器容器 / Cropper container */}
      <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-gray-900 md:h-80">
        <Cropper
          image={图像源.src}
          crop={裁剪位置}
          zoom={缩放}
          aspect={1}                    // 正方形裁剪 / Square crop
          onCropChange={set裁剪位置}
          onZoomChange={set缩放}
          onCropComplete={onCropComplete}
          cropShape="rect"
          showGrid={true}
          restrictPosition={true}
        />

        {/* 顶部信息条 / Top info bar */}
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-apple">
          <Crop className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-medium text-white">拖动调整裁剪区域</span>
        </div>

        {/* 缩放控制 / Zoom control */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-apple">
          <ZoomIn className="h-3.5 w-3.5 text-white" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={缩放}
            onChange={(e) => set缩放(parseFloat(e.target.value))}
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30"
          />
          <span className="text-xs font-medium text-white">{缩放.toFixed(1)}×</span>
        </div>
      </div>

      {/* 目标尺寸提示 / Target size hint */}
      <motion.div
        key={`${目标尺寸}-${抖动强度}`}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5"
      >
        <span className="text-sm text-gray-600">输出尺寸</span>
        <span className="text-sm font-medium text-gray-900">
          {目标尺寸} × {目标尺寸} px
        </span>
      </motion.div>
    </div>
  );
}
