// pages/category-manage/category-manage.js

Page({
  data: {
    categories: [],
    loading: false,
    // 排序相关
    sortOptions: ['名称', '创建时间'],
    currentSortIndex: 1, // 默认按创建时间排序
    sortOrder: 'desc', // 'asc' 或 'desc'，desc 表示最新创建的在最上面
    showSortOptions: false, // 是否显示排序方式选择

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
    this.loadCategories();
  },

  onShow: function () {
    // 页面每次显示都重新加载，确保数据是最新的
    this.loadCategories();
  },

  onPullDownRefresh: function () {
    this.loadCategories(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载类别列表
  loadCategories: function (callback) {
    if (this.data.loading) return;

    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    wx.cloud.callFunction({
      name: 'getCategories',
      success: (res) => {
        const resultData = res.result;

        if (resultData && resultData.success) {
          const processCategories = async () => {
            const categoriesData = resultData.data || [];

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
                  // 获取失败时使用 null，显示内置图标
                }
              } else if (category.icon && category.icon.startsWith('http')) {
                // 已经是 http 临时链接，直接使用
                displayIcon = category.icon;
              }

              return {
                ...category,
                displayIcon: displayIcon,
                _selected: false // 初始化选中状态
              };
            }));

            // 应用当前排序
            const sortedCategories = this.applySorting(categoriesWithIcons);

            this.setData({
              categories: sortedCategories
            });
          };

          processCategories();
        } else {
          this.setData({
            categories: []
          });
          wx.showToast({
            title: resultData?.error || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        this.setData({
          categories: []
        });
        wx.showToast({
            title: '网络错误',
            icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
        wx.hideLoading();
        if (callback) callback();
      }
    });
  },

  // 按名称排序
  changeSortByName: function() {
    const { currentSortIndex, sortOrder, categories } = this.data;
    let newIndex = 0;
    let newOrder = 'asc';

    if (currentSortIndex === 0) {
      // 同一字段，切换升序/降序
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    this.setData({
      currentSortIndex: newIndex,
      sortOrder: newOrder
    });

    // 使用新值进行排序
    const sorted = this.applySortingWithParams(categories, newIndex, newOrder);
    this.setData({ categories: sorted });

    wx.showToast({
      title: newOrder === 'asc' ? '名称 ↑' : '名称 ↓',
      icon: 'none',
      duration: 500
    });
  },

  // 按创建时间排序
  changeSortByTime: function() {
    const { currentSortIndex, sortOrder, categories } = this.data;
    let newIndex = 1;
    let newOrder = 'asc';

    if (currentSortIndex === 1) {
      // 同一字段，切换升序/降序
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    this.setData({
      currentSortIndex: newIndex,
      sortOrder: newOrder
    });

    // 使用新值进行排序
    const sorted = this.applySortingWithParams(categories, newIndex, newOrder);
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
    // 重新加载以获取自定义排序
    this.loadCategories();
    wx.showToast({
      title: '已切换到自定义排序',
      icon: 'none',
      duration: 500
    });
  },

  // 带参数的排序方法
  applySortingWithParams: function(categories, sortIndex, sortOrder) {
    // 如果是自定义排序，直接返回
    if (sortIndex === -1) {
      return categories;
    }

    const sorted = [...categories];

    switch(sortIndex) {
      case 0: // 按名称排序
        sorted.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (sortOrder === 'asc') {
            return nameA.localeCompare(nameB);
          } else {
            return nameB.localeCompare(nameA);
          }
        });
        break;
      case 1: // 按创建时间排序
        sorted.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (sortOrder === 'asc') {
            return timeA - timeB;
          } else {
            return timeB - timeA;
          }
        });
        break;
    }

    return sorted;
  },

  // 应用排序
  applySorting: function(categories) {
    const { currentSortIndex, sortOrder } = this.data;

    // 如果是自定义排序，直接返回（保持云端返回的顺序）
    if (currentSortIndex === -1) {
      return categories;
    }

    const sorted = [...categories];

    switch(currentSortIndex) {
      case 0: // 按名称排序
        sorted.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (sortOrder === 'asc') {
            return nameA.localeCompare(nameB);
          } else {
            return nameB.localeCompare(nameA);
          }
        });
        break;
      case 1: // 按创建时间排序（createdAt）
        sorted.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (sortOrder === 'asc') {
            return timeA - timeB;
          } else {
            return timeB - timeA;
          }
        });
        break;
    }

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
        const isUploadedImage = iconValue.startsWith('cloud://') || iconValue.startsWith('http');
        const isCustomEmoji = !isBuiltinIcon && !isUploadedImage && iconValue.length > 0;

        this.setData({
          dialogVisible: true,
          dialogTitle: '编辑分类',
          operationType: 'edit',
          editCategoryId: categoryId,
          tempCategoryName: category.name,
          selectedIcon: iconValue || this.data.builtinIcons[0].icon,
          selectedIconName: isBuiltinIcon ? (this.data.builtinIcons.find(item => item.icon === iconValue)?.name || '') : (isUploadedImage ? '自定义图片' : (isCustomEmoji ? '自定义emoji' : '')),
          uploadedImagePath: isUploadedImage ? iconValue : '',
          customEmojiValue: isCustomEmoji ? iconValue : '',
          tempDescription: category.description || ''
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

        // 检查文件大小 (最大2M)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (res.tempFiles[0].size > maxSize) {
          wx.showToast({
            title: '图片过大，请选择小于2M的图片',
            icon: 'none'
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

  // 上传图片到云存储
  uploadImage: function(filePath) {
    wx.showLoading({ title: '上传中...' });

    const that = this;
    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const fileName = `category-icons/${timestamp}-${randomNum}.png`;

    wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: filePath,
      success: res => {
        wx.hideLoading();
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });

        // 将云文件ID存储起来
        that.setData({
          selectedIcon: res.fileID,
          selectedIconName: '自定义图片',
          uploadedImagePath: res.fileID,
          customEmojiValue: '' // 清除自定义emoji
        });
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
      }
    });
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
  performAddCategory: function() {
    wx.showLoading({ title: '添加中...' });

    const { tempCategoryName, selectedIcon, tempDescription } = this.data;

    // 调用云函数添加类别
    wx.cloud.callFunction({
      name: 'addCategory',
      data: {
        name: tempCategoryName,
        icon: selectedIcon || '',
        description: tempDescription
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result.success) {
          // 重新加载类别列表
          this.loadCategories();
          // 关闭弹窗
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
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.result.error || '添加失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '添加失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 执行编辑分类
  performEditCategory: function() {
    const { tempCategoryName, selectedIcon, editCategoryId, tempDescription } = this.data;

    wx.showLoading({ title: '更新中...' });

    // 调用云函数更新类别
    wx.cloud.callFunction({
      name: 'updateCategory',
      data: {
        categoryId: editCategoryId,
        name: tempCategoryName,
        icon: selectedIcon || '',
        description: tempDescription
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result.success) {
          // 重新加载类别列表
          this.loadCategories();
          // 关闭弹窗
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
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.result.error || '更新失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '更新失败，请重试',
          icon: 'none'
        });
      }
    });
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
      customEmojiValue: '',
      tempDescription: '',
      operationType: '',
      editCategoryId: null
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
  saveSortOrder: function(categories) {
    const sortOrders = categories.map((cat, index) => ({
      categoryId: cat._id,
      sortOrder: index
    }));

    wx.cloud.callFunction({
      name: 'updateCategorySortOrder',
      data: { sortOrders },
      success: (res) => {
        if (res.result.success) {
          wx.showToast({
            title: '排序已保存',
            icon: 'success',
            duration: 1000
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '保存排序失败',
          icon: 'none'
        });
        // 重新加载列表恢复原顺序
        this.loadCategories();
      }
    });
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
  performBatchDelete: function() {
    wx.showLoading({ title: '删除中...' });

    wx.cloud.callFunction({
      name: 'batchDeleteCategories',
      data: {
        categoryIds: this.data.selectedCategoryIds
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result.success) {
          this.setData({
            batchMode: false,
            selectedCategoryIds: []
          });
          this.loadCategories();
          wx.showToast({
            title: res.result.message || '删除成功',
            icon: 'success',
            duration: 1500
          });
        } else {
          wx.showToast({
            title: res.result.error || '删除失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '删除失败，请重试',
          icon: 'none'
        });
      }
    });
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
    this.closeDetailDialog();

    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类 "${category.name}" 吗？此操作不可恢复`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });

          wx.cloud.callFunction({
            name: 'deleteCategory',
            data: {
              categoryId: category._id
            },
            success: (res) => {
              wx.hideLoading();
              if (res.result.success) {
                this.loadCategories();
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: res.result.error || '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
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
          wx.showLoading({ title: '删除中...' });

          // 调用云函数删除类别
          wx.cloud.callFunction({
            name: 'deleteCategory',
            data: {
              categoryId: categoryId
            },
            success: (res) => {
              wx.hideLoading();
              if (res.result.success) {
                // 重新加载类别列表
                this.loadCategories();
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: res.result.error || '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  }
})