/**
 * 图像处理工具函数 / Image Processing Utility Functions
 * ================================================================
 */

import type { 像素矩阵类型 } from './Pnt二进制引擎';

/**
 * 从 File 对象加载图像 / Load image from File object
 * ================================================================
 * 注意：不立即撤销 Object URL，因为 react-easy-crop 需要通过 img.src 重新加载图像。
 * Note: Does NOT immediately revoke Object URL, because react-easy-crop needs
 * to reload the image via img.src. URL persists for component lifetime.
 *
 * @param 文件 - 图片文件 / Image file
 * @returns HTMLImageElement / Loaded image element
 * @throws 当文件不是有效图片时抛出 / Throws when file is not a valid image
 */
export function 从文件加载图像(文件: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // 校验文件类型 / Validate file type
    if (!文件.type.startsWith('image/')) {
      reject(new Error(`文件类型 ${文件.type} 不是图片 / File type is not image`));
      return;
    }

    const url = URL.createObjectURL(文件);
    const img = new Image();
    img.onload = () => {
      // 不撤销 URL，保持 img.src 可用 / Do NOT revoke URL, keep img.src usable
      // react-easy-crop 会通过 src 重新加载图像 / react-easy-crop reloads via src
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败 / Image load failed'));
    };
    img.src = url;
  });
}

/**
 * 从 HTMLImageElement 提取像素矩阵 / Extract pixel matrix from HTMLImageElement
 * ================================================================
 * @param img - 已加载的图像元素 / Loaded image element
 * @returns 像素矩阵 / Pixel matrix
 */
export function 从图像提取像素(img: HTMLImageElement): 像素矩阵类型 {
  const 画布 = document.createElement('canvas');
  画布.width = img.naturalWidth;
  画布.height = img.naturalHeight;
  const 上下文 = 画布.getContext('2d')!;
  上下文.drawImage(img, 0, 0);
  const 图像数据 = 上下文.getImageData(0, 0, 画布.width, 画布.height);
  return {
    宽度: 图像数据.width,
    高度: 图像数据.height,
    数据: 图像数据.data,
  };
}

/**
 * 裁剪像素矩阵 / Crop pixel matrix
 * ================================================================
 * @param 源像素 - 源像素矩阵 / Source pixel matrix
 * @param x - 裁剪起始 X / Crop start X
 * @param y - 裁剪起始 Y / Crop start Y
 * @param 宽度 - 裁剪宽度 / Crop width
 * @param 高度 - 裁剪高度 / Crop height
 * @returns 裁剪后的像素矩阵 / Cropped pixel matrix
 */
export function 裁剪像素矩阵(
  源像素: 像素矩阵类型,
  x: number, y: number, 宽度: number, 高度: number
): 像素矩阵类型 {
  // 边界钳制 / Boundary clamping
  const 起始X = Math.max(0, Math.floor(x));
  const 起始Y = Math.max(0, Math.floor(y));
  const 结束X = Math.min(源像素.宽度, 起始X + Math.floor(宽度));
  const 结束Y = Math.min(源像素.高度, 起始Y + Math.floor(高度));
  const 实际宽度 = 结束X - 起始X;
  const 实际高度 = 结束Y - 起始Y;

  if (实际宽度 <= 0 || 实际高度 <= 0) {
    throw new Error('裁剪区域无效 / Invalid crop region');
  }

  const 输出数据 = new Uint8ClampedArray(实际宽度 * 实际高度 * 4);
  for (let row = 0; row < 实际高度; row++) {
    for (let col = 0; col < 实际宽度; col++) {
      const 源索引 = ((起始Y + row) * 源像素.宽度 + (起始X + col)) * 4;
      const 目标索引 = (row * 实际宽度 + col) * 4;
      输出数据[目标索引 + 0] = 源像素.数据[源索引 + 0];
      输出数据[目标索引 + 1] = 源像素.数据[源索引 + 1];
      输出数据[目标索引 + 2] = 源像素.数据[源索引 + 2];
      输出数据[目标索引 + 3] = 源像素.数据[源索引 + 3];
    }
  }

  return { 宽度: 实际宽度, 高度: 实际高度, 数据: 输出数据 };
}

/**
 * 格式化字节数 / Format byte size
 * ================================================================
 * @param 字节 - 字节数 / Byte count
 * @returns 人类可读字符串 / Human-readable string
 */
export function 格式化字节(字节: number): string {
  if (字节 < 1024) return `${字节} B`;
  if (字节 < 1024 * 1024) return `${(字节 / 1024).toFixed(1)} KB`;
  return `${(字节 / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 防抖函数 / Debounce function
 * ================================================================
 * 用于裁剪实时预览，避免高频回调导致卡顿。
 * Used for crop real-time preview to avoid high-frequency callback lag.
 */
export function 防抖<参数类型 extends unknown[]>(
  函数: (...参数: 参数类型) => void,
  延迟毫秒: number
): (...参数: 参数类型) => void {
  let 定时器: ReturnType<typeof setTimeout> | null = null;
  return (...参数: 参数类型) => {
    if (定时器 !== null) clearTimeout(定时器);
    定时器 = setTimeout(() => 函数(...参数), 延迟毫秒);
  };
}
