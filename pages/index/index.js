// index.js
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 引入 echarts
const echarts = require('../../components/ec-canvas/echarts');
// 引入主题管理器
const { themeManager } = require('../../utils/themeManager');
// 引入 Supabase
const { supabase, uploadFileToStorage, deleteStorageFile, getChinaTimeISO } = require('../../utils/supabase');
const { isAdmin, ADMIN_OPENID } = require('../../utils/auth');

Page({
  data: {
    // 日期
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    currentDay: new Date().getDate(),
    currentWeek: weekDays[new Date().getDay()],

    // 天气
    weatherText: '',
    weatherTemp: '',
    weatherIcon: '',
    weatherTempMax: '',
    weatherTempMin: '',
    weatherLoading: true,

    // 统计数据
    totalPrice: 0,
    dailyCost: 0,
    totalPriceSize: 64,
    dailyCostSize: 32,
    activeCount: 0,
    retiredCount: 0,
    soldCount: 0,
    statsTotalCount: 0,

    // 管理员标识
    showUserStats: false,
    isAdmin: false,

    // 资产列表
    assets: [],
    filteredAssets: [],
    filteredTotalPrice: '0.00',
    filteredDailyCost: '0.00',

    // 筛选状态
    activeStatus: 'all',
    statusMap: {
      all: '全部',
      active: '服役中',
      retired: '已退役',
      sold: '已卖出'
    },

    // 分类筛选
    activeCategory: 'all',
    categories: [],
    categoryList: [],

    // 排序
    sortDbFields: ['price', 'purchaseDate', 'createdAt'],
    sortOptions: ['价格', '购买时间', '添加时间', '服役时长', '日均成本'],
    currentSortIndex: 1,
    sortOrder: 'desc',

    // 视图控制
    showSetting: false,
    showReport: false,

    // 统计数据
    reportLoading: false,
    reportEmpty: false,
    reportTotalAssets: 0,
    reportTotalPrice: 0,
    reportExcludedPrice: 0,
    reportIncludedCount: 0,
    reportExcludedCount: 0,
    reportCategoryStats: [],
    reportColors: [],  // 由 initTheme() 动态设置

    // 状态统计
    reportActiveCount: 0,
    reportActivePrice: 0,
    reportRetiredCount: 0,
    reportRetiredPrice: 0,
    reportSoldCount: 0,
    reportSoldPrice: 0,
    reportDailyCost: 0,

    // 图表配置 - 使用延迟加载
    pieEc: { lazyLoad: true },
    lineEc: { lazyLoad: true },
    timePeriodEc: { lazyLoad: true },

    // 时间段统计
    activeTimePeriod: 'all',
    activeGranularity: 'year',
    timePeriodStats: null,

    // 环形图中间文字
    pieCenterText: '',
    pieCenterSubText: '总资产',

    // 批量删除
    showBatchDelete: false,
    batchAssetList: [],
    filteredBatchAssetList: [],
    selectedAssets: [],
    selectedTotalPrice: '0.00',
    isAllSelected: false,
    batchSearchKeyword: '',

    // 状态
    isLoading: false,
    _fromSetting: false,
    showBackToTop: false,

    // 搜索
    searchKeyword: '',
    showSearchInput: false,
    searchInputValue: '',
    searchInputFocus: false,

    // 关于弹窗
    showAboutModal: false,

    // 主题设置
    showThemeModal: false,
    themeList: [],
    currentThemeName: '星辰靛蓝',
    currentThemeKey: '',
    themeStyle: '',
    themeColors: {},
    statBgColors: [],

    // 欢迎提示弹窗
    showWelcomeToast: false,
    welcomeMessage: '',
    welcomeSubMessage: '',
    welcomeDuration: 10,

    // 金额显隐控制
    showAmount: true,

    // 资产列表视图模式
    showSimpleView: false,
    simpleViewCols: [[], [], [], [], []],

    // 预设头像 SVG（20个不同风格和语义的头像）
    presetAvatars: [
      // 生动语义化头像系列
      // 太阳 - 温暖阳光
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FFD93D"/><circle cx="50" cy="50" r="25" fill="%23FF6B6B"/><line x1="50" y1="10" x2="50" y2="25" stroke="%23FFD93D" stroke-width="4"/><line x1="50" y1="75" x2="50" y2="90" stroke="%23FFD93D" stroke-width="4"/><line x1="10" y1="50" x2="25" y2="50" stroke="%23FFD93D" stroke-width="4"/><line x1="75" y1="50" x2="90" y2="50" stroke="%23FFD93D" stroke-width="4"/><line x1="22" y1="22" x2="32" y2="32" stroke="%23FFD93D" stroke-width="4"/><line x1="68" y1="68" x2="78" y2="78" stroke="%23FFD93D" stroke-width="4"/><line x1="78" y1="22" x2="68" y2="32" stroke="%23FFD93D" stroke-width="4"/><line x1="32" y1="68" x2="22" y2="78" stroke="%23FFD93D" stroke-width="4"/></svg>',
      // 云朵 - 自由飘逸
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2387CEEB"/><ellipse cx="50" cy="55" rx="35" ry="25" fill="%23fff"/><circle cx="30" cy="50" r="20" fill="%23fff"/><circle cx="70" cy="50" r="20" fill="%23fff"/><circle cx="50" cy="40" r="22" fill="%23fff"/></svg>',
      // 月亮 - 宁静夜晚
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%232C3E50"/><circle cx="50" cy="50" r="35" fill="%23F5F5DC"/><circle cx="65" cy="50" r="25" fill="%232C3E50"/><circle cx="20" cy="25" r="3" fill="%23fff"/><circle cx="75" cy="30" r="2" fill="%23fff"/><circle cx="85" cy="60" r="2" fill="%23fff"/></svg>',
      // 花朵 - 绽放美好
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2396CEB4"/><circle cx="50" cy="50" r="12" fill="%23FFD93D"/><circle cx="50" cy="30" r="15" fill="%23FF69B4"/><circle cx="30" cy="45" r="15" fill="%23FF69B4"/><circle cx="70" cy="45" r="15" fill="%23FF69B4"/><circle cx="35" cy="65" r="15" fill="%23FF69B4"/><circle cx="65" cy="65" r="15" fill="%23FF69B4"/></svg>',
      // 彩虹 - 多彩缤纷
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23fff"/><path d="M20 70 Q50 20 80 70" stroke="%23E74C3C" stroke-width="6" fill="none"/><path d="M25 70 Q50 25 75 70" stroke="%23F39C12" stroke-width="6" fill="none"/><path d="M30 70 Q50 30 70 70" stroke="%23F1C40F" stroke-width="6" fill="none"/><path d="M35 70 Q50 35 65 70" stroke="%2327AE60" stroke-width="6" fill="none"/><path d="M40 70 Q50 40 60 70" stroke="%233498DB" stroke-width="6" fill="none"/><path d="M45 70 Q50 45 55 70" stroke="%239B59B6" stroke-width="6" fill="none"/></svg>',
      // 心形 - 温暖爱心
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FFC0CB"/><path d="M50 75 C25 55 20 35 35 30 C50 25 50 40 50 45 C50 40 50 25 65 30 C80 35 75 55 50 75" fill="%23E91E63"/></svg>',
      // 水滴 - 清澈纯净
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%234ECDC4"/><path d="M50 20 Q30 45 30 60 Q30 80 50 85 Q70 80 70 60 Q70 45 50 20" fill="%23fff"/><ellipse cx="50" cy="60" rx="15" ry="20" fill="%234ECDC4" opacity="0.5"/></svg>',
      // 山峰 - 坚毅稳重
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2385C1E9"/><polygon points="50,25 25,70 75,70" fill="%232C3E50"/><polygon points="50,35 35,70 65,70" fill="%23fff"/><polygon points="70,45 55,70 85,70" fill="%235D6D7E"/></svg>',
      // 闪电 - 充满活力
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%233498DB"/><polygon points="55,15 35,50 50,50 45,85 65,50 50,50" fill="%23F1C40F"/></svg>',
      // 音乐音符 - 艺术爱好
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23BB8FCE"/><circle cx="35" cy="70" r="10" fill="%23fff"/><circle cx="65" cy="60" r="10" fill="%23fff"/><rect x="43" y="25" width="4" height="45" fill="%23fff"/><rect x="73" y="20" width="4" height="40" fill="%23fff"/><path d="M47 25 L77 20" stroke="%23fff" stroke-width="4" fill="none"/></svg>',
      // 戴眼镜的学者
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%235D6D7E"/><circle cx="35" cy="42" r="8" fill="none" stroke="%23fff" stroke-width="2"/><circle cx="65" cy="42" r="8" fill="none" stroke="%23fff" stroke-width="2"/><line x1="43" y1="42" x2="57" y2="42" stroke="%23fff" stroke-width="2"/><circle cx="35" cy="42" r="3" fill="%23fff"/><circle cx="65" cy="42" r="3" fill="%23fff"/><path d="M35 65 Q50 72 65 65" stroke="%23fff" stroke-width="3" fill="none"/></svg>',
      // 戴帽子的旅行者
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23F39C12"/><ellipse cx="50" cy="18" rx="35" ry="12" fill="%238B4513"/><rect x="35" y="18" width="30" height="8" fill="%238B4513"/><circle cx="35" cy="45" r="5" fill="%23333"/><circle cx="65" cy="45" r="5" fill="%23333"/><path d="M35 60 Q50 68 65 60" stroke="%23333" stroke-width="3" fill="none"/></svg>',
      // 大笑表情
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FF9F43"/><path d="M25 35 L35 45" stroke="%23333" stroke-width="3"/><path d="M65 35 L75 45" stroke="%23333" stroke-width="3"/><path d="M25 45 L35 35" stroke="%23333" stroke-width="3"/><path d="M65 45 L75 35" stroke="%23333" stroke-width="3"/><path d="M25 58 Q50 80 75 58" stroke="%23333" stroke-width="3" fill="%23333"/></svg>',
      // 思考者
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%239B59B6"/><circle cx="35" cy="42" r="5" fill="%23fff"/><circle cx="65" cy="42" r="5" fill="%23fff"/><circle cx="37" cy="40" r="2" fill="%23333"/><circle cx="67" cy="40" r="2" fill="%23333"/><path d="M40 65 L50 60 L60 65" stroke="%23fff" stroke-width="3" fill="none"/></svg>',
      // 爱心头像
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23E91E63"/><path d="M50 70 C30 50 25 35 35 30 C45 25 50 35 50 40 C50 35 55 25 65 30 C75 35 70 50 50 70" fill="%23fff"/></svg>',
      // 星星头像
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%232C3E50"/><polygon points="50,20 56,38 75,38 60,50 66,68 50,58 34,68 40,50 25,38 44,38" fill="%23F1C40F"/></svg>',
      // 小猫咪
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FFE4C4"/><polygon points="20,25 30,45 25,45" fill="%23FFE4C4"/><polygon points="80,25 70,45 75,45" fill="%23FFE4C4"/><circle cx="35" cy="45" r="8" fill="%232C3E50"/><circle cx="65" cy="45" r="8" fill="%232C3E50"/><circle cx="37" cy="43" r="3" fill="%23fff"/><circle cx="67" cy="43" r="3" fill="%23fff"/><ellipse cx="50" cy="55" rx="6" ry="4" fill="%23FFE4C4"/><path d="M44 62 Q50 68 56 62" stroke="%232C3E50" stroke-width="2" fill="none"/></svg>',
      // 小熊猫
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23fff"/><circle cx="50" cy="50" r="35" fill="%232C3E50"/><circle cx="20" cy="25" r="12" fill="%232C3E50"/><circle cx="80" cy="25" r="12" fill="%232C3E50"/><circle cx="35" cy="45" r="10" fill="%23fff"/><circle cx="65" cy="45" r="10" fill="%23fff"/><circle cx="35" cy="45" r="5" fill="%232C3E50"/><circle cx="65" cy="45" r="5" fill="%232C3E50"/><ellipse cx="50" cy="60" rx="8" ry="5" fill="%232C3E50"/></svg>',
      // 机器人
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%233498DB"/><rect x="25" y="30" width="50" height="40" rx="5" fill="%232C3E50"/><rect x="30" y="38" width="15" height="10" rx="2" fill="%23E74C3C"/><rect x="55" y="38" width="15" height="10" rx="2" fill="%23E74C3C"/><rect x="40" y="58" width="20" height="8" rx="2" fill="%233498DB"/><rect x="45" y="15" width="10" height="15" fill="%232C3E50"/><circle cx="50" cy="15" r="5" fill="%23E74C3C"/></svg>',
      // 书虫（读书爱好者）
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2327AE60"/><rect x="25" y="55" width="50" height="25" rx="3" fill="%23fff"/><line x1="50" y1="55" x2="50" y2="80" stroke="%232C3E50" stroke-width="2"/><path d="M25 55 Q35 50 50 55" stroke="%2327AE60" stroke-width="2" fill="none"/><path d="M50 55 Q65 50 75 55" stroke="%2327AE60" stroke-width="2" fill="none"/><circle cx="35" cy="40" r="5" fill="%23fff"/><circle cx="65" cy="40" r="5" fill="%23fff"/><circle cx="37" cy="38" r="2" fill="%232C3E50"/><circle cx="67" cy="38" r="2" fill="%232C3E50"/></svg>'
    ],

    // 预设昵称（100个生动活泼的昵称）
    presetNicknames: [
      // 🌸 温暖治愈类（10个）
      '小确幸', '暖阳儿', '棉花糖', '奶油泡芙', '甜甜圈', '小太阳', '暖心窝', '小暖炉', '棉花云', '暖宝宝',
      // 🌙 星辰浪漫类（10个）
      '追星星', '月亮船', '星河漫步', '流星雨', '夜空中', '银河系', '小星星', '月光下', '星空梦', '摘月亮',
      // 🌿 自然清新类（10个）
      '小清新', '薄荷糖', '青草香', '小绿叶', '晨露珠', '清风徐', '白云朵', '小雨滴', '春暖花开', '微风起',
      // 🐱 萌宠可爱类（10个）
      '小奶猫', '小仓鼠', '小熊猫', '小企鹅', '小海豚', '小兔子', '小松鼠', '小考拉', '小刺猬', '小绵羊',
      // 🎵 音乐艺术类（10个）
      '小音符', '钢琴键', '吉他手', '小画笔', '调色板', '小诗人', '故事书', '小作家', '阅读者', '文艺范',
      // 🌈 活泼快乐类（10个）
      '开心果', '乐天派', '笑脸儿', '笑嘻嘻', '乐呵呵', '小快乐', '阳光派', '正能量', '活力满满', '元气满满',
      // 🏔️ 旅行探索类（10个）
      '小旅人', '背包客', '冒险家', '探索者', '山海间', '云游者', '小行者', '徒步者', '远方来', '在路上',
      // 🌸 花语美好类（10个）
      '小雏菊', '玫瑰花', '向日葵', '薰衣草', '樱花雨', '蒲公英', '茉莉花', '满天星', '小百合', '郁金香',
      // ☕ 生活态度类（10个）
      '慢生活', '小闲适', '简简单', '悠哉游', '小惬意', '自由派', '随性走', '小自在', '逍遥游', '小洒脱',
      // ✨ 梦想未来类（10个）
      '追梦人', '梦想家', '筑梦者', '小未来', '向前冲', '努力家', '小坚持', '奋斗派', '小目标', '向远方'
    ]
  },

  onLoad() {
    this.loadCategories();
    this.loadAssets();
    this.loadWeather();
    this.checkAdmin();
    this.checkUserAuth();
    this.initTheme();
  },

  // 检查用户是否已授权 - 新用户自动分配随机头像昵称
  checkUserAuth() {
    const app = getApp();

    app.getOpenid().then(async openid => {
      // 管理员直接加载布局偏好
      if (isAdmin(openid)) {
        this.loadLayoutPreference();
        return;
      }

      // 查询 Supabase 检查用户是否存在
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('_openid', openid)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('查询用户信息失败:', error);
        return;
      }

      if (!user) {
        // 用户不存在，自动创建随机头像昵称（新用户）
        this.createRandomUserInfo(true);
      } else {
        // 用户存在，先加载布局偏好
        this.loadLayoutPreference();

        if (!user.nickName || !user.avatarUrl) {
          // 存在记录但缺少昵称头像，自动补充随机信息
          this.updateUserInfoWithRandom(user.id, true);
        } else {
          // 用户已完善信息，显示欢迎回来提示
          this.showWelcomeToast(`欢迎回来，${user.nickName}`, '继续记录您的资产吧');
          app.globalData.userInfo = {
            nickName: user.nickName,
            avatarUrl: user.avatarUrl
          };
          // 更新访问时间
          await supabase
            .from('users')
            .update({ lastAccessTime: getChinaTimeISO() })
            .eq('_openid', openid);
        }
      }
    });
  },

  // 显示欢迎提示弹窗
  showWelcomeToast(message, subMessage = '', duration = 10) {
    const durationMs = duration * 1000;
    this.setData({
      showWelcomeToast: true,
      welcomeMessage: message,
      welcomeSubMessage: subMessage,
      welcomeDuration: duration
    });

    // 指定秒数后自动关闭
    this.welcomeTimer = setTimeout(() => {
      this.hideWelcomeToast();
    }, durationMs);
  },

  // 手动关闭欢迎提示
  hideWelcomeToast() {
    if (this.welcomeTimer) {
      clearTimeout(this.welcomeTimer);
      this.welcomeTimer = null;
    }
    this.setData({
      showWelcomeToast: false,
      welcomeMessage: '',
      welcomeSubMessage: '',
      welcomeDuration: 10
    });
  },

  // 为新用户自动创建随机头像昵称
  async createRandomUserInfo(isNewUser = false) {
    const { presetAvatars, presetNicknames } = this.data;
    const app = getApp();
    const openid = await app.getOpenid();

    // 随机选择头像
    const randomAvatar = presetAvatars[Math.floor(Math.random() * presetAvatars.length)];

    // 随机选择昵称 + 随机数字后缀
    const randomNickname = presetNicknames[Math.floor(Math.random() * presetNicknames.length)] +
                           Math.floor(Math.random() * 1000);

    // 显示新用户欢迎提示
    if (isNewUser) {
      this.showWelcomeToast(`欢迎，${randomNickname}`, '可在设置-账号中管理你的信息，请开启您的资产管理之旅吧！', 30);
    }

    try {
      // 上传 SVG 头像到 Supabase Storage
      const finalAvatarUrl = await this.uploadDataUrlAvatar(randomAvatar);

      // 保存用户信息到 Supabase（已查询确认用户不存在，用 insert 即可）
      const { error } = await supabase
        .from('users')
        .insert({
          _openid: openid,
          nickName: randomNickname,
          avatarUrl: finalAvatarUrl,
          createdAt: getChinaTimeISO(),
          updatedAt: getChinaTimeISO(),
          firstAccessTime: getChinaTimeISO(),
          lastAccessTime: getChinaTimeISO()
        });

      if (!error) {
        app.globalData.userInfo = {
          nickName: randomNickname,
          avatarUrl: finalAvatarUrl
        };
      }
    } catch (err) {
      console.error('自动创建用户信息失败:', err);
      // 上传失败时直接使用 data URL
      await supabase
        .from('users')
        .insert({
          _openid: openid,
          nickName: randomNickname,
          avatarUrl: randomAvatar,
          createdAt: getChinaTimeISO(),
          updatedAt: getChinaTimeISO(),
          firstAccessTime: getChinaTimeISO(),
          lastAccessTime: getChinaTimeISO()
        });
      app.globalData.userInfo = {
        nickName: randomNickname,
        avatarUrl: randomAvatar
      };
    }
  },

  // 为已有用户补充随机头像昵称
  async updateUserInfoWithRandom(userId, isNewUser = false) {
    const { presetAvatars, presetNicknames } = this.data;
    const app = getApp();
    const openid = await app.getOpenid();

    const randomAvatar = presetAvatars[Math.floor(Math.random() * presetAvatars.length)];
    const randomNickname = presetNicknames[Math.floor(Math.random() * presetNicknames.length)] +
                           Math.floor(Math.random() * 1000);

    // 显示新用户欢迎提示
    if (isNewUser) {
      this.showWelcomeToast(`欢迎，${randomNickname}`, '可在设置-账号中管理你的信息，请开启您的资产管理之旅吧！', 30);
    }

    try {
      const finalAvatarUrl = await this.uploadDataUrlAvatar(randomAvatar);
      await supabase
        .from('users')
        .update({ nickName: randomNickname, avatarUrl: finalAvatarUrl })
        .eq('_openid', openid);
      app.globalData.userInfo = {
        nickName: randomNickname,
        avatarUrl: finalAvatarUrl
      };
    } catch (err) {
      console.error('上传随机头像失败:', err);
      await supabase
        .from('users')
        .update({ nickName: randomNickname, avatarUrl: randomAvatar })
        .eq('_openid', openid);
      app.globalData.userInfo = {
        nickName: randomNickname,
        avatarUrl: randomAvatar
      };
    }
  },

  // 上传 SVG data URL 头像到 Supabase Storage
  uploadDataUrlAvatar(dataUrl) {
    return new Promise((resolve, reject) => {
      const fsm = wx.getFileSystemManager();
      const timestamp = Date.now();
      const tempFilePath = `${wx.env.USER_DATA_PATH}/avatar-${timestamp}.svg`;
      const fileName = `${timestamp}.svg`;

      // 从 data URL 中提取 SVG 内容
      let svgContent = dataUrl;
      if (dataUrl.startsWith('data:image/svg+xml,')) {
        svgContent = dataUrl.substring('data:image/svg+xml,'.length);
        // 解码 URL 编码
        svgContent = svgContent.replace(/%23/g, '#').replace(/%20/g, ' ').replace(/%3C/g, '<').replace(/%3E/g, '>').replace(/%22/g, '"').replace(/%27/g, "'").replace(/%2F/g, '/').replace(/%3A/g, ':').replace(/%3D/g, '=');
      }

      fsm.writeFile({
        filePath: tempFilePath,
        data: svgContent,
        encoding: 'utf8',
        success: () => {
          // 直接上传临时文件到 Supabase Storage
          uploadFileToStorage('avatars', fileName, tempFilePath)
            .then(result => {
              fsm.unlink({ filePath: tempFilePath, fail: () => {} });

              if (result.error) {
                console.error('Supabase Storage 上传失败:', result.error);
                resolve(dataUrl);
                return;
              }

              resolve(result.publicUrl);
            })
            .catch(err => {
              fsm.unlink({ filePath: tempFilePath, fail: () => {} });
              console.error('上传处理失败:', err);
              resolve(dataUrl);
            });
        },
        fail: err => {
          console.error('写入临时文件失败:', err);
          resolve(dataUrl);
        }
      });
    });
  },

  checkAdmin() {
    const app = getApp();

    app.getOpenid().then(openid => {
      if (isAdmin(openid)) {
        this.setData({
          isAdmin: true,
          showUserStats: true
        });
      } else {
        this.setData({
          isAdmin: false,
          showUserStats: false
        });
      }
    }).catch(err => {
      this.setData({
        isAdmin: false,
        showUserStats: false
      });
    });
  },

  onShow() {
    if (this.data.isLoading) return;

    if (this.data._fromSetting) {
      this.setData({ showSetting: true, _fromSetting: false });
    }

    this.loadCategories();
    this.loadAssets();
  },

  // 加载天气
  loadWeather() {
    this.setData({ weatherLoading: true });

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const { latitude, longitude } = res;
        this.fetchWeather(latitude, longitude);
      },
      fail: (err) => {
        // 位置获取失败时显示默认状态
        this.setData({
          weatherText: '',
          weatherTemp: '',
          weatherIcon: '',
          weatherLoading: false
        });
      }
    });
  },

  // 获取天气数据（通过 Supabase Edge Function）
  fetchWeather(latitude, longitude) {
    supabase.functions.invoke('getWeather', { latitude, longitude })
      .then(result => {
        const { data, error } = result;

        if (error || !data || !data.success) {
          this.setData({ weatherLoading: false });
          return;
        }

        const { now, forecast } = data;

        const updateData = { weatherLoading: false };

        if (now) {
          updateData.weatherText = now.text || '';
          updateData.weatherTemp = now.temp || '';
          updateData.weatherIcon = this.getWeatherIcon(now.text);
        }

        if (forecast && forecast[0]) {
          updateData.weatherTempMax = forecast[0].tempMax || '';
          updateData.weatherTempMin = forecast[0].tempMin || '';
        }

        this.setData(updateData);
      }).catch(err => {
        this.setData({ weatherLoading: false });
      });
  },

  // 根据天气描述获取对应的图标
  getWeatherIcon(text) {
    const iconMap = {
      '晴': '☀️',
      '多云': '⛅',
      '阴': '☁️',
      '小雨': '🌧️',
      '中雨': '🌧️',
      '大雨': '🌧️',
      '暴雨': '⛈️',
      '雷阵雨': '⛈️',
      '小雪': '🌨️',
      '中雪': '🌨️',
      '大雪': '❄️',
      '雨夹雪': '🌨️',
      '雾': '🌫️',
      '霾': '🌫️',
      '风': '💨',
      '浮尘': '🌪️',
      '扬沙': '🌪️'
    };

    for (const key in iconMap) {
      if (text && text.includes(key)) {
        return iconMap[key];
      }
    }
    return '🌡️';
  },

  // 加载类别
  async loadCategories() {
    const app = getApp();
    try {
      const openid = await app.getOpenid();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('_openid', openid)
        .order('sortOrder', { ascending: true });

      if (error) {
        this.setData({ categories: [], categoryList: [] });
        return;
      }

      this.processCategories(data || []);
    } catch (err) {
      console.error('加载分类失败:', err);
      this.setData({ categories: [], categoryList: [] });
    }
  },

  async processCategories(categoriesData) {
    const categoriesWithIcons = categoriesData.map(category => ({
      name: category.name,
      icon: category.icon || '',
      displayIcon: category.icon && category.icon.startsWith('http') ? category.icon : null
    }));

    this.setData({
      categories: categoriesWithIcons.map(c => c.name),
      categoryList: categoriesWithIcons
    }, () => this.updateAssetsCategoryIcon());
  },

  // 加载资产
  async loadAssets(searchKeyword) {
    if (this.data.isLoading) return;

    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    const app = getApp();
    const { currentSortIndex, sortOrder, sortDbFields } = this.data;

    // 使用传入的搜索关键词，或当前状态中的值
    const keyword = searchKeyword !== undefined ? searchKeyword : this.data.searchKeyword;

    try {
      const openid = await app.getOpenid();

      // Supabase 查询
      let query = supabase
        .from('assets')
        .select('*')
        .eq('_openid', openid);

      // 添加名称搜索条件（Supabase 使用 ilike）
      if (keyword) {
        query = query.ilike('name', `%${keyword}%`);
      }

      // 排序
      const sortField = sortDbFields[currentSortIndex];
      const orderField = sortField || 'createdAt';
      const orderDir = sortField ? sortOrder : 'desc';

      query = query.order(orderField, { ascending: orderDir === 'asc' });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // 处理图标 - HTTP 链接用图片，emoji 用文字
      const assetsWithIcon = data.map(asset => ({
        ...asset,
        _id: asset.id, // Supabase id 映射到 _id
        displayIcon: asset.icon && asset.icon.startsWith('http') ? asset.icon : null
      }));

      const assets = assetsWithIcon.map(a => this.calculateAssetFields(a));
      // 为复杂模式资产卡片分配背景色
      const cardBgColors = themeManager.getCardBgColors();
      const cardBgMode = themeManager.getThemeColors().cardBgMode;
      const opacity = cardBgMode === 'solid' ? 1 : 0.30;
      assets.forEach((a, i) => {
        const hex = cardBgColors[i % cardBgColors.length];
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        a._cardBg = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      });
      this.setData({ assets, isLoading: false });

      // 应用筛选
      this.applyFilters();

      if (!sortDbFields[currentSortIndex]) {
        this.applySort();
      }
    } catch (err) {
      console.error('加载资产失败:', err);
      this.setData({ assets: [], filteredAssets: [], simpleViewCols: [[], [], [], [], []], isLoading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  parseDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return new Date(dateInput);
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 获取周期类型显示文本
  getPeriodTypeText(periodType, periodDays) {
    const periodTextMap = {
      'monthly': '月',
      'quarterly': '季',
      'yearly': '年',
      'weekly': '周',
      'custom': periodDays ? `${periodDays}天` : '自定义'
    };
    return periodTextMap[periodType] || '周期';
  },

  // 格式化每期金额显示
  formatPeriodAmount(asset) {
    if (asset.assetType !== 'subscription' || !asset.periodAmount) return { amount: '', period: '' };
    const periodTypeText = this.getPeriodTypeText(asset.periodType, asset.periodDays);
    return {
      amount: asset.periodAmount,
      period: periodTypeText
    };
  },

  // 按日历计算订阅周期数（不使用固定天数）
  calcSubscriptionPeriods(asset, startDate, endDate) {
    const periodType = asset.periodType;
    // 从 periodDays 解码计算方式（monthly/quarterly/yearly 类型时存 0/1/2）
    let calcMethod = 'day_to_day';
    if (periodType === 'monthly' || periodType === 'quarterly' || periodType === 'yearly') {
      const code = parseInt(asset.periodDays);
      if (!isNaN(code) && code >= 0 && code <= 2) {
        calcMethod = ['natural', 'day_to_day', 'day_to_day_minus_one'][code];
      }
    }

    if (periodType === 'weekly') {
      const usedDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      const safeDays = Math.max(1, usedDays);
      return { usedDays: safeDays, completedPeriods: Math.floor(safeDays / 7) + 1 };
    }
    if (periodType === 'custom') {
      const customDays = parseInt(asset.periodDays) || 30;
      const usedDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      const safeDays = Math.max(1, usedDays);
      return { usedDays: safeDays, completedPeriods: Math.floor(safeDays / customDays) + 1 };
    }

    if (periodType === 'yearly') {
      return this.calcYearlyPeriods(startDate, endDate, calcMethod);
    }
    if (periodType === 'quarterly') {
      return this.calcQuarterlyPeriods(startDate, endDate, calcMethod);
    }
    // monthly
    return this.calcMonthlyPeriods(startDate, endDate, calcMethod);
  },

  // 计算月度周期
  calcMonthlyPeriods(startDate, endDate, calcMethod) {
    const sy = startDate.getFullYear(), sm = startDate.getMonth(), sd = startDate.getDate();
    const ey = endDate.getFullYear(), em = endDate.getMonth(), ed = endDate.getDate();

    const mDiff = (ey - sy) * 12 + (em - sm);
    const usedDays = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));

    // 处理月尾边界：如果开始日是31号，当前月只有28天，则有效日为28
    const daysInMonth = new Date(ey, em + 1, 0).getDate();
    const effDay = Math.min(sd, daysInMonth);

    let completedPeriods;
    if (calcMethod === 'natural') {
      completedPeriods = Math.max(1, mDiff + 1);
    } else if (calcMethod === 'day_to_day') {
      completedPeriods = ed > effDay ? mDiff + 1 : Math.max(1, mDiff);
    } else { // day_to_day_minus_one
      completedPeriods = ed >= effDay ? mDiff + 1 : Math.max(1, mDiff);
    }

    return { usedDays, completedPeriods };
  },

  // 计算年度周期
  calcYearlyPeriods(startDate, endDate, calcMethod) {
    const sy = startDate.getFullYear(), sm = startDate.getMonth(), sd = startDate.getDate();
    const ey = endDate.getFullYear(), em = endDate.getMonth(), ed = endDate.getDate();

    const yDiff = ey - sy;
    const usedDays = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));

    // 处理月尾边界
    const daysInMonth = new Date(ey, em + 1, 0).getDate();
    const effDay = Math.min(sd, daysInMonth);

    let completedPeriods;
    if (calcMethod === 'natural') {
      completedPeriods = Math.max(1, yDiff + 1);
    } else if (calcMethod === 'day_to_day') {
      if (em > sm || (em === sm && ed > effDay)) {
        completedPeriods = yDiff + 1;
      } else {
        completedPeriods = Math.max(1, yDiff);
      }
    } else { // day_to_day_minus_one
      if (em > sm || (em === sm && ed >= effDay)) {
        completedPeriods = yDiff + 1;
      } else {
        completedPeriods = Math.max(1, yDiff);
      }
    }

    return { usedDays, completedPeriods };
  },

  // 计算季度周期
  calcQuarterlyPeriods(startDate, endDate, calcMethod) {
    const sy = startDate.getFullYear(), sm = startDate.getMonth(), sd = startDate.getDate();
    const ey = endDate.getFullYear(), em = endDate.getMonth(), ed = endDate.getDate();

    const mDiff = (ey - sy) * 12 + (em - sm);
    const qDiff = Math.floor(mDiff / 3);
    const remainingMonths = mDiff % 3;
    const usedDays = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));

    // 处理月尾边界
    const daysInMonth = new Date(ey, em + 1, 0).getDate();
    const effDay = Math.min(sd, daysInMonth);

    let completedPeriods;
    if (calcMethod === 'natural') {
      const sq = Math.floor(sm / 3);
      const eq = Math.floor(em / 3);
      const qDiffNat = (ey - sy) * 4 + (eq - sq);
      completedPeriods = Math.max(1, qDiffNat + 1);
    } else if (calcMethod === 'day_to_day') {
      completedPeriods = (remainingMonths > 0 || ed > effDay) ? qDiff + 1 : Math.max(1, qDiff);
    } else { // day_to_day_minus_one
      completedPeriods = (remainingMonths > 0 || ed >= effDay) ? qDiff + 1 : Math.max(1, qDiff);
    }

    return { usedDays, completedPeriods };
  },

  calculateAssetFields(asset) {
    // 订阅资产处理
    if (asset.assetType === 'subscription') {
      const purchaseDate = this.parseDate(asset.purchaseDate);
      const now = new Date();
      const subscriptionStartDate = asset.subscriptionStartDate ? this.parseDate(asset.subscriptionStartDate) : purchaseDate;

      // 计算订阅开始日期（待生效状态使用subscriptionStartDate）
      const effectiveStartDate = asset.subscriptionStatus === 'pending' ? subscriptionStartDate : purchaseDate;

      // 订阅结束日期
      let endDate = now;
      if (asset.subscriptionStatus === 'ended' && asset.subscriptionEndDate) {
        endDate = this.parseDate(asset.subscriptionEndDate);
      }

      // 计算已订阅天数
      let usedDays = 0;
      if (asset.subscriptionStatus !== 'pending') {
        usedDays = Math.floor((endDate - effectiveStartDate) / (1000 * 60 * 60 * 24));
        if (usedDays < 1) usedDays = 1;
      }

      // 计算总投入（按日历周期）
      let totalInvestment = 0;
      if (asset.subscriptionStatus !== 'pending' && asset.periodAmount && asset.periodType) {
        const result = this.calcSubscriptionPeriods(asset, effectiveStartDate, endDate);
        usedDays = result.usedDays;
        totalInvestment = asset.periodAmount * result.completedPeriods;
      }

      // 订阅资产日均成本 = 总投入 / 已订阅天数
      const dailyCost = (asset.subscriptionStatus !== 'pending' && usedDays > 0 && totalInvestment > 0)
        ? (totalInvestment / usedDays).toFixed(2)
        : '0.00';

      const startDate = this.formatDate(asset.subscriptionStartDate || asset.purchaseDate);
      const dateRangeEnd = asset.subscriptionStatus === 'ended' && asset.subscriptionEndDate
        ? this.formatDate(asset.subscriptionEndDate) : '至今';

      const categoryItem = this.data.categoryList && this.data.categoryList.find(c => c.name === asset.category);
      const categoryIcon = (categoryItem && categoryItem.displayIcon) || (categoryItem && categoryItem.icon) || '';
      const categoryIconUrl = categoryIcon && categoryIcon.startsWith('http') ? categoryIcon : '';

      return {
        ...asset,
        usedDays,
        dailyCost,
        dailyEquivalent: '0.00',
        totalInvestment: totalInvestment.toFixed(2),
        periodAmountDisplay: this.formatPeriodAmount(asset).amount,
        periodTypeDisplay: this.formatPeriodAmount(asset).period,
        dateRange: asset.subscriptionStatus === 'pending'
          ? `待生效: ${startDate}`
          : (asset.subscriptionStatus === 'ended'
            ? `${startDate} - ${dateRangeEnd}`
            : `${startDate} - 至今`),
        categoryIcon,
        categoryIconUrl
      };
    }

    // 普通资产处理
    const purchaseDate = this.parseDate(asset.purchaseDate);
    const now = new Date();
    let usedDays = 0;
    let endDate = now;

    if (asset.purchaseDate) {
      const retiredDateStr = asset.retiredDate || asset.soldDate;
      if ((asset.status === 'retired' || asset.status === 'sold') && retiredDateStr) {
        endDate = this.parseDate(retiredDateStr);
      }
      usedDays = Math.floor((endDate - purchaseDate) / (1000 * 60 * 60 * 24)) + 1;
      if (usedDays <= 0) usedDays = 1;
    }

    const startDate = this.formatDate(asset.purchaseDate);
    const retiredDateStr = asset.retiredDate || asset.soldDate;
    const dateRangeEnd = (asset.status === 'retired' || asset.status === 'sold') && retiredDateStr
      ? this.formatDate(retiredDateStr) : '至今';

    let dailyCost = '0.00';
    let dailyEquivalent = '0.00';
    if (asset.status === 'active' && asset.price && usedDays >= 1) {
      dailyCost = (asset.price / usedDays).toFixed(2);
    } else if ((asset.status === 'retired' || asset.status === 'sold') && asset.price && usedDays >= 1) {
      dailyEquivalent = (asset.price / usedDays).toFixed(2);
    }

    const categoryItem = this.data.categoryList && this.data.categoryList.find(c => c.name === asset.category);
    const categoryIcon = (categoryItem && categoryItem.displayIcon) || (categoryItem && categoryItem.icon) || '';
    const categoryIconUrl = categoryIcon && categoryIcon.startsWith('http') ? categoryIcon : '';

    return {
      ...asset,
      usedDays,
      dailyCost,
      dailyEquivalent,
      dateRange: asset.status === 'active' ? `${startDate} - 至今` : `${startDate} - ${dateRangeEnd}`,
      categoryIcon,
      categoryIconUrl
    };
  },

  updateAssetsCategoryIcon() {
    const { assets, categoryList } = this.data;
    if (!assets.length || !categoryList || !categoryList.length) return;

    const update = list => list.map(asset => {
      const item = categoryList.find(c => c.name === asset.category);
      const icon = (item && item.displayIcon) || (item && item.icon) || '';
      return { ...asset, categoryIcon: icon, categoryIconUrl: icon && icon.startsWith('http') ? icon : '' };
    });

    const nextFiltered = update(this.data.filteredAssets);
    this.setData({ assets: update(assets), filteredAssets: nextFiltered, simpleViewCols: this._splitIntoCols(nextFiltered) });
  },

  // 应用筛选
  applyFilters() {
    const { assets, activeStatus, activeCategory } = this.data;
    let filtered = [...assets];

    // 按状态筛选
    if (activeStatus !== 'all') {
      filtered = filtered.filter(a => a.status === activeStatus);
    }

    // 按分类筛选
    if (activeCategory !== 'all') {
      filtered = filtered.filter(a => a.category === activeCategory);
    }

    this.setData({ filteredAssets: filtered }, () => {
      this.calculateStats();
      this._updateSimpleCols(filtered);
    });
  },

  calculateStats() {
    const { filteredAssets, assets, activeCategory } = this.data;
    let totalPrice = 0, dailyCostTotal = 0;
    let filteredTotal = 0; // 当前筛选条件下所有资产总金额
    let filteredDailyTotal = 0; // 当前筛选条件下所有资产的日均总和
    let activeCount = 0, retiredCount = 0, soldCount = 0;
    let subscriptionActiveCount = 0, subscriptionPendingCount = 0, subscriptionEndedCount = 0;

    // 根据分类筛选计算统计数量
    const statsAssets = activeCategory === 'all' ? assets : assets.filter(a => a.category === activeCategory);
    statsAssets.forEach(asset => {
      // 订阅资产统计
      if (asset.assetType === 'subscription') {
        if (asset.subscriptionStatus === 'active' || (!asset.subscriptionStatus && asset.status === 'active')) {
          subscriptionActiveCount++;
        } else if (asset.subscriptionStatus === 'pending') {
          subscriptionPendingCount++;
        } else if (asset.subscriptionStatus === 'ended') {
          subscriptionEndedCount++;
        }
      } else {
        // 普通资产统计
        if (asset.status === 'active') activeCount++;
        else if (asset.status === 'retired') retiredCount++;
        else if (asset.status === 'sold') soldCount++;
      }
    });

    // 从筛选后的资产计算金额统计
    filteredAssets.forEach(asset => {
      // 订阅资产处理
      if (asset.assetType === 'subscription') {
        // 订阅资产使用 totalInvestment 作为总金额
        const investment = parseFloat(asset.totalInvestment) || 0;
        filteredTotal += investment;

        // 订阅资产日均成本
        if (asset.subscriptionStatus !== 'pending' && asset.subscriptionStatus !== 'ended' && asset.dailyCost) {
          filteredDailyTotal += parseFloat(asset.dailyCost);
        }

        if (asset.excludeTotal === true || asset.excludeTotal === 'true') return;
        totalPrice += investment;

        // 订阅资产的日均成本计入统计（待生效和已结束的不计入）
        if (asset.subscriptionStatus !== 'pending' && asset.subscriptionStatus !== 'ended' &&
            asset.excludeDaily !== true && asset.excludeDaily !== 'true' && asset.dailyCost) {
          dailyCostTotal += parseFloat(asset.dailyCost);
        }
        return;
      }

      // 普通资产处理
      filteredTotal += asset.price || 0; // 计算所有资产金额

      // 计算所有资产的日均（active用dailyCost，retired/sold用dailyEquivalent）
      if (asset.status === 'active' && asset.dailyCost) {
        filteredDailyTotal += parseFloat(asset.dailyCost);
      } else if ((asset.status === 'retired' || asset.status === 'sold') && asset.dailyEquivalent) {
        filteredDailyTotal += parseFloat(asset.dailyEquivalent);
      }

      if (asset.excludeTotal === true || asset.excludeTotal === 'true') return;
      totalPrice += asset.price || 0;

      if (asset.status === 'active' && asset.excludeDaily !== true && asset.excludeDaily !== 'true' && asset.dailyCost) {
        dailyCostTotal += parseFloat(asset.dailyCost);
      }
    });

    const totalPriceStr = totalPrice.toFixed(2);
    const dailyCostStr = dailyCostTotal.toFixed(2);

    // 根据数字长度计算字体大小
    const calcFontSize = (numStr, baseSize, minSize) => {
      const len = numStr.length;
      if (len <= 6) return baseSize;
      if (len <= 8) return baseSize - 4;
      if (len <= 10) return baseSize - 8;
      if (len <= 12) return baseSize - 14;
      return Math.max(minSize, baseSize - 20);
    };

    this.setData({
      totalPrice: totalPriceStr,
      filteredTotalPrice: filteredTotal.toFixed(2),
      filteredDailyCost: filteredDailyTotal.toFixed(2),
      dailyCost: dailyCostStr,
      totalPriceSize: calcFontSize(totalPriceStr, 48, 26),
      dailyCostSize: calcFontSize(dailyCostStr, 28, 20),
      activeCount, retiredCount, soldCount,
      subscriptionActiveCount, subscriptionPendingCount, subscriptionEndedCount,
      statsTotalCount: statsAssets.length
    });
  },

  filterByStatus(e) {
    this.setData({ activeStatus: e.currentTarget.dataset.status });
    this.applyFilters();
  },

  filterByCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.category });
    this.applyFilters();
  },

  changeSort(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      currentSortIndex: index,
      sortOrder: this.data.sortOrder === 'desc' ? 'asc' : 'desc'
    });

    if (this.data.sortDbFields[index]) {
      this.loadAssets();
    } else {
      this.applySort();
    }
  },

  applySort() {
    const { filteredAssets, currentSortIndex, sortOrder } = this.data;
    const sorted = [...filteredAssets];

    const getVal = (a, key) => {
      if (key === 'price') return Number(a.price) || 0;
      if (key === 'purchaseDate' || key === 'createdAt') return this.parseDate(a[key]).getTime();
      if (key === 'usedDays') return a.usedDays || 0;
      if (key === 'dailyCost') {
        if (a.status !== 'active') return 0;
        const days = (Date.now() - this.parseDate(a.purchaseDate).getTime()) / 86400000;
        return days > 0 ? a.price / days : 0;
      }
      return 0;
    };

    const fields = ['price', 'purchaseDate', 'createdAt', 'usedDays', 'dailyCost'];
    const field = fields[currentSortIndex];
    sorted.sort((a, b) => sortOrder === 'desc' ? getVal(b, field) - getVal(a, field) : getVal(a, field) - getVal(b, field));

    this.setData({ filteredAssets: sorted }, () => {
      this.calculateStats();
      this._updateSimpleCols(sorted);
    });
  },

  goToAdd() {
    // 检查是否有分类,没有分类则提示用户先去添加
    if (!this.data.categoryList || this.data.categoryList.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请先在设置中添加资产分类',
        confirmText: '去添加',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/category-manage/category-manage' });
          }
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/asset-add/asset-add' });
  },

  switchToHome() {
    this.setData({ showSetting: false, showReport: false });
  },

  switchToReport() {
    // 切换到统计页面时关闭搜索功能
    this.setData({
      showReport: true,
      showSetting: false,
      showSearchInput: false,
      searchKeyword: '',
      searchInputValue: '',
      searchInputFocus: false
    });
    setTimeout(() => this.loadReportData(), 100);
  },

  navigateToCategoryManage() {
    this.setData({ _fromSetting: true });
    wx.navigateTo({ url: '/pages/category-manage/category-manage' });
  },

  navigateToUserStats() {
    wx.navigateTo({ url: '/pages/user-stats/user-stats' });
  },

  navigateToAccount() {
    wx.navigateTo({ url: '/pages/account/account' });
  },

  navigateToSetting() {
    // 切换到设置页面时关闭搜索功能
    this.setData({
      showSetting: true,
      showReport: false,
      showSearchInput: false,
      searchKeyword: '',
      searchInputValue: '',
      searchInputFocus: false
    });
  },

  showAboutInfo() {
    this.setData({ showAboutModal: true });
  },

  closeAboutModal() {
    this.setData({ showAboutModal: false });
  },

  // ============================================
  // 主题设置
  // ============================================

  initTheme() {
    themeManager.init();
    const themeList = themeManager.getAllThemes();
    const current = themeList.find(t => t.isActive);
    this.setData({
      themeList,
      currentThemeKey: themeManager.getCurrentTheme(),
      currentThemeName: current && current.name || '星辰靛蓝',
      themeStyle: themeManager.getCurrentStyle(),
      themeColors: themeManager.getThemeColors(),
      reportColors: themeManager.getReportColors(),
      statBgColors: themeManager.getStatBgColors()
    });
    // 初始化导航栏颜色
    const initNavColors = themeManager.getThemeColors();
    wx.setNavigationBarColor({
      backgroundColor: initNavColors.navBg,
      frontColor: initNavColors.navTextStyle
    });
    // 注册主题变更监听器
    themeManager.addListener((style, themeKey) => {
      const list = themeManager.getAllThemes();
      const found = list.find(t => t.key === themeKey);
      const name = found && found.name;
      this.setData({
        themeList: list,
        currentThemeKey: themeKey,
        currentThemeName: name,
        themeStyle: style,
        themeColors: themeManager.getThemeColors(),
        reportColors: themeManager.getReportColors(),
        statBgColors: themeManager.getStatBgColors()
      });
      // 重新计算卡片背景色以匹配新主题
      if (this.data.assets.length > 0) {
        this.applyFilters();
      }
      // 图表颜色变化时重新初始化图表
      if (this.data.showReport) {
        this.initPieChart();
        this.initLineChart();
        this.initTimePeriodChart();
      }
      // 更新导航栏颜色
      const navColors = themeManager.getThemeColors();
      wx.setNavigationBarColor({
        backgroundColor: navColors.navBg,
        frontColor: navColors.navTextStyle
      });
    });
  },

  showThemeSelector() {
    this.setData({ showThemeModal: true });
  },

  closeThemeModal() {
    this.setData({ showThemeModal: false });
  },

  selectTheme(e) {
    const key = e.currentTarget.dataset.key;
    themeManager.setTheme(key);
    this.closeThemeModal();
  },

  goToDetail(e) {
    wx.navigateTo({ url: `/pages/asset-detail/asset-detail?id=${e.currentTarget.dataset.id}` });
  },

  onPullDownRefresh() {
    this.loadAssets();
    wx.stopPullDownRefresh();
  },

  onPageScroll(e) {
    const showBackToTop = e.scrollTop > 100;
    if (showBackToTop !== this.data.showBackToTop) {
      this.setData({ showBackToTop });
    }
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  // 切换金额显示/隐藏
  toggleAmountVisible() {
    this.setData({ showAmount: !this.data.showAmount });
  },

  toggleAssetView() {
    const newShowSimpleView = !this.data.showSimpleView;
    this.setData({ showSimpleView: newShowSimpleView });
    this.saveLayoutPreference(newShowSimpleView);
  },

  // 保存布局偏好 - 本地存储
  saveLayoutPreference(showSimpleView) {
    wx.setStorageSync('showSimpleView', showSimpleView);
  },

  // 加载布局偏好 - 本地存储
  loadLayoutPreference() {
    const cached = wx.getStorageSync('showSimpleView');
    if (cached !== '') {
      this.setData({ showSimpleView: !!cached });
    }
  },

  _splitIntoCols(arr, n = 5) {
    // 估算卡片自然高度: padding(32) + 头像(padding 40 + 内容 80) + name(32) + cost(31) ≈ 215
    const BASE_HEIGHT = 220;
    const BG_COLORS = themeManager.getCardBgColors();
    const cols = Array.from({ length: n }, () => []);
    arr.forEach((item, i) => {
      const extra = [20, 50, 80][Math.floor(Math.random() * 3)];
      item._cardHeight = BASE_HEIGHT + extra;
      item._bgColor = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
      cols[i % n].push(item);
    });
    return cols;
  },

  _updateSimpleCols(filteredAssets) {
    const cols = this._splitIntoCols(filteredAssets);
    // 同步更新复杂模式的 _cardBg（从 _splitIntoCols 赋值的 _bgColor 转换）
    const cardBgMode = themeManager.getThemeColors().cardBgMode;
    const opacity = cardBgMode === 'solid' ? 1 : 0.30;
    filteredAssets.forEach(a => {
      if (a._bgColor && a._bgColor.startsWith('#')) {
        const r = parseInt(a._bgColor.slice(1, 3), 16);
        const g = parseInt(a._bgColor.slice(3, 5), 16);
        const b = parseInt(a._bgColor.slice(5, 7), 16);
        a._cardBg = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    });
    this.setData({
      simpleViewCols: cols,
      filteredAssets: [...filteredAssets]
    });
  },

  preventTouchMove() {},

  // ============================================
  // 批量删除
  // ============================================

  enterBatchDelete() {
    this.loadAllAssetsForBatch();
    this.setData({ showSetting: false, showBatchDelete: true, selectedAssets: [], selectedTotalPrice: '0.00', isAllSelected: false, batchSearchKeyword: '' });
  },

  exitBatchDelete() {
    this.setData({ showBatchDelete: false, showSetting: true, selectedAssets: [], selectedTotalPrice: '0.00', isAllSelected: false, batchAssetList: [], filteredBatchAssetList: [], batchSearchKeyword: '' });
  },

  async loadAllAssetsForBatch() {
    const app = getApp();
    wx.showLoading({ title: '加载中...' });

    try {
      const openid = await app.getOpenid();

      // 使用 Supabase 查询
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('_openid', openid)
        .order('purchaseDate', { ascending: false });

      if (error) throw error;

      const list = data.map(asset => ({
        ...asset,
        _id: asset.id, // Supabase id 映射到 _id
        displayIcon: asset.icon && asset.icon.startsWith('http') ? asset.icon : null,
        _selected: false,
        purchaseDate: this.formatDate(asset.purchaseDate),
        dateRange: asset.status === 'active'
          ? `${this.formatDate(asset.purchaseDate)} - 至今`
          : `${this.formatDate(asset.purchaseDate)} - ${this.formatDate(asset.retiredDate || asset.soldDate) || '至今'}`
      }));

      this.setData({ batchAssetList: list, filteredBatchAssetList: list, isAllSelected: false });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  toggleSelectAsset(e) {
    const id = e.currentTarget.dataset.id;
    const { batchAssetList, filteredBatchAssetList, selectedAssets } = this.data;
    const newSelected = selectedAssets.includes(id)
      ? selectedAssets.filter(x => x !== id)
      : [...selectedAssets, id];

    // 计算选中资产总金额
    const selectedTotalPrice = batchAssetList
      .filter(a => newSelected.includes(a._id))
      .reduce((sum, a) => sum + (Number(a.price) || 0), 0)
      .toFixed(2);

    const newBatchAssetList = batchAssetList.map(a => ({ ...a, _selected: newSelected.includes(a._id) }));
    const newFilteredList = filteredBatchAssetList.map(a => ({ ...a, _selected: newSelected.includes(a._id) }));

    this.setData({
      selectedAssets: newSelected,
      selectedTotalPrice,
      batchAssetList: newBatchAssetList,
      filteredBatchAssetList: newFilteredList,
      isAllSelected: newSelected.length === newFilteredList.length && newFilteredList.length > 0
    });
  },

  toggleSelectAll() {
    const { isAllSelected, batchAssetList, filteredBatchAssetList } = this.data;
    if (isAllSelected) {
      // 取消全选：只取消过滤列表中的选中
      const filteredIds = new Set(filteredBatchAssetList.map(a => a._id));
      const newSelected = this.data.selectedAssets.filter(id => !filteredIds.has(id));

      const newBatchAssetList = batchAssetList.map(a => ({
        ...a,
        _selected: newSelected.includes(a._id)
      }));
      const newFilteredList = filteredBatchAssetList.map(a => ({ ...a, _selected: false }));

      this.setData({
        selectedAssets: newSelected,
        selectedTotalPrice: newSelected.length > 0
          ? batchAssetList.filter(a => newSelected.includes(a._id))
              .reduce((sum, a) => sum + (Number(a.price) || 0), 0).toFixed(2)
          : '0.00',
        batchAssetList: newBatchAssetList,
        filteredBatchAssetList: newFilteredList,
        isAllSelected: false
      });
    } else {
      // 全选：选中过滤列表中的所有
      const filteredIds = new Set(filteredBatchAssetList.map(a => a._id));
      const newSelected = [...new Set([...this.data.selectedAssets, ...filteredIds])];

      const selectedTotalPrice = batchAssetList
        .filter(a => newSelected.includes(a._id))
        .reduce((sum, a) => sum + (Number(a.price) || 0), 0)
        .toFixed(2);

      const newBatchAssetList = batchAssetList.map(a => ({
        ...a,
        _selected: newSelected.includes(a._id)
      }));
      const newFilteredList = filteredBatchAssetList.map(a => ({ ...a, _selected: true }));

      this.setData({
        selectedAssets: newSelected,
        selectedTotalPrice,
        batchAssetList: newBatchAssetList,
        filteredBatchAssetList: newFilteredList,
        isAllSelected: true
      });
    }
  },

  onBatchSearchInput(e) {
    const keyword = e.detail.value.trim().toLowerCase();
    const { batchAssetList } = this.data;

    let filteredList = batchAssetList;
    if (keyword) {
      filteredList = batchAssetList.filter(asset => {
        const name = (asset.name || '').toLowerCase();
        const category = (asset.category || '').toLowerCase();
        return name.includes(keyword) || category.includes(keyword);
      });
    }

    this.setData({
      batchSearchKeyword: e.detail.value,
      filteredBatchAssetList: filteredList,
      isAllSelected: filteredList.length > 0 &&
        filteredList.every(a => this.data.selectedAssets.includes(a._id))
    });
  },

  clearBatchSearch() {
    const { batchAssetList } = this.data;
    this.setData({
      batchSearchKeyword: '',
      filteredBatchAssetList: batchAssetList,
      isAllSelected: batchAssetList.length > 0 &&
        batchAssetList.every(a => this.data.selectedAssets.includes(a._id))
    });
  },

  confirmBatchDelete() {
    const { selectedAssets } = this.data;
    if (selectedAssets.length === 0) {
      wx.showToast({ title: '请选择要删除的资产', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定删除选中的 ${selectedAssets.length} 项资产吗？`,
      confirmColor: themeManager.getThemeColors().error,
      success: res => { if (res.confirm) this.executeBatchDelete(); }
    });
  },

  async executeBatchDelete() {
    const { selectedAssets, batchSearchKeyword } = this.data;
    const app = getApp();
    wx.showLoading({ title: '删除中...', mask: true });

    try {
      const openid = await app.getOpenid();

      // 删除所有选中资产的 Storage 图标文件
      const assetsToDelete = this.data.batchAssetList
        .filter(a => selectedAssets.includes(a._id || a.id));
      for (var ai = 0; ai < assetsToDelete.length; ai++) {
        var assetItem = assetsToDelete[ai];
        if (assetItem.icon && assetItem.icon.startsWith('http')) {
          await deleteStorageFile('icons', assetItem.icon);
        }
      }

      // 使用 id 批量删除
      const idsToDelete = assetsToDelete.map(a => a.id || a._id);

      const { error } = await supabase
        .from('assets')
        .delete()
        .in('id', idsToDelete);

      wx.hideLoading();

      if (error) {
        wx.showToast({ title: '删除失败', icon: 'none' });
        return;
      }

      const remaining = this.data.batchAssetList.filter(a => !selectedAssets.includes(a._id || a.id));

      // 根据当前搜索关键词过滤剩余列表
      let filteredRemaining = remaining;
      if (batchSearchKeyword) {
        const keyword = batchSearchKeyword.toLowerCase();
        filteredRemaining = remaining.filter(asset => {
          const name = (asset.name || '').toLowerCase();
          const category = (asset.category || '').toLowerCase();
          return name.includes(keyword) || category.includes(keyword);
        });
      }

      this.setData({
        batchAssetList: remaining,
        filteredBatchAssetList: filteredRemaining,
        selectedAssets: [],
        selectedTotalPrice: '0.00',
        isAllSelected: false
      });
      wx.showToast({ title: `已删除 ${selectedAssets.length} 项`, icon: 'success' });

      if (remaining.length === 0) {
        setTimeout(() => { this.exitBatchDelete(); this.loadAssets(); }, 1500);
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  // ============================================
  // 统计功能
  // ============================================

  async loadReportData() {
    this.setData({ reportLoading: true });

    const app = getApp();
    try {
      const openid = await app.getOpenid();

      // 使用 Supabase 查询
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('_openid', openid)
        .order('purchaseDate', { ascending: true });

      if (error) throw error;

      const assets = data;

      // 计算分类统计和资产映射
      const categoryMap = {};
      const categoryAssetsMap = {}; // 分类资产映射
      let totalPrice = 0;
      let excludedPrice = 0; // 不计入总资产的金额
      let includedCount = 0; // 计入总资产的资产数
      let excludedCount = 0; // 不计入总资产的资产数

      // 状态统计
      let activeCount = 0, activePrice = 0;
      let retiredCount = 0, retiredPrice = 0;
      let soldCount = 0, soldPrice = 0;
      let dailyCostTotal = 0; // 日均成本（全部资产）

      // 先初始化所有分类
      const categoryList = this.data.categoryList || [];
      categoryList.forEach(c => {
        categoryMap[c.name] = { name: c.name, total: 0, count: 0, icon: c.icon || '', displayIcon: c.displayIcon || '' };
        categoryAssetsMap[c.name] = [];
      });

      // 使用 calculateAssetFields 处理每个资产，复用首页的计算逻辑
      const enrichedAssets = assets.map(a => this.calculateAssetFields(a));

      enrichedAssets.forEach(asset => {
        const cat = asset.category || '未分类';
        const price = Number(asset.price) || 0;
        if (!categoryMap[cat]) {
          categoryMap[cat] = { name: cat, total: 0, count: 0, icon: '', displayIcon: '' };
          categoryAssetsMap[cat] = [];
        }
        categoryMap[cat].total += price;
        categoryMap[cat].count++;
        categoryAssetsMap[cat].push({ name: asset.name, price: price });

        // 总资产 = 所有资产金额总和
        totalPrice += price;

        // 统计不计入总资产的金额
        if (asset.excludeTotal === true || asset.excludeTotal === 'true') {
          excludedPrice += price;
          excludedCount++;
        } else {
          includedCount++;
        }

        // 计算日均成本（全部资产）- 复用首页逻辑
        if (asset.status === 'active' && asset.dailyCost) {
          dailyCostTotal += parseFloat(asset.dailyCost);
        } else if ((asset.status === 'retired' || asset.status === 'sold') && asset.dailyEquivalent) {
          dailyCostTotal += parseFloat(asset.dailyEquivalent);
        }

        // 状态统计
        if (asset.status === 'active') {
          activeCount++;
          activePrice += price;
        } else if (asset.status === 'retired') {
          retiredCount++;
          retiredPrice += price;
        } else if (asset.status === 'sold') {
          soldCount++;
          soldPrice += price;
        }
      });

      const reportCategoryStats = Object.values(categoryMap)
        .sort((a, b) => b.total - a.total)
        .map(item => ({ ...item, totalFixed: item.total.toFixed(2) }));

      this.setData({
        reportLoading: false,
        reportEmpty: assets.length === 0,
        reportAssets: assets,
        reportTotalAssets: assets.length,
        reportTotalPrice: totalPrice.toFixed(2),
        reportExcludedPrice: excludedPrice.toFixed(2),
        reportIncludedCount: includedCount,
        reportExcludedCount: excludedCount,
        reportCategoryStats,
        reportCategoryAssetsMap: categoryAssetsMap,
        pieCenterText: '¥' + totalPrice.toFixed(2),
        pieCenterSubText: '总资产',
        // 状态统计
        reportActiveCount: activeCount,
        reportActivePrice: activePrice.toFixed(2),
        reportRetiredCount: retiredCount,
        reportRetiredPrice: retiredPrice.toFixed(2),
        reportSoldCount: soldCount,
        reportSoldPrice: soldPrice.toFixed(2),
        reportDailyCost: dailyCostTotal.toFixed(2)
      });

      if (assets.length > 0) {
        setTimeout(() => {
          this.initPieChart();
          this.initLineChart();
          this.calculateTimePeriodStats();
        }, 200);
      }
    } catch (err) {
      this.setData({ reportLoading: false, reportEmpty: true });
    }
  },

  initPieChart() {
    const { reportCategoryStats, reportColors, pieCenterText, pieCenterSubText } = this.data;
    if (!reportCategoryStats.length) return;

    // 获取当前主题颜色（用于图表样式）
    const themeColors = themeManager.getThemeColors();

    const component = this.selectComponent('#pie-chart');
    if (!component) return;

    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);

      const total = reportCategoryStats.reduce((sum, i) => sum + i.total, 0);
      const pieData = reportCategoryStats.map((item, i) => ({
        name: item.name,
        value: item.total
      }));

      // 保存 chart 实例以便后续更新
      this.pieChart = chart;
      this.pieTotal = total;

      chart.setOption({
        color: reportColors,
        tooltip: {
          trigger: 'item',
          confine: true,
          backgroundColor: themeColors.bgCard,
          borderColor: themeColors.borderLight,
          borderWidth: 1,
          padding: [8, 12],
          textStyle: {
            color: themeColors.textDefault,
            fontSize: 12
          },
          formatter: params => {
            const catName = params.name;
            const catValue = params.value;
            const catAssets = this.data.reportCategoryAssetsMap[catName] || [];
            const percent = ((catValue / total) * 100).toFixed(1);

            // 构建资产列表（纯文本格式）
            let assetList = catAssets.slice(0, 5).map(asset => `${asset.name}: ¥${asset.price}`).join('\n');
            if (catAssets.length > 5) {
              assetList += `\n... 等${catAssets.length}项`;
            }

            return `${catName}\n总计: ¥${catValue} (${percent}%)\n${assetList}`;
          }
        },
        legend: {
          type: 'scroll',
          orient: 'horizontal',
          bottom: 0,
          left: 'center'
        },
        // 中间文字 - z: -1 确保 tooltip 层级更高
        graphic: [{
          type: 'group',
          left: 'center',
          top: '32%',
          z: -1,
          children: [
            {
              type: 'text',
              left: 'center',
              top: '0',
              style: {
                fill: themeColors.textDefault,
                text: pieCenterText,
                font: 'bold 18px sans-serif',
                textAlign: 'center'
              }
            },
            {
              type: 'text',
              left: 'center',
              top: '24',
              style: {
                fill: themeColors.textMuted,
                text: pieCenterSubText,
                font: '12px sans-serif',
                textAlign: 'center'
              }
            }
          ]
        }],
        series: [{
          type: 'pie',
          radius: ['40%', '60%'],
          center: ['50%', '40%'],
          itemStyle: {
            borderRadius: 6,
            borderColor: themeColors.bgCard,
            borderWidth: 2
          },
          label: { show: false },
          emphasis: {
            scale: true,
            label: { show: true, fontWeight: 'bold' }
          },
          data: pieData
        }]
      });

      // 点击事件
      chart.on('click', params => {
        if (params.componentType === 'series') {
          const value = params.value;
          const name = params.name;
          this.updatePieCenterText('¥' + value.toFixed(2), name);
        }
      });

      // 图例点击事件 - 重置为总金额
      chart.on('legendselectchanged', () => {
        this.updatePieCenterText('¥' + this.pieTotal.toFixed(2), '总资产');
      });

      return chart;
    });
  },

  // 更新环形图中间文字
  updatePieCenterText(text, subText) {
    if (!this.pieChart) return;

    this.pieChart.setOption({
      graphic: [{
        type: 'group',
        left: 'center',
        top: '32%',
        z: -1,
        children: [
          {
            type: 'text',
            left: 'center',
            top: '0',
            style: {
              fill: themeColors.textDefault,
              text: text,
              font: 'bold 18px sans-serif',
              textAlign: 'center'
            }
          },
          {
            type: 'text',
            left: 'center',
            top: '24',
            style: {
              fill: themeColors.textMuted,
              text: subText,
              font: '12px sans-serif',
              textAlign: 'center'
            }
          }
        ]
      }]
    });

    this.setData({
      pieCenterText: text,
      pieCenterSubText: subText
    });
  },

  initLineChart() {
    const { reportAssets } = this.data;
    if (!reportAssets.length) return;

    // 获取当前主题颜色（用于图表样式）
    const themeColors = themeManager.getThemeColors();

    const component = this.selectComponent('#line-chart');
    if (!component) return;

    const sorted = [...reportAssets].sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

    // 日期到资产的映射（同一天可能有多笔资产）
    const dateAssetsMap = {};
    sorted.forEach(a => {
      const d = new Date(a.purchaseDate);
      const dateKey = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
      if (!dateAssetsMap[dateKey]) {
        dateAssetsMap[dateKey] = [];
      }
      dateAssetsMap[dateKey].push(a);
    });

    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);

      const dates = [];
      const dayPrices = [];

      // 按日期聚合
      const uniqueDates = [...new Set(sorted.map(a => {
        const d = new Date(a.purchaseDate);
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
      }))];

      uniqueDates.forEach(dateKey => {
        dates.push(dateKey);
        const dayAssets = dateAssetsMap[dateKey] || [];
        const dayTotal = dayAssets.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
        dayPrices.push(dayTotal);
      });

      // 保存映射供tooltip使用
      this.lineDateAssetsMap = dateAssetsMap;

      chart.setOption({
        color: [themeColors.primary600],
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: themeColors.bgCard,
          borderColor: themeColors.borderLight,
          borderWidth: 1,
          padding: [8, 12],
          textStyle: {
            color: themeColors.textDefault,
            fontSize: 12
          },
          formatter: params => {
            if (!params || !params.length) return '';
            const dateKey = params[0].axisValue;
            const dayTotal = params[0].value;
            const dayAssets = this.lineDateAssetsMap[dateKey] || [];

            let assetList = dayAssets.map(asset => `${asset.name}: ¥${Number(asset.price || 0).toFixed(2)}`).join('\n');

            return `${dateKey}\n金额: ¥${dayTotal.toFixed(2)}\n${assetList}`;
          }
        },
        legend: {
          data: ['每日资产'],
          top: 0
        },
        grid: {
          left: '3%',
          right: '3%',
          bottom: '8%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            fontSize: 10,
            rotate: dates.length > 6 ? 30 : 0
          },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: '¥{value}' },
          splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: [
          {
            name: '每日资产',
            type: 'line',
            data: dayPrices,
            smooth: true,
            areaStyle: { opacity: 0.1 },
            symbol: 'circle',
            symbolSize: 6
          }
        ]
      });

      return chart;
    });
  },

  // ============================================
  // 时间段统计功能
  // ============================================

  // 获取时间范围
  getTimeRange(period) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let startDate;

    switch (period) {
      case 'week':
        const dayOfWeek = today.getDay() || 7;
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek + 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date(0); // 最早时间
        break;
    }

    return { startDate, endDate: today };
  },

  // 按粒度分组统计
  groupAssetsByGranularity(assets, granularity) {
    if (!assets || assets.length === 0) {
      return {
        data: [],
        summary: { totalAmount: 0, totalCount: 0 }
      };
    }

    const groupMap = {};

    assets.forEach(asset => {
      const purchaseDate = new Date(asset.purchaseDate);
      let label;

      if (granularity === 'year') {
        label = purchaseDate.getFullYear().toString();
      } else if (granularity === 'quarter') {
        const year = purchaseDate.getFullYear();
        const quarter = Math.floor(purchaseDate.getMonth() / 3) + 1;
        label = `${year}Q${quarter}`;
      } else if (granularity === 'month') {
        const year = purchaseDate.getFullYear();
        const month = purchaseDate.getMonth() + 1;
        label = `${year}-${String(month).padStart(2, '0')}`;
      } else {
        // 非全部时间段，使用单组
        label = this.getTimePeriodLabel(this.data.activeTimePeriod);
      }

      if (!groupMap[label]) {
        groupMap[label] = { label, totalAmount: 0, count: 0, assets: [] };
      }
      groupMap[label].totalAmount += Number(asset.price) || 0;
      groupMap[label].count++;
      groupMap[label].assets.push({ name: asset.name, price: Number(asset.price) || 0 });
    });

    // 按时间排序
    const data = Object.values(groupMap).sort((a, b) => a.label.localeCompare(b.label));
    const totalAmount = data.reduce((sum, d) => sum + d.totalAmount, 0);
    const summary = {
      totalAmount: totalAmount.toFixed(2),
      totalCount: data.reduce((sum, d) => sum + d.count, 0)
    };

    return { data, summary };
  },

  // 获取时间段显示名称
  getTimePeriodLabel(period) {
    const labels = {
      week: '本周',
      month: '本月',
      quarter: '本季度',
      year: '本年',
      all: '全部'
    };
    return labels[period] || period;
  },

  // 计算时间段统计数据
  calculateTimePeriodStats() {
    const { reportAssets, activeTimePeriod, activeGranularity } = this.data;
    if (!reportAssets || reportAssets.length === 0) {
      this.setData({ timePeriodStats: null });
      return;
    }

    // 计算时间范围
    const { startDate, endDate } = this.getTimeRange(activeTimePeriod);

    // 筛选资产
    const filteredAssets = reportAssets.filter(a => {
      if (!a.purchaseDate) return false;
      const pd = new Date(a.purchaseDate);
      return pd >= startDate && pd <= endDate;
    });

    // 分组统计
    const granularity = activeTimePeriod === 'all' ? activeGranularity : null;
    const stats = this.groupAssetsByGranularity(filteredAssets, granularity);

    this.setData({ timePeriodStats: stats });

    // 更新图表
    setTimeout(() => this.initTimeChart(), 100);
  },

  // 选择时间段
  selectTimePeriod(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ activeTimePeriod: period });
    this.calculateTimePeriodStats();
  },

  // 选择时间线粒度
  selectGranularity(e) {
    const granularity = e.currentTarget.dataset.granularity;
    this.setData({ activeGranularity: granularity });
    this.calculateTimePeriodStats();
  },

  // 初始化时间段柱状图
  initTimeChart() {
    const { timePeriodStats } = this.data;
    if (!timePeriodStats || timePeriodStats.data.length === 0) return;

    // 获取当前主题颜色（用于图表样式）
    const themeColors = themeManager.getThemeColors();

    const component = this.selectComponent('#time-chart');
    if (!component) return;

    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);

      chart.setOption({
        color: [themeColors.primary600],
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: themeColors.bgCard,
          borderColor: themeColors.borderLight,
          borderWidth: 1,
          padding: [8, 12],
          textStyle: {
            color: themeColors.textDefault,
            fontSize: 12
          },
          formatter: params => {
            if (!params || !params.length) return '';
            const d = params[0];
            const dataItem = timePeriodStats.data[d.dataIndex];
            // 构建资产列表（最多显示5项）
            let assetList = dataItem.assets.slice(0, 5).map(a => `${a.name}: ¥${a.price.toFixed(2)}`).join('\n');
            if (dataItem.assets.length > 5) {
              assetList += `\n... 等${dataItem.assets.length}项`;
            }
            return `${d.name}\n金额: ¥${dataItem.totalAmount.toFixed(2)}\n数量: ${dataItem.count}件\n${assetList}`;
          }
        },
        grid: {
          left: '3%',
          right: '6%',
          bottom: '15%',
          top: '18%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: timePeriodStats.data.map(d => d.label),
          axisLabel: {
            fontSize: 10,
            rotate: timePeriodStats.data.length > 6 ? 30 : 0
          },
          axisTick: { show: false }
        },
        yAxis: [
          {
            type: 'value',
            name: '金额(元)',
            axisLabel: { formatter: '¥{value}' },
            splitLine: { lineStyle: { type: 'dashed' } }
          },
          {
            type: 'value',
            name: '数量(件)',
            axisLabel: { formatter: '{value}件' },
            splitLine: { show: false }
          }
        ],
        series: [{
          type: 'bar',
          yAxisIndex: 0,
          data: timePeriodStats.data.map(d => d.totalAmount),
          barMaxWidth: 40,
          itemStyle: {
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            formatter: params => {
              const dataItem = timePeriodStats.data[params.dataIndex];
              return dataItem.count + '件';
            },
            fontSize: 10,
            color: themeColors.textMuted
          }
        }]
      });

      this.timeChart = chart;
      return chart;
    });
  },

  // ============================================
  // 搜索功能
  // ============================================

  // 显示/隐藏搜索输入框
  toggleSearchInput() {
    if (this.data.showSearchInput) {
      // 关闭时恢复原状
      this.setData({
        searchKeyword: '',
        searchInputValue: '',
        showSearchInput: false,
        searchInputFocus: false
      });
      this.loadAssets('');  // 传入空字符串确保加载全部资产
    } else {
      // 先显示搜索框，延迟设置 focus 确保键盘弹出
      this.setData({
        showSearchInput: true,
        searchInputFocus: false
      });
      setTimeout(() => {
        this.setData({ searchInputFocus: true });
      }, 100);
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchInputValue: e.detail.value });
  },

  // 执行搜索
  doSearch() {
    const keyword = this.data.searchInputValue.trim();
    this.setData({ searchKeyword: keyword });
    this.loadAssets(keyword);
  },

  // 清空输入框内容
  clearSearch() {
    this.setData({
      searchInputValue: ''
    });
  },

  // 取消搜索 - 恢复原状
  cancelSearch() {
    this.setData({
      searchKeyword: '',
      searchInputValue: '',
      showSearchInput: false,
      searchInputFocus: false
    });
    this.loadAssets('');  // 传入空字符串确保加载全部资产
  }
});
