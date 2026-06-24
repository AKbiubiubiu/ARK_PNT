/**
 * 方舟官方颜色调色板数据模块 / ARK Official Color Palette Data Module
 * ================================================================
 * 数据来源 / Data source: ARK Fandom Wiki - Color IDs
 *   https://ark.fandom.com/wiki/Color_IDs
 *
 * 本模块涵盖方舟全部可用 Color ID，共 127 种：
 * This module covers all usable ARK Color IDs, 127 in total:
 *   - ID 0      : 透明（无颜色）/ Transparent (no color)
 *   - ID 1-100  : 生物颜色 / Creature colors
 *   - ID 201-226: 染料 / Dyes (含 211 不可合成紫色染料 / incl. 211 uncraftable purple)
 *
 * .pnt 文件中每个像素占 1 字节，直接存储 Color ID。
 * Each pixel in .pnt file occupies 1 byte, storing Color ID directly.
 */

/**
 * 方舟颜色数据结构 / ARK Color data structure
 * @property 编号 - 方舟 Color ID（0, 1-100, 201-226）/ ARK Color ID
 * @property 中文名 - 中文显示名称 / Chinese display name
 * @property 英文名 - 英文显示名称 / English display name
 * @property 红 - 红色通道值 0-255 / Red channel 0-255
 * @property 绿 - 绿色通道值 0-255 / Green channel 0-255
 * @property 蓝 - 蓝色通道值 0-255 / Blue channel 0-255
 * @property 透明 - 是否透明（仅 ID 0 为 true）/ Is transparent (only ID 0)
 */
export interface 方舟颜色类型 {
  编号: number;        // Color ID / Color ID
  中文名: string;      // Chinese name / Chinese name
  英文名: string;      // English name / English name
  红: number;          // Red 0-255 / Red 0-255
  绿: number;          // Green 0-255 / Green 0-255
  蓝: number;          // Blue 0-255 / Blue 0-255
  透明: boolean;       // Is transparent / Is transparent
}

/**
 * 方舟官方完整颜色列表 / Complete official ARK color list
 * 顺序按 Color ID 升序排列 / Ordered by Color ID ascending
 *
 * RGB 数值均来自官方 Wiki 十六进制色值，确保二进制生成与逆向解析的色彩精准度。
 * RGB values are sourced from official Wiki hex codes for color accuracy.
 */
