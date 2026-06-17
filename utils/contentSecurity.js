const { uploadFileToFunction } = require('./supabase');

function isRiskContentCode(code) {
  const value = String(code);
  return value === '87014' || value === '55001' || value === '55002' || value === '55003';
}

function compressImage(filePath) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality: 70,
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

  try {
    return await compressImage(filePath);
  } catch (err) {
    return filePath;
  }
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

module.exports = {
  checkImageSecurity,
  prepareImageForSecurityCheck
};
