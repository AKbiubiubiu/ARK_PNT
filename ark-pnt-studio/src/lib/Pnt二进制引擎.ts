/**
 * 方舟 .pnt 二进制核心引擎 / ARK .pnt Binary Core Engine
 * ================================================================
 * 文件格式规范（小端序 Little-Endian）：
 * File format specification (Little-Endian):
 *
 *   偏移  0-3  : uint32 LE  保留字段（恒为 0）/ Reserved (always 0)
 *   偏移  4-7  : uint32 LE  宽度 Width
 *   偏移  8-11 : uint32 LE  高度 Height
 *   偏移 12-15 : uint32 LE  位深 BitDepth（恒为 8）/ Bit depth (always 8)
 *   偏移 16-19 : uint32 LE  数据大小 DataSize（= 宽度 × 高度）/ Data size
 *   偏移 20-末 : W×H bytes  像素数据，每像素 1 字节 = ARK Color ID
 *                          Pixel data, 1 byte per pixel = ARK Color ID
 *
 *   总文件大小 = 20 + 宽度 × 高度
 *   Total file size = 20 + width × height
 *
 * 像素排列：从左上角 (0,0) 起，行优先，每行左→右，行间上→下。
 * Pixel order: from top-left (0,0), row-major, left→right per row, top→bottom.
 *
 * Color ID 0 = 透明（未上色），1-100 = 生物色，201-226 = 染料。
 * Color ID 0 = transparent (unpainted), 1-100 = creature colors, 201-226 = dyes.
 *
 * 格式来源：用户提供的真实 .pnt 文件 2_Sign_PaintingCanvas_C.pnt 逆向分析。
 * Format source: reverse-engineered from user's real .pnt file.
 */

import { 编号到RGB映射, 按编号查找颜色, 透明颜色ID, type 方舟颜色类型 } from './染料调色板';

/**
 * 文件头字节数 / Header byte count
 * 固定 20 字节 / Fixed 20 bytes
 */
export const 头部字节数 = 20;

/**
 * RGBA 像素矩阵类型 / RGBA pixel matrix type
 * 用于 Canvas 渲染，数据为 RGBA 顺序，每像素 4 字节。
 * Used for Canvas rendering, data in RGBA order, 4 bytes per pixel.
 */
export interface 像素矩阵类型 {
  宽度: number;                          // 图像宽度 / Image width
  高度: number;                          // 图像高度 / Image height
  数据: Uint8ClampedArray<ArrayBuffer>;  // RGBA 顺序像素数据 / RGBA pixel data
}

/**
 * 索引像素矩阵类型 / Indexed pixel matrix type
 * 用于 .pnt 二进制格式，每像素 1 字节 = ARK Color ID。
 * Used for .pnt binary format, 1 byte per pixel = ARK Color ID.
 */
export interface 索引像素矩阵类型 {
  宽度: number;        // 图像宽度 / Image width
  高度: number;        // 图像高度 / Image height
  数据: Uint8Array;    // Color ID 索引数据 / Color ID index data
}

/**
 * 解析结果类型 / Parse result type
 * 同时包含索引数据（用于精确还原）与 RGBA 数据（用于画布渲染）。
 * Contains both indexed data (for exact restoration) and RGBA data (for canvas rendering).
 */
export interface 解析结果类型 {
  宽度: number;                // 图像宽度 / Image width
  高度: number;                // 图像高度 / Image height
  索引: 索引像素矩阵类型;      // Color ID 索引 / Color ID indices
  像素: 像素矩阵类型;          // RGBA 像素（用于渲染）/ RGBA pixels (for rendering)
  字节大小: number;            // 原始文件字节大小 / Raw file byte size
  唯一颜色数: number;          // 使用的不同 Color ID 数量 / Unique Color ID count
}

/**
 * 生成 .pnt 二进制字节流 / Generate .pnt binary byte stream
 * ================================================================
 * 将 Color ID 索引像素矩阵转换为方舟 .pnt 格式的 ArrayBuffer。
 * Converts Color ID indexed pixel matrix to ARK .pnt format ArrayBuffer.
 *
 * @param 索引像素 - 输入索引像素矩阵（每像素 1 字节 Color ID）/ Input indexed pixel matrix
 * @returns .pnt 格式的 ArrayBuffer / .pnt format ArrayBuffer
 * @throws 当输入无效时抛出错误 / Throws when input is invalid
 */
