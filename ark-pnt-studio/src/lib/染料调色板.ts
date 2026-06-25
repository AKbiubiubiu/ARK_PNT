/**
 * 方舟官方颜色调色板数据模块 / ARK Official Color Palette Data Module
 * ================================================================
 * 数据来源：ARK 官方 GIMP 调色板导出（25 种命名颜色 + 透明度）。
 * Data source: ARK official GIMP palette export (25 named colors + transparency).
 *
 * 完整调色板共 26 项 / Complete palette has 26 entries:
 *   - ID 0：透明 / Transparent（未上色区域）/ Transparent (unpainted area)
 *   - ID 1-25：方舟命名颜色 / ARK named colors
 *
 * RGB 值直接取自官方 GIMP 调色板，确保二进制生成与逆向解析的色彩精准度。
 * RGB values taken directly from official GIMP palette for color accuracy.
 */

/**
 * 方舟颜色数据结构 / ARK color data structure
 */
export interface 方舟颜色类型 {
  编号: number;        // Color ID / Color ID
  中文名: string;      // Chinese name / Chinese name
  英文名: string;      // English name / English name
  红: number;          // Red 0-255 / Red 0-255
  绿: number;          // Green 0-255 / Green 0-255
  蓝: number;          // Blue 0-255 / Blue 0-255
  透明: boolean;       // 是否透明（仅 ID 0 为 true）/ Is transparent (only ID 0 is true)
}

/**
 * 染料类型（向后兼容别名）/ Dye type (backward-compatible alias)
 */
export type 染料类型 = 方舟颜色类型;

/**
 * 方舟官方完整颜色列表 / Complete ARK color list
 * ================================================================
 * ID 0 为透明，ID 1-25 为方舟命名颜色，RGB 值来自官方 GIMP 调色板。
 * ID 0 is transparent, ID 1-25 are ARK named colors, RGB from official GIMP palette.
 */
