const { uploadFileToFunction } = require('./supabase');

// 图片审核相关的统一文案，供各页面复用（改文案只需改这里）
const SECURITY_MESSAGES = {
  checking: '图片审核中...',
  riskTitle: '图片未通过审核',
  riskContent: '这张图片可能含有违规内容，请换一张再试。',
  failedTitle: '图片审核失败',
  failedContent: '没能完成图片审核，请检查网络后重试，或换一张图片。'
};

function isRiskContentCode(code) {
  const value = String(code);
  return value === '87014' || value === '55001' || value === '55002' || value === '55003';
}

function compressImage(filePath, quality) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality: quality,
      success(res) {
        resolve(res.tempFilePath || filePath);
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

function getFileSize(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileInfo({
      filePath,
      success(res) {
        resolve(res.size || 0);
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

async function prepareImageForSecurityCheck(filePath, size) {
  const maxDirectCheckSize = 1024 * 1024;
  const targetSize = 900 * 1024;
  const qualities = [70, 50, 30];
  let actualSize = size;

  if (!actualSize) {
    try {
      actualSize = await getFileSize(filePath);
    } catch (err) {
      actualSize = 0;
    }
  }

  if (!actualSize || actualSize <= maxDirectCheckSize) {
    return filePath;
  }

  let currentPath = filePath;
  let currentSize = actualSize;

  for (let i = 0; i < qualities.length; i++) {
    try {
      currentPath = await compressImage(currentPath, qualities[i]);
      currentSize = await getFileSize(currentPath);
      if (currentSize && currentSize <= targetSize) {
        return currentPath;
      }
    } catch (err) {
      break;
    }
  }

  return currentPath;
}

async function checkImageSecurity(filePath, scene) {
  if (!filePath) {
    throw new Error('缺少待校验图片');
  }

  const result = await uploadFileToFunction('img-sec-check', filePath, {
    scene: scene || 'image'
  });

  if (result.error) {
    throw new Error(result.error.message || '内容安全校验失败');
  }

  const data = result.data || {};
  const errCode = typeof data.errCode !== 'undefined'
    ? data.errCode
    : (typeof data.errcode !== 'undefined' ? data.errcode : 0);
  const errMsg = data.errMsg || data.errmsg || data.message || '';
  const ok = data.ok === true || errCode === 0 || errCode === '0';

  return {
    ok,
    errCode,
    errMsg,
    isRiskContent: isRiskContentCode(errCode),
    raw: data
  };
}

// 审核未通过时的统一弹窗（内容违规 / 接口异常分开处理）
function showSecurityCheckResultModal(checkResult) {
  if (checkResult && checkResult.isRiskContent) {
    wx.showModal({
      title: SECURITY_MESSAGES.riskTitle,
      content: SECURITY_MESSAGES.riskContent,
      showCancel: false,
      confirmText: '知道了'
    });
    return;
  }

  // 非内容违规（接口异常等）：技术原因只写日志，不展示给用户
  console.error('[图片审核] 接口未通过', {
    errCode: checkResult && checkResult.errCode,
    errMsg: checkResult && checkResult.errMsg,
    raw: checkResult && checkResult.raw
  });
  wx.showModal({
    title: SECURITY_MESSAGES.failedTitle,
    content: SECURITY_MESSAGES.failedContent,
    showCancel: false,
    confirmText: '知道了'
  });
}

// 审核过程异常（网络超时等）时的统一弹窗
function showSecurityCheckErrorModal(err, tag) {
  console.error('[图片审核] ' + (tag || '图片') + '检查异常', err);
  wx.showModal({
    title: SECURITY_MESSAGES.failedTitle,
    content: SECURITY_MESSAGES.failedContent,
    showCancel: false,
    confirmText: '知道了'
  });
}

module.exports = {
  SECURITY_MESSAGES,
  checkImageSecurity,
  prepareImageForSecurityCheck,
  showSecurityCheckResultModal,
  showSecurityCheckErrorModal
};