export function 生成Pnt字节流(索引像素: 索引像素矩阵类型): ArrayBuffer {
  // ---- 输入校验 / Input validation ----
  if (!索引像素) {
    // 索引像素为空，无法生成 / Indexed pixels is null, cannot generate
    throw new Error('索引像素矩阵不能为空 / Indexed pixel matrix cannot be null');
  }
  const { 宽度, 高度, 数据 } = 索引像素;
  if (宽度 <= 0 || 高度 <= 0) {
    // 宽高必须为正整数 / Width and height must be positive integers
    throw new Error(`无效的图像尺寸: ${宽度}×${高度} / Invalid image dimensions`);
  }
  const 预期长度 = 宽度 * 高度;
  if (!数据 || 数据.length !== 预期长度) {
    // 数据长度与宽高不匹配 / Data length mismatch with dimensions
    throw new Error(
      `索引数据长度 ${数据?.length ?? 0} 与 ${宽度}×${高度}=${预期长度} 不匹配 / Index data length mismatch`
    );
  }

  // ---- 计算总字节数 / Calculate total byte count ----
  // 文件头 20 字节 + 像素数据 W×H×1 字节
  // 20-byte header + W×H×1 pixel data
  const 像素字节数 = 预期长度;
  const 总字节数 = 头部字节数 + 像素字节数;

  // ---- 分配缓冲区 / Allocate buffer ----
  const 缓冲区 = new ArrayBuffer(总字节数);
  const 视图 = new DataView(缓冲区);
  const 字节数组 = new Uint8Array(缓冲区);

  // ---- 写入文件头（小端序 uint32）/ Write header (little-endian uint32) ----
  // 偏移 0-3：保留字段（恒为 0）/ Offset 0-3: reserved (always 0)
  视图.setUint32(0, 0, true);
  // 偏移 4-7：宽度 / Offset 4-7: width
  视图.setUint32(4, 宽度, true);
  // 偏移 8-11：高度 / Offset 8-11: height
  视图.setUint32(8, 高度, true);
  // 偏移 12-15：位深（恒为 8）/ Offset 12-15: bit depth (always 8)
  视图.setUint32(12, 8, true);
  // 偏移 16-19：数据大小（= 宽度 × 高度）/ Offset 16-19: data size
  视图.setUint32(16, 像素字节数, true);

  // ---- 写入像素数据（直接拷贝 Color ID）/ Write pixel data (copy Color IDs directly) ----
  // 每像素 1 字节，直接为 ARK Color ID，无需转换
  // 1 byte per pixel, directly ARK Color ID, no conversion needed
  字节数组.set(数据, 头部字节数);

  return 缓冲区;
}

/**
 * 逆向解析 .pnt 二进制字节流 / Reverse parse .pnt binary byte stream
 * ================================================================
 * 将方舟 .pnt 格式的 ArrayBuffer 解析为 Color ID 索引 + RGBA 像素。
 * Parses ARK .pnt format ArrayBuffer into Color ID indices + RGBA pixels.
 *
 * @param 缓冲区 - .pnt 文件的 ArrayBuffer / .pnt file ArrayBuffer
 * @returns 解析结果（含索引、RGBA 像素、元数据）/ Parse result
 * @throws 当文件格式无效时抛出错误 / Throws when file format is invalid
 */
