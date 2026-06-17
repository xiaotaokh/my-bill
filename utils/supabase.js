// utils/supabase.js - Supabase REST API 封装（小程序版）
// 使用 wx.request 直接调用 Supabase REST API

const SUPABASE_URL = 'https://scogsobcckvybkwcmvqh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EqhquS2f1xsGfXGQxhMHPw_u9a1qSe9';

// 基础请求函数
function baseRequest(method, endpoint, data, prefer) {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: method,
      data: data,
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': prefer || 'return=representation'
      },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ data: res.data, error: null });
        } else {
          resolve({
            data: null,
            error: {
              message: res.data ? (res.data.message || res.data.error || '请求失败') : '请求失败',
              code: res.statusCode
            }
          });
        }
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
}

// Edge Function 调用
function invokeFunction(functionName, data) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: 'POST',
      data: JSON.stringify(data || {}),
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ data: res.data, error: null });
        } else {
          resolve({ data: null, error: { message: (res.data && res.data.error) || (res.data && res.data.message) || JSON.stringify(res.data), statusCode: res.statusCode } });
        }
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
}

// 上传文件到 Edge Function
function uploadFileToFunction(functionName, filePath, formData) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: url,
      filePath: filePath,
      name: 'file',
      formData: formData || {},
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      },
      success: function(res) {
        let body = null;
        try {
          body = JSON.parse(res.data);
        } catch (e) {
          body = null;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ data: body, error: null });
        } else {
          resolve({
            data: body,
            error: {
              message: body ? (body.error || body.errMsg || body.errmsg || body.message || res.data || '请求失败') : (res.data || '请求失败'),
              code: res.statusCode
            }
          });
        }
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
}

// 模拟 Supabase 客户端
var supabase = {
  from: function(table) {
    // 创建查询构建器
    var builder = {
      table: table,
      columns: '*',
      filters: [],
      orders: [],
      limitValue: null,

      // SELECT
      select: function(columns) {
        this.columns = columns || '*';
        return this;
      },

      // WHERE 条件
      eq: function(column, value) {
        this.filters.push(column + '=eq.' + encodeURIComponent(value));
        return this;
      },

      in: function(column, values) {
        var encoded = values.map(function(v) { return encodeURIComponent(v); }).join(',');
        this.filters.push(column + '=in.(' + encoded + ')');
        return this;
      },

      ilike: function(column, value) {
        this.filters.push(column + '=ilike.' + encodeURIComponent(value));
        return this;
      },

      // ORDER BY
      order: function(column, options) {
        var dir = (options && options.ascending) ? 'asc' : 'desc';
        this.orders.push('order=' + column + '.' + dir);
        return this;
      },

      // LIMIT
      limit: function(n) {
        this.limitValue = n;
        return this;
      },

      // 获取单条记录
      single: function() {
        this.limitValue = 1;
        var self = this;

        return new Promise(function(resolve) {
          var queryParts = self.filters.concat(self.orders);
          if (self.limitValue) queryParts.push('limit=' + self.limitValue);

          var queryString = queryParts.join('&');
          var endpoint = '/' + self.table + '?select=' + self.columns + (queryString ? '&' + queryString : '');

          baseRequest('GET', endpoint, null, null).then(function(result) {
            if (result.data && result.data.length > 0) {
              resolve({ data: result.data[0], error: null });
            } else {
              resolve({ data: null, error: { code: 'PGRST116', message: '未找到记录' } });
            }
          }).catch(function(err) {
            resolve({ data: null, error: err });
          });
        });
      },

      // 执行查询 (thenable)
      then: function(resolve) {
        var self = this;

        var queryParts = self.filters.concat(self.orders);
        if (self.limitValue) queryParts.push('limit=' + self.limitValue);

        var queryString = queryParts.join('&');
        var endpoint = '/' + self.table + '?select=' + self.columns + (queryString ? '&' + queryString : '');

        baseRequest('GET', endpoint, null, null).then(function(result) {
          resolve(result);
        }).catch(function(err) {
          resolve({ data: null, error: err });
        });
      },

      // INSERT
      insert: function(data) {
        var endpoint = '/' + this.table;
        return baseRequest('POST', endpoint, data, 'return=minimal');
      },

      // UPSERT（如果存在则更新，否则插入）
      upsert: function(data, options) {
        var endpoint = '/' + this.table;
        if (options && options.onConflict) {
          endpoint += '?onConflict=' + options.onConflict;
        }
        return baseRequest('POST', endpoint, data, 'resolution=merge-duplicates');
      },

      // UPDATE (需要先调用 eq 设置条件)
      update: function(data) {
        var self = this;
        return {
          eq: function(column, value) {
            self.filters.push(column + '=eq.' + encodeURIComponent(value));
            return this;
          },
          then: function(resolve) {
            var queryString = self.filters.join('&');
            var endpoint = '/' + self.table + '?' + queryString;
            baseRequest('PATCH', endpoint, data, 'return=minimal').then(function(result) {
              resolve(result);
            });
          }
        };
      },

      // DELETE
      delete: function() {
        var self = this;
        return {
          eq: function(column, value) {
            self.filters.push(column + '=eq.' + encodeURIComponent(value));
            return this;
          },
          in: function(column, values) {
            var encoded = values.map(function(v) { return encodeURIComponent(v); }).join(',');
            self.filters.push(column + '=in.(' + encoded + ')');
            return this;
          },
          then: function(resolve) {
            var queryString = self.filters.join('&');
            var endpoint = '/' + self.table + '?' + queryString;
            baseRequest('DELETE', endpoint, null, 'return=minimal').then(function(result) {
              resolve(result);
            });
          }
        };
      }
    };

    return builder;
  },

  storage: {
    from: function(bucket) {
      return {
        upload: function(fileName, fileData, options) {
          // 小程序文件上传需要特殊处理
          return Promise.resolve({ data: { path: bucket + '/' + fileName }, error: null });
        },
        getPublicUrl: function(fileName) {
          return {
            data: {
              publicUrl: SUPABASE_URL + '/storage/v1/object/public/' + bucket + '/' + fileName
            }
          };
        }
      };
    }
  },

  functions: {
    invoke: function(functionName, data) {
      return invokeFunction(functionName, data);
    }
  }
};

