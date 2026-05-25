/**
 * 主题配置模块
 * 新增主题只需在 themes 对象中添加配置项即可
 * 所有主题配置集中于此，便于扩展和维护
 */

export const themes = {
  // 默认主题 - 星辰靛蓝（FinTech 科技风）
  fintech: {
    name: '星辰靛蓝',
    description: '深邃海蓝主调，专业金融科技感',
    colors: {
      // 主色系 - Indigo 靛蓝系
      primary700: '#3730A3',
      primary600: '#4F46E5',
      primary500: '#6366F1',
      primary400: '#818CF8',
      primary200: '#C7D2FE',
      primary100: '#E0E7FF',
      primarySoft: '#EEF2FF',

      // 中性色
      neutral900: '#1E293B',
      neutral700: '#334155',
      neutral500: '#64748B',
      neutral300: '#CBD5E1',
      neutral200: '#E2E8F0',
      neutral100: '#F1F5F9',
      neutral50: '#F8FAFC',

      // 背景色
      bgBase: '#F8FAFC',
      bgCard: '#FFFFFF',
      bgSubtle: '#F1F5F9',
      bgHover: '#E2E8F0',
      bgCardRgb: '255, 255, 255',

      // 边框色
      borderDefault: '#E2E8F0',
      borderLight: '#F1F5F9',
      borderFocus: '#4F46E5',

      // 文本色
      textDefault: '#1E293B',
      textMuted: '#64748B',
      textHint: '#94A3B8',
      textInverse: '#FFFFFF',

      // 状态色
      success: '#10B981',
      successBg: '#ECFDF5',
      error: '#EF4444',
      errorBg: '#FEF2F2',
      warning: '#F59E0B',
      warningBg: '#FFFBEB',
      amber: '#B45309',

      // 资产状态色
      retired: '#B45309',
      sold: '#6B7280',
      gold: '#FBBF24',

      // 用户活跃度状态色
      activityHigh: '#10B981',
      activityHighBg: '#ECFDF5',
      activityHighText: '#059669',
      activityMedium: '#F59E0B',
      activityMediumBg: '#FFFBEB',
      activityMediumText: '#B45309',
      activityLow: '#94A3B8',

      // RGB 变量（用于 rgba）
      primary600Rgb: '79, 70, 229',
      errorRgb: '239, 68, 68',
      warningRgb: '245, 158, 11',
      neutral900Rgb: '30, 41, 59',
      shadowRgb: '148, 163, 184',
      textInverseRgb: '255, 255, 255',
      retiredRgb: '180, 83, 9',
      soldRgb: '107, 114, 128',
      goldRgb: '251, 191, 36',

      // 复合变量
      accentColor: '#4F46E5',
      primaryGradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',

      // 阴影
      shadowSoft: '0 8rpx 32rpx rgba(var(--shadow-rgb), 0.08)',
      shadowCard: '0 4rpx 16rpx rgba(var(--shadow-rgb), 0.06)',

      // 装饰色 - 气泡和卡片边框渐变
      pink: '#F472B6',
      hotPink: '#EC4899',
      mint: '#34D399',
      emerald: '#10B981',
      warmYellow: '#F59E0B',
      cream: '#FEF3C7',
      creamDark: '#FDE68A',
      creamLight: '#FEF7E6',
      creamMid: '#FDE9B8',
      orange: '#FB923C',
      purple: '#A78BFA',
      skyBlue: '#38BDF8',
      blue: '#3B82F6',
    }
  },

  // 极简呼吸感主题 - Warm & Natural
  minimal: {
    name: '大地暖息',
    description: '暖白基调，大地色系，简约温暖有呼吸感',
    colors: {
      // 主色系 - 暖棕色系（大地色，温暖自然）
      primary700: '#8B6F5E',
      primary600: '#A38472',
      primary500: '#B89B8A',
      primary400: '#CEB6A8',
      primary200: '#E2D3C9',
      primary100: '#F0E7E1',
      primarySoft: '#F6F0EC',

      // 中性色 - 暖灰系
      neutral900: '#2C2A28',
      neutral700: '#5C5955',
      neutral500: '#8E8A85',
      neutral300: '#C2BEB9',
      neutral200: '#D9D5D1',
      neutral100: '#EBE9E5',
      neutral50: '#F4F2F0',

      // 背景色 - 暖白
      bgBase: '#F6F4F1',
      bgCard: '#FFFFFF',
      bgSubtle: '#EEECE9',
      bgHover: '#E5E2DE',
      bgCardRgb: '255, 255, 255',

      // 边框色 - 暖灰
      borderDefault: '#E5E2DD',
      borderLight: '#EEECE9',
      borderFocus: '#A38472',

      // 文本色 - 暖深灰
      textDefault: '#2C2A28',
      textMuted: '#7A7671',
      textHint: '#A5A19C',
      textInverse: '#FFFFFF',

      // 状态色 - 柔和但清晰可辨
      success: '#7B9E8A',
      successBg: '#EFF4F1',
      error: '#D49A8E',
      errorBg: '#F8F1EF',
      warning: '#D4B08A',
      warningBg: '#F6F2EC',
      amber: '#B8935A',

      // 资产状态色
      retired: '#B8A088',
      sold: '#A5A19C',
      gold: '#E8C84A',

      // 用户活跃度状态色
      activityHigh: '#7B9E8A',
      activityHighBg: '#EFF4F1',
      activityHighText: '#5E7E6B',
      activityMedium: '#D4B08A',
      activityMediumBg: '#F6F2EC',
      activityMediumText: '#A8885A',
      activityLow: '#C2BEB9',

      // RGB 变量（用于 rgba）
      primary600Rgb: '163, 132, 114',
      errorRgb: '212, 154, 142',
      warningRgb: '212, 176, 138',
      neutral900Rgb: '44, 42, 40',
      shadowRgb: '165, 161, 156',
      textInverseRgb: '255, 255, 255',
      retiredRgb: '184, 160, 136',
      soldRgb: '180, 178, 174',
      goldRgb: '232, 200, 74',

      // 复合变量
      accentColor: '#A38472',
      primaryGradient: 'linear-gradient(135deg, #A38472 0%, #B89B8A 100%)',

      // 阴影 - 柔和暖影
      shadowSoft: '0 4rpx 12rpx rgba(var(--shadow-rgb), 0.04)',
      shadowCard: '0 2rpx 8rpx rgba(var(--shadow-rgb), 0.03)',

      // 装饰色 - 柔和彩色系
      pink: '#E8C8C4',
      hotPink: '#D99C94',
      mint: '#B8D0C0',
      emerald: '#8FB89E',
      warmYellow: '#E8DCC4',
      cream: '#F4F2EE',
      creamDark: '#E8E2DA',
      creamLight: '#FDFCFA',
      creamMid: '#EDE6DC',
      orange: '#E8C0A8',
      purple: '#C4B8D4',
      skyBlue: '#B8C8D4',
      blue: '#A0B8C8',
    }
  }
};

