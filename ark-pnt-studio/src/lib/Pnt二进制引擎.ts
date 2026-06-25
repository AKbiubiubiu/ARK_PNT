/**
 * 方舟 .pnt 二进制核心引擎 / ARK .pnt Binary Core Engine
 * ================================================================
 * 文件格式规范（小端序 Little-Endian）：
 * File format specification (Little-Endian):
 *
 *   偏移 0-3   : uint32 LE  保留字段（恒为 0）/ Reserved (always 0)
 *   偏移 4-7   : uint32 LE  宽度 Width
 *   偏移 8-11  : uint32 LE  高度 Height
 *   偏移 12-15 : uint32 LE  位深（恒为 8）/ Bit depth (always 8)
 *   偏移 16-19 : uint32 LE  像素数据大小（= 宽 × 高）/ Pixel data size (= W × H)
 *   偏移 20-末 : W×H×1 bytes 像素数据，每像素 1 字节 = ARK Color ID 索引
 *                          Pixel data, 1 byte per pixel = ARK Color ID index
 *
 *   总文件大小 = 20 + 宽度 × 高度
 *   Total file size = 20 + width × height
 *
 * 像素排列：从左上角 (0,0) 起，行优先，每行左→右，行间上→下。
 * Pixel order: from top-left (0,0), row-major, left→right per row, top→bottom.
 *
 * Color ID 含义：
 *   0        = 透明/未上色 / Transparent / unpainted
 *   1-100    = 生物颜色 / Creature colors
 *   201-226  = 染料颜色 / Dye colors（画布绘画通常仅使用 1-100）
 */

import { 按编号查找颜色 } from './染料调色板';

/**
 * 像素数据结构（RGBA 顺序，兼容 Canvas ImageData）/ Pixel data structure (RGBA, Canvas-compatible)
 */
export interface 像素矩阵类型 {
  宽度: number;                          // 图像宽度 / Image width
  高度: number;                          // 图像高度 / Image height
  数据: Uint8ClampedArray<ArrayBuffer>;  // RGBA 顺序像素数据 / RGBA pixel data
}

/**
 * 索引像素矩阵结构（每像素 1 字节 Color ID）/ Indexed pixel matrix (1 byte Color ID per pixel)
 */
export interface 索引像素矩阵类型 {
  宽度: number;                          // 图像宽度 / Image width
  高度: number;                          // 图像高度 / Image height
  数据: Uint8Array<ArrayBuffer>;         // Color ID 索引数据 / Color ID index data
}

/**
 * 解析结果类型 / Parse result type
 */
export interface 解析结果类型 {
  宽度: number;
  高度: number;
  像素: 像素矩阵类型;                    // RGBA 像素（用于显示）/ RGBA pixels (for display)
  索引: 索引像素矩阵类型;                // Color ID 索引（原始数据）/ Color ID indices (raw data)
  字节大小: number;                      // 原始文件字节大小 / Raw file byte size
  唯一颜色数: number;                    // 使用的不同 Color ID 数量 / Unique Color ID count
}

/**
 * 文件头大小（字节）/ Header size in bytes
 */
const 文件头大小 = 20;

/**
 * 将索引像素矩阵（Color ID）转换为 RGBA 像素矩阵（用于画布显示）
 * Convert indexed pixel matrix (Color ID) to RGBA pixel matrix (for canvas display)
 * @param 索引像素 - Color ID 索引矩阵 / Color ID index matrix
 * @returns RGBA 像素矩阵 / RGBA pixel matrix
 */
export function 索引转RGBA(索引像素: 索引像素矩阵类型): 像素矩阵类型 {
  const { 宽度, 高度, 数据 } = 索引像素;
  const rgba数据 = new Uint8ClampedArray(宽度 * 高度 * 4);

  for (let i = 0; i < 数据.length; i++) {
    const 颜色ID = 数据[i];
    const rgba偏移 = i * 4;

    if (颜色ID === 0) {
      // 透明像素 / Transparent pixel
      rgba数据[rgba偏移 + 0] = 0;
      rgba数据[rgba偏移 + 1] = 0;
      rgba数据[rgba偏移 + 2] = 0;
      rgba数据[rgba偏移 + 3] = 0;
    } else {
      // 查找 Color ID 对应的 RGB / Look up RGB for Color ID
      const 颜色 = 按编号查找颜色(颜色ID);
      if (颜色) {
        rgba数据[rgba偏移 + 0] = 颜色.红;
        rgba数据[rgba偏移 + 1] = 颜色.绿;
        rgba数据[rgba偏移 + 2] = 颜色.蓝;
        rgba数据[rgba偏移 + 3] = 255;
      } else {
        // 未知 Color ID，用白色标记 / Unknown Color ID, mark as white
        rgba数据[rgba偏移 + 0] = 255;
        rgba数据[rgba偏移 + 1] = 255;
        rgba数据[rgba偏移 + 2] = 255;
        rgba数据[rgba偏移 + 3] = 255;
      }
    }
  }

  return { 宽度, 高度, 数据: rgba数据 };
}

