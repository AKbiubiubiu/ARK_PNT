/**
 * 图像抖动量化引擎 / Image Dithering & Quantization Engine
 * ================================================================
 * 实现 Floyd-Steinberg 误差扩散抖动 + redmean 感知加权距离 + 预计算查找表。
 * Implements Floyd-Steinberg error diffusion + redmean perceptual weighted
 * distance + precomputed lookup table.
 *
 * 设计目标 / Design goals:
 *   - 画质：redmean 距离比纯欧氏距离更贴近人眼感知 / Better perceptual accuracy
 *   - 速度：查找表查表 O(1)，单帧 256×256 量化 < 3ms / O(1) lookup, <3ms per frame
 *   - 像素艺术感：误差扩散避免色块断层 / Error diffusion avoids banding
 */

import { 染料调色板, 染料总数, type 染料类型 } from './染料调色板';
import type { 像素矩阵类型 } from './Pnt二进制引擎';

/**
 * 查找表量化位深 / Lookup table quantization bit depth
 * 每通道量化为 5 位（32 级），查找表总大小 32×32×32 = 32768 项，约 32KB。
 * Quantize each channel to 5 bits (32 levels), lookup table total 32768 entries, ~32KB.
 */
const 查找表位深 = 5;
const 查找表每通道级数 = 1 << 查找表位深; // 32 / 32 levels per channel
const 查找表掩码 = 查找表每通道级数 - 1;   // 0x1F / mask 0x1F

/**
 * 预计算查找表 / Precomputed lookup table
 * 索引方式：(R量化 << 10) | (G量化 << 5) | B量化
 * Index: (RQuantized << 10) | (GQuantized << 5) | BQuantized
 * 值为对应染料在 染料调色板 中的索引。
 * Value is the dye index in the palette.
 */
let 预计算查找表: Int8Array | null = null;

/**
 * 将 0-255 的通道值量化为 5 位（0-31）/ Quantize 0-255 channel to 5 bits (0-31)
 * 使用 >> 3 右移，等价于除以 8。
 * Uses >> 3 right shift, equivalent to dividing by 8.
 */
function 量化通道(值: number): number {
  return (值 >> 3) & 查找表掩码;
}

/**
 * 计算感知加权距离平方（redmean 算法）/ Compute perceptual weighted distance squared (redmean)
 * ================================================================
 * 公式来源：https://en.wikipedia.org/wiki/Color_difference
 *   r̄ = (R₁ + R₂) / 2
 *   ΔR = (2 + r̄/256) × (R₁−R₂)²
 *   ΔG = 4 × (G₁−G₂)²
 *   ΔB = (2 + (255−r̄)/256) × (B₁−B₂)²
 *   距离² = ΔR + ΔG + ΔB
 *
 * 返回平方距离以避免开方运算，提升性能。
 * Returns squared distance to avoid sqrt, improving performance.
 */
function 计算感知距离平方(
  R1: number, G1: number, B1: number,
  R2: number, G2: number, B2: number
): number {
  // 平均红通道 / Average red channel
  const r均 = (R1 + R2) / 2;
  // 红通道差 / Red channel difference
  const dR = R1 - R2;
  const dG = G1 - G2;
  const dB = B1 - B2;
  // 加权计算 / Weighted calculation
  const ΔR = (2 + r均 / 256) * dR * dR;
  const ΔG = 4 * dG * dG;
  const ΔB = (2 + (255 - r均) / 256) * dB * dB;
  return ΔR + ΔG + ΔB;
}

/**
 * 暴力查找最近染料索引 / Brute-force find nearest dye index
 * ================================================================
 * 用于查找表预计算，遍历所有 25 种染料找最近邻。
 * Used for lookup table precomputation, iterates all 25 dyes to find nearest.
 *
 * @param R - 红通道 0-255 / Red 0-255
 * @param G - 绿通道 0-255 / Green 0-255
 * @param B - 蓝通道 0-255 / Blue 0-255
 * @returns 染料在调色板中的索引 / Dye index in palette
 */
