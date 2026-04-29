# 微信云开发迁移至 Supabase 计划文档

## 项目背景

由于微信云开发收费，决定将数据迁移至 Supabase，保留微信云开发数据作为备份，不影响用户使用。

最终方案：数据迁移至 Supabase + 继续使用微信 openid 作为用户标识（通过 Supabase Edge Function 获取）

---

## 一、已完成步骤 ✅

### 1. Supabase 项目创建
- [x] 已有 Supabase 项目
- [x] Project URL: `https://scogsobcckvybkwcmvqh.supabase.co`
- [x] Anon Key: `sb_publishable_EqhquS2f1xsGfXGQxhMHPw_u9a1qSe9`

### 2. 数据库表创建
在 Supabase SQL Editor 中执行，创建了三张表：

| 表名 | 用途 | 状态 |
|------|------|------|
| users | 用户基本信息 | ✅ 已创建 |
| categories | 分类数据 | ✅ 已创建 |
| assets | 资产数据 | ✅ 已创建 |

### 3. 权限配置（RLS）
- [x] 启用 Row Level Security
- [x] 配置每张表的权限规则（用户只能访问自己的数据）

### 4. Storage 创建
创建了三个 bucket（都设置为 Public）：

| Bucket 名称 | 用途 | 状态 |
|-------------|------|------|
| avatars | 用户头像 | ✅ 已创建 |
| icons | 资产自定义缩略图 | ✅ 已创建 |
| category-icons | 分类图标 | ✅ 已创建 |

### 5. 环境变量配置
在 Supabase Edge Functions 设置环境变量：

| 变量名 | 值 | 状态 |
|--------|-----|------|
| WECHAT_APPID | `wxb1fb63721cb2da59` | ✅ 已设置 |
| WECHAT_SECRET | 用户 AppSecret | ✅ 已设置 |

### 6. Edge Function 创建
- [x] 函数名：`get-wechat-openid`
- [x] URL: `https://scogsobcckvybkwcmvqh.supabase.co/functions/v1/get-wechat-openid`
- [x] 功能：接收微信 code，调用微信 API，返回 openid

### 7. 微信小程序域名白名单
- [x] 在微信公众平台后台配置
- [x] 已添加 `https://scogsobcckvybkwcmvqh.supabase.co` 到 request 合法域名

---

## 二、未完成步骤 ⏳

### 1. 现有数据迁移
**状态**: 未开始

需要迁移的内容：

| 数据类型 | 来源 | 目标 | 预估数量 |
|----------|------|------|----------|
| assets 表数据 | 微信云数据库 | Supabase assets 表 | 约 30 条 |
| categories 表数据 | 微信云数据库 | Supabase categories 表 | 约 10 条 |
| users 表数据 | 微信云数据库 | Supabase users 表 | 约 10 条 |

**迁移方式**: 
- 从微信云开发后台导出 JSON
- 在 Supabase SQL Editor 中导入

### 2. 云存储文件迁移
**状态**: 未开始

需要迁移的文件：

| 文件夹 | 内容 | 目标 Bucket |
|--------|------|-------------|
| user-avatars | 用户头像 | avatars |
| icons | 资产自定义缩略图 | icons |
| category-icons | 分类图标 | category-icons |

**关键问题**: 文件 URL 会变化，需要更新数据库中对应的字段
- users.avatarUrl
- assets.icon（自定义缩略图）
- categories.icon（分类图标）

### 3. 小程序代码改造
**状态**: 未开始

需要修改的文件：

| 文件 | 改动内容 |
|------|----------|
| app.js | 移除云开发初始化，添加 Supabase 配置，修改获取 openid 方式 |
| pages/index/index.js | 数据操作改为 Supabase API，文件上传改为 Supabase Storage |
| pages/asset-add/asset-add.js | 添加资产改为 Supabase API，缩略图上传改为 Supabase Storage |
| pages/asset-detail/asset-detail.js | 资产详情改为 Supabase API |
| pages/category-manage/category-manage.js | 分类管理改为 Supabase API，图标上传改为 Supabase Storage |
| pages/user-stats/user-stats.js | 用户统计改为 Supabase API |
| project.config.json | 移除 cloudfunctionRoot 配置 |

需要新增的模块：

| 新增内容 | 功能 |
|----------|------|
| utils/supabase.js | Supabase API 封装（数据库操作、文件上传） |
| utils/auth.js | 用户认证封装（获取 openid） |

### 4. 删除微信云开发代码
**状态**: 未开始（数据迁移完成后再执行）

- 删除 cloudfunctions 目录
- 删除云开发相关配置

---

## 三、接下来要做的事情

### 立即执行：现有数据迁移

**步骤**:
1. 登录微信云开发后台
2. 进入数据库管理
3. 分别导出 assets、categories、users 三张表为 JSON 文件
4. 查看 JSON 文件格式
5. 编写导入 SQL，在 Supabase SQL Editor 中执行导入
6. 验证数据是否正确导入

### 然后执行：云存储文件迁移

**步骤**:
1. 从微信云开发后台下载所有文件
2. 上传到 Supabase Storage 对应 bucket
3. 记录新的 URL
4. 更新数据库中对应的 URL 字段

### 最后执行：小程序代码改造

**步骤**:
1. 创建 utils/supabase.js 封装 Supabase API
2. 创建 utils/auth.js 封装用户认证
3. 修改 app.js 初始化逻辑
4. 逐个修改页面文件的数据操作
5. 测试所有功能是否正常
6. 确认无误后，删除微信云开发代码

---

## 四、关键配置信息汇总

### Supabase 配置

| 配置项 | 值 |
|--------|-----|
| Project URL | `https://scogsobcckvybkwcmvqh.supabase.co` |
| Anon Key | `sb_publishable_EqhquS2f1xsGfXGQxhMHPw_u9a1qSe9` |
| Edge Function URL | `https://scogsobcckvybkwcmvqh.supabase.co/functions/v1/get-wechat-openid` |

### 微信小程序配置

| 配置项 | 值 |
|--------|-----|
| AppID | `wxb1fb63721cb2da59` |
| 管理员 openid | `ofW_r4lPk806IqPSk4-gR9r_478g` |

### Storage Buckets

| Bucket | 公开访问 | 用途 |
|--------|----------|------|
| avatars | ✅ | 用户头像 |
| icons | ✅ | 资产自定义缩略图 |
| category-icons | ✅ | 分类图标 |

---

## 五、注意事项

1. **保留微信云开发数据**: 作为备份，不要删除
2. **用户标识一致性**: 继续使用微信 openid，确保老用户数据兼容
3. **文件 URL 更新**: 迁移文件后必须更新数据库中的 URL 字段
4. **权限测试**: 改造完成后测试用户权限是否正常（只能看到自己的数据）
5. **管理员功能**: 确保 user-stats 页面能正常查询所有用户信息（需要特殊权限配置）