export const 方舟颜色列表: 方舟颜色类型[] = [
  // ---- ID 0: 透明（无颜色）/ ID 0: Transparent (no color) ----
  { 编号: 0,   中文名: '透明',       英文名: 'Transparent',         红: 0,   绿: 0,   蓝: 0,   透明: true  },

  // ---- ID 1-100: 生物颜色 / ID 1-100: Creature colors ----
  { 编号: 1,   中文名: '红色',       英文名: 'Red',                 红: 255, 绿: 0,   蓝: 0,   透明: false },
  { 编号: 2,   中文名: '蓝色',       英文名: 'Blue',                红: 0,   绿: 0,   蓝: 255, 透明: false },
  { 编号: 3,   中文名: '绿色',       英文名: 'Green',               红: 0,   绿: 255, 蓝: 0,   透明: false },
  { 编号: 4,   中文名: '黄色',       英文名: 'Yellow',              红: 255, 绿: 255, 蓝: 0,   透明: false },
  { 编号: 5,   中文名: '青色',       英文名: 'Cyan',                红: 0,   绿: 255, 蓝: 255, 透明: false },
  { 编号: 6,   中文名: '品红',       英文名: 'Magenta',             红: 255, 绿: 0,   蓝: 255, 透明: false },
  { 编号: 7,   中文名: '浅绿',       英文名: 'Light Green',         红: 192, 绿: 255, 蓝: 186, 透明: false },
  { 编号: 8,   中文名: '浅灰',       英文名: 'Light Grey',          红: 200, 绿: 202, 蓝: 202, 透明: false },
  { 编号: 9,   中文名: '浅棕',       英文名: 'Light Brown',         红: 120, 绿: 103, 蓝: 89,  透明: false },
  { 编号: 10,  中文名: '浅橙',       英文名: 'Light Orange',        红: 255, 绿: 180, 蓝: 108, 透明: false },
  { 编号: 11,  中文名: '浅黄',       英文名: 'Light Yellow',        红: 255, 绿: 250, 蓝: 138, 透明: false },
  { 编号: 12,  中文名: '浅红',       英文名: 'Light Red',           红: 255, 绿: 117, 蓝: 108, 透明: false },
  { 编号: 13,  中文名: '深灰',       英文名: 'Dark Grey',           红: 123, 绿: 123, 蓝: 123, 透明: false },
  { 编号: 14,  中文名: '黑色',       英文名: 'Black',               红: 59,  绿: 59,  蓝: 59,  透明: false },
  { 编号: 15,  中文名: '棕色',       英文名: 'Brown',               红: 89,  绿: 58,  蓝: 42,  透明: false },
  { 编号: 16,  中文名: '深绿',       英文名: 'Dark Green',          红: 34,  绿: 73,  蓝: 0,   透明: false },
  { 编号: 17,  中文名: '深红',       英文名: 'Dark Red',            红: 129, 绿: 33,  蓝: 24,  透明: false },
  { 编号: 18,  中文名: '白色',       英文名: 'White',               红: 255, 绿: 255, 蓝: 255, 透明: false },
  { 编号: 19,  中文名: '龙浅红',     英文名: 'Dino Light Red',      红: 255, 绿: 168, 蓝: 168, 透明: false },
  { 编号: 20,  中文名: '龙深红',     英文名: 'Dino Dark Red',       红: 89,  绿: 43,  蓝: 43,  透明: false },
  { 编号: 21,  中文名: '龙浅橙',     英文名: 'Dino Light Orange',   红: 255, 绿: 182, 蓝: 148, 透明: false },
  { 编号: 22,  中文名: '龙深橙',     英文名: 'Dino Dark Orange',    红: 136, 绿: 83,  蓝: 47,  透明: false },
  { 编号: 23,  中文名: '龙浅黄',     英文名: 'Dino Light Yellow',   红: 202, 绿: 202, 蓝: 160, 透明: false },
  { 编号: 24,  中文名: '龙深黄',     英文名: 'Dino Dark Yellow',    红: 148, 绿: 148, 蓝: 108, 透明: false },
  { 编号: 25,  中文名: '龙浅绿',     英文名: 'Dino Light Green',    红: 224, 绿: 255, 蓝: 224, 透明: false },
  { 编号: 26,  中文名: '龙中绿',     英文名: 'Dino Medium Green',   红: 121, 绿: 148, 蓝: 121, 透明: false },
  { 编号: 27,  中文名: '龙深绿',     英文名: 'Dino Dark Green',     红: 34,  绿: 65,  蓝: 34,  透明: false },
  { 编号: 28,  中文名: '龙浅蓝',     英文名: 'Dino Light Blue',     红: 217, 绿: 224, 蓝: 255, 透明: false },
  { 编号: 29,  中文名: '龙深蓝',     英文名: 'Dino Dark Blue',      红: 57,  绿: 66,  蓝: 99,  透明: false },
  { 编号: 30,  中文名: '龙浅紫',     英文名: 'Dino Light Purple',   红: 228, 绿: 217, 蓝: 255, 透明: false },
  { 编号: 31,  中文名: '龙深紫',     英文名: 'Dino Dark Purple',    红: 64,  绿: 52,  蓝: 89,  透明: false },
  { 编号: 32,  中文名: '龙浅棕',     英文名: 'Dino Light Brown',    红: 255, 绿: 224, 蓝: 186, 透明: false },
  { 编号: 33,  中文名: '龙中棕',     英文名: 'Dino Medium Brown',   红: 148, 绿: 133, 蓝: 117, 透明: false },
  { 编号: 34,  中文名: '龙深棕',     英文名: 'Dino Dark Brown',     红: 89,  绿: 78,  蓝: 65,  透明: false },
  { 编号: 35,  中文名: '龙更深灰',   英文名: 'Dino Darker Grey',    红: 89,  绿: 89,  蓝: 89,  透明: false },
  { 编号: 36,  中文名: '龙白化',     英文名: 'Dino Albino',         红: 255, 绿: 255, 蓝: 255, 透明: false },
  { 编号: 37,  中文名: '大脚0',      英文名: 'BigFoot0',            红: 183, 绿: 150, 蓝: 131, 透明: false },
  { 编号: 38,  中文名: '大脚4',      英文名: 'BigFoot4',            红: 234, 绿: 218, 蓝: 213, 透明: false },
  { 编号: 39,  中文名: '大脚5',      英文名: 'BigFoot5',            红: 208, 绿: 167, 蓝: 148, 透明: false },
  { 编号: 40,  中文名: '狼毛',       英文名: 'WolfFur',             红: 195, 绿: 179, 蓝: 159, 透明: false },
  { 编号: 41,  中文名: '深狼毛',     英文名: 'DarkWolfFur',         红: 136, 绿: 118, 蓝: 102, 透明: false },
  { 编号: 42,  中文名: '龙基0',      英文名: 'DragonBase0',         红: 160, 绿: 102, 蓝: 75,  透明: false },
  { 编号: 43,  中文名: '龙基1',      英文名: 'DragonBase1',         红: 203, 绿: 121, 蓝: 86,  透明: false },
  { 编号: 44,  中文名: '龙火',       英文名: 'DragonFire',          红: 188, 绿: 79,  蓝: 0,   透明: false },
  { 编号: 45,  中文名: '龙绿0',      英文名: 'DragonGreen0',        红: 121, 绿: 132, 蓝: 108, 透明: false },
  { 编号: 46,  中文名: '龙绿1',      英文名: 'DragonGreen1',        红: 144, 绿: 156, 蓝: 121, 透明: false },
  { 编号: 47,  中文名: '龙绿2',      英文名: 'DragonGreen2',        红: 165, 绿: 164, 蓝: 139, 透明: false },
  { 编号: 48,  中文名: '龙绿3',      英文名: 'DragonGreen3',        红: 116, 绿: 147, 蓝: 156, 透明: false },
  { 编号: 49,  中文名: '飞龙紫0',    英文名: 'WyvernPurple0',       红: 120, 绿: 116, 蓝: 150, 透明: false },
  { 编号: 50,  中文名: '飞龙紫1',    英文名: 'WyvernPurple1',       红: 176, 绿: 162, 蓝: 192, 透明: false },
  { 编号: 51,  中文名: '飞龙蓝0',    英文名: 'WyvernBlue0',         红: 98,  绿: 129, 蓝: 167, 透明: false },
  { 编号: 52,  中文名: '飞龙蓝1',    英文名: 'WyvernBlue1',         红: 72,  绿: 92,  蓝: 117, 透明: false },
  { 编号: 53,  中文名: '龙中蓝',     英文名: 'Dino Medium Blue',    红: 95,  绿: 164, 蓝: 234, 透明: false },
  { 编号: 54,  中文名: '龙深蓝2',    英文名: 'Dino Deep Blue',      红: 69,  绿: 104, 蓝: 212, 透明: false },
  { 编号: 55,  中文名: '近白',       英文名: 'NearWhite',           红: 237, 绿: 237, 蓝: 237, 透明: false },
  { 编号: 56,  中文名: '近黑',       英文名: 'NearBlack',           红: 81,  绿: 81,  蓝: 81,  透明: false },
  { 编号: 57,  中文名: '深青绿',     英文名: 'DarkTurquoise',       红: 24,  绿: 69,  蓝: 70,  透明: false },
  { 编号: 58,  中文名: '中青绿',     英文名: 'MediumTurquoise',     红: 0,   绿: 112, 蓝: 96,  透明: false },
  { 编号: 59,  中文名: '青绿',       英文名: 'Turquoise',           红: 0,   绿: 197, 蓝: 171, 透明: false },
  { 编号: 60,  中文名: '绿板岩',     英文名: 'GreenSlate',          红: 64,  绿: 89,  蓝: 76,  透明: false },
  { 编号: 61,  中文名: '鼠尾草',     英文名: 'Sage',                红: 62,  绿: 79,  蓝: 64,  透明: false },
  { 编号: 62,  中文名: '深暖灰',     英文名: 'DarkWarmGray',        红: 59,  绿: 57,  蓝: 56,  透明: false },
  { 编号: 63,  中文名: '中暖灰',     英文名: 'MediumWarmGray',      红: 88,  绿: 85,  蓝: 84,  透明: false },
  { 编号: 64,  中文名: '浅暖灰',     英文名: 'LightWarmGray',       红: 155, 绿: 146, 蓝: 144, 透明: false },
  { 编号: 65,  中文名: '深水泥',     英文名: 'DarkCement',          红: 82,  绿: 91,  蓝: 86,  透明: false },
  { 编号: 66,  中文名: '浅水泥',     英文名: 'LightCement',         红: 138, 绿: 161, 蓝: 150, 透明: false },
  { 编号: 67,  中文名: '浅粉',       英文名: 'LightPink',           红: 232, 绿: 176, 蓝: 255, 透明: false },
  { 编号: 68,  中文名: '深粉',       英文名: 'DeepPink',            红: 255, 绿: 17,  蓝: 154, 透明: false },
  { 编号: 69,  中文名: '深紫罗兰',   英文名: 'DarkViolet',          红: 115, 绿: 0,   蓝: 70,  透明: false },
  { 编号: 70,  中文名: '深品红',     英文名: 'DarkMagenta',         红: 183, 绿: 0,   蓝: 66,  透明: false },
  { 编号: 71,  中文名: '焦赭',       英文名: 'BurntSienna',         红: 126, 绿: 51,  蓝: 30,  透明: false },
  { 编号: 72,  中文名: '中秋色',     英文名: 'MediumAutumn',        红: 169, 绿: 48,  蓝: 0,   透明: false },
  { 编号: 73,  中文名: '朱红',       英文名: 'Vermillion',          红: 239, 绿: 49,  蓝: 0,   透明: false },
  { 编号: 74,  中文名: '珊瑚',       英文名: 'Coral',               红: 255, 绿: 88,  蓝: 52,  透明: false },
  { 编号: 75,  中文名: '橙色',       英文名: 'Orange',              红: 255, 绿: 127, 蓝: 0,   透明: false },
  { 编号: 76,  中文名: '桃色',       英文名: 'Peach',               红: 255, 绿: 167, 蓝: 58,  透明: false },
  { 编号: 77,  中文名: '浅秋色',     英文名: 'LightAutumn',         红: 174, 绿: 112, 蓝: 0,   透明: false },
  { 编号: 78,  中文名: '芥末',       英文名: 'Mustard',             红: 148, 绿: 148, 蓝: 39,  透明: false },
  { 编号: 79,  中文名: '真黑',       英文名: 'ActualBlack',         红: 23,  绿: 23,  蓝: 23,  透明: false },
  { 编号: 80,  中文名: '午夜蓝',     英文名: 'MidnightBlue',        红: 25,  绿: 29,  蓝: 54,  透明: false },
  { 编号: 81,  中文名: '深蓝',       英文名: 'DarkBlue',            红: 21,  绿: 43,  蓝: 58,  透明: false },
  { 编号: 82,  中文名: '黑沙',       英文名: 'BlackSands',          红: 48,  绿: 37,  蓝: 49,  透明: false },
  { 编号: 83,  中文名: '柠檬绿',     英文名: 'LemonLime',           红: 168, 绿: 255, 蓝: 68,  透明: false },
  { 编号: 84,  中文名: '薄荷',       英文名: 'Mint',                红: 56,  绿: 233, 蓝: 133, 透明: false },
  { 编号: 85,  中文名: '翡翠',       英文名: 'Jade',                红: 0,   绿: 136, 蓝: 64,  透明: false },
  { 编号: 86,  中文名: '松绿',       英文名: 'PineGreen',           红: 15,  绿: 85,  蓝: 46,  透明: false },
  { 编号: 87,  中文名: '云杉绿',     英文名: 'SpruceGreen',         红: 0,   绿: 91,  蓝: 69,  透明: false },
  { 编号: 88,  中文名: '叶绿',       英文名: 'LeafGreen',           红: 91,  绿: 151, 蓝: 37,  透明: false },
  { 编号: 89,  中文名: '深薰衣草',   英文名: 'DarkLavender',        红: 94,  绿: 39,  蓝: 95,  透明: false },
  { 编号: 90,  中文名: '中薰衣草',   英文名: 'MediumLavender',      红: 133, 绿: 53,  蓝: 135, 透明: false },
  { 编号: 91,  中文名: '薰衣草',     英文名: 'Lavender',            红: 189, 绿: 119, 蓝: 190, 透明: false },
  { 编号: 92,  中文名: '深蓝绿',     英文名: 'DarkTeal',            红: 14,  绿: 64,  蓝: 74,  透明: false },
  { 编号: 93,  中文名: '中蓝绿',     英文名: 'MediumTeal',          红: 16,  绿: 85,  蓝: 99,  透明: false },
  { 编号: 94,  中文名: '蓝绿',       英文名: 'Teal',                红: 20,  绿: 132, 蓝: 156, 透明: false },
  { 编号: 95,  中文名: '粉蓝',       英文名: 'PowderBlue',          红: 130, 绿: 167, 蓝: 255, 透明: false },
  { 编号: 96,  中文名: '冰川',       英文名: 'Glacial',             红: 172, 绿: 234, 蓝: 255, 透明: false },
  { 编号: 97,  中文名: '迷彩',       英文名: 'Cammo',               红: 80,  绿: 81,  蓝: 24,  透明: false },
  { 编号: 98,  中文名: '干苔',       英文名: 'DryMoss',             红: 118, 绿: 110, 蓝: 63,  透明: false },
  { 编号: 99,  中文名: '蛋奶',       英文名: 'Custard',             红: 192, 绿: 189, 蓝: 94,  透明: false },
  { 编号: 100, 中文名: '奶油',       英文名: 'Cream',               红: 244, 绿: 255, 蓝: 192, 透明: false },

  // ---- ID 201-226: 染料 / ID 201-226: Dyes ----
  { 编号: 201, 中文名: '黑色染料',   英文名: 'Black Dye',           红: 31,  绿: 31,  蓝: 31,  透明: false },
  { 编号: 202, 中文名: '蓝色染料',   英文名: 'Blue Dye',            红: 0,   绿: 0,   蓝: 255, 透明: false },
  { 编号: 203, 中文名: '棕色染料',   英文名: 'Brown Dye',           红: 117, 绿: 97,  蓝: 71,  透明: false },
  { 编号: 204, 中文名: '青色染料',   英文名: 'Cyan Dye',            红: 0,   绿: 255, 蓝: 255, 透明: false },
  { 编号: 205, 中文名: '森林绿染料', 英文名: 'Forest Dye',          红: 0,   绿: 108, 蓝: 0,   透明: false },
  { 编号: 206, 中文名: '绿色染料',   英文名: 'Green Dye',           红: 0,   绿: 255, 蓝: 0,   透明: false },
  { 编号: 207, 中文名: '紫色染料',   英文名: 'Purple Dye',          红: 108, 绿: 0,   蓝: 186, 透明: false },
  { 编号: 208, 中文名: '橙色染料',   英文名: 'Orange Dye',          红: 255, 绿: 136, 蓝: 0,   透明: false },
  { 编号: 209, 中文名: '羊皮纸染料', 英文名: 'Parchment Dye',       红: 255, 绿: 255, 蓝: 186, 透明: false },
  { 编号: 210, 中文名: '粉色染料',   英文名: 'Pink Dye',            红: 255, 绿: 123, 蓝: 225, 透明: false },
  { 编号: 211, 中文名: '不可合成紫', 英文名: 'Uncraftable Purple',  红: 123, 绿: 0,   蓝: 224, 透明: false },
  { 编号: 212, 中文名: '红色染料',   英文名: 'Red Dye',             红: 255, 绿: 0,   蓝: 0,   透明: false },
  { 编号: 213, 中文名: '皇室紫染料', 英文名: 'Royalty Dye',         红: 123, 绿: 0,   蓝: 168, 透明: false },
  { 编号: 214, 中文名: '银色染料',   英文名: 'Silver Dye',          红: 224, 绿: 224, 蓝: 224, 透明: false },
  { 编号: 215, 中文名: '天蓝染料',   英文名: 'Sky Dye',             红: 186, 绿: 212, 蓝: 255, 透明: false },
  { 编号: 216, 中文名: '黄褐染料',   英文名: 'Tan Dye',             红: 255, 绿: 237, 蓝: 130, 透明: false },
  { 编号: 217, 中文名: '橘红染料',   英文名: 'Tangerine Dye',       红: 173, 绿: 101, 蓝: 44,  透明: false },
  { 编号: 218, 中文名: '白色染料',   英文名: 'White Dye',           红: 254, 绿: 254, 蓝: 254, 透明: false },
  { 编号: 219, 中文名: '黄色染料',   英文名: 'Yellow Dye',          红: 255, 绿: 255, 蓝: 0,   透明: false },
  { 编号: 220, 中文名: '品红染料',   英文名: 'Magenta Dye',         红: 231, 绿: 31,  蓝: 217, 透明: false },
  { 编号: 221, 中文名: '砖红染料',   英文名: 'Brick Dye',           红: 148, 绿: 52,  蓝: 31,  透明: false },
  { 编号: 222, 中文名: '哈密瓜染料', 英文名: 'Cantaloupe Dye',      红: 255, 绿: 154, 蓝: 0,   透明: false },
  { 编号: 223, 中文名: '泥色染料',   英文名: 'Mud Dye',             红: 71,  绿: 59,  蓝: 43,  透明: false },
  { 编号: 224, 中文名: '海军蓝染料', 英文名: 'Navy Dye',            红: 52,  绿: 52,  蓝: 108, 透明: false },
  { 编号: 225, 中文名: '橄榄染料',   英文名: 'Olive Dye',           红: 186, 绿: 186, 蓝: 89,  透明: false },
  { 编号: 226, 中文名: '板岩灰染料', 英文名: 'Slate Dye',           红: 89,  绿: 89,  蓝: 89,  透明: false },
];