function 查找最近染料索引(R: number, G: number, B: number): number {
  let 最近索引 = 0;
  let 最小距离 = Infinity;
  for (let i = 0; i < 染料总数; i++) {
    const 染料 = 染料调色板[i];
    const 距离 = 计算感知距离平方(R, G, B, 染料.红, 染料.绿, 染料.蓝);
    if (距离 < 最小距离) {
      最小距离 = 距离;
      最近索引 = i;
    }
  }
  return 最近索引;
}

/**
 * 初始化查找表 / Initialize lookup table
 * ================================================================
 * 预计算 32768 种量化颜色的最近染料索引。
 * Precompute nearest dye index for 32768 quantized colors.
 * 仅在首次调用时执行，后续直接查表。
 * Executes only on first call, subsequent calls use lookup.
 */
export function 初始化查找表(): void {
  // 已初始化则跳过 / Skip if already initialized
  if (预计算查找表 !== null) return;

  // 分配 32768 项 Int8Array（25 种染料索引 0-24，Int8 足够）
  // Allocate 32768-entry Int8Array (25 dye indices 0-24, Int8 sufficient)
  预计算查找表 = new Int8Array(查找表每通道级数 * 查找表每通道级数 * 查找表每通道级数);

  // 遍历所有量化颜色组合 / Iterate all quantized color combinations
  for (let r = 0; r < 查找表每通道级数; r++) {
    for (let g = 0; g < 查找表每通道级数; g++) {
      for (let b = 0; b < 查找表每通道级数; b++) {
        // 反量化回 0-255 范围（中心值）/ Dequantize back to 0-255 (center value)
        const R = (r << 3) | 4; // 中心值偏移 4 / Center offset 4
        const G = (g << 3) | 4;
        const B = (b << 3) | 4;
        // 查找最近染料 / Find nearest dye
        const 索引 = 查找最近染料索引(R, G, B);
        // 计算一维索引 / Compute 1D index
        const 一维索引 = (r << 10) | (g << 5) | b;
        预计算查找表[一维索引] = 索引;
      }
    }
  }
}

/**
 * 通过查找表快速查找最近染料 / Fast nearest dye lookup via lookup table
 * ================================================================
 * @param R - 红通道 0-255 / Red 0-255
 * @param G - 绿通道 0-255 / Green 0-255
 * @param B - 蓝通道 0-255 / Blue 0-255
 * @returns 染料对象 / Dye object
 */
function 通过查找表查找染料(R: number, G: number, B: number): 染料类型 {
  // 确保查找表已初始化 / Ensure lookup table is initialized
  if (预计算查找表 === null) {
    初始化查找表();
  }
  // 量化并计算索引 / Quantize and compute index
  const r = 量化通道(R);
  const g = 量化通道(G);
  const b = 量化通道(B);
  const 一维索引 = (r << 10) | (g << 5) | b;
  const 染料索引 = 预计算查找表![一维索引];
  return 染料调色板[染料索引];
}

/**
 * 执行 Floyd-Steinberg 误差扩散抖动量化 / Perform Floyd-Steinberg dithering
 * ================================================================
 * 算法流程 / Algorithm flow:
 *   1. 复制原始像素到工作缓冲区（Float32 防止误差累积溢出）
 *      Copy original pixels to working buffer (Float32 to avoid overflow)
 *   2. 逐像素通过查找表查找最近染料
 *      Per-pixel nearest dye lookup via lookup table
 *   3. 计算量化误差，按 7/16, 3/16, 5/16, 1/16 扩散至右、左下、下、右下邻居
 *      Compute quantization error, diffuse to neighbors with weights
 *   4. 透明像素（Alpha=0）跳过抖动，保持透明
 *      Transparent pixels (Alpha=0) skip dithering, remain transparent
 *
 * @param 原始像素 - 输入 RGBA 像素矩阵 / Input RGBA pixel matrix
 * @param 抖动强度 - 0-1，控制误差扩散幅度（0=无抖动，1=标准 FS）/ 0-1 dithering strength
 * @returns 量化后的 RGBA 像素矩阵 / Quantized RGBA pixel matrix
 * @throws 当输入无效时抛出错误 / Throws when input is invalid
 */