export function 解析Pnt字节流(缓冲区: ArrayBuffer): 解析结果类型 {
  // ---- 输入校验 / Input validation ----
  if (!缓冲区 || 缓冲区.byteLength < 头部字节数) {
    // 文件过小，连头部都读不到 / File too small to even read header
    throw new Error(
      `文件过小（${缓冲区?.byteLength ?? 0} 字节），无法解析 .pnt 头部 / File too small to parse .pnt header`
    );
  }

  // ---- 读取文件头 / Read header ----
  const 视图 = new DataView(缓冲区);
  // 偏移 0-3：保留字段（应为 0，此处不校验）/ Offset 0-3: reserved (should be 0, not validated here)
  // 偏移 4-7：宽度 / Offset 4-7: width
  const 宽度 = 视图.getUint32(4, true);
  // 偏移 8-11：高度 / Offset 8-11: height
  const 高度 = 视图.getUint32(8, true);
  // 偏移 12-15：位深 / Offset 12-15: bit depth
  const 位深 = 视图.getUint32(12, true);
  // 偏移 16-19：数据大小 / Offset 16-19: data size
  const 数据大小 = 视图.getUint32(16, true);

  // ---- 校验宽高合法性 / Validate dimensions ----
  if (宽度 <= 0 || 宽度 > 4096) {
    // 宽度异常：方舟绘画最大 512×512，超过 4096 视为损坏
    // Abnormal width: ARK paintings max 512×512, >4096 considered corrupt
    throw new Error(`无效的宽度值: ${宽度} / Invalid width value`);
  }
  if (高度 <= 0 || 高度 > 4096) {
    throw new Error(`无效的高度值: ${高度} / Invalid height value`);
  }

  // ---- 校验位深 / Validate bit depth ----
  if (位深 !== 8) {
    // 仅支持 8 位索引色 / Only support 8-bit indexed color
    throw new Error(`不支持的位深: ${位深}，仅支持 8 / Unsupported bit depth: ${位深}, only 8 supported`);
  }

  // ---- 校验数据大小 / Validate data size ----
  const 预期像素字节数 = 宽度 * 高度;
  if (数据大小 !== 预期像素字节数) {
    // 数据大小与宽高不匹配 / Data size mismatch with dimensions
    throw new Error(
      `数据大小 ${数据大小} 与 ${宽度}×${高度}=${预期像素字节数} 不匹配 / Data size mismatch`
    );
  }

  // ---- 校验文件总大小 / Validate total file size ----
  const 预期总字节数 = 头部字节数 + 预期像素字节数;
  if (缓冲区.byteLength < 预期总字节数) {
    // 文件大小不足，像素数据被截断 / File size insufficient, pixel data truncated
    throw new Error(
      `文件大小 ${缓冲区.byteLength} 字节，预期 ${预期总字节数} 字节 / File size mismatch`
    );
  }

  // ---- 读取像素数据（Color ID 索引）/ Read pixel data (Color ID indices) ----
  const 字节数组 = new Uint8Array(缓冲区);
  // 提取像素数据副本 / Extract pixel data copy
  const 索引数据 = new Uint8Array(预期像素字节数);
  索引数据.set(字节数组.subarray(头部字节数, 头部字节数 + 预期像素字节数));

  // ---- 将 Color ID 索引转为 RGBA（用于画布渲染）/ Convert Color ID indices to RGBA ----
  const rgba数据 = new Uint8ClampedArray(预期像素字节数 * 4);
  // 统计唯一颜色数 / Count unique colors
  const 唯一颜色集合 = new Set<number>();

  for (let i = 0; i < 预期像素字节数; i++) {
    const colorId = 索引数据[i];
    唯一颜色集合.add(colorId);
    const rgba偏移 = i * 4;
    // 查找 Color ID 对应的 RGB / Look up RGB for Color ID
    const rgb = 编号到RGB映射.get(colorId);
    if (rgb) {
      // 已知颜色 / Known color
      rgba数据[rgba偏移 + 0] = rgb.红;
      rgba数据[rgba偏移 + 1] = rgb.绿;
      rgba数据[rgba偏移 + 2] = rgb.蓝;
      // ID 0 为透明，其余不透明 / ID 0 is transparent, others opaque
      rgba数据[rgba偏移 + 3] = colorId === 透明颜色ID ? 0 : 255;
    } else {
      // 未知 Color ID，用白色占位并标记不透明 / Unknown Color ID, use white placeholder
      // 注意：ID 227 在游戏中显示为白色 / Note: ID 227 displays as white in-game
      rgba数据[rgba偏移 + 0] = 255;
      rgba数据[rgba偏移 + 1] = 255;
      rgba数据[rgba偏移 + 2] = 255;
      rgba数据[rgba偏移 + 3] = 255;
    }
  }

  return {
    宽度,
    高度,
    索引: {
      宽度,
      高度,
      数据: 索引数据,
    },
    像素: {
      宽度,
      高度,
      数据: rgba数据,
    },
    字节大小: 预期总字节数,
    唯一颜色数: 唯一颜色集合.size,
  };
}

/**
 * 将索引像素矩阵转为 RGBA 像素矩阵 / Convert indexed pixel matrix to RGBA
 * ================================================================
 * 用于将量化结果渲染到 Canvas。
 * Used to render quantization results to Canvas.
 *
 * @param 索引像素 - Color ID 索引像素矩阵 / Color ID indexed pixel matrix
 * @returns RGBA 像素矩阵 / RGBA pixel matrix
 */
export function 索引转RGBA(索引像素: 索引像素矩阵类型): 像素矩阵类型 {
  // 输入校验 / Input validation
  if (!索引像素) {
    throw new Error('索引像素矩阵不能为空 / Indexed pixel matrix cannot be null');
  }
  const { 宽度, 高度, 数据 } = 索引像素;
  const 像素总数 = 宽度 * 高度;
  const rgba数据 = new Uint8ClampedArray(像素总数 * 4);

  for (let i = 0; i < 像素总数; i++) {
    const colorId = 数据[i];
    const rgba偏移 = i * 4;
    const rgb = 编号到RGB映射.get(colorId);
    if (rgb) {
      rgba数据[rgba偏移 + 0] = rgb.红;
      rgba数据[rgba偏移 + 1] = rgb.绿;
      rgba数据[rgba偏移 + 2] = rgb.蓝;
      rgba数据[rgba偏移 + 3] = colorId === 透明颜色ID ? 0 : 255;
    } else {
      // 未知 Color ID 用白色 / Unknown Color ID uses white
      rgba数据[rgba偏移 + 0] = 255;
      rgba数据[rgba偏移 + 1] = 255;
      rgba数据[rgba偏移 + 2] = 255;
      rgba数据[rgba偏移 + 3] = 255;
    }
  }

  return { 宽度, 高度, 数据: rgba数据 };
}

