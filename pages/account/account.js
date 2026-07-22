// pages/account/account.js
const { themeManager } = require('../../utils/themeManager');
const { supabase, uploadFileToStorage, deleteStorageFile, getChinaTimeISO } = require('../../utils/supabase');
const { isAdmin } = require('../../utils/auth');
const { checkImageSecurity, prepareImageForSecurityCheck } = require('../../utils/contentSecurity');
const { PRESET_AVATARS, PRESET_NICKNAMES } = require('../../utils/presetAvatars');
const app = getApp();

Page({
  data: {
    themeStyle: '',
    userInfo: null,
    loading: true,
    userId: '',

    // 管理员标识
    isAdmin: false,

    // 编辑模式
    isEditing: false,
    editNickName: '',
    editAvatarUrl: '',
    avatarLoading: false, // 头像加载状态
    choosingAvatar: false, // 选择头像时的遮罩状态
    canPreviewAvatar: false,

    // 随机信息弹窗
    showRandomModal: false,
    randomNickName: '',
    randomAvatarUrl: '',

    presetAvatars: PRESET_AVATARS,

    presetNicknames: PRESET_NICKNAMES,

    nicknameFocus: false,
    submitting: false
  },

  onLoad() {
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
    this.loadUserInfo();
  },

  // 从数据库加载用户信息
  loadUserInfo() {
    this.setData({ loading: true });

    const openid = app.globalData.openid;
    if (!openid) {
      app.getOpenid().then(() => {
        this.queryUserInfo();
      }).catch(() => {
        this.setData({ loading: false });
      });
    } else {
      this.queryUserInfo();
    }
  },

  // 查询 Supabase 用户信息
  async queryUserInfo() {
    try {
      const openid = await app.getOpenid();
      if (isAdmin(openid)) {
        this.setData({ isAdmin: true });
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('_openid', openid)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('获取用户信息失败:', error);
        this.setData({ loading: false });
        return;
      }

      if (data) {
        // 如果头像是 Storage URL，设置加载状态
        const avatarUrl = data.avatarUrl || '';
        const isLoading = avatarUrl.includes('/avatars/');

        this.setData({
          userInfo: {
            nickName: data.nickName || '',
            avatarUrl: avatarUrl,
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
            lastAccessTime: data.lastAccessTime || '',
            createdAtText: this.formatDateTime(data.createdAt),
            updatedAtText: this.formatDateTime(data.updatedAt),
            lastAccessTimeText: this.formatDateTime(data.lastAccessTime)
          },
          userId: data.id,
          loading: false,
          avatarLoading: isLoading,
          canPreviewAvatar: this.canPreviewAvatar(avatarUrl)
        });
      } else {
      this.setData({
        userInfo: {},
        loading: false,
        canPreviewAvatar: false
      });
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
      this.setData({ loading: false });
    }
  },

  formatDateTime(value) {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '-';

    const pad = num => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  // 进入编辑模式
  startEdit() {
    const { userInfo } = this.data;
    this.setData({
      isEditing: true,
      editNickName: userInfo.nickName || '',
      editAvatarUrl: userInfo.avatarUrl || ''
    });
  },

  // 取消编辑
  cancelEdit() {
    this.setData({
      isEditing: false,
      editNickName: '',
      editAvatarUrl: '',
      showRandomModal: false
    });
  },

  // 选择头像
  async onChooseAvatar(e) {
    if (this.data.submitting) return;
    const avatarUrl = e.detail.avatarUrl;
    if (!avatarUrl) return;

    wx.showLoading({ title: '安全校验中...', mask: true });

    try {
      const securityFilePath = await prepareImageForSecurityCheck(avatarUrl);
      const checkResult = await checkImageSecurity(securityFilePath, 'avatar');
      wx.hideLoading();

      if (!checkResult.ok) {
        wx.showModal({
          title: checkResult.isRiskContent ? '图片校验未通过' : '图片校验失败',
          content: checkResult.isRiskContent
            ? '你选择的图片可能包含违规信息，请更换后重试。'
            : `微信图片安全接口未通过本次校验：${checkResult.errMsg || checkResult.errCode || '未知原因'}`,
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
    } catch (err) {
      wx.hideLoading();
      console.error('头像安全校验失败', err);
      wx.showModal({
        title: '安全校验失败',
        content: `图片内容安全校验失败：${(err && err.message) || '未知错误'}`,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    // 设置选择状态，显示遮罩层阻止点击
    this.setData({
      editAvatarUrl: avatarUrl,
      choosingAvatar: true
    });

    // 头像加载完成后隐藏遮罩
    // 对于临时文件，给一个短暂延迟后隐藏
    setTimeout(() => {
      this.setData({ choosingAvatar: false });
    }, 500);
  },

  // 从相册选择原图头像
  chooseAvatarFromAlbum() {
    if (this.data.submitting) return;

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['compressed'],
      success: async (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file || !file.tempFilePath) return;

        const extMatch = String(file.tempFilePath).match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        const ext = extMatch ? extMatch[1].toLowerCase() : '';
        const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'];

        const maxSize = 5 * 1024 * 1024;
        if (file.size && file.size > maxSize) {
          wx.showToast({
            title: '头像不能超过5M',
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

        wx.showLoading({ title: '安全校验中...', mask: true });

        try {
          const securityFilePath = await prepareImageForSecurityCheck(file.tempFilePath, file.size);
          const checkResult = await checkImageSecurity(securityFilePath, 'avatar');
          wx.hideLoading();

          if (!checkResult.ok) {
            wx.showModal({
              title: checkResult.isRiskContent ? '图片校验未通过' : '图片校验失败',
              content: checkResult.isRiskContent
                ? '你选择的图片可能包含违规信息，请更换后重试。'
                : `微信图片安全接口未通过本次校验：${checkResult.errMsg || checkResult.errCode || '未知原因'}`,
              showCancel: false,
              confirmText: '知道了'
            });
            return;
          }
        } catch (err) {
          wx.hideLoading();
          console.error('头像安全校验失败', err);
          wx.showModal({
            title: '安全校验失败',
            content: `图片内容安全校验失败：${(err && err.message) || '未知错误'}`,
            showCancel: false,
            confirmText: '知道了'
          });
          return;
        }

        this.setData({
          editAvatarUrl: file.tempFilePath,
          choosingAvatar: true
        });

        setTimeout(() => {
          this.setData({ choosingAvatar: false });
        }, 500);
      }
    });
  },

  // 点击按钮触发昵称选择
  chooseNickname() {
    if (this.data.submitting) return;
    this.setData({ nicknameFocus: true });
  },

  // 昵称输入
  onNicknameInput(e) {
    const raw = e.detail.value || '';
    if (raw.length > 10) {
      wx.showToast({ title: '昵称最多10个字', icon: 'none' });
    }
    this.setData({ editNickName: raw.slice(0, 10) });
  },

  // 昵称失去焦点
  onNicknameBlur(e) {
    const nickName = (e.detail.value || '').trim();
    this.setData({
      editNickName: nickName,
      nicknameFocus: false
    });
  },

  // 显示随机选择弹窗
  showRandomPicker() {
    if (this.data.submitting) return;
    const { presetAvatars, presetNicknames } = this.data;

    const randomAvatar = presetAvatars[Math.floor(Math.random() * presetAvatars.length)];
    const randomNickname = presetNicknames[Math.floor(Math.random() * presetNicknames.length)] +
                           Math.floor(Math.random() * 1000);

    this.setData({
      showRandomModal: true,
      randomNickName: randomNickname,
      randomAvatarUrl: randomAvatar
    });
  },

  // 刷新随机头像
  refreshRandomAvatar() {
    const { presetAvatars } = this.data;
    const randomAvatar = presetAvatars[Math.floor(Math.random() * presetAvatars.length)];
    this.setData({ randomAvatarUrl: randomAvatar });
  },

  // 刷新随机昵称
  refreshRandomNickname() {
    const { presetNicknames } = this.data;
    const randomNickname = presetNicknames[Math.floor(Math.random() * presetNicknames.length)] +
                           Math.floor(Math.random() * 1000);
    this.setData({ randomNickName: randomNickname });
  },

  // 确认使用随机信息
  confirmRandomInfo() {
    const { randomNickName, randomAvatarUrl } = this.data;
    this.setData({
      editNickName: randomNickName,
      editAvatarUrl: randomAvatarUrl,
      showRandomModal: false
    });
  },

  // 取消随机弹窗
  cancelRandomModal() {
    this.setData({ showRandomModal: false });
  },

  // 提交修改
  submitEdit() {
    const { editNickName, editAvatarUrl, userId, userInfo } = this.data;
    const oldAvatarUrl = userInfo ? userInfo.avatarUrl : '';

    if (this.data.submitting) return;

    if (!editAvatarUrl) {
      wx.showToast({ title: '请选择头像', icon: 'none' });
      return;
    }

    if (!editNickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    // 判断头像类型并处理
    // 优先检查临时文件路径（微信头像选择返回的路径）
    if (editAvatarUrl.includes('tmp') || editAvatarUrl.startsWith('wxfile://') || editAvatarUrl.includes('temporary')) {
      // 微信临时文件，需要上传到云存储
      this.uploadAvatar(editAvatarUrl).then(url => {
        // 上传成功后保存到数据库，保存成功后才删除旧文件
        this.saveUserInfoToDb(userId, editNickName, url, oldAvatarUrl);
      }).catch(err => {
        console.error('头像上传失败:', err);
        this.setData({ submitting: false });
        if (!err || err.message !== 'UNSUPPORTED_IMAGE_FORMAT') {
          wx.showToast({ title: '头像上传失败，请重试', icon: 'none' });
        }
      });
    } else if (editAvatarUrl.startsWith('data:image')) {
      // SVG data URL 直接使用
      this.saveUserInfoToDb(userId, editNickName, editAvatarUrl, oldAvatarUrl);
    } else if (editAvatarUrl.startsWith('http://') || editAvatarUrl.startsWith('https://')) {
      // 真正的网络URL，直接使用
      this.saveUserInfoToDb(userId, editNickName, editAvatarUrl, oldAvatarUrl);
    } else {
      // 其他未知格式，尝试上传
      this.uploadAvatar(editAvatarUrl).then(url => {
        this.saveUserInfoToDb(userId, editNickName, url, oldAvatarUrl);
      }).catch(err => {
        console.error('头像上传失败:', err);
        this.setData({ submitting: false });
        if (!err || err.message !== 'UNSUPPORTED_IMAGE_FORMAT') {
          wx.showToast({ title: '头像上传失败，请重试', icon: 'none' });
        }
      });
    }
  },

  // 保存用户信息到 Supabase
  async saveUserInfoToDb(userId, nickName, newAvatarUrl, oldAvatarUrl) {
    try {
      const openid = await app.getOpenid();
      const updatedAt = getChinaTimeISO();

      const { error } = await supabase
        .from('users')
        .update({
          nickName: nickName.trim(),
          avatarUrl: newAvatarUrl,
          updatedAt: updatedAt
        })
        .eq('_openid', openid);

      if (error) {
        console.error('更新用户信息失败:', error);
        this.setData({ submitting: false });
        wx.showToast({ title: '修改失败', icon: 'none' });
        return;
      }

      // 保存成功后，删除旧头像（如果是 Storage 文件且与新头像不同）
      if (oldAvatarUrl && oldAvatarUrl.includes('/avatars/') && oldAvatarUrl !== newAvatarUrl) {
        deleteStorageFile('avatars', oldAvatarUrl).catch(err => {
          console.log('删除旧头像失败（忽略）:', err);
        });
      }

      // 如果新头像是 Storage URL，设置加载状态
      const isLoading = newAvatarUrl.includes('/avatars/');

      app.globalData.userInfo = {
        nickName: nickName.trim(),
        avatarUrl: newAvatarUrl
      };

      const currentUserInfo = this.data.userInfo || {};

      this.setData({
        userInfo: {
          nickName: nickName.trim(),
          avatarUrl: newAvatarUrl,
          createdAt: currentUserInfo.createdAt || '',
          updatedAt: updatedAt,
          lastAccessTime: currentUserInfo.lastAccessTime || '',
          createdAtText: this.formatDateTime(currentUserInfo.createdAt),
          updatedAtText: this.formatDateTime(updatedAt),
          lastAccessTimeText: this.formatDateTime(currentUserInfo.lastAccessTime)
        },
        isEditing: false,
        editNickName: '',
        editAvatarUrl: '',
        submitting: false,
        avatarLoading: isLoading,
        canPreviewAvatar: this.canPreviewAvatar(newAvatarUrl)
      });

      wx.showToast({ title: '修改成功', icon: 'success' });
    } catch (err) {
      console.error('更新用户信息失败:', err);
      this.setData({ submitting: false });
      wx.showToast({ title: '修改失败', icon: 'none' });
    }
  },

  // 头像图片加载完成
  onAvatarLoad() {
    this.setData({ avatarLoading: false });
  },

  // 头像图片加载失败
  onAvatarImageError() {
    this.setData({ avatarLoading: false });
    console.log('头像图片加载失败');
  },

  canPreviewAvatar(avatarUrl) {
    if (!avatarUrl) return false;
    return !avatarUrl.startsWith('data:image');
  },

  previewAvatar() {
    const avatarUrl = this.data.userInfo && this.data.userInfo.avatarUrl;
    if (!this.canPreviewAvatar(avatarUrl)) return;
    wx.previewImage({
      current: avatarUrl,
      urls: [avatarUrl]
    });
  },

  // 阻止滚动和点击
  preventTouchMove() {
    return;
  },
  preventTap() {
    return;
  },

  // 上传头像到 Supabase Storage
  async uploadAvatar(tempFilePath) {
    const timestamp = Date.now();
    const extMatch = String(tempFilePath).match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'];
    if (!allowedTypes.includes(ext)) {
      wx.showModal({
        title: '格式不支持',
        content: '支持的图片格式：jpg、jpeg、png、gif、webp、bmp、svg、heic、heif。文件后缀不区分大小写，例如 JPG 和 jpg 会按同一种格式处理。',
        showCancel: false,
        confirmText: '知道了'
      });
      throw new Error('UNSUPPORTED_IMAGE_FORMAT');
    }

    wx.showLoading({ title: '上传中...', mask: true });

    const fileName = `${timestamp}.${ext}`;

    try {
      const { publicUrl, error } = await uploadFileToStorage('avatars', fileName, tempFilePath);

      wx.hideLoading();

      if (error) {
        console.error('Supabase Storage 上传失败:', error);
        throw error;
      }

      return publicUrl;
    } catch (err) {
      wx.hideLoading();
      console.error('头像上传失败:', err);
      throw err;
    }
  },

  // 头像加载失败时显示默认占位
  onAvatarError() {
    this.setData({ 'userInfo.avatarUrl': '', canPreviewAvatar: false });
  }
});
