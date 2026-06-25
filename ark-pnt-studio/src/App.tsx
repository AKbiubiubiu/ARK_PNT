/**
 * 方舟 PNT 工坊 · 主应用组件 / ARK PNT Studio · Main App
 * ================================================================
 * 整合拖拽上传、高级图像编辑（调整/文字/裁剪）、实时量化、二进制导出、逆向解析全链路。
 * Integrates upload, advanced editing (adjust/text/crop), quantization, export, reverse parse.
 */

import { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import {
  Download,
  Loader2,
  Check,
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Settings2,
  ArrowLeftRight,
  Palette,
} from 'lucide-react';

import { 拖拽上传区 } from './components/拖拽上传区';
import { 图像编辑器 } from './components/图像编辑器';
import { 方舟画布预览 } from './components/方舟画布预览';
import { 逆向解析舱 } from './components/逆向解析舱';

import { 从文件加载图像 } from './lib/图像工具';
import {
  生成Pnt字节流,
  下载二进制文件,
  索引转RGBA,
  type 像素矩阵类型,
  type 索引像素矩阵类型,
} from './lib/Pnt二进制引擎';
import { 执行抖动量化, 重采样图像, 初始化查找表 } from './lib/抖动量化引擎';

// 目标尺寸选项 / Target size options
const 尺寸选项 = [128, 256, 512] as const;
// 目标对象类型 / Target object types
const 目标对象列表 = [
  { 名称: '墙面画布', 后缀: '_Sign_PaintingCanvas_C', 推荐尺寸: 256 },
  { 名称: '单面板旗帜', 后缀: '_Flag_SM_Single_C', 推荐尺寸: 256 },
  { 名称: '多面板旗帜', 后缀: '_Flag_SM_C', 推荐尺寸: 256 },
  { 名称: '木质广告牌', 后缀: '_Sign_Large_Wood_C', 推荐尺寸: 256 },
  { 名称: '金属广告牌', 后缀: '_Sign_Large_Metal_C', 推荐尺寸: 256 },
  { 名称: '战争地图', 后缀: '_Sign_WarMap_C', 推荐尺寸: 512 },
] as const;

export default function App() {
  // ---- 状态管理 / State management ----
  const [加载的图像, set加载的图像] = useState<HTMLImageElement | null>(null);
  const [原图加载中, set原图加载中] = useState(false);
  const [编辑后像素, set编辑后像素] = useState<像素矩阵类型 | null>(null);
  // 量化后的 Color ID 索引（用于生成 .pnt）/ Quantized Color ID indices (for .pnt)
  const [量化后索引, set量化后索引] = useState<索引像素矩阵类型 | null>(null);
  // 量化后的 RGBA 像素（用于画布预览）/ Quantized RGBA pixels (for canvas preview)
  const [量化后像素, set量化后像素] = useState<像素矩阵类型 | null>(null);
  const [目标尺寸, set目标尺寸] = useState<number>(256);
  const [抖动强度, set抖动强度] = useState<number>(1.0);
  const [导出中, set导出中] = useState(false);
  const [导出成功, set导出成功] = useState(false);
  const [当前标签页, set当前标签页] = useState<'正向' | '逆向'>('正向');
  const [选中对象, set选中对象] = useState<typeof 目标对象列表[number]>(目标对象列表[0]);

  // 应用启动时预初始化查找表 / Pre-initialize lookup table on mount
  useEffect(() => {
    try {
      初始化查找表();
    } catch (错误) {
      console.error('查找表初始化失败 / Lookup table init failed:', 错误);
    }
  }, []);

  // ---- 文件接受处理 / File accepted handler ----
  const 处理文件接受 = useCallback(async (文件: File) => {
    set原图加载中(true);
    try {
      const 图像 = await 从文件加载图像(文件);
      set加载的图像(图像);
      set编辑后像素(null);
      set量化后索引(null);
      set量化后像素(null);
    } catch (错误) {
      console.error('图像加载失败 / Image load failed:', 错误);
    } finally {
      set原图加载中(false);
    }
  }, []);

  // ---- 编辑器输出处理 / Editor output handler ----
  const 处理编辑结果 = useCallback((像素: 像素矩阵类型) => {
    set编辑后像素(像素);
  }, []);

  // ---- 当编辑像素或参数变化时，执行重采样 + 量化 / Resample + quantize on change ----
  useEffect(() => {
    if (!编辑后像素) {
      set量化后索引(null);
      set量化后像素(null);
      return;
    }

    try {
      // 重采样到目标尺寸 / Resample to target size
      const 重采样像素 = 重采样图像(编辑后像素, 目标尺寸, 目标尺寸);
      // 执行抖动量化，输出 Color ID 索引 / Perform dithering, output Color ID indices
      const 量化索引 = 执行抖动量化(重采样像素, 抖动强度);
      set量化后索引(量化索引);
      // 将索引转为 RGBA 用于画布预览 / Convert indices to RGBA for canvas preview
      set量化后像素(索引转RGBA(量化索引));
    } catch (错误) {
      console.error('量化失败 / Quantization failed:', 错误);
    }
  }, [编辑后像素, 目标尺寸, 抖动强度]);

  // ---- 导出 PNT / Export PNT ----
  const 处理导出 = useCallback(async () => {
    if (!量化后索引) return;
    set导出中(true);
    set导出成功(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const 字节流 = 生成Pnt字节流(量化后索引);
      // 文件名必须使用 ASCII 字符，游戏不识别非 ASCII 文件名
      // Filename must use ASCII characters, game doesn't recognize non-ASCII filenames
      const 文件名 = `ARKPaint_${选中对象.后缀}.pnt`;
      下载二进制文件(字节流, 文件名);

      set导出成功(true);
      setTimeout(() => set导出成功(false), 2000);
    } catch (错误) {
      console.error('导出失败 / Export failed:', 错误);
    } finally {
      set导出中(false);
    }
  }, [量化后索引, 选中对象]);

  // ---- 切换目标对象时自动调整尺寸 / Auto-adjust size on object change ----
  const 切换对象 = useCallback((对象: typeof 目标对象列表[number]) => {
    set选中对象(对象);
    set目标尺寸(对象.推荐尺寸);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      {/* ===== 顶部导航 / Top navigation ===== */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white md:text-lg">
                ARK PNT Studio
              </h1>
              <p className="hidden text-[11px] text-zinc-500 md:block">
                方舟生存进化 · 专业绘画转换工具
              </p>
            </div>
          </div>

          {/* 标签页切换 / Tab switch */}
          <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
            <button
              onClick={() => set当前标签页('正向')}
              className={`
                flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all
                md:px-4 md:text-sm
                ${当前标签页 === '正向' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-white'}
              `}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>图像转 PNT</span>
            </button>
            <button
              onClick={() => set当前标签页('逆向')}
              className={`
                flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all
                md:px-4 md:text-sm
                ${当前标签页 === '逆向' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-white'}
              `}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>PNT 逆向解析</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== 主内容区 / Main content ===== */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <AnimatePresence mode="wait">
          {当前标签页 === '正向' ? (
            <motion.div
              key="forward"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* ===== 正向转换流程 / Forward conversion ===== */}
              {!加载的图像 ? (
                // 未加载图像：显示拖拽区 / No image: show dropzone
                <div className="mx-auto max-w-2xl py-8 md:py-16">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                  >
                    <h2 className="mb-3 text-2xl font-bold text-white md:text-4xl">
                      将你的图片转换为方舟绘画
                    </h2>
                    <p className="text-sm text-zinc-400 md:text-base">
                      专业图像编辑 · 滤镜调整 · 文字叠加 · 25 种官方颜色精准量化
                    </p>
                  </motion.div>

                  {原图加载中 ? (
                    <div className="flex h-48 items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    </div>
                  ) : (
                    <拖拽上传区 onFileAccepted={处理文件接受} />
                  )}

                  {/* 特性卡片 / Feature cards */}
                  <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[
                      { 图标: Wand2, 标题: '滤镜与调整', 描述: '亮度/对比度/饱和度/色相实时调整' },
                      { 图标: ImageIcon, 标题: '文字叠加', 描述: '多层文字 · 拖拽定位 · 自定义样式' },
                      { 图标: Download, 标题: '一键导出 PNT', 描述: 'Floyd-Steinberg 抖动 · 二进制精准生成' },
                    ].map((特性, i) => (
                      <motion.div
                        key={特性.标题}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-xl"
                      >
                        <特性.图标 className="mb-2 h-5 w-5 text-cyan-400" />
                        <h3 className="text-sm font-semibold text-white">{特性.标题}</h3>
                        <p className="mt-1 text-xs text-zinc-400">{特性.描述}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                // 已加载图像：显示编辑界面 / Image loaded: show editor
                <div className="space-y-6">
                  {/* 顶部操作栏 / Top action bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          set加载的图像(null);
                          set编辑后像素(null);
                          set量化后索引(null);
                          set量化后像素(null);
                        }}
                        className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        重新选择图片
                      </button>
                    </div>
                  </div>

                  {/* 主编辑区：左编辑器 + 右预览 / Main editor: left editor + right preview */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* 左侧：图像编辑器 / Left: image editor */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl">
                        <div className="mb-4 flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-cyan-400" />
                          <h3 className="text-sm font-semibold text-white">图像编辑器</h3>
                          <span className="ml-auto text-[10px] text-zinc-500">调整 · 文字 · 裁剪</span>
                        </div>

                        <图像编辑器
                          图像源={加载的图像}
                          目标尺寸={目标尺寸}
                          onEdit={处理编辑结果}
                        />
                      </div>

                      {/* 参数控制 / Parameter controls */}
                      <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl">
                        <div className="mb-4 flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-cyan-400" />
                          <h3 className="text-sm font-semibold text-white">导出参数</h3>
                        </div>

                        {/* 目标对象选择 / Target object selector */}
                        <div className="mb-4">
                          <label className="mb-2 block text-xs font-medium text-zinc-400">
                            绘画目标对象
                          </label>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {目标对象列表.map((对象) => (
                              <button
                                key={对象.后缀}
                                onClick={() => 切换对象(对象)}
                                className={`
                                  rounded-xl px-3 py-2 text-xs font-medium transition-all
                                  ${选中对象.后缀 === 对象.后缀
                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                    : 'bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'}
                                `}
                              >
                                {对象.名称}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 输出尺寸 / Output size */}
                        <div className="mb-4">
                          <label className="mb-2 block text-xs font-medium text-zinc-400">
                            输出尺寸
                          </label>
                          <div className="flex gap-2">
                            {尺寸选项.map((尺寸) => (
                              <button
                                key={尺寸}
                                onClick={() => set目标尺寸(尺寸)}
                                disabled={尺寸 > 256 && 选中对象.推荐尺寸 < 512}
                                className={`
                                  flex-1 rounded-xl px-3 py-2 text-xs font-medium transition-all
                                  ${目标尺寸 === 尺寸
                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                    : 'bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'}
                                  ${尺寸 > 256 && 选中对象.推荐尺寸 < 512
                                    ? 'cursor-not-allowed opacity-40'
                                    : ''}
                                `}
                              >
                                {尺寸}×{尺寸}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 抖动强度 / Dithering strength */}
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <label className="text-xs font-medium text-zinc-400">
                              抖动强度
                            </label>
                            <span className="text-xs font-medium text-cyan-400">
                              {(抖动强度 * 100).toFixed(0)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.1}
                            value={抖动强度}
                            onChange={(e) => set抖动强度(parseFloat(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
                          />
                          <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                            <span>无抖动（色块）</span>
                            <span>标准 FS</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* 右侧：预览与导出 / Right: preview & export */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl">
                        <div className="mb-4 flex items-center gap-2">
                          <Palette className="h-4 w-4 text-cyan-400" />
                          <h3 className="text-sm font-semibold text-white">方舟画布预览</h3>
                          <span className="ml-auto text-[10px] text-zinc-500">量化后效果</span>
                        </div>
                        <方舟画布预览 像素矩阵={量化后像素} 显示尺寸={256} />
                      </div>

                      {/* 导出按钮 / Export button */}
                      <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl">
                        <button
                          onClick={处理导出}
                          disabled={!量化后像素 || 导出中}
                          className={`
                            flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5
                            text-sm font-medium transition-all duration-300
                            ${导出成功
                              ? 'bg-green-500 text-white'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30'}
                            ${(!量化后像素 || 导出中) ? 'cursor-not-allowed opacity-50' : ''}
                          `}
                        >
                          {导出中 ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>正在生成二进制...</span>
                            </>
                          ) : 导出成功 ? (
                            <>
                              <Check className="h-4 w-4 success-pulse" />
                              <span>导出成功！</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              <span>导出 PNT 文件</span>
                            </>
                          )}
                        </button>
                        <p className="mt-2 text-center text-[11px] text-zinc-500">
                          文件名格式：ARKPaint{选中对象.后缀}.pnt
                        </p>
                        <div className="mt-3 rounded-xl bg-amber-500/10 px-4 py-2.5 ring-1 ring-amber-500/20">
                          <p className="text-[11px] leading-relaxed text-amber-400">
                            提示：在游戏中加载绘画时，需要在物品栏中放置足够的染料。游戏会自动消耗对应颜色的染料来渲染画面。
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            // ===== 逆向解析标签页 / Reverse parse tab =====
            <motion.div
              key="reverse"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-2xl py-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-center"
              >
                <h2 className="mb-2 text-2xl font-bold text-white md:text-3xl">
                  PNT 文件逆向解析
                </h2>
                <p className="text-sm text-zinc-400">
                  上传 .pnt 文件，100% 高保真还原 · 悬停查看染料名称
                </p>
              </motion.div>

              <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl">
                <逆向解析舱 />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ===== 底部 / Footer ===== */}
      <footer className="mt-12 border-t border-white/5 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
          <p className="text-xs text-zinc-500">
            ARK PNT Studio · 基于 Floyd-Steinberg 抖动 + redmean 感知距离 + 预计算查找表
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            数据来源：ARK 官方 GIMP 调色板 · 25 种命名颜色 + 透明度 · 二进制规范 20B 头 + W×H×1 索引色
          </p>
        </div>
      </footer>

      {/* ===== 全局通知 / Global toaster ===== */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: 'rgba(24,24,27,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fafafa',
          },
        }}
      />
    </div>
  );
}