/**
 * 根据 Color ID 获取颜色对象 / Get color object by Color ID
 * @param colorId - ARK Color ID
 * @returns 颜色对象，未找到返回 undefined / Color object or undefined
 */
export function 按ID查找颜色(colorId: number): 方舟颜色类型 | undefined {
  return 按编号查找颜色(colorId);
}

/**
 * 触发浏览器下载二进制文件 / Trigger browser download of binary file
 * ================================================================
 * @param 缓冲区 - 要下载的 ArrayBuffer / ArrayBuffer to download
 * @param 文件名 - 下载文件名（含扩展名）/ Download filename (with extension)
 */
export function 下载二进制文件(缓冲区: ArrayBuffer, 文件名: string): void {
  // 创建 Blob 对象 / Create Blob object
  const blob = new Blob([缓冲区], { type: 'application/octet-stream' });
  // 生成临时下载 URL / Generate temporary download URL
  const url = URL.createObjectURL(blob);
  // 创建隐藏的 <a> 标签触发下载 / Create hidden <a> tag to trigger download
  const 链接 = document.createElement('a');
  链接.href = url;
  链接.download = 文件名;
  链接.style.display = 'none';
  document.body.appendChild(链接);
  链接.click();
  // 清理 DOM 与 URL / Cleanup DOM and URL
  document.body.removeChild(链接);
  // 延迟释放 URL，避免下载未完成 / Delay URL release to avoid incomplete download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 校验文件是否为合法 .pnt / Validate if file is valid .pnt
 * ================================================================
 * 通过解析 20 字节文件头并校验一致性来判断。
 * Validates by parsing the 20-byte header and checking consistency.
 *
 * @param 缓冲区 - .pnt 文件的 ArrayBuffer / .pnt file ArrayBuffer
 * @returns 是否为合法 .pnt / Whether it is a valid .pnt
 */
export function 校验Pnt格式(缓冲区: ArrayBuffer): boolean {
  // 至少 20 字节头部 / At least 20-byte header
  if (!缓冲区 || 缓冲区.byteLength < 头部字节数) return false;

  try {
    const 视图 = new DataView(缓冲区);
    const 宽度 = 视图.getUint32(4, true);
    const 高度 = 视图.getUint32(8, true);
    const 位深 = 视图.getUint32(12, true);
    const 数据大小 = 视图.getUint32(16, true);

    // 宽高合法 / Valid dimensions
    if (宽度 <= 0 || 宽度 > 4096) return false;
    if (高度 <= 0 || 高度 > 4096) return false;
    // 位深必须为 8 / Bit depth must be 8
    if (位深 !== 8) return false;
    // 数据大小一致 / Data size consistent
    if (数据大小 !== 宽度 * 高度) return false;
    // 文件总大小一致 / Total file size consistent
    if (缓冲区.byteLength < 头部字节数 + 数据大小) return false;

    return true;
  } catch {
    // 解析异常则非合法 .pnt / Parse error means not valid .pnt
    return false;
  }
}

/**
 * 粗略校验 Pnt 格式（基于文件大小）/ Roughly validate .pnt format (by file size)
 * ================================================================
 * 兼容旧接口，仅通过文件大小做粗略判断。
 * Compatible with old interface, roughly validates by file size only.
 *
 * @param 字节长度 - 文件字节长度 / File byte length
 * @returns 是否可能为合法 .pnt / Whether it could be a valid .pnt
 */
export function 粗略校验Pnt格式(字节长度: number): boolean {
  // 至少 20 字节头部 / At least 20-byte header
  if (字节长度 < 头部字节数) return false;
  // 减去头部后为像素数据 / After subtracting header is pixel data
  const 像素字节数 = 字节长度 - 头部字节数;
  // 像素数必须为正 / Pixel count must be positive
  if (像素字节数 <= 0) return false;
  // 方舟绘画常见尺寸：128×128, 256×256, 512×512
  // ARK painting common sizes: 128×128, 256×256, 512×512
  // 此处放宽校验，仅排除明显异常 / Relax validation, only exclude obvious anomalies
  return 像素字节数 <= 4096 * 4096;
}