/**
 * 方舟颜色总数 / Total ARK color count
 * 共 127 种颜色（1 透明 + 100 生物色 + 26 染料）
 * 127 colors total (1 transparent + 100 creature + 26 dyes)
 */
export const 方舟颜色总数: number = 方舟颜色列表.length;

/**
 * 透明颜色的 Color ID / Transparent color's Color ID
 * ID 0 在 .pnt 中表示「未上色」/ ID 0 means "unpainted" in .pnt
 */
export const 透明颜色ID: number = 0;

/**
 * Color ID → 颜色对象 的快速映射表 / Fast Color ID → color object map
 * 使用 Map 实现 O(1) 查找 / Uses Map for O(1) lookup
 */
export const 编号到颜色映射: Map<number, 方舟颜色类型> = new Map(
  方舟颜色列表.map((颜色) => [颜色.编号, 颜色])
);

/**
 * Color ID → RGB 的快速映射表 / Fast Color ID → RGB map
 * 用于逆向解析时将索引色快速转为 RGBA 用于画布渲染。
 * Used in reverse parsing to quickly convert index color to RGBA for canvas.
 */
export const 编号到RGB映射: Map<number, { 红: number; 绿: number; 蓝: number }> = new Map(
  方舟颜色列表.map((颜色) => [颜色.编号, { 红: 颜色.红, 绿: 颜色.绿, 蓝: 颜色.蓝 }])
);

