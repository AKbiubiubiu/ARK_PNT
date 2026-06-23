/** @type {import('tailwindcss').Config} */
// Tailwind 配置 / Tailwind configuration
// 启用苹果极简风所需的全部扫描路径与扩展主题
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 苹果风圆角与阴影体系 / Apple-style radius & shadow system
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'apple': '0 4px 24px -8px rgba(0,0,0,0.08), 0 2px 8px -4px rgba(0,0,0,0.04)',
        'apple-hover': '0 8px 32px -12px rgba(0,0,0,0.12), 0 4px 12px -6px rgba(0,0,0,0.06)',
      },
      backdropBlur: {
        'apple': '20px',
      },
      // 苹果系字体栈 / Apple system font stack
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      // 平滑过渡曲线 / Smooth transition timing
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