export function 执行抖动量化(
  原始像素: 像素矩阵类型,
  抖动强度: number = 1.0
): 像素矩阵类型 {
  // ---- 输入校验 / Input validation ----
  if (!原始像素 || !原始像素.数据) {
    throw new Error('原始像素矩阵无效 / Invalid input pixel matrix');
  }
  const { 宽度, 高度, 数据 } = 原始像素;
  if (宽度 <= 0 || 高度 <= 0) {
    throw new Error(`无效尺寸: ${宽度}×${高度} / Invalid dimensions`);
  }
  // 限制抖动强度在 0-1 范围 / Clamp dithering strength to 0-1
  const 强度 = Math.max(0, Math.min(1, 抖动强度));

  // ---- 确保查找表已初始化 / Ensure lookup table initialized ----
  初始化查找表();

  // ---- 创建工作缓冲区（Float32 防溢出）/ Create working buffer (Float32) ----
  const 像素总数 = 宽度 * 高度;
  const 工作缓冲区 = new Float32Array(像素总数 * 3); // 仅 RGB，A 单独处理 / RGB only, A separate
  // 复制原始 RGB 数据 / Copy original RGB data
  for (let i = 0; i < 像素总数; i++) {
    工作缓冲区[i * 3 + 0] = 数据[i * 4 + 0]; // R
    工作缓冲区[i * 3 + 1] = 数据[i * 4 + 1]; // G
    工作缓冲区[i * 3 + 2] = 数据[i * 4 + 2]; // B
  }

  // ---- 创建输出缓冲区 / Create output buffer ----
  const 输出数据 = new Uint8ClampedArray(数据.length);

  // ---- 逐像素处理 / Process each pixel ----
  for (let y = 0; y < 高度; y++) {
    for (let x = 0; x < 宽度; x++) {
      const 当前索引 = (y * 宽度 + x) * 3;
      const 当前像素索引 = (y * 宽度 + x) * 4;
      const 原始Alpha = 数据[当前像素索引 + 3];

      // 透明像素直接跳过，保持透明 / Transparent pixels skip, remain transparent
      if (原始Alpha === 0) {
        输出数据[当前像素索引 + 0] = 0;
        输出数据[当前像素索引 + 1] = 0;
        输出数据[当前像素索引 + 2] = 0;
        输出数据[当前像素索引 + 3] = 0;
        continue;
      }

      // 读取当前工作值（可能已被前像素误差修改）/ Read current working value
      let R = 工作缓冲区[当前索引 + 0];
      let G = 工作缓冲区[当前索引 + 1];
      let B = 工作缓冲区[当前索引 + 2];

      // 钳制到 0-255 / Clamp to 0-255
      R = Math.max(0, Math.min(255, R));
      G = Math.max(0, Math.min(255, G));
      B = Math.max(0, Math.min(255, B));

      // 通过查找表查找最近染料 / Find nearest dye via lookup table
      const 染料 = 通过查找表查找染料(R, G, B);

      // 写入输出 / Write output
      输出数据[当前像素索引 + 0] = 染料.红;
      输出数据[当前像素索引 + 1] = 染料.绿;
      输出数据[当前像素索引 + 2] = 染料.蓝;
      输出数据[当前像素索引 + 3] = 原始Alpha;

      // ---- 计算量化误差并扩散 / Compute quantization error and diffuse ----
      if (强度 > 0) {
        const 误差R = (R - 染料.红) * 强度;
        const 误差G = (G - 染料.绿) * 强度;
        const 误差B = (B - 染料.蓝) * 强度;

        // Floyd-Steinberg 误差扩散权重 / FS error diffusion weights
        //        当前    右(7/16)
        // 左下(3/16) 下(5/16) 右下(1/16)
        const 扩散误差 = (
          dx: number, dy: number, 权重: number,
          误差R: number, 误差G: number, 误差B: number
        ) => {
          const nx = x + dx;
          const ny = y + dy;
          // 边界检查 / Boundary check
          if (nx < 0 || nx >= 宽度 || ny < 0 || ny >= 高度) return;
          const n索引 = (ny * 宽度 + nx) * 3;
          工作缓冲区[n索引 + 0] += 误差R * 权重;
          工作缓冲区[n索引 + 1] += 误差G * 权重;
          工作缓冲区[n索引 + 2] += 误差B * 权重;
        };

        // 右邻居 (7/16) / Right neighbor
        扩散误差(1, 0, 7 / 16, 误差R, 误差G, 误差B);
        // 左下 (3/16) / Bottom-left
        扩散误差(-1, 1, 3 / 16, 误差R, 误差G, 误差B);
        // 下 (5/16) / Bottom
        扩散误差(0, 1, 5 / 16, 误差R, 误差G, 误差B);
        // 右下 (1/16) / Bottom-right
        扩散误差(1, 1, 1 / 16, 误差R, 误差G, 误差B);
      }
    }
  }

  return {
    宽度,
    高度,
    数据: 输出数据,
  };
}

