/**
 * 主题配置模块
 * 新增主题只需在 themes 对象中添加配置项即可
 * 所有主题配置集中于此，便于扩展和维护
 */

const themes = {
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
      subscription: '#4F46E5',
      subscriptionBg: '#EEF2FF',

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
      subscriptionRgb: '79, 70, 229',

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

      // 强调背景组件色（用于彩色背景卡片、统计项等）
      accentBgText: '#1E293B',
      accentBgTextMuted: '#64748B',
      accentBgTextActive: '#4F46E5',
      accentBgPrimary: '#3730A3',
      accentBgTextRgb: '30, 41, 59',

      // 遮罩和阴影色
      overlayBg: 'rgba(0, 0, 0, 0.5)',
      overlayRgb: '0, 0, 0',
      shadowSubtle: 'rgba(0, 0, 0, 0.04)',
      shadowActiveOverlay: 'rgba(79, 70, 229, 0.10)',
      shadowPanel: 'rgba(0, 0, 0, 0.2)',

      // 复杂模式资产卡片文字色
      cardName: '#1E293B',
      cardDate: '#64748B',
      cardLabel: '#64748B',
      cardValue: '#1E293B',
      cardPrimary: '#4F46E5',
      cardMuted: '#94A3B8',
      cardCategoryText: '#64748B',
      cardCategoryBg: 'rgba(30, 41, 59, 0.06)',

      // 简单模式资产卡片文字色
      simpleCardName: '#1E293B',
      simpleCardCost: '#3730A3',

      // 卡片背景模式
      cardBgMode: 'translucent',

      // 导航栏
      navBg: '#4F46E5',
      navTextStyle: '#ffffff',
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
      subscription: '#A38472',
      subscriptionBg: '#F6F0EC',

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
      subscriptionRgb: '163, 132, 114',

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

      // 强调背景组件色
      accentBgText: '#2C2A28',
      accentBgTextMuted: '#5C5955',
      accentBgTextActive: '#A38472',
      accentBgPrimary: '#8B6F5E',
      accentBgTextRgb: '44, 42, 40',

      // 遮罩和阴影色
      overlayBg: 'rgba(0, 0, 0, 0.5)',
      overlayRgb: '0, 0, 0',
      shadowSubtle: 'rgba(0, 0, 0, 0.04)',
      shadowActiveOverlay: 'rgba(163, 132, 114, 0.10)',
      shadowPanel: 'rgba(0, 0, 0, 0.2)',

      // 复杂模式资产卡片文字色
      cardName: '#2C2A28',
      cardDate: '#5C5955',
      cardLabel: '#5C5955',
      cardValue: '#2C2A28',
      cardPrimary: '#A38472',
      cardMuted: '#7A7671',
      cardCategoryText: '#5C5955',
      cardCategoryBg: 'rgba(44, 42, 40, 0.06)',

      // 简单模式资产卡片文字色
      simpleCardName: '#2C2A28',
      simpleCardCost: '#8B6F5E',

      // 卡片背景模式
      cardBgMode: 'translucent',

      // 导航栏
      navBg: '#A38472',
      navTextStyle: '#ffffff',
    }
  },

  // 深色奢华主题 - Obsidian 黑曜夜境
  obsidian: {
    name: '黑曜夜境',
    description: '深邃黑底配香槟金，高级奢华夜间体验',
    colors: {
      // 主色系 - 香槟金
      primary700: '#B8860B',
      primary600: '#C9A962',
      primary500: '#D4AF37',
      primary400: '#E0C080',
      primary200: '#F0D890',
      primary100: '#F8E8B8',
      primarySoft: '#FDF4D8',

      // 中性色 - 深灰系
      neutral900: '#F5F5F5',
      neutral700: '#D4D4D4',
      neutral500: '#A3A3A3',
      neutral300: '#525252',
      neutral200: '#404040',
      neutral100: '#262626',
      neutral50: '#171717',

      // 背景色 - 深黑
      bgBase: '#0D0D0D',
      bgCard: '#1A1A1A',
      bgSubtle: '#262626',
      bgHover: '#333333',
      bgCardRgb: '26, 26, 26',

      // 边框色
      borderDefault: '#333333',
      borderLight: '#262626',
      borderFocus: '#C9A962',

      // 文本色 - 亮色系
      textDefault: '#F5F5F5',
      textMuted: '#A3A3A3',
      textHint: '#737373',
      textInverse: '#0D0D0D',

      // 状态色 - 高亮版
      success: '#4ADE80',
      successBg: '#1A2E1A',
      error: '#F87171',
      errorBg: '#2E1A1A',
      warning: '#FBBF24',
      warningBg: '#2E2A1A',
      amber: '#D97706',

      // 资产状态色
      retired: '#B45309',
      sold: '#6B7280',
      gold: '#D4AF37',
      subscription: '#C9A962',
      subscriptionBg: '#FDF4D8',

      // 用户活跃度状态色
      activityHigh: '#4ADE80',
      activityHighBg: '#1A2E1A',
      activityHighText: '#22C55E',
      activityMedium: '#FBBF24',
      activityMediumBg: '#2E2A1A',
      activityMediumText: '#D97706',
      activityLow: '#737373',

      // RGB 变量
      primary600Rgb: '201, 169, 98',
      errorRgb: '248, 113, 113',
      warningRgb: '251, 191, 36',
      neutral900Rgb: '245, 245, 245',
      shadowRgb: '115, 115, 115',
      textInverseRgb: '13, 13, 13',
      retiredRgb: '180, 83, 9',
      soldRgb: '107, 114, 128',
      goldRgb: '212, 175, 55',
      subscriptionRgb: '201, 169, 98',

      // 复合变量
      accentColor: '#C9A962',
      primaryGradient: 'linear-gradient(135deg, #C9A962 0%, #D4AF37 100%)',

      // 阴影 - 深色阴影
      shadowSoft: '0 8rpx 32rpx rgba(var(--shadow-rgb), 0.3)',
      shadowCard: '0 4rpx 16rpx rgba(var(--shadow-rgb), 0.2)',
      shadowGold: '0 4rpx 16rpx rgba(201, 169, 98, 0.15)',

      // 装饰色 - 深色版亮色点缀
      pink: '#F472B6',
      hotPink: '#EC4899',
      mint: '#34D399',
      emerald: '#10B981',
      warmYellow: '#FBBF24',
      cream: '#F8E8B8',
      creamDark: '#D4AF37',
      creamLight: '#FDF4D8',
      creamMid: '#E0C080',
      orange: '#FB923C',
      purple: '#A78BFA',
      skyBlue: '#38BDF8',
      blue: '#3B82F6',

      // 强调背景组件色 - 深色文字确保对比度
      accentBgText: '#171717',
      accentBgTextMuted: '#262626',
      accentBgTextActive: '#B8860B',
      accentBgPrimary: '#B8860D',
      accentBgTextRgb: '17, 17, 17',

      // 遮罩和阴影色 - 深色主题用亮色
      overlayBg: 'rgba(255, 255, 255, 0.08)',
      overlayRgb: '255, 255, 255',
      shadowSubtle: 'rgba(255, 255, 255, 0.02)',
      shadowActiveOverlay: 'rgba(201, 169, 98, 0.15)',
      shadowPanel: 'rgba(255, 255, 255, 0.12)',

      // 复杂模式资产卡片文字色 - 深色背景配白色/金色文字
      cardName: '#F5F5F5',
      cardDate: '#A3A3A3',
      cardLabel: '#A3A3A3',
      cardValue: '#F5F5F5',
      cardPrimary: '#C9A962',
      cardMuted: '#A3A3A3',
      cardCategoryText: '#A3A3A3',
      cardCategoryBg: 'rgba(245, 245, 245, 0.08)',

      // 简单模式资产卡片文字色
      simpleCardName: '#F5F5F5',
      simpleCardCost: '#C9A962',

      // 卡片背景模式 - 实色背景
      cardBgMode: 'solid',

      // 导航栏
      navBg: '#1A1A1A',
      navTextStyle: '#ffffff',
    }
  },

  // 清新自然主题 - Forest 森林呼吸
  forest: {
    name: '森林呼吸',
    description: '清新翡翠绿，自然气息与财富增长概念契合',
    colors: {
      // 主色系 - 翡翠绿
      primary700: '#065F46',
      primary600: '#059669',
      primary500: '#10B981',
      primary400: '#34D399',
      primary200: '#A7F3D0',
      primary100: '#D1FAE5',
      primarySoft: '#ECFDF5',

      // 中性色 - 深绿灰系
      neutral900: '#14532D',
      neutral700: '#166534',
      neutral500: '#3B7A5A',
      neutral300: '#6EA888',
      neutral200: '#A3CBB4',
      neutral100: '#C8DECF',
      neutral50: '#EAF3ED',

      // 背景色 - 浅绿
      bgBase: '#F0FDF4',
      bgCard: '#FFFFFF',
      bgSubtle: '#ECFDF5',
      bgHover: '#D1FAE5',
      bgCardRgb: '255, 255, 255',

      // 边框色
      borderDefault: '#D1FAE5',
      borderLight: '#ECFDF5',
      borderFocus: '#059669',

      // 文本色
      textDefault: '#14532D',
      textMuted: '#166534',
      textHint: '#15803D',
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
      subscription: '#2563EB',
      subscriptionBg: '#EFF6FF',

      // 用户活跃度状态色
      activityHigh: '#10B981',
      activityHighBg: '#ECFDF5',
      activityHighText: '#059669',
      activityMedium: '#F59E0B',
      activityMediumBg: '#FFFBEB',
      activityMediumText: '#B45309',
      activityLow: '#94A3B8',

      // RGB 变量
      primary600Rgb: '5, 150, 105',
      errorRgb: '239, 68, 68',
      warningRgb: '245, 158, 11',
      neutral900Rgb: '20, 83, 45',
      shadowRgb: '134, 239, 172',
      textInverseRgb: '255, 255, 255',
      retiredRgb: '180, 83, 9',
      soldRgb: '107, 114, 128',
      goldRgb: '251, 191, 36',
      subscriptionRgb: '37, 99, 235',

      // 复合变量
      accentColor: '#059669',
      primaryGradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',

      // 阴影
      shadowSoft: '0 8rpx 32rpx rgba(var(--shadow-rgb), 0.08)',
      shadowCard: '0 4rpx 16rpx rgba(var(--shadow-rgb), 0.06)',

      // 装饰色 - 自然色系
      pink: '#F9A8D4',
      hotPink: '#EC4899',
      mint: '#A7F3D0',
      emerald: '#10B981',
      warmYellow: '#FCD34D',
      cream: '#FEF3C7',
      creamDark: '#FDE68A',
      creamLight: '#FEF7E6',
      creamMid: '#FDE9B8',
      orange: '#FB923C',
      purple: '#A78BFA',
      skyBlue: '#38BDF8',
      blue: '#3B82F6',

      // 强调背景组件色
      accentBgText: '#14532D',
      accentBgTextMuted: '#166534',
      accentBgTextActive: '#059669',
      accentBgPrimary: '#065F46',
      accentBgTextRgb: '20, 83, 45',

      // 遮罩和阴影色
      overlayBg: 'rgba(0, 0, 0, 0.5)',
      overlayRgb: '0, 0, 0',
      shadowSubtle: 'rgba(0, 0, 0, 0.04)',
      shadowActiveOverlay: 'rgba(5, 150, 105, 0.10)',
      shadowPanel: 'rgba(0, 0, 0, 0.2)',

      // 复杂模式资产卡片文字色
      cardName: '#14532D',
      cardDate: '#166534',
      cardLabel: '#166534',
      cardValue: '#14532D',
      cardPrimary: '#059669',
      cardMuted: '#166534',
      cardCategoryText: '#166534',
      cardCategoryBg: 'rgba(20, 83, 45, 0.06)',

      // 简单模式资产卡片文字色
      simpleCardName: '#14532D',
      simpleCardCost: '#065F46',

      // 卡片背景模式
      cardBgMode: 'translucent',

      // 导航栏
      navBg: '#059669',
      navTextStyle: '#ffffff',
    }
  },

  // 温暖活力主题 - Sunset 日落暖橙
  sunset: {
    name: '日落暖橙',
    description: '活力橙红主调，温暖向上，适合年轻用户',
    colors: {
      // 主色系 - 橙红系
      primary700: '#C2410C',
      primary600: '#EA580C',
      primary500: '#F97316',
      primary400: '#FB923C',
      primary200: '#FED7AA',
      primary100: '#FFEDD5',
      primarySoft: '#FFF7ED',

      // 中性色 - 暖棕灰系
      neutral900: '#431407',
      neutral700: '#7C2D12',
      neutral500: '#8A6050',
      neutral300: '#B89788',
      neutral200: '#CEB9AD',
      neutral100: '#E0D3CC',
      neutral50: '#F2EDE8',

      // 背景色 - 暖黄
      bgBase: '#FFFBEB',
      bgCard: '#FFFFFF',
      bgSubtle: '#FFF7ED',
      bgHover: '#FFEDD5',
      bgCardRgb: '255, 255, 255',

      // 边框色
      borderDefault: '#FFEDD5',
      borderLight: '#FFF7ED',
      borderFocus: '#EA580C',

      // 文本色
      textDefault: '#431407',
      textMuted: '#7C2D12',
      textHint: '#9A3412',
      textInverse: '#FFFFFF',

      // 状态色
      success: '#22C55E',
      successBg: '#F0FDF4',
      error: '#EF4444',
      errorBg: '#FEF2F2',
      warning: '#F59E0B',
      warningBg: '#FFFBEB',
      amber: '#B45309',

      // 资产状态色
      retired: '#B45309',
      sold: '#6B7280',
      gold: '#FBBF24',
      subscription: '#EA580C',
      subscriptionBg: '#FFF7ED',

      // 用户活跃度状态色
      activityHigh: '#22C55E',
      activityHighBg: '#F0FDF4',
      activityHighText: '#15803D',
      activityMedium: '#F59E0B',
      activityMediumBg: '#FFFBEB',
      activityMediumText: '#B45309',
      activityLow: '#94A3B8',

      // RGB 变量
      primary600Rgb: '234, 88, 12',
      errorRgb: '239, 68, 68',
      warningRgb: '245, 158, 11',
      neutral900Rgb: '67, 20, 7',
      shadowRgb: '253, 186, 116',
      textInverseRgb: '255, 255, 255',
      retiredRgb: '180, 83, 9',
      soldRgb: '107, 114, 128',
      goldRgb: '251, 191, 36',
      subscriptionRgb: '234, 88, 12',

      // 复合变量
      accentColor: '#EA580C',
      primaryGradient: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',

      // 阴影
      shadowSoft: '0 8rpx 32rpx rgba(var(--shadow-rgb), 0.08)',
      shadowCard: '0 4rpx 16rpx rgba(var(--shadow-rgb), 0.06)',

      // 装饰色 - 活力暖色系
      pink: '#F9A8D4',
      hotPink: '#EC4899',
      mint: '#A7F3D0',
      emerald: '#10B981',
      warmYellow: '#FCD34D',
      cream: '#FEF3C7',
      creamDark: '#FDE68A',
      creamLight: '#FEF7E6',
      creamMid: '#FDE9B8',
      orange: '#FB923C',
      purple: '#A78BFA',
      skyBlue: '#38BDF8',
      blue: '#3B82F6',

      // 强调背景组件色
      accentBgText: '#431407',
      accentBgTextMuted: '#7C2D12',
      accentBgTextActive: '#EA580C',
      accentBgPrimary: '#C2410C',
      accentBgTextRgb: '67, 20, 7',

      // 遮罩和阴影色
      overlayBg: 'rgba(0, 0, 0, 0.5)',
      overlayRgb: '0, 0, 0',
      shadowSubtle: 'rgba(0, 0, 0, 0.04)',
      shadowActiveOverlay: 'rgba(234, 88, 12, 0.10)',
      shadowPanel: 'rgba(0, 0, 0, 0.2)',

      // 复杂模式资产卡片文字色
      cardName: '#431407',
      cardDate: '#7C2D12',
      cardLabel: '#7C2D12',
      cardValue: '#431407',
      cardPrimary: '#EA580C',
      cardMuted: '#7C2D12',
      cardCategoryText: '#7C2D12',
      cardCategoryBg: 'rgba(67, 20, 7, 0.06)',

      // 简单模式资产卡片文字色
      simpleCardName: '#431407',
      simpleCardCost: '#C2410C',

      // 卡片背景模式
      cardBgMode: 'translucent',

      // 导航栏
      navBg: '#EA580C',
      navTextStyle: '#ffffff',
    }
  },

  // 梦幻潮流主题 - Aurora 极光幻彩
  aurora: {
    name: '极光幻彩',
    description: '紫罗兰渐变配多彩点缀，梦幻潮流设计感',
    colors: {
      // 主色系 - 紫罗兰系
      primary700: '#5B21B6',
      primary600: '#8B5CF6',
      primary500: '#A78BFA',
      primary400: '#C4B5FD',
      primary200: '#DDD6FE',
      primary100: '#EDE9FE',
      primarySoft: '#F5F3FF',

      // 中性色 - 深紫灰系
      neutral900: '#1E1B4B',
      neutral700: '#312E81',
      neutral500: '#4C1D95',
      neutral300: '#6B21A8',
      neutral200: '#A78BFA',
      neutral100: '#C4B5FD',
      neutral50: '#FAFAFA',

      // 背景色 - 浅灰紫
      bgBase: '#FAFAFA',
      bgCard: '#FFFFFF',
      bgSubtle: '#F5F3FF',
      bgHover: '#EDE9FE',
      bgCardRgb: '255, 255, 255',

      // 边框色
      borderDefault: '#EDE9FE',
      borderLight: '#F5F3FF',
      borderFocus: '#8B5CF6',

      // 文本色
      textDefault: '#1E1B4B',
      textMuted: '#312E81',
      textHint: '#4C1D95',
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
      subscription: '#8B5CF6',
      subscriptionBg: '#F5F3FF',

      // 用户活跃度状态色
      activityHigh: '#10B981',
      activityHighBg: '#ECFDF5',
      activityHighText: '#059669',
      activityMedium: '#F59E0B',
      activityMediumBg: '#FFFBEB',
      activityMediumText: '#B45309',
      activityLow: '#94A3B8',

      // RGB 变量
      primary600Rgb: '139, 92, 246',
      errorRgb: '239, 68, 68',
      warningRgb: '245, 158, 11',
      neutral900Rgb: '30, 27, 75',
      shadowRgb: '196, 181, 253',
      textInverseRgb: '255, 255, 255',
      retiredRgb: '180, 83, 9',
      soldRgb: '107, 114, 128',
      goldRgb: '251, 191, 36',
      subscriptionRgb: '139, 92, 246',

      // 复合变量
      accentColor: '#8B5CF6',
      primaryGradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',

      // 阴影
      shadowSoft: '0 8rpx 32rpx rgba(var(--shadow-rgb), 0.08)',
      shadowCard: '0 4rpx 16rpx rgba(var(--shadow-rgb), 0.06)',
      shadowAurora: '0 4rpx 24rpx rgba(139, 92, 246, 0.15)',

      // 装饰色 - 极光多彩系
      pink: '#F472B6',
      hotPink: '#EC4899',
      mint: '#34D399',
      emerald: '#10B981',
      warmYellow: '#FCD34D',
      cream: '#FEF3C7',
      creamDark: '#FDE68A',
      creamLight: '#FEF7E6',
      creamMid: '#FDE9B8',
      orange: '#FB923C',
      purple: '#A78BFA',
      skyBlue: '#38BDF8',
      cyan: '#06B6D4',
      blue: '#3B82F6',

      // 强调背景组件色
      accentBgText: '#1E1B4B',
      accentBgTextMuted: '#312E81',
      accentBgTextActive: '#8B5CF6',
      accentBgPrimary: '#5B21B6',
      accentBgTextRgb: '30, 27, 75',

      // 遮罩和阴影色
      overlayBg: 'rgba(0, 0, 0, 0.5)',
      overlayRgb: '0, 0, 0',
      shadowSubtle: 'rgba(0, 0, 0, 0.04)',
      shadowActiveOverlay: 'rgba(139, 92, 246, 0.10)',
      shadowPanel: 'rgba(0, 0, 0, 0.2)',

      // 复杂模式资产卡片文字色
      cardName: '#1E1B4B',
      cardDate: '#312E81',
      cardLabel: '#312E81',
      cardValue: '#1E1B4B',
      cardPrimary: '#8B5CF6',
      cardMuted: '#312E81',
      cardCategoryText: '#312E81',
      cardCategoryBg: 'rgba(30, 27, 75, 0.06)',

      // 简单模式资产卡片文字色
      simpleCardName: '#1E1B4B',
      simpleCardCost: '#5B21B6',

      // 卡片背景模式
      cardBgMode: 'translucent',

      // 导航栏
      navBg: '#8B5CF6',
      navTextStyle: '#ffffff',
    }
  }
};

