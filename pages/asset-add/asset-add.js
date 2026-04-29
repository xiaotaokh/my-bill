// asset-add.js
Page({
  data: {
    // 编辑模式
    isEdit: false,
    assetId: '',
    assetName: '', // 用于编辑时显示标题
    assetCategory: '', // 用于编辑时回显类别

    // 资产类型
    assetType: 'fixed', // 'fixed' | 'subscription'
    periodTypeOptions: ['月度', '年度', '周', '自定义'],
    periodTypeIndex: 0,

    // 表单数据
    name: '',
    price: '',
    purchaseDate: '',
    remark: '',
    isRetired: false,
    isSold: false,
    excludeTotal: false,
    excludeDaily: false,
    retiredDate: '', // 退役日期
    soldDate: '', // 卖出日期

    // 订阅资产字段
    periodAmount: '',
    periodType: 'monthly',
    periodDays: '',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
    pendingSubscription: false,
    endSubscription: false,

    // 缩略图选择
    selectedIcon: '📦', // 用户选择的自定义缩略图（默认为📦）
    selectedIconName: '默认',
    selectedGroupName: '常用', // 选中的分组名称
    selectedIconIndex: 0, // 选中的图标索引
    uploadedImagePath: '', // 用户上传的图片路径

    // 自定义emoji相关
    emojiDialogVisible: false, // emoji输入弹窗是否显示
    tempEmojiInput: '', // emoji输入框临时值
    customEmojiValue: '', // 用户选择的自定义emoji

    // 内置图标分组数据
    builtinIconGroups: [
      {
        name: '常用',
        icons: [
          { name: '默认', icon: '📦' },
          { name: '手机', icon: '📱' },
          { name: '电脑', icon: '💻' },
          { name: '平板', icon: '📟' },
          { name: '耳机', icon: '🎧' },
          { name: '相机', icon: '📷' },
          { name: '配件', icon: '🔧' },
          { name: '首饰', icon: '💍' },
          { name: '房子', icon: '🏠' },
          { name: '车子', icon: '🚗' }
        ]
      },
      {
        name: '数码影音',
        icons: [
          { name: '手机', icon: '📱' },
          { name: '电脑', icon: '💻' },
          { name: '平板', icon: '📟' },
          { name: '耳机', icon: '🎧' },
          { name: '音箱', icon: '🔊' },
          { name: '相机', icon: '📷' },
          { name: '镜头', icon: '🎥' },
          { name: '投影设备', icon: '📽️' },
          { name: '智能手表', icon: '⌚' },
          { name: '游戏机', icon: '🎮' },
          { name: '游戏手柄', icon: '🕹️' },
          { name: '游戏外设', icon: '🖥️' },
          { name: '存储设备', icon: '💾' },
          { name: '路由器', icon: '📡' },
          { name: '充电设备', icon: '🔋' },
          { name: '手机配件', icon: '🧩' },
          { name: '智能家居设备', icon: '🏠' },
          { name: '无人机', icon: '🛸' },
          { name: 'VR/AR设备', icon: '🥽' }
        ]
      },
      {
        name: '交通工具',
        icons: [
          { name: '汽车', icon: '🚗' },
          { name: '摩托车', icon: '🏍️' },
          { name: '自行车', icon: '🚲' },
          { name: '电动车', icon: '🛵' },
          { name: '配件', icon: '🔧' },
          { name: '加油/充电费', icon: '⛽' },
          { name: '停车费', icon: '🅿️' },
          { name: '保养维修', icon: '🛠️' },
          { name: '洗车', icon: '🚿' }
        ]
      },
      {
        name: '家居生活',
        icons: [
          { name: '家具', icon: '🛋️' },
          { name: '儿童家具', icon: '🧸' },
          { name: '家电', icon: '🧊' },
          { name: '家纺', icon: '🛏️' },
          { name: '厨具', icon: '🍳' },
          { name: '餐具', icon: '🍴' },
          { name: '清洁用品', icon: '🧹' },
          { name: '收纳用品', icon: '🗂️' },
          { name: '装饰品', icon: '🖼️' },
          { name: '灯具', icon: '💡' },
          { name: '维修工具', icon: '🛠️' },
          { name: '搬运工具', icon: '🛒' },
          { name: '购物工具', icon: '🧺' }
        ]
      },
      {
        name: '虚拟产品',
        icons: [
          { name: '视频会员', icon: '🎬' },
          { name: '音乐会员', icon: '🎵' },
          { name: '云存储', icon: '☁️' },
          { name: '软件订阅', icon: '💿' },
          { name: 'AI工具订阅', icon: '🤖' },
          { name: '游戏软件', icon: '🎮' },
          { name: '游戏充值', icon: '💳' },
          { name: '点卡', icon: '🎫' },
          { name: '游戏皮肤/点券', icon: '🎁' },
          { name: '电子书', icon: '📚' },
          { name: '网课/知识', icon: '🎓' },
          { name: '手机话费', icon: '💸' },
          { name: '服务器', icon: '🖥️' },
          { name: '域名/网站服务', icon: '🌐' },
          { name: 'VPN/加速器', icon: '🚀' }
        ]
      },
      {
        name: '办公用品',
        icons: [
          { name: '鼠标', icon: '🖱️' },
          { name: '键盘', icon: '⌨️' },
          { name: '触摸板', icon: '🖐️' },
          { name: '拓展坞', icon: '🔌' },
          { name: '电脑配件', icon: '🖥️' },
          { name: '显示器', icon: '📺' },
          { name: '打印机', icon: '🖨️' },
          { name: '纸张', icon: '📄' },
          { name: '笔', icon: '🖊️' },
          { name: '文件柜', icon: '🗄️' },
          { name: '订书机', icon: '📎' },
          { name: '办公桌椅', icon: '🪑' },
          { name: '便签纸', icon: '📝' }
        ]
      },
      {
        name: '户外运动',
        icons: [
          { name: '健身器材', icon: '🏋️' },
          { name: '瑜伽垫', icon: '🧘' },
          { name: '跑步装备', icon: '🏃' },
          { name: '徒步装备', icon: '🥾' },
          { name: '球类装备', icon: '🏀' },
          { name: '骑行装备', icon: '🚴' },
          { name: '游泳', icon: '🏊' },
          { name: '冲浪/桨板', icon: '🏄' },
          { name: '水上娱乐', icon: '🚤' },
          { name: '登山', icon: '🏔️' },
          { name: '滑雪装备', icon: '🎿' },
          { name: '露营帐篷', icon: '⛺' },
          { name: '露营睡袋', icon: '🛏️' },
          { name: '露营家具', icon: '🪑' },
          { name: '露营炊具', icon: '🍳' },
          { name: '露营照明', icon: '🔦' },
          { name: '户外电源', icon: '🔋' },
          { name: '户外服饰', icon: '🧥' },
          { name: '户外工具', icon: '🔧' },
          { name: '户外安全', icon: '🛡️' },
          { name: '钓鱼', icon: '🎣' },
          { name: '筋膜枪', icon: '💆' }
        ]
      },
      {
        name: '服饰珠宝',
        icons: [
          { name: '上衣', icon: '👕' },
          { name: '裤子', icon: '👖' },
          { name: '裙装', icon: '👗' },
          { name: '外套', icon: '🧥' },
          { name: '鞋履', icon: '👟' },
          { name: '包袋', icon: '👜' },
          { name: '手表', icon: '⌚' },
          { name: '项链', icon: '📿' },
          { name: '手链', icon: '⛓️' },
          { name: '戒指', icon: '💍' },
          { name: '耳环', icon: '💎' },
          { name: '皮带', icon: '🎗️' },
          { name: '围巾', icon: '🧣' },
          { name: '帽子', icon: '🧢' },
          { name: '领带', icon: '🎀' },
          { name: '手套', icon: '🧤' },
          { name: '双肩包', icon: '🎒' }
        ]
      },
      {
        name: '收藏投资',
        icons: [
          { name: '纪念币', icon: '🪙' },
          { name: '邮票', icon: '✉️' },
          { name: '文玩', icon: '🏺' },
          { name: '古董字画', icon: '🖼️' },
          { name: '名酒', icon: '🍷' },
          { name: '手办', icon: '🎎' }
        ]
      },
      {
        name: '旅行出行',
        icons: [
          { name: '票据', icon: '✈️' },
          { name: '酒店', icon: '🏨' },
          { name: '车费', icon: '🚕' },
          { name: '团费', icon: '👥' },
          { name: '签证', icon: '🛂' },
          { name: '行李箱', icon: '🧳' },
          { name: '纪念品', icon: '🎁' }
        ]
      },
      {
        name: '工作',
        icons: [
          { name: '职业技能培训', icon: '🎓' },
          { name: '商务应酬', icon: '🥂' },
          { name: '交通补贴', icon: '🚗' },
          { name: '办公耗材', icon: '📋' },
          { name: '相关书籍', icon: '📖' }
        ]
      },
      {
        name: '日常消耗',
        icons: [
          { name: '餐饮', icon: '🍽️' },
          { name: '生鲜果蔬', icon: '🥬' },
          { name: '零食饮料', icon: '🍿' },
          { name: '日用品', icon: '🧴' },
          { name: '水电燃气费', icon: '💡' },
          { name: '物业费', icon: '🏢' },
          { name: '药品', icon: '💊' },
          { name: '母婴用品', icon: '🍼' }
        ]
      },
      {
        name: '金融资产',
        icons: [
          { name: '股票', icon: '📈' },
          { name: '基金', icon: '📊' },
          { name: '债券', icon: '📜' },
          { name: '黄金/贵金属', icon: '🥇' },
          { name: '银行存款', icon: '🏦' },
          { name: '理财产品', icon: '💰' },
          { name: '保险', icon: '🛡️' },
          { name: '数字货币', icon: '₿' },
          { name: '信托', icon: '🔐' }
        ]
      },
      {
        name: '其他',
        icons: [
          { name: '他人', icon: '👤' },
          { name: '礼金/红包', icon: '🧧' },
          { name: '捐赠', icon: '🎁' },
          { name: '罚款', icon: '💸' },
          { name: '医疗体检', icon: '🏥' },
          { name: '宠物用品', icon: '🐾' },
          { name: '婚庆服务', icon: '💒' },
          { name: '法律咨询费', icon: '⚖️' },
          { name: '桌游', icon: '🎲' }
        ]
      }
    ],

    // 当前展开的分组索引
    expandedGroupIndex: 0,  // 默认展开第一个分组（常用）

    // 类别 - 初始为空，从数据库加载
    categories: [],

    // 表单验证
    errors: {},

    // 今天的日期（用于限制日期选择器）
    todayDate: ''
  },

  onLoad: function (options) {
    // 初始化今天的日期
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;

    // 检查是否是编辑模式
    if (options.id && options.edit === 'true') {
      this.setData({
        isEdit: true,
        assetId: options.id,
        todayDate: todayDate
      });
      // 编辑模式：先加载资产详情，详情加载完成后再加载类别
      // loadAssetDetail 会在完成后调用 loadCategories
      this.loadAssetDetail(options.id);
    } else {
      // 添加模式：初始化购买日期为今天
      this.setData({
        purchaseDate: todayDate,
        selectedIcon: '📦', // 设置默认的通用emoji
        selectedIconName: '默认',
        todayDate: todayDate
      });

      // 添加模式下直接加载类别
      this.loadCategories();
    }
  },

  // 加载资产详情（编辑模式）
  loadAssetDetail(id) {
    wx.showLoading({ title: '加载中...' });

    const db = wx.cloud.database({
      env: getApp().globalData.envId
    });

    db.collection('assets').doc(id).get()
      .then(async res => {
        if (res.data) {
          const asset = res.data;

          // 设置页面标题
          wx.setNavigationBarTitle({
            title: `编辑资产 - ${asset.name}`
          });

          // 处理缩略图
          let uploadedImagePath = '';
          let selectedIcon = '📦';
          let selectedIconName = '默认';
          let selectedGroupName = '常用';
          let selectedIconIndex = 0;
          let customEmojiValue = '';

          if (asset.icon) {
            if (asset.icon.startsWith('cloud://')) {
              // 云存储路径，需要获取临时URL用于预览
              try {
                const fileRes = await wx.cloud.getTempFileURL({
                  fileList: [asset.icon]
                });
                if (fileRes.fileList && fileRes.fileList[0] && fileRes.fileList[0].tempFileURL) {
                  uploadedImagePath = asset.icon; // 保存原始云存储路径
                  selectedIcon = ''; // 清空内置图标
                  selectedIconName = ''; // 清空图标名称
                  selectedGroupName = ''; // 清空分组名称，不选中任何内置图标
                  customEmojiValue = ''; // 清空自定义emoji
                }
              } catch (e) {
                // 获取失败时使用 null
              }
            } else if (asset.icon.startsWith('http')) {
              uploadedImagePath = asset.icon;
              selectedIcon = '';
              selectedIconName = ''; // 清空图标名称
              selectedGroupName = ''; // 清空分组名称，不选中任何内置图标
              customEmojiValue = ''; // 清空自定义emoji
            } else {
              // emoji 图标
              selectedIcon = asset.icon;

              // 判断是否是自定义emoji（iconName为"自定义emoji"）
              if (asset.iconName === '自定义emoji') {
                customEmojiValue = asset.icon;
                selectedIconName = '自定义emoji';
                selectedGroupName = '';
                selectedIconIndex = 0;
              } else {
                // 查找对应的图标名称和索引，传入保存的图标名称和分组名称
                const iconInfo = this.findIconInfoByValue(asset.icon, asset.iconName, asset.groupName);
                selectedIconName = iconInfo.name;
                selectedGroupName = iconInfo.groupName;
                selectedIconIndex = iconInfo.iconIndex;
                customEmojiValue = '';
              }
            }
          }

          // 已退役或已卖出状态，自动开启不计入总日均
          const isRetired = asset.status === 'retired';
          const isSold = asset.status === 'sold';

          // 处理订阅资产数据回显
          const isSubscription = asset.assetType === 'subscription';
          let periodAmount = '';
          let periodType = 'monthly';
          let periodTypeIndex = 0;
          let periodDays = '';
          let subscriptionStartDate = '';
          let subscriptionEndDate = '';
          let pendingSubscription = false;
          let endSubscription = false;

          if (isSubscription) {
            periodAmount = String(asset.periodAmount || '');
            periodType = asset.periodType || 'monthly';
            const periodTypes = ['monthly', 'yearly', 'weekly', 'custom'];
            periodTypeIndex = periodTypes.indexOf(periodType);
            if (periodType === 'custom') {
              periodDays = String(asset.periodDays || '');
            }
            subscriptionStartDate = asset.subscriptionStartDate || '';
            subscriptionEndDate = asset.subscriptionEndDate || '';
            pendingSubscription = asset.pendingSubscription || false;
            endSubscription = asset.subscriptionStatus === 'ended';
          }

          this.setData({
            assetName: asset.name,
            name: asset.name,
            price: isSubscription ? '' : String(asset.price),
            purchaseDate: asset.purchaseDate,
            remark: asset.remark || '',
            isRetired: isRetired,
            isSold: isSold,
            retiredDate: asset.retiredDate || '',
            soldDate: asset.soldDate || '',
            excludeTotal: asset.excludeTotal || false,
            // 已退役或已卖出时，强制不计入总日均
            excludeDaily: isRetired || isSold ? true : (asset.excludeDaily || false),
            selectedIcon: selectedIcon,
            selectedIconName: selectedIconName,
            selectedGroupName: selectedGroupName,
            selectedIconIndex: selectedIconIndex,
            uploadedImagePath: uploadedImagePath,
            customEmojiValue: customEmojiValue,
            assetCategory: asset.category || '', // 保存类别，等待类别加载后选中
            // 订阅资产字段
            assetType: asset.assetType || 'fixed',
            periodAmount: periodAmount,
            periodType: periodType,
            periodTypeIndex: periodTypeIndex,
            periodDays: periodDays,
            subscriptionStartDate: subscriptionStartDate,
            subscriptionEndDate: subscriptionEndDate,
            pendingSubscription: pendingSubscription,
            endSubscription: endSubscription
          });

          wx.hideLoading();

          // 编辑模式下，资产详情加载完成后再加载类别
          this.loadCategories();
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '资产不存在',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      });
  },

  // 加载类别
  loadCategories() {
    wx.cloud.callFunction({
      name: 'getCategories',
      success: (res) => {
        if (res.result && res.result.success && res.result.data) {
          const processCategories = async () => {
            const categoriesData = res.result.data;

            const categoriesWithIcons = await Promise.all(categoriesData.map(async category => {
              let displayIcon = null;

              // 如果是云存储的fileID，获取临时文件链接
              if (category.icon && category.icon.startsWith('cloud://')) {
                try {
                  const fileRes = await wx.cloud.getTempFileURL({
                    fileList: [category.icon]
                  });
                  if (fileRes.fileList && fileRes.fileList[0] && fileRes.fileList[0].tempFileURL) {
                    displayIcon = fileRes.fileList[0].tempFileURL;
                  }
                } catch (e) {
                  // 获取失败时使用空
                }
              } else if (category.icon && category.icon.startsWith('http')) {
                // 已经是 http 临时链接，直接使用
                displayIcon = category.icon;
              }

              // 编辑模式下，根据资产类别选中对应的类别（单选模式）
              let isSelected = false;
              if (this.data.isEdit && this.data.assetCategory) {
                // 单选模式：只匹配第一个类别
                isSelected = category.name === this.data.assetCategory;
              }

              return {
                name: category.name,
                icon: category.icon || '',
                displayIcon: displayIcon, // 临时文件链接
                selected: isSelected
              };
            }));

            // 添加模式下默认选中第一个类别
            if (!this.data.isEdit && categoriesWithIcons.length > 0) {
              categoriesWithIcons[0].selected = true;
            }

            this.setData({ categories: categoriesWithIcons });
          };

          processCategories();
        } else {
          this.setData({ categories: [] });
        }
      },
      fail: (err) => {
        this.setData({ categories: [] });
      }
    });
  },

  // 辅助函数：判断是否为图片路径（云存储或网络路径）
  isAssetImage(icon) {
    if (!icon) return true;  // 没有图标时显示上传区域
    // 检查是否为云存储路径或网络路径
    return icon.indexOf('cloud://') !== -1 || icon.indexOf('http://') !== -1 || icon.indexOf('https://') !== -1;
  },

  // 移除已上传的图片
  removeUploadedImage() {
    // 删除上传图片后，清空选中状态
    this.setData({
      uploadedImagePath: '',
      selectedIcon: '📦',
      selectedIconName: '默认',
      selectedGroupName: '常用',
      selectedIconIndex: 0,
      customEmojiValue: ''
    });
  },

  selectBuiltinIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    const groupName = e.currentTarget.dataset.groupName;
    const iconIdx = e.currentTarget.dataset.iconIdx;
    this.setData({
      selectedIcon: icon.icon,
      selectedIconName: icon.name,
      selectedGroupName: groupName,
      selectedIconIndex: iconIdx,
      uploadedImagePath: '', // 清空之前上传的图片
      customEmojiValue: '' // 清空自定义emoji
    });
  },

  // ========== 自定义Emoji相关方法 ==========

  // 显示emoji输入弹窗
  showEmojiInput: function() {
    this.setData({
      emojiDialogVisible: true,
      tempEmojiInput: this.data.customEmojiValue || '' // 回显已有的emoji
    });
  },

  // 关闭emoji输入弹窗
  closeEmojiDialog: function() {
    this.setData({
      emojiDialogVisible: false,
      tempEmojiInput: ''
    });
  },

  // 监听emoji输入，只允许一个emoji，第二个替换第一个
  onEmojiInput: function(e) {
    const input = e.detail.value;

    // 检测所有emoji
    const emojis = this.findAllEmojis(input);

    if (emojis.length === 0) {
      // 没有emoji，清空
      this.setData({ tempEmojiInput: '' });
    } else {
      // 取最后一个emoji，实现替换效果（新emoji替换旧的）
      this.setData({ tempEmojiInput: emojis[emojis.length - 1] });
    }
  },

  // 找出所有单个emoji字符
  findAllEmojis: function(str) {
    if (!str) return [];

    const result = [];
    const chars = [...str]; // 正确分割Unicode字符

    for (const char of chars) {
      const code = char.codePointAt(0);
      // 单个emoji的范围检测
      if (
        (code >= 0x1F600 && code <= 0x1F64F) || // Emoticons
        (code >= 0x1F300 && code <= 0x1F5FF) || // Misc Symbols and Pictographs
        (code >= 0x1F680 && code <= 0x1F6FF) || // Transport and Map
        (code >= 0x1F700 && code <= 0x1F77F) || // Alchemical
        (code >= 0x1F780 && code <= 0x1F7FF) || // Geometric Shapes Extended
        (code >= 0x1F800 && code <= 0x1F8FF) || // Supplemental Arrows-C
        (code >= 0x1F900 && code <= 0x1F9FF) || // Supplemental Symbols and Pictographs
        (code >= 0x1FA00 && code <= 0x1FA6F) || // Chess Symbols
        (code >= 0x1FA70 && code <= 0x1FAFF) || // Symbols and Pictographs Extended-A
        (code >= 0x2600 && code <= 0x26FF) ||   // Misc symbols
        (code >= 0x2700 && code <= 0x27BF) ||   // Dingbats
        (code >= 0x1F1E0 && code <= 0x1F1FF)    // Flags (区域指示符号)
      ) {
        result.push(char);
      }
    }

    return result;
  },

  // 选择示例emoji
  selectExampleEmoji: function(e) {
    const emoji = e.currentTarget.dataset.emoji;
    if (emoji) {
      // 示例emoji可能包含组合emoji，取第一个字符
      const chars = [...emoji];
      const firstChar = chars[0];
      const code = firstChar.codePointAt(0);

      // 检测是否是单个emoji
      if (
        (code >= 0x1F600 && code <= 0x1F64F) ||
        (code >= 0x1F300 && code <= 0x1F5FF) ||
        (code >= 0x1F680 && code <= 0x1F6FF) ||
        (code >= 0x1F700 && code <= 0x1F77F) ||
        (code >= 0x1F780 && code <= 0x1F7FF) ||
        (code >= 0x1F800 && code <= 0x1F8FF) ||
        (code >= 0x1F900 && code <= 0x1F9FF) ||
        (code >= 0x1FA00 && code <= 0x1FA6F) ||
        (code >= 0x1FA70 && code <= 0x1FAFF) ||
        (code >= 0x2600 && code <= 0x26FF) ||
        (code >= 0x2700 && code <= 0x27BF) ||
        (code >= 0x1F1E0 && code <= 0x1F1FF)
      ) {
        this.setData({ tempEmojiInput: firstChar });
      }
    }
  },

  // 确认emoji输入
  confirmEmojiInput: function() {
    const { tempEmojiInput } = this.data;

    if (!tempEmojiInput) {
      wx.showToast({
        title: '请输入emoji',
        icon: 'none'
      });
      return;
    }

    // 验证是否包含有效emoji
    const emojis = this.findAllEmojis(tempEmojiInput);
    if (emojis.length === 0) {
      wx.showToast({
        title: '请输入有效的emoji图标',
        icon: 'none'
      });
      return;
    }

    // 设置自定义emoji
    this.setData({
      customEmojiValue: emojis[0],
      selectedIcon: emojis[0],
      selectedIconName: '自定义emoji',
      selectedGroupName: '',
      selectedIconIndex: 0,
      uploadedImagePath: '', // 清除上传的图片
      emojiDialogVisible: false,
      tempEmojiInput: ''
    });

    wx.showToast({
      title: '已选择emoji',
      icon: 'success',
      duration: 1000
    });
  },

  // 删除自定义emoji
  removeCustomEmoji: function() {
    this.setData({
      customEmojiValue: '',
      uploadedImagePath: '', // 清除上传的图片（保险）
      selectedIcon: '📦',
      selectedIconName: '默认',
      selectedGroupName: '常用',
      selectedIconIndex: 0
    });
  },

  // 切换分组展开/收起
  toggleGroup(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    if (this.data.expandedGroupIndex === index) {
      // 如果点击的是已展开的分组，则收起
      this.setData({ expandedGroupIndex: -1 });
    } else {
      // 否则展开该分组
      this.setData({ expandedGroupIndex: index });
    }
  },

  // 根据分组名称、图标和名称查找对应的索引（用于编辑模式回显）
  findIconInfoByValue(iconValue, iconName, groupName) {
    for (let groupIdx = 0; groupIdx < this.data.builtinIconGroups.length; groupIdx++) {
      const group = this.data.builtinIconGroups[groupIdx];
      for (let iconIdx = 0; iconIdx < group.icons.length; iconIdx++) {
        const item = group.icons[iconIdx];
        // 同时匹配分组名称、图标和名称
        if (group.name === groupName && item.icon === iconValue && item.name === iconName) {
          return {
            name: item.name,
            groupName: group.name,
            iconIndex: iconIdx
          };
        }
      }
    }
    // 如果完全匹配失败，只匹配图标+名称（兼容旧数据）
    for (let groupIdx = 0; groupIdx < this.data.builtinIconGroups.length; groupIdx++) {
      const group = this.data.builtinIconGroups[groupIdx];
      for (let iconIdx = 0; iconIdx < group.icons.length; iconIdx++) {
        if (group.icons[iconIdx].icon === iconValue && group.icons[iconIdx].name === iconName) {
          return {
            name: group.icons[iconIdx].name,
            groupName: group.name,
            iconIndex: iconIdx
          };
        }
      }
    }
    // 最后只匹配图标
    for (let groupIdx = 0; groupIdx < this.data.builtinIconGroups.length; groupIdx++) {
      const group = this.data.builtinIconGroups[groupIdx];
      for (let iconIdx = 0; iconIdx < group.icons.length; iconIdx++) {
        if (group.icons[iconIdx].icon === iconValue) {
          return {
            name: group.icons[iconIdx].name,
            groupName: group.name,
            iconIndex: iconIdx
          };
        }
      }
    }
    return { name: '默认', groupName: '常用', iconIndex: 0 };
  },

  // 选择自定义图标
  chooseIcon() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const size = res.tempFiles[0].size;

        // 检查文件大小（2M限制）
        if (size > 2 * 1024 * 1024) {
          wx.showToast({
            title: '图片大小不能超过2M',
            icon: 'none'
          });
          return;
        }

        // 检查文件类型
        const ext = tempFilePath.split('.').pop().toLowerCase();
        const allowedTypes = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
        if (!allowedTypes.includes(ext)) {
          wx.showToast({
            title: '仅支持jpg/png/webp/svg格式',
            icon: 'none'
          });
          return;
        }

        // 设置临时路径作为预览，并清空之前选择的内置图标
        this.setData({
          selectedIcon: '', // 清空之前选择的内置图标
          selectedIconName: '',
          selectedGroupName: '',
          selectedIconIndex: 0,
          uploadedImagePath: tempFilePath // 设置上传图片的临时路径
        });

        // 上传图片到云存储
        this.uploadIconToCloud(tempFilePath);
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('cancel')) {
          // 用户取消选择，不做任何操作
          return;
        }
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 上传图标到云存储
  uploadIconToCloud(filePath) {
    wx.showLoading({ title: '上传中...' });

    const fileName = `icons/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;

    wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: filePath,
      success: (res) => {
        // 上传成功后，更新selectedIcon为云存储路径，保持缩略图显示
        this.setData({
          uploadedImagePath: res.fileID, // 使用uploadedImagePath存储云存储路径
          customEmojiValue: '' // 清除自定义emoji
        });
        wx.hideLoading();
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '上传失败，请重试',
          icon: 'none'
        });
        // 如果上传失败，清空上传路径
        this.setData({
          uploadedImagePath: ''
        });
      }
    });
  },

  // 物品名称输入
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  // 价格输入
  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  // 购买日期改变
  onDateChange(e) {
    this.setData({
      purchaseDate: e.detail.value
    });
  },

  // 切换类别选择（单选模式）
  toggleCategory(e) {
    const index = e.currentTarget.dataset.index;

    // 单选模式：取消其他所有选中，只选中当前点击的
    const categories = this.data.categories.map((item, i) => ({
      ...item,
      selected: i === index
    }));

    this.setData({ categories });
  },

  // 已退役开关
  onRetiredChange(e) {
    const checked = e.detail.value;
    const updates = { isRetired: checked };

    if (checked) {
      // 开启退役：，设置默认退役日期为今天，并取消已卖出，同时强制开启不计入总日均
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      updates.retiredDate = `${year}-${month}-${day}`;
      updates.isSold = false;
      updates.soldDate = '';
      updates.excludeDaily = true;
    } else {
      // 关闭退役：恢复计入总日均
      updates.retiredDate = '';
      updates.excludeDaily = false;
    }

    this.setData(updates);
  },

  // 已卖出开关
  onSoldChange(e) {
    const checked = e.detail.value;
    const updates = { isSold: checked };

    if (checked) {
      // 开启卖出：设置默认卖出日期为今天，并取消已退役，同时强制开启不计入总日均
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      updates.soldDate = `${year}-${month}-${day}`;
      updates.isRetired = false;
      updates.retiredDate = '';
      updates.excludeDaily = true;
    } else {
      // 关闭卖出：恢复计入总日均
      updates.soldDate = '';
      updates.excludeDaily = false;
    }

    this.setData(updates);
  },

  // 卖出日期改变
  onSoldDateChange(e) {
    this.setData({
      soldDate: e.detail.value
    });
  },

  // 退役日期改变
  onRetiredDateChange(e) {
    this.setData({
      retiredDate: e.detail.value
    });
  },

  // 不计入总资产开关
  onExcludeTotalChange(e) {
    this.setData({ excludeTotal: e.detail.value });
  },

  // 不计入日均开关
  onExcludeDailyChange(e) {
    this.setData({ excludeDaily: e.detail.value });
  },

  // 资产类型切换
  onAssetTypeChange(e) {
    const assetType = e.currentTarget.dataset.type;

    // 编辑模式下，如果切换到当前已有的类型，不做任何处理
    if (this.data.isEdit && assetType === this.data.assetType) {
      return;
    }

    // 编辑模式下切换资产类型时，需要提示用户
    if (this.data.isEdit) {
      wx.showModal({
        title: '确认切换',
        content: '切换资产类型将清空相关字段数据，确定要切换吗？',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              assetType,
              // 切换类型时清空订阅字段
              periodAmount: '',
              periodType: 'monthly',
              periodTypeIndex: 0,
              periodDays: '',
              subscriptionStartDate: '',
              subscriptionEndDate: '',
              pendingSubscription: false,
              endSubscription: false,
              // 同时清空普通资产的退役/卖出状态
              isRetired: false,
              isSold: false,
              retiredDate: '',
              soldDate: '',
              price: ''
            });
          }
        }
      });
    } else {
      // 新增模式：直接切换
      this.setData({
        assetType,
        // 切换类型时清空订阅字段
        periodAmount: '',
        periodType: 'monthly',
        periodTypeIndex: 0,
        periodDays: '',
        subscriptionStartDate: '',
        subscriptionEndDate: '',
        pendingSubscription: false,
        endSubscription: false
      });
    }
  },

  // 每期金额输入
  onPeriodAmountInput(e) {
    this.setData({ periodAmount: e.detail.value });
  },

  // 周期类型选择
  onPeriodTypeChange(e) {
    const index = parseInt(e.detail.value);
    const periodTypes = ['monthly', 'yearly', 'weekly', 'custom'];
    const periodType = periodTypes[index];
    this.setData({
      periodTypeIndex: index,
      periodType,
      periodDays: '' // 清空自定义天数
    });
  },

  // 周期天数输入
  onPeriodDaysInput(e) {
    this.setData({ periodDays: e.detail.value });
  },

  // 待订阅开关
  onPendingSubscriptionChange(e) {
    const checked = e.detail.value;
    const updates = { pendingSubscription: checked };

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (checked) {
      // 打开待订阅：设置开始日期，清空结束订阅状态
      updates.subscriptionStartDate = todayStr;
      updates.endSubscription = false;
      updates.subscriptionEndDate = '';
    } else {
      // 关闭待订阅：设置订阅日期
      updates.purchaseDate = todayStr;
    }
    this.setData(updates);
  },

  // 订阅开始日期改变
  onSubscriptionStartDateChange(e) {
    this.setData({ subscriptionStartDate: e.detail.value });
  },

  // 订阅结束日期改变
  onSubscriptionEndDateChange(e) {
    this.setData({ subscriptionEndDate: e.detail.value });
  },

  // 结束订阅开关
  onEndSubscriptionChange(e) {
    const checked = e.detail.value;
    const updates = { endSubscription: checked };
    if (checked) {
      // 设置默认结束日期，并强制开启不计入总日均
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      updates.subscriptionEndDate = todayStr;
      updates.excludeDaily = true;
    } else {
      updates.subscriptionEndDate = '';
      updates.excludeDaily = false;
    }
    this.setData(updates);
  },

  // 验证订阅资产表单
  validateSubscriptionForm() {
    const errors = {};
    const { periodAmount, periodType, periodDays, pendingSubscription, subscriptionStartDate } = this.data;

    if (!periodAmount || parseFloat(periodAmount) <= 0) {
      errors.periodAmount = '请输入有效的每期金额';
    }

    if (pendingSubscription && !subscriptionStartDate) {
      errors.subscriptionStartDate = '请选择订阅开始日期';
    }

    if (periodType === 'custom') {
      const days = parseInt(periodDays);
      if (!periodDays || isNaN(days) || days < 1 || days > 365) {
        errors.periodDays = '周期天数必须在1-365之间';
      }
    }

    return errors;
  },

  // 表单验证
  validateForm(formData) {
    const errors = {};

    // 验证物品名称
    if (!formData.name || formData.name.trim() === '') {
      errors.name = '请输入物品名称';
    } else if (formData.name.length > 50) {
      errors.name = '物品名称不能超过 50 个字符';
    }

    // 根据资产类型验证不同字段
    if (this.data.assetType === 'subscription') {
      // 订阅资产验证
      if (!this.data.periodAmount || parseFloat(this.data.periodAmount) <= 0) {
        errors.periodAmount = '请输入有效的每期金额';
      }
      if (this.data.periodType === 'custom') {
        const days = parseInt(this.data.periodDays);
        if (!this.data.periodDays || isNaN(days) || days < 1 || days > 365) {
          errors.periodDays = '周期天数必须在1-365之间';
        }
      }
      if (this.data.pendingSubscription && !this.data.subscriptionStartDate) {
        errors.subscriptionStartDate = '请选择订阅开始日期';
      }
    } else {
      // 普通资产验证价格
      if (!formData.price || formData.price <= 0) {
        errors.price = '请输入有效的价格';
      } else if (isNaN(formData.price)) {
        errors.price = '价格必须是数字';
      }
    }

    // 验证购买日期（订阅资产根据待订阅状态验证不同字段）
    if (this.data.assetType === 'subscription') {
      if (this.data.pendingSubscription) {
        // 待订阅：验证开始日期
        if (!this.data.subscriptionStartDate) {
          errors.subscriptionStartDate = '请选择开始日期';
        }
      } else {
        // 已订阅：验证订阅日期
        if (!formData.purchaseDate) {
          errors.purchaseDate = '请选择订阅日期';
        }
      }
    } else {
      // 普通资产：验证购买日期
      if (!formData.purchaseDate) {
        errors.purchaseDate = '请选择购买日期';
      }
    }

    // 验证类别
    if (!formData.category || formData.category.trim() === '') {
      errors.category = '请选择类别';
    }

    // 验证退役日期（如果已退役）
    if (this.data.isRetired && !this.data.retiredDate) {
      errors.retiredDate = '请选择退役日期';
    }

    // 验证卖出日期（如果已卖出）
    if (this.data.isSold && !this.data.soldDate) {
      errors.soldDate = '请选择卖出日期';
    }

    return errors;
  },

  // 表单提交
  onSubmit() {
    // 构造表单数据
    const formData = {
      name: this.data.name,
      price: this.data.assetType === 'subscription' ? this.data.periodAmount : this.data.price,
      purchaseDate: this.data.purchaseDate,
      remark: this.data.remark,
      // 优先使用上传的图片，其次自定义emoji，最后内置图标
      icon: this.data.uploadedImagePath || this.data.customEmojiValue || this.data.selectedIcon || '📦'
    };

    // 获取选中的类别（单选模式）
    const selectedCat = this.data.categories.find(item => item.selected);
    formData.category = selectedCat ? selectedCat.name : '';

    // 验证表单
    const errors = this.validateForm(formData);
    if (Object.keys(errors).length > 0) {
      this.setData({ errors });
      const firstError = Object.values(errors)[0];
      wx.showToast({
        title: firstError,
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    // 确定资产状态
    let status = 'active'; // 默认服役中
    if (this.data.assetType === 'fixed') {
      if (this.data.isRetired) {
        status = 'retired';
      } else if (this.data.isSold) {
        status = 'sold';
      }
    }

    // 构造请求数据
    const requestData = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      purchaseDate: formData.purchaseDate,
      category: formData.category,
      icon: formData.icon, // 传递缩略图字段
      iconName: this.data.uploadedImagePath ? '' : (this.data.customEmojiValue ? '自定义emoji' : (this.data.selectedIconName || '默认')),
      groupName: this.data.uploadedImagePath ? '' : (this.data.customEmojiValue ? '' : (this.data.selectedGroupName || '常用')),
      remark: formData.remark || '',
      status: status,
      retiredDate: this.data.isRetired ? this.data.retiredDate : '',
      soldDate: this.data.isSold ? this.data.soldDate : '',
      excludeTotal: this.data.excludeTotal,
      excludeDaily: this.data.excludeDaily,
      // 资产类型
      assetType: this.data.assetType
    };

    // 订阅资产额外字段
    if (this.data.assetType === 'subscription') {
      requestData.periodAmount = parseFloat(this.data.periodAmount);
      requestData.periodType = this.data.periodType;
      if (this.data.periodType === 'custom') {
        requestData.periodDays = parseInt(this.data.periodDays);
      }

      // 根据待订阅状态设置日期
      if (this.data.pendingSubscription) {
        // 待订阅开启：使用开始日期，清空订阅日期和结束日期
        requestData.purchaseDate = '';
        requestData.subscriptionStartDate = this.data.subscriptionStartDate;
        requestData.subscriptionEndDate = '';
      } else {
        // 待订阅关闭：使用订阅日期
        requestData.purchaseDate = this.data.purchaseDate;
        requestData.subscriptionStartDate = '';
        requestData.subscriptionEndDate = this.data.subscriptionEndDate;
      }

      requestData.pendingSubscription = this.data.pendingSubscription;
      requestData.endSubscription = this.data.endSubscription;
    }

    // 根据是否编辑模式调用不同的云函数
    const cloudFunctionName = this.data.isEdit ? 'updateAsset' : 'addAsset';
    if (this.data.isEdit) {
      requestData.id = this.data.assetId;
    }

    // 调用云函数保存资产
    wx.cloud.callFunction({
      name: cloudFunctionName,
      data: requestData,
      success: (res) => {
        if (res.result.success) {
          wx.hideLoading();
          wx.showToast({
            title: this.data.isEdit ? '更新成功' : '保存成功',
            icon: 'success'
          });

          // 返回并刷新上一页
          setTimeout(() => {
            wx.navigateBack({
              delta: 1,
              success: () => {
                // 触发上一页的刷新
                const pages = getCurrentPages();
                if (pages.length > 1) {
                  const prevPage = pages[pages.length - 2];
                  // 资产详情页有 loadAssetDetail，首页有 loadAssets
                  if (prevPage.loadAssetDetail) {
                    prevPage.loadAssetDetail(this.data.assetId);
                  } else if (prevPage.loadAssets) {
                    prevPage.loadAssets();
                  }
                }
              }
            });
          }, 1500);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: res.result.error || '保存失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      }
    });
  }
});