/**
 * 生成 .pnt 二进制字节流 / Generate .pnt binary byte stream
 * ================================================================
 * 将 Color ID 索引像素矩阵转换为方舟 .pnt 格式的 ArrayBuffer。
 * Converts Color ID index pixel matrix to ARK .pnt format ArrayBuffer.
 *
 * @param 索引像素 - Color ID 索引矩阵 / Color ID index matrix
 * @returns .pnt 格式的 ArrayBuffer / .pnt format ArrayBuffer
 * @throws 当输入无效时抛出错误 / Throws when input is invalid
 */
export function 生成Pnt字节流(索引像素: 索引像素矩阵类型): ArrayBuffer {
  // ---- 输入校验 / Input validation ----
  if (!索引像素) {
    throw new Error('索引像素矩阵不能为空 / Index pixel matrix cannot be null');
  }
  const { 宽度, 高度, 数据 } = 索引像素;
  if (宽度 <= 0 || 高度 <= 0) {
    throw new Error(`无效的图像尺寸: ${宽度}×${高度} / Invalid image dimensions`);
  }
  if (!数据 || 数据.length !== 宽度 * 高度) {
    throw new Error(
      `索引数据长度 ${数据?.length ?? 0} 与 ${宽度}×${高度}=${宽度 * 高度} 不匹配 / Index data length mismatch`
    );
  }

  // ---- 计算总字节数 / Calculate total byte count ----
  // 文件头 20 字节 + 像素数据 W×H×1 字节
  // 20-byte header + W×H×1 pixel data
  const 像素字节数 = 宽度 * 高度;
  const 总字节数 = 文件头大小 + 像素字节数;

  // ---- 分配缓冲区 / Allocate buffer ----
  const 缓冲区 = new ArrayBuffer(总字节数);
  const 视图 = new DataView(缓冲区);
  const 字节数组 = new Uint8Array(缓冲区);

  // ---- 写入文件头（小端序 uint32）/ Write header (little-endian uint32) ----
  视图.setUint32(0, 0, true);              // 偏移 0-3：保留字段 / Reserved
  视图.setUint32(4, 宽度, true);           // 偏移 4-7：宽度 / Width
  视图.setUint32(8, 高度, true);           // 偏移 8-11：高度 / Height
  视图.setUint32(12, 8, true);             // 偏移 12-15：位深 / Bit depth
  视图.setUint32(16, 像素字节数, true);    // 偏移 16-19：数据大小 / Data size

  // ---- 写入像素数据（每像素 1 字节 Color ID）/ Write pixel data (1 byte Color ID per pixel) ----
  字节数组.set(数据, 文件头大小);

  return 缓冲区;
}

/**
 * 逆向解析 .pnt 二进制字节流 / Reverse parse .pnt binary byte stream
 * ================================================================
 * 将方舟 .pnt 格式的 ArrayBuffer 解析为 Color ID 索引 + RGBA 像素。
 * Parses ARK .pnt format ArrayBuffer into Color ID indices + RGBA pixels.
 *
 * 支持两种格式：
 *   1. 标准 20 字节头 + 1 字节/像素（真实 .pnt 文件）
 *      Standard 20-byte header + 1 byte/pixel (real .pnt files)
 *   2. 旧式 8 字节头 + 4 字节/像素 BGRA（兼容性回退）
 *      Legacy 8-byte header + 4 bytes/pixel BGRA (compatibility fallback)
 *
 * @param 缓冲区 - .pnt 文件的 ArrayBuffer / .pnt file ArrayBuffer
 * @returns 解析结果（含宽高、索引、RGBA 像素）/ Parse result
 * @throws 当文件格式无效时抛出错误 / Throws when file format is invalid
 */