export const 方舟颜色列表: 方舟颜色类型[] = [
  // ---- ID 0：透明 / Transparent ----
  { 编号: 0,  中文名: '透明',     英文名: 'Transparent', 红: 0,   绿: 0,   蓝: 0,   透明: true  },

  // ---- ID 1-25：方舟命名颜色 / ARK named colors ----
  { 编号: 1,  中文名: '黑色',     英文名: 'Black',       红: 2,   绿: 2,   蓝: 2,   透明: false },
  { 编号: 2,  中文名: '蓝色',     英文名: 'Blue',        红: 0,   绿: 0,   蓝: 255, 透明: false },
  { 编号: 3,  中文名: '砖红',     英文名: 'Brick',       红: 132, 绿: 31,  蓝: 39,  透明: false },
  { 编号: 4,  中文名: '棕色',     英文名: 'Brown',       红: 46,  绿: 30,  蓝: 15,  透明: false },
  { 编号: 5,  中文名: '哈密瓜',   英文名: 'Cantaloupe',  红: 254, 绿: 166, 蓝: 32,  透明: false },
  { 编号: 6,  中文名: '青色',     英文名: 'Cyan',        红: 0,   绿: 255, 蓝: 255, 透明: false },
  { 编号: 7,  中文名: '森林绿',   英文名: 'Forest',      红: 0,   绿: 38,  蓝: 0,   透明: false },
  { 编号: 8,  中文名: '绿色',     英文名: 'Green',       红: 0,   绿: 255, 蓝: 0,   透明: false },
  { 编号: 9,  中文名: '洋红',     英文名: 'Magenta',     红: 255, 绿: 0,   蓝: 255, 透明: false },
  { 编号: 10, 中文名: '泥色',     英文名: 'Mud',         红: 127, 绿: 97,  蓝: 34,  透明: false },
  { 编号: 11, 中文名: '海军蓝',   英文名: 'Navy',        红: 0,   绿: 0,   蓝: 128, 透明: false },
  { 编号: 12, 中文名: '橄榄',     英文名: 'Olive',       红: 128, 绿: 128, 蓝: 0,   透明: false },
  { 编号: 13, 中文名: '橙色',     英文名: 'Orange',      红: 255, 绿: 63,  蓝: 0,   透明: false },
  { 编号: 14, 中文名: '羊皮纸',   英文名: 'Parchment',   红: 255, 绿: 255, 蓝: 127, 透明: false },
  { 编号: 15, 中文名: '粉色',     英文名: 'Pink',        红: 255, 绿: 51,  蓝: 194, 透明: false },
  { 编号: 16, 中文名: '紫色',     英文名: 'Purple',      红: 51,  绿: 0,   蓝: 191, 透明: false },
  { 编号: 17, 中文名: '红色',     英文名: 'Red',         红: 255, 绿: 0,   蓝: 0,   透明: false },
  { 编号: 18, 中文名: '皇室紫',   英文名: 'Royalty',     红: 51,  绿: 0,   蓝: 102, 透明: false },
  { 编号: 19, 中文名: '银色',     英文名: 'Silver',      红: 191, 绿: 191, 蓝: 191, 透明: false },
  { 编号: 20, 中文名: '天蓝',     英文名: 'Sky',         红: 127, 绿: 170, 蓝: 255, 透明: false },
  { 编号: 21, 中文名: '板岩灰',   英文名: 'Slate',       红: 119, 绿: 136, 蓝: 153, 透明: false },
  { 编号: 22, 中文名: '黄褐',     英文名: 'Tan',         红: 255, 绿: 216, 蓝: 115, 透明: false },
  { 编号: 23, 中文名: '橘红',     英文名: 'Tangerine',   红: 242, 绿: 133, 蓝: 0,   透明: false },
  { 编号: 24, 中文名: '白色',     英文名: 'White',       红: 253, 绿: 253, 蓝: 253, 透明: false },
  { 编号: 25, 中文名: '黄色',     英文名: 'Yellow',      红: 255, 绿: 255, 蓝: 0,   透明: false },
];

/**
 * 向后兼容：染料调色板（全部命名颜色，ID 1-25）/ Backward-compat: dye palette (all named colors)
 */
export const 染料调色板: 染料类型[] = 方舟颜色列表.filter((c) => c.编号 > 0);

/**
 * 颜色总数 / Total color count
 */
export const 方舟颜色总数: number = 方舟颜色列表.length;

/**
 * 向后兼容：染料总数 / Backward-compat: dye count
 */
export const 染料总数: number = 染料调色板.length;

/**
 * 根据 Color ID 查找颜色 / Find color by Color ID
 * @param 编号 - 方舟 Color ID / ARK Color ID
 * @returns 对应颜色对象，未找到返回 undefined / Corresponding color or undefined
 */
export function 按编号查找颜色(编号: number): 方舟颜色类型 | undefined {
  return 方舟颜色列表.find((颜色) => 颜色.编号 === 编号);
}

/**
 * 向后兼容：根据 Color ID 查找染料 / Backward-compat: find dye by Color ID
 */
export function 按编号查找染料(编号: number): 染料类型 | undefined {
  return 按编号查找颜色(编号);
}

/**
 * 将颜色 RGB 转为 CSS 颜色字符串 / Convert color RGB to CSS color string
 */
export function 染料转CSS颜色(染料: 染料类型): string {
  return `rgb(${染料.红}, ${染料.绿}, ${染料.蓝})`;
}

/**
 * 将颜色 RGB 转为十六进制颜色字符串 / Convert color RGB to hex color string
 */
export function 染料转十六进制(染料: 染料类型): string {
  const 转十六进制 = (值: number): string => 值.toString(16).padStart(2, '0');
  return `#${转十六进制(染料.红)}${转十六进制(染料.绿)}${转十六进制(染料.蓝)}`;
}