/**
 * 将颜色 RGB 转为 CSS 颜色字符串 / Convert color RGB to CSS color string
 * @param 颜色 - 颜色对象 / Color object
 * @returns CSS rgb 字符串 / CSS rgb string
 */
export function 颜色转CSS(颜色: 方舟颜色类型): string {
  // 拼接为 rgb(r,g,b) 格式 / Concatenate to rgb(r,g,b) format
  return `rgb(${颜色.红}, ${颜色.绿}, ${颜色.蓝})`;
}

/**
 * 将颜色 RGB 转为十六进制颜色字符串 / Convert color RGB to hex color string
 * @param 颜色 - 颜色对象 / Color object
 * @returns #RRGGBB 格式字符串 / #RRGGBB format string
 */
export function 颜色转十六进制(颜色: 方舟颜色类型): string {
  // 每通道转 2 位十六进制并补零 / Convert each channel to 2-digit hex with zero padding
  const 转十六进制 = (值: number): string => 值.toString(16).padStart(2, '0');
  return `#${转十六进制(颜色.红)}${转十六进制(颜色.绿)}${转十六进制(颜色.蓝)}`;
}

/**
 * 根据 Color ID 查找颜色 / Find color by Color ID
 * @param 编号 - 方舟 Color ID / ARK Color ID
 * @returns 对应颜色对象，未找到返回 undefined / Corresponding color or undefined
 */
export function 按编号查找颜色(编号: number): 方舟颜色类型 | undefined {
  // 使用 Map O(1) 查找 / Use Map for O(1) lookup
  return 编号到颜色映射.get(编号);
}

// ============================================================================
// 向后兼容别名 / Backward-compatible aliases
// 保留旧名称以减少其他文件的改动量 / Keep old names to minimize changes
// ============================================================================
export type 染料类型 = 方舟颜色类型;
export const 染料调色板 = 方舟颜色列表;
export const 染料总数 = 方舟颜色总数;
export const 染料转CSS颜色 = 颜色转CSS;
export const 染料转十六进制 = 颜色转十六进制;
export const 按编号查找染料 = 按编号查找颜色;