export function 解析Pnt字节流(缓冲区: ArrayBuffer): 解析结果类型 {
  // ---- 输入校验 / Input validation ----
  if (!缓冲区 || 缓冲区.byteLength < 20) {
    throw new Error(
      `文件过小（${缓冲区?.byteLength ?? 0} 字节），无法解析 .pnt 头部 / File too small to parse .pnt header`
    );
  }

  // ---- 读取文件头 / Read header ----
  const 视图 = new DataView(缓冲区);

  // 尝试按标准 20 字节头解析 / Try parsing as standard 20-byte header
  const 保留 = 视图.getUint32(0, true);
  const 宽度 = 视图.getUint32(4, true);
  const 高度 = 视图.getUint32(8, true);
  const 位深 = 视图.getUint32(12, true);
  const 数据大小 = 视图.getUint32(16, true);

  // 判断是否为标准 20 字节头格式（保留=0, 位深=8, 数据大小=宽×高）
  // Check if standard 20-byte header format (reserved=0, bitdepth=8, datasize=W×H)
  const 是标准格式 = (保留 === 0) && (位深 === 8) && (数据大小 === 宽度 * 高度)
    && (缓冲区.byteLength >= 文件头大小 + 数据大小);

  if (是标准格式) {
    // ---- 标准 20 字节头 + 1 字节/像素 / Standard 20-byte header + 1 byte/pixel ----
    const 字节数组 = new Uint8Array(缓冲区);
    const 索引数据 = new Uint8Array(数据大小);
    // 复制像素数据 / Copy pixel data
    索引数据.set(字节数组.subarray(文件头大小, 文件头大小 + 数据大小));

    // 统计唯一颜色数 / Count unique colors
    const 唯一集合 = new Set<number>();
    for (let i = 0; i < 索引数据.length; i++) {
      唯一集合.add(索引数据[i]);
    }

    // 转换为 RGBA / Convert to RGBA
    const rgba像素 = 索引转RGBA({
      宽度,
      高度,
      数据: 索引数据,
    });

    return {
      宽度,
      高度,
      像素: rgba像素,
      索引: { 宽度, 高度, 数据: 索引数据 },
      字节大小: 缓冲区.byteLength,
      唯一颜色数: 唯一集合.size,
    };
  }

  // ---- 回退：尝试旧式 8 字节头 + 4 字节/像素 BGRA / Fallback: legacy 8-byte header + 4 bytes/pixel BGRA ----
  const 旧宽度 = 视图.getUint32(0, true);
  const 旧高度 = 视图.getUint32(4, true);
  const 旧预期字节数 = 8 + 旧宽度 * 旧高度 * 4;

  if (旧宽度 > 0 && 旧宽度 <= 4096 && 旧高度 > 0 && 旧高度 <= 4096
      && 缓冲区.byteLength >= 旧预期字节数) {
    // 旧格式：8 字节头 + BGRA 4 字节/像素
    // Legacy format: 8-byte header + BGRA 4 bytes/pixel
    const 字节数组 = new Uint8Array(缓冲区);
    const 像素数据 = new Uint8ClampedArray(旧宽度 * 旧高度 * 4);
    for (let i = 0; i < 像素数据.length; i += 4) {
      const 偏移 = 8 + i;
      像素数据[i + 0] = 字节数组[偏移 + 2]; // R
      像素数据[i + 1] = 字节数组[偏移 + 1]; // G
      像素数据[i + 2] = 字节数组[偏移 + 0]; // B
      像素数据[i + 3] = 字节数组[偏移 + 3]; // A
    }

    // 旧格式无 Color ID 索引，生成空的索引数据（用 0 填充）
    // Legacy format has no Color ID index, generate empty index data (filled with 0)
    const 空索引 = new Uint8Array(旧宽度 * 旧高度);

    return {
      宽度: 旧宽度,
      高度: 旧高度,
      像素: { 宽度: 旧宽度, 高度: 旧高度, 数据: 像素数据 },
      索引: { 宽度: 旧宽度, 高度: 旧高度, 数据: 空索引 },
      字节大小: 缓冲区.byteLength,
      唯一颜色数: 0,
    };
  }

  // 两种格式都不匹配 / Neither format matches
  throw new Error(
    `无法识别的 .pnt 文件格式（${缓冲区.byteLength} 字节）/ Unrecognized .pnt format`
  );
}

/**
 * 触发浏览器下载二进制文件 / Trigger browser download of binary file
 * @param 缓冲区 - 要下载的 ArrayBuffer / ArrayBuffer to download
 * @param 文件名 - 下载文件名（含扩展名）/ Download filename (with extension)
 */
export function 下载二进制文件(缓冲区: ArrayBuffer, 文件名: string): void {
  const blob = new Blob([缓冲区], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const 链接 = document.createElement('a');
  链接.href = url;
  链接.download = 文件名;
  链接.style.display = 'none';
  document.body.appendChild(链接);
  链接.click();
  document.body.removeChild(链接);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 校验文件是否为合法 .pnt（基于大小推算）/ Validate if file is valid .pnt (by size)
 * ================================================================
 * 支持两种格式：
 *   1. 标准 20 字节头：(大小 - 20) = 宽 × 高，且能从头部读出合法宽高
 *   2. 旧式 8 字节头：(大小 - 8) 能被 4 整除且开方为整数
 * @param 字节长度 - 文件字节长度 / File byte length
 * @returns 是否可能为合法 .pnt / Whether it could be a valid .pnt
 */
export function 粗略校验Pnt格式(字节长度: number): boolean {
  if (字节长度 < 20) return false;

  // 标准 20 字节头格式：(大小 - 20) 应为某个正方形的面积
  // Standard 20-byte header: (size - 20) should be area of a square
  const 像素数1 = 字节长度 - 20;
  const 边长1 = Math.sqrt(像素数1);
  if (Number.isInteger(边长1) && 边长1 > 0 && 边长1 <= 4096) {
    return true;
  }

  // 旧式 8 字节头格式：(大小 - 8) 应为 4 的倍数且开方为整数
  // Legacy 8-byte header: (size - 8) should be multiple of 4 and sqrt is integer
  if (字节长度 >= 8) {
    const 像素数2 = 字节长度 - 8;
    if (像素数2 % 4 === 0) {
      const 像素总数 = 像素数2 / 4;
      const 边长2 = Math.sqrt(像素总数);
      if (Number.isInteger(边长2) && 边长2 > 0 && 边长2 <= 4096) {
        return true;
      }
    }
  }

  return false;
}