// 生成主题 CSS 变量字符串
export function getThemeStyle(themeKey) {
  const theme = themes[themeKey] || themes.fintech;
  const colors = theme.colors;

  // 生成主题色 CSS 变量（包含装饰色）
  const cssVars = Object.entries(colors)
    .map(([key, value]) => {
      // 转换驼峰为 CSS 变量格式：primary600 → --primary-600, bgCardRgb → --bg-card-rgb
      const cssKey = key
        .replace(/([a-z])(\d+)/g, '$1-$2')    // 字母与数字间加连字符：primary600 → primary-600
        .replace(/([A-Z])/g, '-$1')             // 大写字母前加连字符：bgCard → bg-Card
        .toLowerCase();
      return `--${cssKey}: ${value}`;
    })
    .join('; ');

  return cssVars;
}

// 默认主题 Key
export const DEFAULT_THEME = 'fintech';

// 获取当前主题的颜色对象（用于 JS 端动态引用）
export function getThemeColors(themeKey) {
  const theme = themes[themeKey] || themes.fintech;
  return theme.colors;
}

// 简单视图卡片背景色（按主题）
export const cardBgColors = {
  fintech: [
    '#C7D2FE', '#A5B4FC', '#BFDBFE', '#93C5FD', '#A7F3D0',
    '#6EE7B7', '#FCD34D', '#F9A8D4', '#F0ABFC', '#C4B5FD',
    '#DDD6FE', '#CBD5E1', '#D1D5DB', '#E2E8F0', '#BFDBFE',
    '#BAE6FD', '#C4B5FD', '#A7F3D0', '#D9F99D', '#C7D2FE'
  ],
  minimal: [
    '#E8D5C4', '#F0E0D0', '#E0D5C8', '#D4DCC8', '#C8DCD0',
    '#E4DEC8', '#ECE4C8', '#E8D4C8', '#E8CCD0', '#D0D0DC',
    '#C8D8DC', '#DCD4D0', '#ECE4D4', '#E4DCD0', '#D0DCC8',
    '#C8D8D0', '#E8E0C4', '#F0E0CC', '#E8D0CC', '#D8D0D4'
  ]
};

// 四个资产状态背景色（按主题）- 五彩实色，类似资产卡片背景
export const statBgColors = {
  fintech: ['#C7D2FE', '#A7F3D0', '#FDE68A', '#E2E8F0'],
  minimal: ['#E2D3C9', '#C8DCD0', '#E8CCD0', '#D0D0DC']
};

// 图表配色（按主题）
export const reportColors = {
  fintech: ['#4F46E5', '#6366F1', '#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#64748B', '#334155', '#3730A3'],
  minimal: ['#A38472', '#B89B8A', '#7B9E8A', '#8FB89E', '#D49A8E', '#D4B08A', '#C4B8D4', '#8E8A85', '#5C5955', '#2C2A28']
};