/**
 * 重采样图像到目标尺寸（双线性插值）/ Resample image to target size (bilinear)
 * ================================================================
 * 使用 Canvas drawImage 自带的平滑插值，性能优于手写双线性。
 * Uses Canvas drawImage's built-in smoothing, faster than manual bilinear.
 *
 * @param 源像素 - 源像素矩阵 / Source pixel matrix
 * @param 目标宽度 - 目标宽度 / Target width
 * @param 目标高度 - 目标高度 / Target height
 * @returns 重采样后的像素矩阵 / Resampled pixel matrix
 */
export function 重采样图像(
  源像素: 像素矩阵类型,
  目标宽度: number,
  目标高度: number
): 像素矩阵类型 {
  // ---- 输入校验 / Input validation ----
  if (!源像素 || 目标宽度 <= 0 || 目标高度 <= 0) {
    throw new Error('重采样参数无效 / Invalid resample parameters');
  }

  // ---- 创建源画布 / Create source canvas ----
  const 源画布 = document.createElement('canvas');
  源画布.width = 源像素.宽度;
  源画布.height = 源像素.高度;
  const 源上下文 = 源画布.getContext('2d')!;
  源上下文.putImageData(new ImageData(源像素.数据, 源像素.宽度, 源像素.高度), 0, 0);

  // ---- 创建目标画布 / Create target canvas ----
  const 目标画布 = document.createElement('canvas');
  目标画布.width = 目标宽度;
  目标画布.height = 目标高度;
  const 目标上下文 = 目标画布.getContext('2d')!;
  // 启用高质量平滑 / Enable high-quality smoothing
  目标上下文.imageSmoothingEnabled = true;
  目标上下文.imageSmoothingQuality = 'high';
  // 绘制缩放图像 / Draw scaled image
  目标上下文.drawImage(源画布, 0, 0, 目标宽度, 目标高度);

  // ---- 提取像素数据 / Extract pixel data ----
  const 图像数据 = 目标上下文.getImageData(0, 0, 目标宽度, 目标高度);
  return {
    宽度: 目标宽度,
    高度: 目标高度,
    数据: 图像数据.data,
  };
}

/**
 * 从 ImageData 创建像素矩阵 / Create pixel matrix from ImageData
 */
export function 从ImageData创建(图像数据: ImageData): 像素矩阵类型 {
  return {
    宽度: 图像数据.width,
    高度: 图像数据.height,
    数据: 图像数据.data,
  };
}

/**
 * 将像素矩阵转为 ImageData / Convert pixel matrix to ImageData
 */
export function 转为ImageData(像素矩阵: 像素矩阵类型): ImageData {
  return new ImageData(像素矩阵.数据, 像素矩阵.宽度, 像素矩阵.高度);
}