// 获取 openid
function getOpenid() {
  var app = getApp();
  return app.getOpenid();
}

// 获取公开 URL
function getPublicUrl(bucket, fileName) {
  return SUPABASE_URL + '/storage/v1/object/public/' + bucket + '/' + fileName;
}

// 上传文件到 Supabase Storage（使用 wx.uploadFile）
function uploadFileToStorage(bucket, fileName, filePath) {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: url,
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'apikey': SUPABASE_ANON_KEY,
        'x-upsert': 'true'
      },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ publicUrl: publicUrl, error: null });
        } else {
          var errMsg = '上传失败';
          try {
            var body = JSON.parse(res.data);
            if (body.message) errMsg = body.message;
            else if (body.error) errMsg = body.error;
          } catch(e) {}
          resolve({ publicUrl: null, error: { message: errMsg, code: res.statusCode } });
        }
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
}

// 从 Supabase Storage 删除文件
function deleteStorageFile(bucket, fileUrl) {
  // 从公开 URL 中提取文件名
  var prefix = SUPABASE_URL + '/storage/v1/object/public/' + bucket + '/';
  if (fileUrl.indexOf(prefix) !== 0) {
    console.log('deleteStorageFile: URL不匹配存储文件，跳过', { bucket, fileUrl, prefix });
    return Promise.resolve({ error: null }); // 不是存储文件，跳过
  }
  var fileName = fileUrl.substring(prefix.length);

  return new Promise(function(resolve, reject) {
    wx.request({
      url: SUPABASE_URL + '/storage/v1/object/' + bucket,
      method: 'DELETE',
      data: JSON.stringify({ prefixes: [fileName] }),
      header: {
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ error: null });
        } else {
          resolve({ error: { message: '删除文件失败', code: res.statusCode } });
        }
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
}

// 获取中国时区 (UTC+8) 的时间字符串，用于存入 timestamp without time zone 字段
function getChinaTimeISO() {
  var now = new Date();
  // 转换为 UTC+8
  var chinaTime = new Date(now.getTime() + 8 * 3600 * 1000);
  return chinaTime.toISOString().replace('Z', '');
}

module.exports = {
  supabase: supabase,
  getOpenid: getOpenid,
  getPublicUrl: getPublicUrl,
  uploadFileToStorage: uploadFileToStorage,
  uploadFileToFunction: uploadFileToFunction,
  deleteStorageFile: deleteStorageFile,
  getChinaTimeISO: getChinaTimeISO
};
