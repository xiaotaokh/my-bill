/**
 * 主题管理服务
 * 参考 showSimpleView 的存储模式
 * 处理主题存储、读取、切换和页面同步
 */
import { themes, getThemeStyle, getThemeColors, DEFAULT_THEME, cardBgColors, reportColors, statBgColors } from './themes';

const STORAGE_KEY = 'selectedTheme';

class ThemeManager {
  constructor() {
    this.currentTheme = DEFAULT_THEME;
    this.listeners = [];
  }

  /**
   * 初始化 - 从本地存储加载主题
   * 若无缓存则使用默认主题（fintech 星辰靛蓝）
   */
  init() {
    const cached = wx.getStorageSync(STORAGE_KEY);
    if (cached && themes[cached]) {
      this.currentTheme = cached;
    }
    return this.currentTheme;
  }

  /**
   * 获取当前主题 Key
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * 获取当前主题的颜色对象（用于 JS 端动态引用）
   */
  getThemeColors() {
    return getThemeColors(this.currentTheme);
  }

  /**
   * 获取当前主题的 CSS 变量样式字符串
   */
  getCurrentStyle() {
    return getThemeStyle(this.currentTheme);
  }

  /**
   * 切换主题并保存到本地存储
   * @param {string} themeKey 主题标识
   * @returns {boolean} 是否切换成功
   */
  setTheme(themeKey) {
    if (!themes[themeKey]) return false;
    this.currentTheme = themeKey;
    wx.setStorageSync(STORAGE_KEY, themeKey);
    this.notifyListeners();
    return true;
  }

  /**
   * 获取主题列表（用于 UI 展示）
   * @returns {Array} 主题列表数组
   */
  getAllThemes() {
    return Object.entries(themes).map(([key, value]) => ({
      key,
      name: value.name,
      description: value.description,
      isActive: key === this.currentTheme
    }));
  }

  /**
   * 获取当前主题的卡片背景色数组
   */
  getCardBgColors() {
    return cardBgColors[this.currentTheme] || cardBgColors.fintech;
  }

  /**
   * 获取当前主题的图表配色数组
   */
  getReportColors() {
    return reportColors[this.currentTheme] || reportColors.fintech;
  }

  /**
   * 获取当前主题的四个资产状态背景色
   */
  getStatBgColors() {
    return statBgColors[this.currentTheme] || statBgColors.fintech;
  }

  /**
   * 注册主题变更监听器
   * @param {Function} callback 页面回调函数
   * @returns {Function} 返回 callback 用于移除
   */
  addListener(callback) {
    this.listeners.push(callback);
    return callback;
  }

  /**
   * 移除主题变更监听器
   * @param {Function} callback 要移除的回调函数
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * 通知所有监听器主题已变更
   */
  notifyListeners() {
    const style = this.getCurrentStyle();
    const themeKey = this.currentTheme;
    this.listeners.forEach(cb => cb(style, themeKey));
  }
}

// 单例导出
export const themeManager = new ThemeManager();