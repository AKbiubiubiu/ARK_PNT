/**
 * 方舟 .pnt 二进制核心引擎 / ARK .pnt Binary Core Engine
 * ================================================================
 * 文件格式规范（小端序 Little-Endian）：
 * File format specification (Little-Endian):
 *
 *   偏移 0-3  : uint32 LE  宽度 Width
 *   偏移 4-7  : uint32 LE  高度 Height
 *   偏移 8-末 : W×H×4 bytes 像素数据，每像素 4 字节 BGRA 顺序
 *                          Pixel data, 4 bytes per pixel in BGRA order
 *
 *   总文件大小 = 8 + 宽度 × 高度 × 4
 *   Total file size = 8 + width × height × 4
 *
 * 像素排列：从左上角 (0,0) 起，行优先，每行左→右，行间上→下。
 * Pixel order: from top-left (0,0), row-major, left→right per row, top→bottom.
 *
 * 通道：B(蓝) G(绿) R(红) A(透明度，0x00=透明，0xFF=不透明)
 * Channels: B(blue) G(green) R(red) A(alpha, 0x00=transparent, 0xFF=opaque)
 */

/**
 * 像素数据结构 / Pixel data structure
 * 使用 Uint8ClampedArray 兼容 Canvas ImageData 格式（RGBA 顺序）
 * Uses Uint8ClampedArray compatible with Canvas ImageData (RGBA order)
 */
export interface 像素矩阵类型 {
  宽度: number;                          // 图像宽度 / Image width
  高度: number;                          // 图像高度 / Image height
  数据: Uint8ClampedArray<ArrayBuffer>;  // RGBA 顺序像素数据 / RGBA pixel data
}

/**
 * 解析结果类型 / Parse result type
 */
export interface 解析结果类型 {
  宽度: number;
  高度: number;
  像素: 像素矩阵类型;
  字节大小: number;                      // 原始文件字节大小 / Raw file byte size
}

/**
 * 生成 .pnt 二进制字节流 / Generate .pnt binary byte stream
 * ================================================================
 * 将 RGBA 像素矩阵转换为方舟 .pnt 格式的 ArrayBuffer。
 * Converts RGBA pixel matrix to ARK .pnt format ArrayBuffer.
 *
 * @param 像素矩阵 - 输入像素矩阵（RGBA 顺序）/ Input pixel matrix (RGBA order)
 * @returns .pnt 格式的 ArrayBuffer / .pnt format ArrayBuffer
 * @throws 当输入无效时抛出错误 / Throws when input is invalid
 */
export function 生成Pnt字节流(像素矩阵: 像素矩阵类型): ArrayBuffer {
  // ---- 输入校验 / Input validation ----
  if (!像素矩阵) {
    // 像素矩阵为空，无法生成 / Pixel matrix is null, cannot generate
    throw new Error('像素矩阵不能为空 / Pixel matrix cannot be null');
  }
  const { 宽度, 高度, 数据 } = 像素矩阵;
  if (宽度 <= 0 || 高度 <= 0) {
    // 宽高必须为正整数 / Width and height must be positive integers
    throw new Error(`无效的图像尺寸: ${宽度}×${高度} / Invalid image dimensions`);
  }
  if (!数据 || 数据.length !== 宽度 * 高度 * 4) {
    // 数据长度与宽高不匹配 / Data length mismatch with dimensions
    throw new Error(
      `像素数据长度 ${数据?.length ?? 0} 与 ${宽度}×${高度}×4=${宽度 * 高度 * 4} 不匹配 / Pixel data length mismatch`
    );
  }

  // ---- 计算总字节数 / Calculate total byte count ----
  // 文件头 8 字节 + 像素数据 W×H×4 字节
  // 8-byte header + W×H×4 pixel data
  const 头部字节数 = 8;
  const 像素字节数 = 宽度 * 高度 * 4;
  const 总字节数 = 头部字节数 + 像素字节数;

  // ---- 分配缓冲区 / Allocate buffer ----
  const 缓冲区 = new ArrayBuffer(总字节数);
  const 视图 = new DataView(缓冲区);
  const 字节数组 = new Uint8Array(缓冲区);

  // ---- 写入文件头（小端序 uint32）/ Write header (little-endian uint32) ----
  // 偏移 0-3：宽度 / Offset 0-3: width
  视图.setUint32(0, 宽度, true);
  // 偏移 4-7：高度 / Offset 4-7: height
  视图.setUint32(4, 高度, true);

  // ---- 写入像素数据（RGBA → BGRA 转换）/ Write pixel data (RGBA → BGRA) ----
  // Canvas ImageData 是 RGBA 顺序，.pnt 需要 BGRA 顺序，需做通道交换
  // Canvas ImageData is RGBA, .pnt requires BGRA, channel swap needed
  for (let i = 0; i < 数据.length; i += 4) {
    const 偏移 = 头部字节数 + i;
    // R 在数据[i+0]，需写入偏移+2 / R at data[i+0], write to offset+2
    // G 在数据[i+1]，需写入偏移+1 / G at data[i+1], write to offset+1
    // B 在数据[i+2]，需写入偏移+0 / B at data[i+2], write to offset+0
    // A 在数据[i+3]，需写入偏移+3 / A at data[i+3], write to offset+3
    字节数组[偏移 + 0] = 数据[i + 2]; // B
    字节数组[偏移 + 1] = 数据[i + 1]; // G
    字节数组[偏移 + 2] = 数据[i + 0]; // R
    字节数组[偏移 + 3] = 数据[i + 3]; // A
  }

  return 缓冲区;
}

