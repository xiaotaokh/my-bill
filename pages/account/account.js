// pages/account/account.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    loading: true,
    userId: '',

    // 编辑模式
    isEditing: false,
    editNickName: '',
    editAvatarUrl: '',

    // 随机信息弹窗
    showRandomModal: false,
    randomNickName: '',
    randomAvatarUrl: '',

    // 预设头像 SVG（20个不同风格和语义的头像）
    presetAvatars: [
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
      // 书虫
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2327AE60"/><rect x="25" y="55" width="50" height="25" rx="3" fill="%23fff"/><line x1="50" y1="55" x2="50" y2="80" stroke="%232C3E50" stroke-width="2"/><path d="M25 55 Q35 50 50 55" stroke="%2327AE60" stroke-width="2" fill="none"/><path d="M50 55 Q65 50 75 55" stroke="%2327AE60" stroke-width="2" fill="none"/><circle cx="35" cy="40" r="5" fill="%23fff"/><circle cx="65" cy="40" r="5" fill="%23fff"/><circle cx="37" cy="38" r="2" fill="%232C3E50"/><circle cx="67" cy="38" r="2" fill="%232C3E50"/></svg>'
    ],

    // 预设昵称
    presetNicknames: [
      '小确幸', '暖阳儿', '棉花糖', '奶油泡芙', '甜甜圈', '小太阳', '暖心窝', '小暖炉', '棉花云', '暖宝宝',
      '追星星', '月亮船', '星河漫步', '流星雨', '夜空中', '银河系', '小星星', '月光下', '星空梦', '摘月亮',
      '小清新', '薄荷糖', '青草香', '小绿叶', '晨露珠', '清风徐', '白云朵', '小雨滴', '春暖花开', '微风起',
      '小奶猫', '小仓鼠', '小熊猫', '小企鹅', '小海豚', '小兔子', '小松鼠', '小考拉', '小刺猬', '小绵羊',
      '小音符', '钢琴键', '吉他手', '小画笔', '调色板', '小诗人', '故事书', '小作家', '阅读者', '文艺范',
      '开心果', '乐天派', '笑脸儿', '笑嘻嘻', '乐呵呵', '小快乐', '阳光派', '正能量', '活力满满', '元气满满',
      '小旅人', '背包客', '冒险家', '探索者', '山海间', '云游者', '小行者', '徒步者', '远方来', '在路上',
      '小雏菊', '玫瑰花', '向日葵', '薰衣草', '樱花雨', '蒲公英', '茉莉花', '满天星', '小百合', '郁金香',
      '慢生活', '小闲适', '简简单', '悠哉游', '小惬意', '自由派', '随性走', '小自在', '逍遥游', '小洒脱',
      '追梦人', '梦想家', '筑梦者', '小未来', '向前冲', '努力家', '小坚持', '奋斗派', '小目标', '向远方'
    ],

    nicknameFocus: false,
    submitting: false
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
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

  // 查询数据库
  queryUserInfo() {
    wx.cloud.database().collection('users').where({
      _openid: app.globalData.openid
    }).limit(1).get({
      success: (res) => {
        if (res.data && res.data.length > 0) {
          const userData = res.data[0];
          this.setData({
            userInfo: {
              nickName: userData.nickName || '',
              avatarUrl: userData.avatarUrl || ''
            },
            userId: userData._id,
            loading: false
          });
        } else {
          this.setData({
            userInfo: {},
            loading: false
          });
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        this.setData({ loading: false });
      }
    });
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
  onChooseAvatar(e) {
    if (this.data.submitting) return;
    const avatarUrl = e.detail.avatarUrl;
    this.setData({ editAvatarUrl: avatarUrl });
  },

  // 点击按钮触发昵称选择
  chooseNickname() {
    if (this.data.submitting) return;
    this.setData({ nicknameFocus: true });
  },

  // 昵称输入
  onNicknameInput(e) {
    const nickName = (e.detail.value || '').trim();
    this.setData({ editNickName: nickName });
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
    const { editNickName, editAvatarUrl, userId } = this.data;

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
        this.saveUserInfoToDb(userId, editNickName, url);
      }).catch(err => {
        console.error('头像上传失败:', err);
        this.setData({ submitting: false });
        wx.showToast({ title: '头像上传失败，请重试', icon: 'none' });
      });
    } else if (editAvatarUrl.startsWith('data:image')) {
      // SVG data URL 直接使用
      this.saveUserInfoToDb(userId, editNickName, editAvatarUrl);
    } else if (editAvatarUrl.startsWith('cloud://')) {
      // 云存储链接直接使用
      this.saveUserInfoToDb(userId, editNickName, editAvatarUrl);
    } else if (editAvatarUrl.startsWith('http://') || editAvatarUrl.startsWith('https://')) {
      // 真正的网络URL（通常是云存储转换后的临时访问链接）
      // 需要判断是否包含tmp，如果是临时链接则需要上传
      if (editAvatarUrl.includes('tmp') || editAvatarUrl.includes('temporary')) {
        this.uploadAvatar(editAvatarUrl).then(url => {
          this.saveUserInfoToDb(userId, editNickName, url);
        }).catch(err => {
          console.error('头像上传失败:', err);
          this.setData({ submitting: false });
          wx.showToast({ title: '头像上传失败，请重试', icon: 'none' });
        });
      } else {
        // 真正的永久HTTP链接，直接使用
        this.saveUserInfoToDb(userId, editNickName, editAvatarUrl);
      }
    } else {
      // 其他未知格式，尝试上传
      this.uploadAvatar(editAvatarUrl).then(url => {
        this.saveUserInfoToDb(userId, editNickName, url);
      }).catch(err => {
        console.error('头像上传失败:', err);
        this.setData({ submitting: false });
        wx.showToast({ title: '头像上传失败，请重试', icon: 'none' });
      });
    }
  },

  // 保存用户信息到数据库
  saveUserInfoToDb(userId, nickName, avatarUrl) {
    wx.cloud.database().collection('users').doc(userId).update({
      data: {
        nickName: nickName.trim(),
        avatarUrl: avatarUrl
      },
      success: () => {
        app.globalData.userInfo = {
          nickName: nickName.trim(),
          avatarUrl: avatarUrl
        };

        this.setData({
          userInfo: {
            nickName: nickName.trim(),
            avatarUrl: avatarUrl
          },
          isEditing: false,
          editNickName: '',
          editAvatarUrl: '',
          submitting: false
        });

        wx.showToast({ title: '修改成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('更新用户信息失败:', err);
        this.setData({ submitting: false });
        wx.showToast({ title: '修改失败', icon: 'none' });
      }
    });
  },

  // 上传头像到云存储
  uploadAvatar(tempFilePath) {
    return new Promise((resolve, reject) => {
      // 如果是 http://tmp/ 格式的特殊临时路径，需要先保存到本地
      if (tempFilePath.startsWith('http://tmp/') || tempFilePath.startsWith('https://tmp/')) {
        // 先将临时文件保存到本地可访问路径
        const localPath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.jpg`;

        wx.saveFile({
          tempFilePath: tempFilePath,
          success: (saveRes) => {
            // 从保存的路径上传到云存储
            const timestamp = Date.now();
            const cloudPath = `user-avatars/${timestamp}.jpg`;

            wx.cloud.uploadFile({
              cloudPath: cloudPath,
              filePath: saveRes.savedFilePath,
              success: (uploadRes) => {
                resolve(uploadRes.fileID);
              },
              fail: (err) => {
                console.error('云存储上传失败:', err);
                reject(err);
              }
            });
          },
          fail: (err) => {
            console.error('保存临时文件失败:', err);
            // 尝试直接上传
            this.directUploadAvatar(tempFilePath).then(resolve).catch(reject);
          }
        });
      } else {
        // 直接上传
        this.directUploadAvatar(tempFilePath).then(resolve).catch(reject);
      }
    });
  },

  // 直接上传头像
  directUploadAvatar(filePath) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const cloudPath = `user-avatars/${timestamp}.jpg`;

      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
        success: (res) => {
          resolve(res.fileID);
        },
        fail: (err) => {
          console.error('直接上传失败:', err);
          reject(err);
        }
      });
    });
  },

  });