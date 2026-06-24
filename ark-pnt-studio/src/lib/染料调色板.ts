/**
 * 方舟官方染料调色板数据模块 / ARK Official Dye Palette Data Module
 * ================================================================
 * 数据来源：ARK Fandom Wiki - Color IDs (https://ark.fandom.com/wiki/Color_IDs)
 *
 * 方舟可制作的染料（Coloring）共 25 种（Color ID 201-226，其中 211 为未使用占位）。
 * 每种染料的 RGB 数值均来自官方 Wiki，确保二进制生成与逆向解析的色彩精准度。
 *
 * ARK has 25 craftable dyes (Color ID 201-226, with 211 being unused placeholder).
 * All RGB values are sourced from the official Wiki to ensure color accuracy
 * for both binary generation and reverse parsing.
 */

/**
 * 染料数据结构 / Dye data structure
 * @property 编号 - 方舟 Color ID（201-226）/ ARK Color ID
 * @property 中文名 - 染料的中文显示名称 / Chinese display name
 * @property 英文名 - 染料的英文显示名称 / English display name
 * @property 红 - 红色通道值 0-255 / Red channel 0-255
 * @property 绿 - 绿色通道值 0-255 / Green channel 0-255
 * @property 蓝 - 蓝色通道值 0-255 / Blue channel 0-255
 */
export interface 染料类型 {
  编号: number;        // Color ID / Color ID
  中文名: string;      // Chinese name / Chinese name
  英文名: string;      // English name / English name
  红: number;          // Red 0-255 / Red 0-255
  绿: number;          // Green 0-255 / Green 0-255
  蓝: number;          // Blue 0-255 / Blue 0-255
}

/**
 * 方舟官方 25 种染料完整列表 / Complete list of 25 official ARK dyes
 * 顺序按 Color ID 升序排列，便于索引查找。
 * Ordered by Color ID ascending for easy index lookup.
 */
export const 染料调色板: 染料类型[] = [
  { 编号: 201, 中文名: '黑色染料',   英文名: 'Black',      红: 31,  绿: 31,  蓝: 31  },
  { 编号: 202, 中文名: '蓝色染料',   英文名: 'Blue',       红: 0,   绿: 0,   蓝: 255 },
  { 编号: 203, 中文名: '棕色染料',   英文名: 'Brown',      红: 117, 绿: 97,  蓝: 71  },
  { 编号: 204, 中文名: '青色染料',   英文名: 'Cyan',       红: 0,   绿: 255, 蓝: 255 },
  { 编号: 205, 中文名: '森林绿染料', 英文名: 'Forest',     红: 0,   绿: 108, 蓝: 0   },
  { 编号: 206, 中文名: '绿色染料',   英文名: 'Green',      红: 0,   绿: 255, 蓝: 0   },
  { 编号: 207, 中文名: '紫色染料',   英文名: 'Purple',     红: 108, 绿: 0,   蓝: 186 },
  { 编号: 208, 中文名: '橙色染料',   英文名: 'Orange',     红: 255, 绿: 136, 蓝: 0   },
  { 编号: 209, 中文名: '羊皮纸染料', 英文名: 'Parchment',  红: 255, 绿: 255, 蓝: 186 },
  { 编号: 210, 中文名: '粉色染料',   英文名: 'Pink',       红: 255, 绿: 123, 蓝: 225 },
  // 注意：Color ID 211 为「Unused Purple Dye」未使用占位，故跳过 / Note: ID 211 is unused, skipped
  { 编号: 212, 中文名: '红色染料',   英文名: 'Red',        红: 255, 绿: 0,   蓝: 0   },
  { 编号: 213, 中文名: '皇室紫染料', 英文名: 'Royalty',    红: 123, 绿: 0,   蓝: 168 },
  { 编号: 214, 中文名: '银色染料',   英文名: 'Silver',     红: 224, 绿: 224, 蓝: 224 },
  { 编号: 215, 中文名: '天蓝染料',   英文名: 'Sky',        红: 186, 绿: 212, 蓝: 255 },
  { 编号: 216, 中文名: '黄褐染料',   英文名: 'Tan',        红: 255, 绿: 237, 蓝: 130 },
  { 编号: 217, 中文名: '橘红染料',   英文名: 'Tangerine',  红: 173, 绿: 101, 蓝: 44  },
  { 编号: 218, 中文名: '白色染料',   英文名: 'White',      红: 254, 绿: 254, 蓝: 254 },
  { 编号: 219, 中文名: '黄色染料',   英文名: 'Yellow',     红: 255, 绿: 255, 蓝: 0   },
  { 编号: 220, 中文名: '品红染料',   英文名: 'Magenta',    红: 231, 绿: 31,  蓝: 217 },
  { 编号: 221, 中文名: '砖红染料',   英文名: 'Brick',      红: 148, 绿: 52,  蓝: 31  },
  { 编号: 222, 中文名: '哈密瓜染料', 英文名: 'Cantaloupe', 红: 255, 绿: 154, 蓝: 0   },
  { 编号: 223, 中文名: '泥色染料',   英文名: 'Mud',        红: 71,  绿: 59,  蓝: 43  },
  { 编号: 224, 中文名: '海军蓝染料', 英文名: 'Navy',       红: 52,  绿: 52,  蓝: 108 },
  { 编号: 225, 中文名: '橄榄染料',   英文名: 'Olive',      红: 186, 绿: 186, 蓝: 89  },
  { 编号: 226, 中文名: '板岩灰染料', 英文名: 'Slate',      红: 89,  绿: 89,  蓝: 89  },
];

/**
 * 染料总数 / Total dye count
 * 共 25 种有效染料 / 25 valid dyes in total
 */
export const 染料总数: number = 染料调色板.length;

/**
 * 将染料 RGB 转为 CSS 颜色字符串 / Convert dye RGB to CSS color string
 * @param 染料 - 染料对象 / Dye object
 * @returns CSS rgb 字符串 / CSS rgb string
 */
export function 染料转CSS颜色(染料: 染料类型): string {
  // 拼接为 rgb(r,g,b) 格式 / Concatenate to rgb(r,g,b) format
  return `rgb(${染料.红}, ${染料.绿}, ${染料.蓝})`;
}

/**
 * 将染料 RGB 转为十六进制颜色字符串 / Convert dye RGB to hex color string
 * @param 染料 - 染料对象 / Dye object
 * @returns #RRGGBB 格式字符串 / #RRGGBB format string
 */
export function 染料转十六进制(染料: 染料类型): string {
  // 每通道转 2 位十六进制并补零 / Convert each channel to 2-digit hex with zero padding
  const 转十六进制 = (值: number): string => 值.toString(16).padStart(2, '0');
  return `#${转十六进制(染料.红)}${转十六进制(染料.绿)}${转十六进制(染料.蓝)}`;
}

/**
 * 根据 Color ID 查找染料 / Find dye by Color ID
 * @param 编号 - 方舟 Color ID / ARK Color ID
 * @returns 对应染料对象，未找到返回 undefined / Corresponding dye or undefined
 */
export function 按编号查找染料(编号: number): 染料类型 | undefined {
  // 线性查找，25 项规模无需哈希 / Linear search, 25 items need no hashing
  return 染料调色板.find((染料) => 染料.编号 === 编号);
}