/**
 * 逆向解析 .pnt 二进制字节流 / Reverse parse .pnt binary byte stream
 * ================================================================
 * 将方舟 .pnt 格式的 ArrayBuffer 解析为 RGBA 像素矩阵。
 * Parses ARK .pnt format ArrayBuffer into RGBA pixel matrix.
 *
 * @param 缓冲区 - .pnt 文件的 ArrayBuffer / .pnt file ArrayBuffer
 * @returns 解析结果（含宽高与 RGBA 像素）/ Parse result (with dimensions and RGBA pixels)
 * @throws 当文件格式无效时抛出错误 / Throws when file format is invalid
 */
export function 解析Pnt字节流(缓冲区: ArrayBuffer): 解析结果类型 {
  // ---- 输入校验 / Input validation ----
  if (!缓冲区 || 缓冲区.byteLength < 8) {
    // 文件过小，连头部都读不到 / File too small to even read header
    throw new Error(
      `文件过小（${缓冲区?.byteLength ?? 0} 字节），无法解析 .pnt 头部 / File too small to parse .pnt header`
    );
  }

  // ---- 读取文件头 / Read header ----
  const 视图 = new DataView(缓冲区);
  // 小端序读取宽高 / Read width/height as little-endian
  const 宽度 = 视图.getUint32(0, true);
  const 高度 = 视图.getUint32(4, true);

  // ---- 校验宽高合法性 / Validate dimensions ----
  if (宽度 <= 0 || 高度 > 4096) {
    // 宽度异常：方舟绘画最大 512×512，超过 4096 视为损坏
    // Abnormal width: ARK paintings max 512×512, >4096 considered corrupt
    throw new Error(`无效的宽度值: ${宽度} / Invalid width value`);
  }
  if (高度 <= 0 || 高度 > 4096) {
    throw new Error(`无效的高度值: ${高度} / Invalid height value`);
  }

  // ---- 校验文件大小 / Validate file size ----
  const 头部字节数 = 8;
  const 预期像素字节数 = 宽度 * 高度 * 4;
  const 预期总字节数 = 头部字节数 + 预期像素字节数;
  if (缓冲区.byteLength < 预期总字节数) {
    // 文件大小不足，像素数据被截断 / File size insufficient, pixel data truncated
    throw new Error(
      `文件大小 ${缓冲区.byteLength} 字节，预期 ${预期总字节数} 字节（${宽度}×${高度}）/ File size mismatch`
    );
  }

  // ---- 读取像素数据（BGRA → RGBA 转换）/ Read pixel data (BGRA → RGBA) ----
  const 字节数组 = new Uint8Array(缓冲区);
  const 像素数据 = new Uint8ClampedArray(预期像素字节数);

  for (let i = 0; i < 预期像素字节数; i += 4) {
    const 偏移 = 头部字节数 + i;
    // .pnt 是 BGRA，需转回 RGBA / .pnt is BGRA, convert back to RGBA
    像素数据[i + 0] = 字节数组[偏移 + 2]; // R
    像素数据[i + 1] = 字节数组[偏移 + 1]; // G
    像素数据[i + 2] = 字节数组[偏移 + 0]; // B
    像素数据[i + 3] = 字节数组[偏移 + 3]; // A
  }

  return {
    宽度,
    高度,
    像素: {
      宽度,
      高度,
      数据: 像素数据,
    },
    字节大小: 预期总字节数,
  };
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
 * 校验文件是否为合法 .pnt（基于大小推算）/ Validate if file is valid .pnt (by size)
 * ================================================================
 * 因 .pnt 无魔数，只能通过 (文件大小 - 8) 能否被 4 整除且开方为整数来粗略判断。
 * Since .pnt has no magic number, we roughly validate by checking if
 * (fileSize - 8) is divisible by 4 and sqrt is an integer.
 *
 * @param 字节长度 - 文件字节长度 / File byte length
 * @returns 是否可能为合法 .pnt / Whether it could be a valid .pnt
 */
export function 粗略校验Pnt格式(字节长度: number): boolean {
  // 至少 8 字节头部 / At least 8-byte header
  if (字节长度 < 8) return false;
  // 减去头部后应为 4 的倍数 / After subtracting header, should be multiple of 4
  const 像素字节数 = 字节长度 - 8;
  if (像素字节数 % 4 !== 0) return false;
  // 像素总数 / Total pixel count
  const 像素总数 = 像素字节数 / 4;
  // 开方应为整数（方舟绘画均为正方形）/ Sqrt should be integer (ARK paintings are square)
  const 边长 = Math.sqrt(像素总数);
  return Number.isInteger(边长) && 边长 > 0 && 边长 <= 4096;
}
