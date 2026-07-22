const { uploadFileToFunction } = require('./supabase');

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

module.exports = {
  checkImageSecurity,
  prepareImageForSecurityCheck
};