// 生成主题 CSS 变量字符串
function getThemeStyle(themeKey) {
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
const DEFAULT_THEME = 'fintech';

// 获取当前主题的颜色对象（用于 JS 端动态引用）
function getThemeColors(themeKey) {
  const theme = themes[themeKey] || themes.fintech;
  return theme.colors;
}

// 简单视图卡片背景色（按主题）
const cardBgColors = {
  fintech: [
    '#E2E8F0', '#D1D9E6', '#E8ECF4', '#C8D0DC', '#EDF2F7',
    '#D4DAE8', '#E6EDF6', '#C5CCD8', '#E0E7FF', '#C2CAD6',
    '#E4E9F2', '#CDD6E4', '#E8EEF4', '#CED6E2', '#DEE4EE',
    '#CCD3E0', '#DCE3F8', '#D0D8E4', '#D8E0F2', '#C0C8D4'
  ],
  minimal: [
    '#E8D5C4', '#C4D8D0', '#D0D0E0', '#D4DCC8', '#E0D0D8',
    '#C8D8DC', '#ECE4C8', '#E0D5C8', '#C8D0E0', '#DCD4D0',
    '#D0DCC8', '#E4D8C8', '#C8D8D4', '#D8C8D8', '#D8DCD0',
    '#E0D0C8', '#D0D0D8', '#E8DCC8', '#C8D4DC', '#DCD0D8'
  ],
  obsidian: [
    '#4A1E1E', '#1E4A2E', '#1E1E5A', '#5A4A1E', '#1E4A4A',
    '#4A1E4A', '#3A3A3A', '#5A2E1E', '#1E3A1E', '#1E2E5A',
    '#5A1E2E', '#2E5A1E', '#1E2E4A', '#4A2E4A', '#2E4A2E',
    '#1E1E4A', '#5A4A1E', '#1E5A4A', '#4A1E2E', '#2E4A4A'
  ],
  forest: [
    '#A7F3D0', '#D1FAE5', '#ECFDF5', '#BBF7D0', '#86EFAC',
    '#FCD34D', '#FBBF24', '#F9A8D4', '#A78BFA', '#38BDF8',
    '#3B82F6', '#C4B5FD', '#DDD6FE', '#F0FDF4', '#FED7AA',
    '#FFEDD5', '#FB923C', '#10B981', '#34D399', '#22C55E'
  ],
  sunset: [
    '#FED7AA', '#FFEDD5', '#FFF7ED', '#FDBA74', '#FB923C',
    '#FCD34D', '#FBBF24', '#F9A8D4', '#A78BFA', '#38BDF8',
    '#3B82F6', '#A7F3D0', '#D1FAE5', '#FFFBEB', '#FEF3C7',
    '#FDE68A', '#EA580C', '#F97316', '#22C55E', '#10B981'
  ],
  aurora: [
    '#C4B5FD', '#DDD6FE', '#EDE9FE', '#F5F3FF', '#A78BFA',
    '#F9A8D4', '#F472B6', '#EC4899', '#38BDF8', '#06B6D4',
    '#3B82F6', '#A7F3D0', '#D1FAE5', '#FCD34D', '#FBBF24',
    '#FB923C', '#8B5CF6', '#10B981', '#34D399', '#22C55E'
  ]
};

// 四个资产状态背景色（按主题）- 五彩实色，类似资产卡片背景
const statBgColors = {
  fintech: ['#C7D2FE', '#A7F3D0', '#FDE68A', '#E2E8F0'],
  minimal: ['#E2D3C9', '#C8DCD0', '#E8CCD0', '#D0D0DC'],
  obsidian: ['#F8E8B8', '#A7F3D0', '#FDE68A', '#E0C080'],  // 深色主题用亮色背景配深色文字
  forest: ['#A7F3D0', '#D1FAE5', '#FCD34D', '#BBF7D0'],
  sunset: ['#FED7AA', '#A7F3D0', '#FCD34D', '#FFEDD5'],
  aurora: ['#C4B5FD', '#F9A8D4', '#FCD34D', '#38BDF8']
};

// 图表配色（按主题）
const reportColors = {
  fintech: ['#4F46E5', '#6366F1', '#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#64748B', '#334155', '#3730A3'],
  minimal: ['#A38472', '#B89B8A', '#7B9E8A', '#8FB89E', '#D49A8E', '#D4B08A', '#C4B8D4', '#8E8A85', '#5C5955', '#2C2A28'],
  obsidian: ['#C9A962', '#D4AF37', '#4ADE80', '#38BDF8', '#F87171', '#FBBF24', '#A78BFA', '#A3A3A3', '#525252', '#B8860B'],
  forest: ['#059669', '#10B981', '#22C55E', '#34D399', '#EF4444', '#F59E0B', '#8B5CF6', '#15803D', '#166534', '#14532D'],
  sunset: ['#EA580C', '#F97316', '#22C55E', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#7C2D12', '#9A3412', '#431407'],
  aurora: ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#EF4444', '#F59E0B', '#A78BFA', '#312E81', '#4C1D95', '#1E1B4B']
};

module.exports = {
  themes,
  getThemeStyle,
  getThemeColors,
  DEFAULT_THEME,
  cardBgColors,
  statBgColors,
  reportColors
};
