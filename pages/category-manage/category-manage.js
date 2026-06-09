// pages/category-manage/category-manage.js
const { themeManager } = require('../../utils/themeManager');
const { supabase, uploadFileToStorage, deleteStorageFile, getChinaTimeISO } = require('../../utils/supabase');

Page({
  data: {
    themeStyle: '',
    categories: [],
    loading: false,
    // 排序相关
    currentSortIndex: 0, // 0=创建时间排序, -1=自定义排序
    sortOrder: 'desc', // 'asc' 或 'desc'，desc 表示最新创建的在最上面

    // 批量操作相关
    batchMode: false, // 是否处于批量选择模式
    selectedCategoryIds: [], // 选中的分类ID

    // 详情弹窗相关
    detailVisible: false,
    currentCategory: null, // 当前查看的分类

    // 添加/编辑弹窗相关
    dialogVisible: false,
    dialogTitle: '添加分类',
    operationType: '', // 'add' 或 'edit'
    editCategoryId: null,

    // 表单数据
    tempCategoryName: '',
    selectedIcon: '',
    selectedIconName: '',
    uploadedImagePath: '', // 用户上传的图片路径
    imageLoading: false, // 图片加载状态
    tempDescription: '', // 分类描述

    // 自定义emoji相关
    emojiDialogVisible: false, // emoji输入弹窗是否显示
    tempEmojiInput: '', // emoji输入框临时值
    customEmojiValue: '', // 用户选择的自定义emoji

    // 内置图标列表（带中文名称）
    builtinIcons: [
      { name: '默认', icon: '📦' },
      { name: '数码影音', icon: '🎧' },
      { name: '交通工具', icon: '🚙' },
      { name: '金融资产', icon: '💰' },
      { name: '房产家居', icon: '🏠' },
      { name: '服饰珠宝', icon: '👗' },
      { name: '美妆护肤', icon: '💄' },
      { name: '图书文具', icon: '📚' },
      { name: '游戏娱乐', icon: '🎮' },
      { name: '运动健身', icon: '⚽' },
      { name: '宠物用品', icon: '🐾' },
      { name: '收藏品', icon: '🎨' },
      { name: '日用消耗', icon: '🛒' },
      { name: '账号服务', icon: '🔑' },
      { name: '母婴用品', icon: '🍼' },
      { name: '户外装备', icon: '⛺' },
      { name: '办公设备', icon: '💼' },
      { name: '其他', icon: '🔖' }
    ]
  },

  onLoad: function () {
    // 初始化主题
    this.setData({
      themeStyle: themeManager.getCurrentStyle(),
      currentThemeKey: themeManager.getCurrentTheme()
    });
    // 初始化导航栏颜色
    const initNavColors = themeManager.getThemeColors();
    wx.setNavigationBarColor({
      backgroundColor: initNavColors.navBg,
      frontColor: initNavColors.navTextStyle
    });
    themeManager.addListener((style, themeKey) => {
      this.setData({ themeStyle: style, currentThemeKey: themeKey });
      const navColors = themeManager.getThemeColors();
      wx.setNavigationBarColor({
        backgroundColor: navColors.navBg,
        frontColor: navColors.navTextStyle
      });
    });
    this.loadCategories();
  },

  onPullDownRefresh: function () {
    this.loadCategories(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载类别列表
  async loadCategories(callback) {
    if (this.data.loading) return;

    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    const app = getApp();

    try {
      const openid = await app.getOpenid();

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('_openid', openid)
        .order('sortOrder', { ascending: true });

      if (error) {
        this.setData({ categories: [], loading: false });
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
        if (callback) callback();
        return;
      }

      // 查询当前用户所有资产的 category，在 JS 中分组计数
      let countMap = {};
      if (data.length > 0) {
        const { data: allAssets, error: assetError } = await supabase
          .from('assets')
          .select('category')
          .eq('_openid', openid);
        if (!assetError && allAssets) {
          allAssets.forEach(asset => {
            const cat = asset.category;
            if (cat) countMap[cat] = (countMap[cat] || 0) + 1;
          });
        }
      }

      // Supabase URL 直接使用，不需要获取临时链接
      // 同时把 Supabase 的 id 映射到 _id，保持业务逻辑兼容
      const categoriesWithIcons = data.map(category => ({
        ...category,
        _id: category.id, // Supabase id 映射到 _id
        displayIcon: category.icon && category.icon.startsWith('http') ? category.icon : null,
        _selected: false,
        assetCount: countMap[category.name] || 0
      }));

      // 应用当前排序
      const sortedCategories = this.applySorting(categoriesWithIcons);

      this.setData({
        categories: sortedCategories,
        loading: false
      });
      wx.hideLoading();
      if (callback) callback();
    } catch (err) {
      this.setData({ categories: [], loading: false });
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
      if (callback) callback();
    }
  },

  // 按创建时间排序
  changeSortByTime: function() {
    const { sortOrder } = this.data;
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';

    this.setData({
      currentSortIndex: 0,
      sortOrder: newOrder
    });

    // 使用新值进行排序
    const sorted = this.applySortingWithParams(this.data.categories, 0, newOrder);
    this.setData({ categories: sorted });

    wx.showToast({
      title: newOrder === 'asc' ? '创建时间 ↑' : '创建时间 ↓',
      icon: 'none',
      duration: 500
    });
  },

  // 重置为自定义排序
  resetToCustomSort: function() {
    this.setData({
      currentSortIndex: -1,
      sortOrder: 'asc'
    });
    this.loadCategories();
    wx.showToast({
      title: '已切换到自定义排序',
      icon: 'none',
      duration: 500
    });
  },

  // 带参数的排序方法
  applySortingWithParams: function(categories, sortIndex, sortOrder) {
    // 如果是自定义排序，直接返回（保持云端返回的顺序）
    if (sortIndex === -1) {
      return categories;
    }

    const sorted = [...categories];

    // 按创建时间排序
    sorted.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (sortOrder === 'asc') {
        return timeA - timeB;
      } else {
        return timeB - timeA;
      }
    });

    return sorted;
  },

  // 应用排序
  applySorting: function(categories) {
    const { currentSortIndex, sortOrder } = this.data;

    if (currentSortIndex === -1) {
      return categories;
    }

    const sorted = [...categories];

    // 按创建时间排序
    sorted.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (sortOrder === 'asc') {
        return timeA - timeB;
      } else {
        return timeB - timeA;
      }
    });

    return sorted;
  },

  // ========== 添加/编辑分类相关方法 ==========

  // 显示分类添加/编辑弹窗
  showCategoryDialog: function(operationType, categoryId = null) {
    if (operationType === 'add') {
      // 添加分类时先设置初始数据
      this.setData({
        dialogVisible: true,
        dialogTitle: '添加分类',
        operationType: 'add',
        tempCategoryName: '',
        selectedIcon: this.data.builtinIcons[0].icon,
        selectedIconName: this.data.builtinIcons[0].name,
        uploadedImagePath: '',
        customEmojiValue: '',
        tempDescription: '',
        editCategoryId: null
      });
    } else if (operationType === 'edit' && categoryId) {
      // 查找要编辑的分类
      const category = this.data.categories.find(cat => cat._id === categoryId);
      if (category) {
        // 判断图标类型：内置图标、上传图片、自定义emoji
        const iconValue = category.icon || '';
        const isBuiltinIcon = this.data.builtinIcons.some(item => item.icon === iconValue);
        const isUploadedImage = iconValue.startsWith('http');
        const isCustomEmoji = !isBuiltinIcon && !isUploadedImage && iconValue.length > 0;

        this.setData({
          dialogVisible: true,
          dialogTitle: '编辑分类',
          operationType: 'edit',
          editCategoryId: categoryId,
          tempCategoryName: category.name,
          selectedIcon: iconValue || this.data.builtinIcons[0].icon,
          selectedIconName: isBuiltinIcon ? (function(arr, val){ var f = arr.find(function(item){ return item.icon === val; }); return f && f.name || ''; }(this.data.builtinIcons, iconValue)) : (isUploadedImage ? '自定义图片' : (isCustomEmoji ? '自定义emoji' : '')),
          uploadedImagePath: isUploadedImage ? iconValue : '',
          customEmojiValue: isCustomEmoji ? iconValue : '',
          tempDescription: category.description || '',
          _originalIcon: iconValue // 保存原始图标，用于后续删除旧文件
        });
      }
    }
  },

  // 监听分类名称输入
  onCategoryNameInput: function(e) {
    this.setData({
      tempCategoryName: e.detail.value
    });
  },

  // 监听分类描述输入
  onDescriptionInput: function(e) {
    this.setData({
      tempDescription: e.detail.value
    });
  },

  // 选择内置图标
  selectBuiltinIcon: function(e) {
    const iconItem = e.currentTarget.dataset.icon;
    if (iconItem) {
      this.setData({
        selectedIcon: iconItem.icon,
        selectedIconName: iconItem.name,
        uploadedImagePath: '', // 清除上传的图片
        customEmojiValue: '' // 清除自定义emoji
      });
    }
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

  // 验证输入是否包含emoji（只取第一个）
  validateEmoji: function(input) {
    const emojis = this.findAllEmojis(input);
    return emojis.length > 0 ? emojis[0] : null;
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
    const validEmoji = this.validateEmoji(tempEmojiInput);

    if (!validEmoji) {
      wx.showToast({
        title: '请输入有效的emoji图标',
        icon: 'none'
      });
      return;
    }

    // 设置自定义emoji
    this.setData({
      customEmojiValue: validEmoji,
      selectedIcon: validEmoji,
      selectedIconName: '自定义emoji',
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
      selectedIcon: this.data.builtinIcons[0].icon,
      selectedIconName: this.data.builtinIcons[0].name
    });
  },

  // 上传自定义图标
  chooseImage: function() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const extMatch = String(tempFilePath).match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        const ext = extMatch ? extMatch[1].toLowerCase() : '';
        const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'];

        // 检查文件大小 (最大5M)
        const maxSize = 5 * 1024 * 1024;
        if (res.tempFiles[0].size > maxSize) {
          wx.showToast({
            title: '分类图片不能超过5M',
            icon: 'none'
          });
          return;
        }

        if (!allowedTypes.includes(ext)) {
          wx.showModal({
            title: '格式不支持',
            content: '支持的图片格式：jpg、jpeg、png、gif、webp、bmp、svg、heic、heif。文件后缀不区分大小写，例如 JPG 和 jpg 会按同一种格式处理。',
            showCancel: false,
            confirmText: '知道了'
          });
          return;
        }

        // 上传图片到云存储
        that.uploadImage(tempFilePath);
      },
      fail: function(err) {
        // 用户取消选择图片或出现错误
      }
    });
  },

  // 上传图片到 Supabase Storage
  uploadImage: async function(filePath) {
    wx.showLoading({ title: '上传中...', mask: true });

    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const extMatch = String(filePath).match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const ext = extMatch[1].toLowerCase();
    const fileName = `${timestamp}-${randomNum}.${ext}`;

    try {
      const { publicUrl, error } = await uploadFileToStorage('category-icons', fileName, filePath);

      if (error) {
        wx.hideLoading();
        console.error('上传失败', error);
        wx.showToast({ title: '上传失败: ' + (error.message || '请重试'), icon: 'none' });
        return;
      }

      // 注意：不在这里删除旧文件，因为用户可能取消编辑
      // 删除旧文件的操作在保存成功后进行（performEditCategory 中）

      // 设置图片加载状态
      this.setData({
        selectedIcon: publicUrl,
        selectedIconName: '自定义图片',
        uploadedImagePath: publicUrl,
        customEmojiValue: '',
        imageLoading: true // 图片正在加载
      });

      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('上传异常', err);
      wx.showToast({ title: '上传失败，请重试', icon: 'none' });
    }
  },

  // 图片加载完成
  onImageLoad: function() {
    this.setData({ imageLoading: false });
  },

  // 图片加载失败
  onImageError: function() {
    this.setData({ imageLoading: false });
    wx.showToast({ title: '图片加载失败', icon: 'none' });
  },

  // 删除已上传的图片
  removeUploadedImage: function() {
    this.setData({
      uploadedImagePath: '',
      selectedIcon: this.data.builtinIcons[0].icon,
      selectedIconName: this.data.builtinIcons[0].name,
      customEmojiValue: '' // 清除自定义emoji
    });
  },

  // 确认分类操作（添加或编辑）
  confirmCategoryOperation: function() {
    const { tempCategoryName, selectedIcon, operationType, editCategoryId } = this.data;

    if (!tempCategoryName || tempCategoryName.trim() === '') {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      });
      return;
    }

    if (operationType === 'add') {
      // 添加分类时检查是否已存在
      const exists = this.data.categories.some(cat => cat.name === tempCategoryName);
      if (exists) {
        wx.showToast({
          title: '分类已存在',
          icon: 'none'
        });
        return;
      }

      this.performAddCategory();
    } else if (operationType === 'edit' && editCategoryId) {
      // 编辑分类时检查名称是否与其他分类冲突
      const exists = this.data.categories.some(cat =>
        cat.name === tempCategoryName && cat._id !== editCategoryId
      );
      if (exists) {
        wx.showToast({
          title: '分类名称已存在',
          icon: 'none'
        });
        return;
      }

      this.performEditCategory();
    }
  },

  // 执行添加分类
  async performAddCategory() {
    wx.showLoading({ title: '添加中...' });

    const { tempCategoryName, selectedIcon, tempDescription } = this.data;
    const app = getApp();

    try {
      const openid = await app.getOpenid();

      // 获取当前最大排序值
      const { data: existingCategories, error: queryError } = await supabase
        .from('categories')
        .select('sortOrder')
        .eq('_openid', openid)
        .order('sortOrder', { ascending: false })
        .limit(1);

      if (queryError) {
        wx.hideLoading();
        wx.showToast({ title: '添加失败', icon: 'none' });
        return;
      }

      const maxSortOrder = existingCategories.length > 0 ? existingCategories[0].sortOrder + 1 : 0;

      // 添加分类
      const { error } = await supabase
        .from('categories')
        .insert({
          _openid: openid,
          name: tempCategoryName,
          icon: selectedIcon || '',
          description: tempDescription || '',
          sortOrder: maxSortOrder,
          createdAt: getChinaTimeISO(),
          updatedAt: getChinaTimeISO()
        });

      wx.hideLoading();
      if (error) {
        wx.showToast({ title: error.message || '添加失败', icon: 'none' });
        return;
      }

      this.loadCategories();
      this.setData({
        dialogVisible: false,
        tempCategoryName: '',
        selectedIcon: '',
        selectedIconName: '',
        uploadedImagePath: '',
        customEmojiValue: '',
        tempDescription: '',
        operationType: '',
        editCategoryId: null
      });
      wx.showToast({ title: '添加成功', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '添加失败，请重试', icon: 'none' });
    }
  },

  // 执行编辑分类
  async performEditCategory() {
    const { tempCategoryName, selectedIcon, editCategoryId, tempDescription } = this.data;

    wx.showLoading({ title: '更新中...' });

    const app = getApp();

    try {
      const openid = await app.getOpenid();

      const { error } = await supabase
        .from('categories')
        .update({
          name: tempCategoryName,
          icon: selectedIcon || '',
          description: tempDescription || '',
          updatedAt: getChinaTimeISO()
        })
        .eq('_openid', openid)
        .eq('id', editCategoryId);

      wx.hideLoading();
      if (error) {
        wx.showToast({ title: error.message || '更新失败', icon: 'none' });
        return;
      }

      // 保存成功后，删除旧图标（如果是 Storage 文件且与新图标不同）
      const originalIcon = this.data._originalIcon;
      if (originalIcon && originalIcon.includes('/category-icons/') && originalIcon !== selectedIcon) {
        deleteStorageFile('category-icons', originalIcon).catch(err => {
          console.log('删除旧分类图标失败（忽略）:', err);
        });
      }

      this.loadCategories();
      this.setData({
        dialogVisible: false,
        tempCategoryName: '',
        selectedIcon: '',
        selectedIconName: '',
        uploadedImagePath: '',
        imageLoading: false,
        customEmojiValue: '',
        tempDescription: '',
        operationType: '',
        editCategoryId: null,
        _originalIcon: ''
      });
      wx.showToast({ title: '修改成功', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '更新失败，请重试', icon: 'none' });
    }
  },

  // 添加新分类
  addCategory: function () {
    this.showCategoryDialog('add');
  },

  // 编辑分类
  editCategory: function (e) {
    const dataset = e.currentTarget.dataset;
    const categoryId = dataset.id;

    this.showCategoryDialog('edit', categoryId);
  },

  // 关闭弹窗
  closeDialog: function() {
    this.setData({
      dialogVisible: false,
      tempCategoryName: '',
      selectedIcon: '',
      selectedIconName: '',
      uploadedImagePath: '',
      imageLoading: false,
      customEmojiValue: '',
      tempDescription: '',
      operationType: '',
      editCategoryId: null,
      _originalIcon: ''
    });
  },

  // ========== 排序相关方法 ==========

  // 上移分类
  moveUpCategory: function(e) {
    const index = e.currentTarget.dataset.index;
    if (index <= 0) return;

    const categories = [...this.data.categories];
    [categories[index - 1], categories[index]] = [categories[index], categories[index - 1]];

    this.setData({ categories });
    this.saveSortOrder(categories);
  },

  // 下移分类
  moveDownCategory: function(e) {
    const index = e.currentTarget.dataset.index;
    const categories = this.data.categories;
    if (index >= categories.length - 1) return;

    const newCategories = [...categories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];

    this.setData({ categories: newCategories });
    this.saveSortOrder(newCategories);
  },

  // 保存排序
  async saveSortOrder(categories) {
    const app = getApp();

    try {
      const openid = await app.getOpenid();

      // 更新每个分类的排序值
      const updatePromises = categories.map((cat, index) => {
        return supabase.from('categories').update({ sortOrder: index })
          .eq('_openid', openid)
          .eq('id', cat.id);
      });

      const results = await Promise.all(updatePromises);
      const hasError = results.some(r => r.error);
      if (hasError) {
        wx.showToast({ title: '保存排序失败', icon: 'none' });
        this.loadCategories();
      } else {
        wx.showToast({ title: '排序已保存', icon: 'success', duration: 1000 });
      }
    } catch (err) {
      wx.showToast({ title: '保存排序失败', icon: 'none' });
      this.loadCategories();
    }
  },

  // ========== 批量操作相关方法 ==========

  // 切换批量选择模式
  toggleBatchMode: function() {
    const newBatchMode = !this.data.batchMode;

    // 重置所有分类的选中状态
    const categories = this.data.categories.map(cat => ({
      ...cat,
      _selected: false
    }));

    this.setData({
      batchMode: newBatchMode,
      selectedCategoryIds: [],
      categories
    });
  },

  // 选择/取消选择分类
  toggleCategorySelection: function(e) {
    const categoryId = e.currentTarget.dataset.id;
    const categories = this.data.categories.map(cat => ({
      ...cat,
      _selected: cat._id === categoryId ? !cat._selected : cat._selected
    }));

    const selectedCategoryIds = categories
      .filter(cat => cat._selected)
      .map(cat => cat._id);

    this.setData({
      categories,
      selectedCategoryIds
    });
  },

  // 全选/取消全选
  toggleSelectAll: function() {
    const { categories } = this.data;
    const allSelected = categories.every(cat => cat._selected || cat.assetCount > 0);

    const newCategories = categories.map(cat => ({
      ...cat,
      _selected: allSelected ? false : (cat.assetCount > 0 ? false : true)
    }));

    const selectedCategoryIds = newCategories
      .filter(cat => cat._selected)
      .map(cat => cat._id);

    this.setData({
      categories: newCategories,
      selectedCategoryIds
    });
  },

  // 批量删除
  batchDeleteCategories: function() {
    const { selectedCategoryIds, categories } = this.data;

    if (selectedCategoryIds.length === 0) {
      wx.showToast({
        title: '请选择要删除的分类',
        icon: 'none'
      });
      return;
    }

    // 检查是否有选中了有资产的分类
    const selectedCategories = categories.filter(cat => selectedCategoryIds.includes(cat._id));
    const withAssets = selectedCategories.filter(cat => cat.assetCount && cat.assetCount > 0);

    if (withAssets.length > 0) {
      wx.showToast({
        title: '请取消选择有资产的分类',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedCategoryIds.length} 个分类吗？此操作不可恢复`,
      success: (res) => {
        if (res.confirm) {
          this.performBatchDelete();
        }
      }
    });
  },

  // 执行批量删除
  async performBatchDelete() {
    wx.showLoading({ title: '删除中...' });

    const app = getApp();
    const categoryIds = this.data.selectedCategoryIds;
    const categories = this.data.categories;

    try {
      const openid = await app.getOpenid();

      // 删除所有自定义图标文件（失败不影响分类删除）
      for (var i = 0; i < categories.length; i++) {
        if (categoryIds.indexOf(categories[i]._id) !== -1 && categories[i].icon) {
          try {
            await deleteStorageFile('category-icons', categories[i].icon);
          } catch (e) {
            console.error('删除图标文件失败', e);
          }
        }
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('_openid', openid)
        .in('id', categoryIds);

      wx.hideLoading();

      if (error) {
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
        return;
      }

      this.setData({
        batchMode: false,
        selectedCategoryIds: []
      });
      this.loadCategories();
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 1500
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
  },

  // ========== 详情弹窗相关方法 ==========

  // 显示分类详情
  showCategoryDetail: function(e) {
    const categoryId = e.currentTarget.dataset.id;
    const category = this.data.categories.find(cat => cat._id === categoryId);

    if (category) {
      this.setData({
        detailVisible: true,
        currentCategory: category
      });
    }
  },

  // 关闭详情弹窗
  closeDetailDialog: function() {
    this.setData({
      detailVisible: false,
      currentCategory: null
    });
  },

  // 从详情弹窗编辑
  editFromDetail: function() {
    const categoryId = this.data.currentCategory._id;
    this.closeDetailDialog();
    this.showCategoryDialog('edit', categoryId);
  },

  // 从详情弹窗删除
  deleteFromDetail: function() {
    const category = this.data.currentCategory;
    const categoryId = category._id;
    this.closeDetailDialog();

    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类 "${category.name}" 吗？此操作不可恢复`,
      success: (res) => {
        if (res.confirm) {
          this.confirmDeleteCategory(categoryId);
        }
      }
    });
  },

  // 确认删除分类
  async confirmDeleteCategory(categoryId) {
    // 检查分类下是否有资产
    const category = this.data.categories.find(cat => cat._id === categoryId);
    if (category && category.assetCount > 0) {
      wx.showToast({
        title: `该分类下有 ${category.assetCount} 个资产，无法删除`,
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '删除中...' });

    try {
      // 获取分类信息（用于删除图标文件）
      const category = this.data.categories.find(cat => cat._id === categoryId);

      // 尝试删除自定义图标文件（失败不影响分类删除）
      if (category && category.icon) {
        try {
          await deleteStorageFile('category-icons', category.icon);
        } catch (e) {
          console.error('删除图标文件失败', e);
        }
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      wx.hideLoading();

      if (error) {
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
        return;
      }

      this.loadCategories();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
  },

  // 删除分类
  deleteCategory: function (e) {
    const dataset = e.currentTarget.dataset;
    const categoryId = dataset.id;
    const categoryIndex = dataset.index;
    const category = this.data.categories[categoryIndex];

    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类 "${category.name}" 吗？此操作不可恢复`,
      success: (res) => {
        if (res.confirm) {
          this.confirmDeleteCategory(categoryId);
        }
      }
    });
  }
})
