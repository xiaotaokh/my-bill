# 页面代码修改指南

本文档提供将微信云开发 API 替换为 Supabase API 的修改模板。

## 引入 Supabase 工具

在每个页面 JS 文件顶部添加：

```javascript
const { supabase, assets, categories, users, storage } = require('../../utils/supabase');
```

---

## 常用 API 替换对照表

### 1. 获取用户 openid

**原代码：**
```javascript
app.getOpenid().then(openid => {
  // 使用 openid
});
```

**保持不变**（过渡方案继续使用微信云函数获取 openid）

---

### 2. 查询资产列表

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'getAssets',
  success: (res) => {
    const assets = res.result.data;
  }
});
```

**新代码：**
```javascript
const openid = await app.getOpenid();
const { data, error } = await supabase
  .from('assets')
  .select('*')
  .eq('_openid', openid)
  .order('createdat', { ascending: false });
  
if (error) {
  console.error('查询失败:', error);
  return;
}
// data 即为资产列表
```

---

### 3. 添加资产

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'addAsset',
  data: {
    name: 'iPhone',
    price: 999,
    category: '数码',
    // ...
  },
  success: (res) => {
    // 成功
  }
});
```

**新代码：**
```javascript
const openid = await app.getOpenid();
const { error } = await supabase
  .from('assets')
  .insert({
    _openid: openid,
    name: 'iPhone',
    price: 999,
    category: '数码',
    // ...
  });
  
if (error) {
  wx.showToast({ title: '添加失败', icon: 'error' });
  return;
}
wx.showToast({ title: '添加成功', icon: 'success' });
```

---

### 4. 更新资产

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'updateAsset',
  data: {
    name: 'iPhone',
    updateData: { price: 888 }
  }
});
```

**新代码：**
```javascript
const openid = await app.getOpenid();
const { error } = await supabase
  .from('assets')
  .update({ price: 888 })
  .eq('_openid', openid)
  .eq('name', 'iPhone');
  
if (error) {
  wx.showToast({ title: '更新失败', icon: 'error' });
}
```

---

### 5. 删除资产

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'deleteAsset',
  data: { name: 'iPhone' }
});
```

**新代码：**
```javascript
const openid = await app.getOpenid();
const { error } = await supabase
  .from('assets')
  .delete()
  .eq('_openid', openid)
  .eq('name', 'iPhone');
```

---

### 6. 批量删除资产

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'batchDeleteAssets',
  data: { names: ['iPhone', 'iPad'] }
});
```

**新代码：**
```javascript
const openid = await app.getOpenid();
const { error } = await supabase
  .from('assets')
  .delete()
  .eq('_openid', openid)
  .in('name', ['iPhone', 'iPad']);
```

---

### 7. 获取分类列表

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'getCategories',
  success: (res) => {
    const categories = res.result.data;
  }
});
```

**新代码：**
```javascript
const openid = await app.getOpenid();
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('_openid', openid)
  .order('sortorder', { ascending: true });
```

---

### 8. 添加分类

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'addCategory',
  data: {
    name: '数码',
    icon: '📱'
  }
});
```

**新代码：**
```javascript
const openid = await app.getOpenid();
const { error } = await supabase
  .from('categories')
  .insert({
    _openid: openid,
    name: '数码',
    icon: '📱',
    sortorder: 0,
    createdat: new Date().toISOString()
  });
```

---

### 9. 更新分类

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'updateCategory',
  data: {
    name: '数码',
    updateData: { icon: '💻' }
  }
});
```

**新代码：**
```javascript
const openid = await app.getOpenid();
const { error } = await supabase
  .from('categories')
  .update({ icon: '💻' })
  .eq('_openid', openid)
  .eq('name', '数码');
```

---

### 10. 删除分类

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'deleteCategory',
  data: { name: '数码' }
});
```

**新代码：**
```javascript
const openid = await app.getOpenid();
const { error } = await supabase
  .from('categories')
  .delete()
  .eq('_openid', openid)
  .eq('name', '数码');
```

---

### 11. 查询用户信息

**原代码：**
```javascript
wx.cloud.database().collection('users').where({ _openid: openid }).get();
```

**新代码：**
```javascript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('_openid', openid)
  .single();
```

---

### 12. 更新用户信息

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'saveUserInfo',
  data: {
    nickName: '用户名',
    avatarUrl: 'https://...'
  }
});
```

**新代码：**
```javascript
const openid = await app.getOpenid();
const { error } = await supabase
  .from('users')
  .upsert({
    _openid: openid,
    nickname: '用户名',
    avatarurl: 'https://...',
    updatedat: new Date().toISOString()
  });
```

---

### 13. 上传文件

**原代码：**
```javascript
wx.cloud.uploadFile({
  cloudPath: 'icons/filename.png',
  filePath: tempFilePath,
  success: (res) => {
    const fileID = res.fileID;
  }
});
```

**新代码：**
```javascript
const { data, error } = await supabase
  .storage
  .from('icons')
  .upload('filename.png', fileData);
  
if (!error) {
  const publicUrl = supabase.storage.from('icons').getPublicUrl('filename.png').data.publicUrl;
}
```

---

### 14. 管理员统计（调用 Edge Function）

**原代码：**
```javascript
wx.cloud.callFunction({
  name: 'getUserStats',
  success: (res) => {
    const stats = res.result;
  }
});
```

**新代码：**
```javascript
const { data, error } = await supabase.functions.invoke('get-user-stats');
if (error) {
  console.error('获取统计失败:', error);
  return;
}
// data 包含所有用户的统计信息
```

---

## 字段名称对照表

微信云数据库使用驼峰命名，Supabase 表保持相同命名：

| 字段 | Supabase 列名 |
|------|---------------|
| _openid | _openid |
| name | name |
| price | price |
| purchaseDate | purchasedate |
| icon | icon |
| iconName | iconname |
| groupName | groupname |
| createdAt | createdat |
| updatedAt | updatedat |
| assetType | assettype |
| periodAmount | periodamount |
| periodType | periodtype |
| periodDays | perioddays |
| subscriptionStartDate | subscriptionstartdate |
| subscriptionEndDate | subscriptionenddate |
| subscriptionStatus | subscriptionstatus |
| amountHistory | amount_history |

---

## 注意事项

1. **异步处理**：Supabase API 使用 Promise，建议使用 async/await
2. **错误处理**：每个操作都需要检查 error 对象
3. **openid 获取**：当前过渡方案继续使用微信云函数 getUserOpenid
4. **RLS 策略**：Supabase 表已配置 RLS，确保每个查询都带 `_openid` 条件