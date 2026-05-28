# 微信云开发迁移至 Supabase 完整计划文档

> **重要提示**：本文档是一个严格的分阶段迁移计划。每个阶段必须完成后才能进入下一阶段。请严格按照步骤顺序执行，每一步都要完成验证确认。

---

## 📋 迁移进度总览

| 阶段 | 名称 | 状态 | 关键检查点 |
|------|------|------|------------|
| 零 | 准备工作 | ⏳ 未开始 | 表结构确认、权限方案设计 |
| 一 | 数据库结构完善 | ⏳ 未开始 | 字段补充、触发器创建 |
| 二 | 数据导出 | ⏳ 未开始 | 数据完整性检查 |
| 三 | 数据导入 | ⏳ 未开始 | 数据总数验证 |
| 四 | 文件迁移 | ⏳ 未开始 | URL映射表创建 |
| 五 | 代码改造 | ⏳ 未开始 | 功能逐个验证 |
| 六 | 功能测试 | ⏳ 未开始 | 全流程测试通过 |
| 七 | 清理与发布 | ⏳ 未开始 | 新版本发布 |

---

## 🔴 阶段零：准备工作（必须在迁移前完成）

> ⚠️ **警告**：此阶段是整个迁移的基础。如果此阶段未完成，后续迁移可能出现数据丢失或功能失效。请务必逐项确认。

### Step 0.1：确认 Supabase 表字段是否完整

#### 操作前检查
- [ ] 已登录 Supabase Dashboard
- [ ] 已进入项目的 Table Editor

#### 操作步骤

**1. 打开 assets 表，检查以下字段是否存在：**

| 字段名 | 类型 | 是否必需 | 说明 |
|--------|------|----------|------|
| `id` | bigint | 必需 | 主键（自增） |
| `openid` | text | 必需 | 用户标识（对应微信 `_openid`） |
| `name` | text | 必需 | 资产名称 |
| `category` | text | 必需 | 分类名称 |
| `price` | numeric | 必需 | 价格 |
| `purchase_date` | date | 必需 | 购买日期 |
| `icon` | text | 可选 | 图标 |
| `icon_name` | text | 可选 | 图标名称 |
| `group_name` | text | 可选 | 图标分组 |
| `remark` | text | 可选 | 备注 |
| `status` | text | 必需 | 状态：active/retired/sold |
| `retired_date` | date | 可选 | 退役日期 |
| `sold_date` | date | 可选 | 卖出日期 |
| `exclude_total` | boolean | 可选 | 不计入总资产 |
| `exclude_daily` | boolean | 可选 | 不计入日均 |
| **`asset_type`** | text | **必需** | 资产类型：fixed/subscription |
| **`period_amount`** | numeric | **订阅必需** | 每期金额 |
| **`period_type`** | text | **订阅必需** | 周期类型 |
| **`period_days`** | integer | **订阅必需** | 周期天数 |
| **`subscription_start_date`** | date | **订阅必需** | 订阅开始日期 |
| **`subscription_end_date`** | date | **订阅必需** | 订阅结束日期 |
| **`subscription_status`** | text | **订阅必需** | 订阅状态 |
| **`pending_subscription`** | boolean | 可选 | 待订阅开关 |
| **`amount_history`** | jsonb | **必需** | 金额变更历史（数组） |
| `created_at` | timestamp | 必需 | 创建时间 |
| `updated_at` | timestamp | 必需 | 更新时间 |

**⚠️ 重点检查：订阅资产相关字段（asset_type 至 amount_history），共10个字段。如果缺失，订阅资产功能迁移后会完全失效！**

**2. 打开 categories 表，检查以下字段是否存在：**

| 字段名 | 类型 | 是否必需 | 说明 |
|--------|------|----------|------|
| `id` | bigint | 必需 | 主键 |
| `openid` | text | 必需 | 用户标识 |
| `name` | text | 必需 | 分类名称 |
| `icon` | text | 可选 | 分类图标 |
| `description` | text | 可选 | 分类描述 |
| `sort_order` | integer | 可选 | 排序顺序 |
| `created_at` | timestamp | 必需 | 创建时间 |
| `updated_at` | timestamp | 必需 | 更新时间 |

**3. 打开 users 表，检查以下字段是否存在：**

| 字段名 | 类型 | 是否必需 | 说明 |
|--------|------|----------|------|
| `id` | bigint | 必需 | 主键 |
| `openid` | text | 必需 | 用户标识 |
| `nick_name` | text | 可选 | 用户昵称 |
| `avatar_url` | text | 可选 | 用户头像URL |
| `first_access_time` | timestamp | 可选 | 首次访问时间 |
| `last_access_time` | timestamp | 可选 | 最近访问时间 |
| `created_at` | timestamp | 必需 | 创建时间 |
| `updated_at` | timestamp | 必需 | 更新时间 |

#### 验证步骤
- [ ] 所有 assets 表字段都存在（特别是订阅资产字段）
- [ ] 所有 categories 表字段都存在
- [ ] 所有 users 表字段都存在
- [ ] 记录缺失字段清单（如有）

#### 失败处理
如果发现字段缺失：
1. 不要继续后续步骤
2. 在 Supabase SQL Editor 中添加缺失字段
3. 重新执行验证步骤

---

### Step 0.2：设计管理员权限方案（重要！）

#### 操作前检查
- [ ] 已了解 Supabase RLS（Row Level Security）机制
- [ ] 已确认管理员 openid：`ofW_r4lPk806IqPSk4-gR9r_478g`

#### 功能需求
管理员需要能够：
1. 查看所有用户的资产列表
2. 查看所有用户的分类数据
3. 查看所有用户的基本信息
4. 在 user-stats 页面显示各用户的统计数据（资产数、总价值、日均成本等）

#### ⚠️ 重要说明：RLS 策略的工作原理

**问题分析**：Supabase 的 RLS 策略是"OR"关系，不是"AND"关系！

```sql
-- 假设已有策略：用户只能看自己的数据
CREATE POLICY "用户查看自己数据" ON assets
  FOR SELECT USING (openid = current_user_openid);

-- 如果添加管理员策略：
CREATE POLICY "管理员查看所有数据" ON assets
  FOR SELECT USING (openid = 'ofW_r4lPk806IqPSk4-gR9r_478g');

-- 实际效果：两个策略是 OR 关系
-- 结果：管理员只能看到管理员自己的数据，不能看到所有用户数据！
-- 因为第一个策略对管理员不生效（openid 不匹配），第二个策略虽然生效但限制了 openid
```

#### 方案选择

**🔴 方案 A：修改管理员策略为"查看所有"（推荐）**

```sql
-- 正确的管理员策略：使用 openid 匹配 OR 条件
CREATE POLICY "管理员可查看所有assets" ON assets
  FOR SELECT
  USING (
    -- 管理员可以看到所有数据（不限制 openid）
    auth.jwt() ->> 'sub' = 'ofW_r4lPk806IqPSk4-gR9r_478g'
    OR 
    -- 或者：使用特殊标记（需要在 Edge Function 中设置）
    true  -- 管理员时不做任何限制
  );

-- 但这种方式有安全风险，需要结合前端验证
```

**🔴 方案 B：使用服务角色密钥（最安全，推荐）**

通过 Edge Function 使用服务角色密钥绕过 RLS：

1. 创建 Edge Function `get-user-stats`
2. 在 Function 中使用 `SUPABASE_SERVICE_ROLE_KEY`
3. 服务角色密钥可以绕过所有 RLS 策略
4. 前端调用 Edge Function，由 Edge Function 返回所有用户数据

**优点**：
- 安全性最高
- API Key 不暴露在小程序端
- 可以添加额外的权限验证

**实现步骤**：

1. 在 Supabase Dashboard 获取 `SUPABASE_SERVICE_ROLE_KEY`
2. 创建 Edge Function `get-user-stats`
3. 在 Edge Function 中验证管理员 openid
4. 使用服务角色密钥查询所有用户数据

**Edge Function 代码示例**：

```typescript
// supabase/functions/get-user-stats/index.ts
import { createClient } from '@supabase/supabase-js'

const ADMIN_OPENID = 'ofW_r4lPk806IqPSk4-gR9r_478g'

Deno.serve(async (req) => {
  const { openid } = await req.json()
  
  // 验证管理员权限
  if (openid !== ADMIN_OPENID) {
    return new Response(JSON.stringify({ error: '无权限' }), { status: 403 })
  }
  
  // 使用服务角色密钥创建客户端（绕过 RLS）
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // 查询所有用户
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*')
    .neq('openid', ADMIN_OPENID)
    .order('last_access_time', { ascending: false })
  
  // 查询所有资产
  const { data: assets } = await supabaseAdmin
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false })
  
  // 组装数据（包含计算逻辑）
  const result = assembleUserStats(users, assets)
  
  return new Response(JSON.stringify({ success: true, data: result }))
})
```

**🔴 方案 C：前端直接查询 + 修改 RLS 策略**

修改 RLS 策略，让管理员策略能够真正查看所有数据：

```sql
-- 删除原来的管理员策略（如果已创建错误的）
DROP POLICY IF EXISTS "管理员可查看所有assets" ON assets;

-- 创建正确的管理员策略
-- 注意：这个策略需要结合前端传递的 openid 参数
-- 但 Supabase 客户端 API 不支持传递自定义参数到 RLS
-- 所以这个方案实际上不可行，必须使用方案 B
```

#### 最终推荐方案

**使用方案 B：创建 Edge Function `get-user-stats`**

这是唯一能真正实现管理员查看所有用户数据的方案。

#### 验证步骤
- [ ] 已选择方案 B
- [ ] 已获取 SUPABASE_SERVICE_ROLE_KEY
- [ ] 已准备创建 Edge Function

---

### Step 0.3：设计分类同步更新触发器

#### 背景
当用户修改分类名称时，需要同步更新所有使用该分类的资产记录中的 `category` 字段。

#### 操作步骤

**在 Supabase SQL Editor 中创建触发器：**

```sql
-- 1. 创建触发器函数
CREATE OR REPLACE FUNCTION sync_category_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 当分类名称改变时，更新所有关联资产
  IF OLD.name != NEW.name THEN
    UPDATE assets
    SET category = NEW.name, updated_at = NOW()
    WHERE category = OLD.name AND openid = NEW.openid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 在 categories 表上创建触发器
CREATE TRIGGER trigger_sync_category_name
  AFTER UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION sync_category_name();
```

#### 验证步骤
- [ ] 触发器函数创建成功
- [ ] 触发器创建成功
- [ ] 测试：修改分类名称后，关联资产的 category 字段自动更新

---

### Step 0.4：决定天气功能迁移方案

#### 当前情况
- 云函数 `getWeather` 调用和风天气 API
- 小程序需要获取天气信息显示

#### 方案选择

**方案 A：小程序端直接调用和风天气 API（推荐）**

优点：
- 无需额外开发 Edge Function
- 减少服务端依赖

注意：
- 需要在小程序 request 合法域名中添加和风天气域名
- 和风天气域名：`https://devapi.qweather.com` 或 `https://api.qweather.com`

**方案 B：创建 Supabase Edge Function**

优点：
- API Key 不暴露在小程序端
- 可以添加缓存逻辑

缺点：
- 需要额外开发

#### 验证步骤
- [ ] 已选择方案：A 或 B
- [ ] 如果选择 A：确认需要添加和风天气域名到白名单
- [ ] 如果选择 B：记录需要在阶段五创建 Edge Function

---

### Step 0.5：创建迁移检查清单

#### 操作步骤

在本地创建一个检查清单文件，用于记录每个步骤的完成状态：

**创建文件：`MIGRATION_CHECKLIST.md`**（本步骤后执行）

#### 验证步骤
- [ ] 已创建检查清单文件
- [ ] 已准备记录工具（笔记本或文档）

---

### ✅ 阶段零完成检查

**在进入阶段一之前，必须确认以下所有项：**

- [ ] Step 0.1：Supabase 表字段确认完成，无缺失字段
- [ ] Step 0.2：管理员权限方案已确定（方案 B：Edge Function）
- [ ] Step 0.3：分类同步触发器已创建并测试通过
- [ ] Step 0.4：天气功能迁移方案已确定
- [ ] Step 0.5：检查清单已创建
- [ ] 已了解需要迁移的业务逻辑（见附录 C）

**⚠️ 如果有任何一项未完成，请勿进入阶段一！**

---

## 🔵 阶段一：数据库结构完善

> 前置条件：阶段零全部完成

### Step 1.1：补充 assets 表缺失字段（如有）

#### 操作前检查
- [ ] 阶段零已完成
- [ ] 已记录缺失字段清单

#### 操作步骤

如果 Step 0.1 发现字段缺失，在 Supabase SQL Editor 中执行：

```sql
-- 示例：添加订阅资产相关字段（根据实际缺失情况调整）
ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_type text DEFAULT 'fixed';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS period_amount numeric;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS period_type text;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS period_days integer;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS subscription_start_date date;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS subscription_end_date date;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS subscription_status text;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS pending_subscription boolean DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS amount_history jsonb DEFAULT '[]'::jsonb;
```

#### 验证步骤
- [ ] SQL 执行成功，无报错
- [ ] 在 Table Editor 中确认字段已添加
- [ ] 字段类型正确

---

### Step 1.2：创建管理员 Edge Function `get-user-stats`

#### 操作前检查
- [ ] 阶段零已完成
- [ ] 已确定使用方案 B（Edge Function + 服务角色密钥）
- [ ] 已准备 Supabase CLI 或 Dashboard

#### 操作步骤

**方式 A：使用 Supabase Dashboard 创建**

1. 进入 Supabase Dashboard > Edge Functions
2. 点击「Create a new function」
3. 函数名：`get-user-stats`
4. 创建函数文件

**方式 B：使用 Supabase CLI 创建**

```bash
supabase functions new get-user-stats
```

**Edge Function 代码**：

```typescript
// supabase/functions/get-user-stats/index.ts
import { createClient } from '@supabase/supabase-js'

const ADMIN_OPENID = 'ofW_r4lPk806IqPSk4-gR9r_478g'

// 计算服役时长
function calculateUsedDays(purchaseDate: string, status: string, retiredDate?: string, soldDate?: string): number {
  if (!purchaseDate) return 0;
  
  const purchase = new Date(purchaseDate);
  const now = new Date();
  
  if (status === 'retired' && retiredDate) {
    const retired = new Date(retiredDate);
    return Math.max(1, Math.floor((retired.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }
  
  if (status === 'sold' && soldDate) {
    const sold = new Date(soldDate);
    return Math.max(1, Math.floor((sold.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }
  
  return Math.max(1, Math.floor((now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

// 格式化服役时长
function formatUsedDays(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainDays = days % 365;
    if (remainDays > 0) return `${years}年${remainDays}天`;
    return `${years}年`;
  }
  return `${days}天`;
}

// 计算日均成本
function calculateDailyCost(price: number, usedDays: number, assetType: string, periodAmount?: number, periodDays?: number): number {
  if (assetType === 'subscription') {
    if (periodAmount && periodDays) return periodAmount / periodDays;
    return 0;
  }
  if (price && usedDays) return price / usedDays;
  return 0;
}

Deno.serve(async (req) => {
  try {
    const { openid } = await req.json();
    
    // 验证管理员权限
    if (openid !== ADMIN_OPENID) {
      return new Response(
        JSON.stringify({ success: false, error: '无权限访问' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 使用服务角色密钥创建客户端（绕过 RLS）
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 查询所有用户（排除管理员）
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .neq('openid', ADMIN_OPENID)
      .order('last_access_time', { ascending: false })
      .limit(100);
    
    if (usersError) throw usersError;
    
    // 获取所有用户的 openid 列表
    const userOpenids = users.map(u => u.openid);
    
    // 查询所有用户的资产
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('openid', userOpenids)
      .order('created_at', { ascending: false });
    
    if (assetsError) throw assetsError;
    
    // 按用户 openid 分组资产
    const assetsByUser: Record<string, any[]> = {};
    
    assets.forEach(asset => {
      if (!assetsByUser[asset.openid]) assetsByUser[asset.openid] = [];
      
      const usedDays = calculateUsedDays(
        asset.purchase_date,
        asset.status,
        asset.retired_date,
        asset.sold_date
      );
      
      const dailyCost = calculateDailyCost(
        asset.price,
        usedDays,
        asset.asset_type,
        asset.period_amount,
        asset.period_days
      );
      
      assetsByUser[asset.openid].push({
        id: asset.id,
        name: asset.name,
        icon: asset.icon || '📦',
        price: asset.price || 0,
        status: asset.status,
        asset_type: asset.asset_type || 'fixed',
        purchase_date: asset.purchase_date,
        usedDays: usedDays,
        usedDaysText: formatUsedDays(usedDays),
        dailyCost: dailyCost.toFixed(2),
        category: asset.category
      });
    });
    
    // 格式化用户数据
    const result = users.map(user => ({
      id: user.id,
      nick_name: user.nick_name || '未设置',
      avatar_url: user.avatar_url || '',
      first_access_time: user.first_access_time,
      last_access_time: user.last_access_time,
      assets: assetsByUser[user.openid] || [],
      asset_count: (assetsByUser[user.openid] || []).length,
      total_asset_price: (assetsByUser[user.openid] || [])
        .reduce((sum: number, a: any) => sum + (a.price || 0), 0)
        .toFixed(2)
    }));
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        total: users.length,
        total_assets: assets.length
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**部署 Edge Function**：

```bash
supabase functions deploy get-user-stats
```

**配置环境变量**：

Edge Function 需要访问 `SUPABASE_SERVICE_ROLE_KEY`，这个环境变量在 Supabase 中默认已设置。

#### 验证步骤
- [ ] Edge Function 创建成功
- [ ] Edge Function 部署成功
- [ ] 在 Supabase Dashboard 中测试函数（使用管理员 openid）
- [ ] 返回数据包含所有用户和资产信息

---

### Step 1.3：验证分类同步触发器

#### 操作前检查
- [ ] 触发器已在 Step 0.3 创建

#### 操作步骤

**测试触发器功能：**

1. 在 Table Editor 中手动创建一条测试数据：
   - categories 表：插入一条分类（openid 使用测试值，name = "测试分类"）
   - assets 表：插入一条资产（openid 相同，category = "测试分类"）

2. 修改 categories 表中该分类的 name 为 "测试分类修改"

3. 检查 assets 表中该资产的 category 字段是否自动更新

#### 验证步骤
- [ ] 测试数据创建成功
- [ ] 修改分类名称后，资产的 category 自动更新
- [ ] 删除测试数据

---

### ✅ 阶段一完成检查

- [ ] Step 1.1：缺失字段已补充（如无缺失则跳过）
- [ ] Step 1.2：管理员 Edge Function `get-user-stats` 已创建并部署
- [ ] Step 1.3：触发器测试通过

---

## 🟢 阶段二：数据导出

> 前置条件：阶段一全部完成

### Step 2.1：导出 assets 表数据

#### 操作前检查
- [ ] 阶段一已完成
- [ ] 已登录微信云开发控制台

#### 操作步骤

1. 打开微信云开发控制台：https://cloud.weixin.qq.com
2. 进入项目：`cloud1-4gdakam95d203bfc`
3. 点击「数据库」
4. 选择 `assets` 集合
5. 点击「导出」按钮
6. 选择导出格式：**JSON**
7. 导出范围：**全部记录**
8. 点击确认导出
9. 保存文件为 `export_assets.json`

#### 验证步骤
- [ ] 文件已下载成功
- [ ] 打开文件，确认包含数据记录
- [ ] **重点检查**：是否包含订阅资产数据（assetType 字段）
- [ ] **重点检查**：是否包含 amountHistory 字段数据
- [ ] 记录导出记录数：`____ 条`

---

### Step 2.2：导出 categories 表数据

#### 操作步骤

同 Step 2.1，导出 `categories` 集合，保存为 `export_categories.json`

#### 验证步骤
- [ ] 文件已下载成功
- [ ] 数据格式正确
- [ ] 记录导出记录数：`____ 条`

---

### Step 2.3：导出 users 表数据

#### 操作步骤

同 Step 2.1，导出 `users` 集合，保存为 `export_users.json`

#### 验证步骤
- [ ] 文件已下载成功
- [ ] 数据格式正确
- [ ] 记录导出记录数：`____ 条`

---

### Step 2.4：检查导出数据完整性

#### 操作步骤

**逐一打开导出的 JSON 文件，检查以下内容：**

**assets.json 检查项：**
- [ ] 记录总数是否符合预期（约30条）
- [ ] 是否包含所有字段（特别是订阅资产字段）
- [ ] `_openid` 字段是否存在于每条记录
- [ ] 时间戳字段格式是否正常（createdAt、updatedAt）

**categories.json 检查项：**
- [ ] 记录总数是否符合预期（约10条）
- [ ] 是否包含所有字段
- [ ] `_openid` 字段是否存在于每条记录

**users.json 检查项：**
- [ ] 记录总数是否符合预期（约10条）
- [ ] 是否包含所有字段
- [ ] `_openid` 字段是否存在于每条记录
- [ ] avatarUrl 字段是否包含云存储路径

#### 失败处理
如果发现数据不完整：
1. 重新执行导出操作
2. 如果仍不完整，检查微信云数据库是否有数据损坏

---

### Step 2.5：备份导出文件

#### 操作步骤

1. 创建备份目录：`migration_backup`
2. 复制三个导出文件到备份目录
3. 创建一个 `export_summary.txt` 记录导出信息

#### 验证步骤
- [ ] 备份目录已创建
- [ ] 文件已复制备份
- [ ] export_summary.txt 已创建

---

### ✅ 阶段二完成检查

- [ ] Step 2.1：assets 数据已导出，记录数已记录
- [ ] Step 2.2：categories 数据已导出，记录数已记录
- [ ] Step 2.3：users 数据已导出，记录数已记录
- [ ] Step 2.4：数据完整性检查通过
- [ ] Step 2.5：备份文件已创建

**导出数据统计：**
- assets：`____ 条`
- categories：`____ 条`
- users：`____ 条`

---

## 🟡 阶段三：数据导入与验证

> 前置条件：阶段二全部完成

### Step 3.1：准备数据转换脚本

#### 背景
微信云数据库与 Supabase 的字段名和格式有差异，需要转换：

| 微信云数据库 | Supabase | 说明 |
|--------------|----------|------|
| `_id` | 不需要 | Supabase 自动生成 id |
| `_openid` | `openid` | 字段名转换 |
| `purchaseDate` | `purchase_date` | 驼峰转蛇形命名 |
| `createdAt` (Timestamp) | `created_at` (timestamp) | 格式可能需转换 |

#### 操作步骤

**手动检查数据格式：**

打开 `export_assets.json`，查看第一条记录的格式示例：

```json
{
  "_id": "xxx",
  "_openid": "xxx",
  "name": "xxx",
  "category": "xxx",
  "price": 100,
  "purchaseDate": "2024-01-01",
  "icon": "xxx",
  ...
}
```

**记录需要转换的字段：**

创建转换映射表文件 `field_mapping.md`：

```markdown
## assets 表字段映射

| 微信字段 | Supabase 字段 | 转换方式 |
|----------|---------------|----------|
| _openid | openid | 直接改名 |
| purchaseDate | purchase_date | 直接改名 |
| retiredDate | retired_date | 直接改名 |
| soldDate | sold_date | 直接改名 |
| assetType | asset_type | 直接改名 |
| periodAmount | period_amount | 直接改名 |
| periodType | period_type | 直接改名 |
| periodDays | period_days | 直接改名 |
| subscriptionStartDate | subscription_start_date | 直接改名 |
| subscriptionEndDate | subscription_end_date | 直接改名 |
| subscriptionStatus | subscription_status | 直接改名 |
| pendingSubscription | pending_subscription | 直接改名 |
| amountHistory | amount_history | 直接改名，转 jsonb |
| iconName | icon_name | 直接改名 |
| groupName | group_name | 直接改名 |
| excludeTotal | exclude_total | 直接改名 |
| excludeDaily | exclude_daily | 直接改名 |
| createdAt | created_at | 时间戳转换 |
| updatedAt | updated_at | 时间戳转换 |
| _id | 忽略 | 不导入 |
```

#### 验证步骤
- [ ] 已查看导出数据格式
- [ ] 已创建字段映射表
- [ ] 已确认时间戳格式需要转换

---

### Step 3.2：导入 assets 数据

#### 操作前检查
- [ ] 字段映射表已创建
- [ ] Supabase 表结构已完善

#### 操作步骤

**方式 A：使用 Supabase Dashboard 导入（推荐）**

1. 进入 Supabase Table Editor > assets 表
2. 点击「Import data from CSV/JSON」
3. 选择 `export_assets.json`
4. 配置字段映射（根据映射表）
5. 执行导入

**方式 B：编写 SQL 导入脚本**

如果方式 A 不可用，手动编写转换后的 INSERT SQL：

```sql
-- 示例（需要根据实际数据调整）
INSERT INTO assets (openid, name, category, price, purchase_date, ...)
VALUES 
  ('openid1', '资产1', '分类1', 100, '2024-01-01', ...),
  ('openid2', '资产2', '分类2', 200, '2024-02-01', ...);
```

#### 验证步骤
- [ ] 导入 SQL 执行成功，无报错
- [ ] 在 Table Editor 中查看数据是否正确导入
- [ ] 记录导入记录数：`____ 条`
- [ ] 对比导出记录数与导入记录数，是否一致
- [ ] 检查关键字段：订阅资产字段是否正确导入
- [ ] 检查 amount_history 字段：是否为数组格式

#### 失败处理
如果导入失败：
1. 检查报错信息
2. 确认字段类型是否匹配
3. 确认时间戳格式是否正确
4. 修复后重新导入

---

### Step 3.3：导入 categories 数据

#### 操作步骤

同 Step 3.2，导入 `export_categories.json` 到 categories 表

#### 验证步骤
- [ ] 导入成功
- [ ] 导入记录数与导出记录数一致
- [ ] sortOrder 字段正确

---

### Step 3.4：导入 users 数据

#### 操作步骤

同 Step 3.2，导入 `export_users.json` 到 users 表

#### 验证步骤
- [ ] 导入成功
- [ ] 导入记录数与导出记录数一致
- [ ] avatarUrl 字段正确（暂时保留原云存储路径）

---

### Step 3.5：验证数据总数

#### 操作步骤

**在 Supabase SQL Editor 中执行验证查询：**

```sql
-- 验证各表记录数
SELECT 'assets' as table_name, COUNT(*) as count FROM assets
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'users', COUNT(*) FROM users;
```

**对比阶段二的导出记录数：**

| 表 | 导出记录数 | 导入记录数 | 是否一致 |
|----|-----------|-----------|----------|
| assets | ____ | ____ | [ ] |
| categories | ____ | ____ | [ ] |
| users | ____ | ____ | [ ] |

#### 验证步骤
- [ ] 三表记录数都一致
- [ ] 如果不一致，记录差异数并排查原因

---

### ✅ 阶段三完成检查

- [ ] Step 3.1：字段映射表已创建
- [ ] Step 3.2：assets 数据已导入，记录数一致
- [ ] Step 3.3：categories 数据已导入，记录数一致
- [ ] Step 3.4：users 数据已导入，记录数一致
- [ ] Step 3.5：数据总数验证通过

---

## 🟠 阶段四：文件迁移与 URL 更新

> 前置条件：阶段三全部完成

### Step 4.1：列出云存储所有文件

#### 操作前检查
- [ ] 已登录微信云开发控制台
- [ ] 已进入云存储管理页面

#### 操作步骤

1. 进入微信云开发控制台 > 云存储
2. 查看以下目录中的文件：
   - `icons/` - 资产自定义缩略图
   - `category-icons/` - 分类图标
   - `user-avatars/` - 用户头像
3. 记录每个目录的文件数量

#### 验证步骤
- [ ] 已查看所有目录
- [ ] 已记录文件数量统计

**文件数量统计：**
- icons/：`____ 个`
- category-icons/：`____ 个`
- user-avatars/：`____ 个`

---

### Step 4.2：下载所有文件

#### 操作步骤

**方式 A：使用云开发控制台批量下载**

1. 进入云存储管理页面
2. 逐个目录选择所有文件
3. 点击下载
4. 保存到本地目录：`migration_files/icons/`、`migration_files/category-icons/`、`migration_files/user-avatars/`

**方式 B：使用命令行工具（如已安装 wx-cloud-cli）**

```bash
# 下载云存储文件（需要配置 wx-cloud-cli）
wx-cloud storage download --env cloud1-4gdakam95d203bfc --path icons/ --local ./migration_files/icons/
wx-cloud storage download --env cloud1-4gdakam95d203bfc --path category-icons/ --local ./migration_files/category-icons/
wx-cloud storage download --env cloud1-4gdakam95d203bfc --path user-avatars/ --local ./migration_files/user-avatars/
```

#### 验证步骤
- [ ] 所有文件已下载
- [ ] 文件数量与记录数量一致
- [ ] 文件可正常打开

---

### Step 4.3：上传到 Supabase Storage

#### 操作前检查
- [ ] 已确认 Supabase Storage buckets 已创建（avatars、icons、category-icons）
- [ ] 已确认 buckets 为 Public

#### 操作步骤

**方式 A：使用 Supabase Dashboard 上传**

1. 进入 Supabase Dashboard > Storage
2. 进入 `icons` bucket
3. 点击「Upload files」
4. 选择 `migration_files/icons/` 目录中的所有文件
5. 执行上传
6. 重复步骤 2-5，上传 `category-icons` 和 `avatars` 文件

**方式 B：使用 Supabase CLI 或 API**

```bash
# 使用 supabase CLI（如已安装）
supabase storage upload icons ./migration_files/icons/
supabase storage upload category-icons ./migration_files/category-icons/
supabase storage upload avatars ./migration_files/user-avatars/
```

#### 验证步骤
- [ ] icons bucket 文件已上传
- [ ] category-icons bucket 文件已上传
- [ ] avatars bucket 文件已上传
- [ ] 文件数量一致

---

### Step 4.4：创建 URL 映射表

#### 背景

文件上传后，URL 会变化，需要建立映射关系：

| 原微信云存储 URL | 新 Supabase URL |
|-----------------|-----------------|
| `cloud://xxx/icons/abc.png` | `https://scogsobcckvybkwcmvqh.supabase.co/storage/v1/object/public/icons/abc.png` |

#### 操作步骤

**创建 URL 映射文件：`url_mapping.csv`**

格式：
```
old_url,new_url,file_name,table,column
cloud://xxx/icons/abc.png,https://xxx.supabase.co/storage/v1/object/public/icons/abc.png,abc.png,assets,icon
cloud://xxx/category-icons/cat.png,https://xxx.supabase.co/storage/v1/object/public/category-icons/cat.png,cat.png,categories,icon
cloud://xxx/user-avatars/user1.png,https://xxx.supabase.co/storage/v1/object/public/avatars/user1.png,user1.png,users,avatar_url
```

#### 验证步骤
- [ ] 映射文件已创建
- [ ] 每个文件都有对应的映射
- [ ] 新 URL 可访问（在浏览器中测试）

---

### Step 4.5：批量更新数据库 URL 字段

#### 操作前检查
- [ ] URL 映射文件已创建
- [ ] 已确认新 URL 可访问

#### 操作步骤

**在 Supabase SQL Editor 中执行批量更新：**

```sql
-- 更新 assets 表的 icon 字段
-- 根据映射文件逐条更新（示例）
UPDATE assets SET icon = 'https://scogsobcckvybkwcmvqh.supabase.co/storage/v1/object/public/icons/abc.png'
WHERE icon LIKE '%icons/abc.png%';

-- 更新 categories 表的 icon 字段
UPDATE categories SET icon = 'https://scogsobcckvybkwcmvqh.supabase.co/storage/v1/object/public/category-icons/cat.png'
WHERE icon LIKE '%category-icons/cat.png%';

-- 更新 users 表的 avatar_url 字段
UPDATE users SET avatar_url = 'https://scogsobcckvybkwcmvqh.supabase.co/storage/v1/object/public/avatars/user1.png'
WHERE avatar_url LIKE '%user-avatars/user1.png%';
```

**注意：需要根据实际映射文件内容逐条生成 SQL**

#### 验证步骤
- [ ] SQL 执行成功
- [ ] 在 Table Editor 中检查 URL 是否已更新
- [ ] 验证新 URL 图片可正常显示

---

### ✅ 阶段四完成检查

- [ ] Step 4.1：云存储文件列表已记录
- [ ] Step 4.2：所有文件已下载
- [ ] Step 4.3：文件已上传到 Supabase Storage
- [ ] Step 4.4：URL 映射表已创建
- [ ] Step 4.5：数据库 URL 字段已更新
- [ ] 图片 URL 在浏览器中可访问

---

## 🟣 阶段五：代码改造

> 前置条件：阶段四全部完成
> ⚠️ 此阶段需要逐个文件修改，每个文件修改后建议进行基础测试

### Step 5.1：创建 utils/supabase.js

#### 操作前检查
- [ ] 已安装 supabase-js SDK 或准备使用 supabase 客户端

#### 需要实现的功能

```javascript
// utils/supabase.js 需要封装的功能

// 1. Supabase 客户端初始化
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. 数据库操作封装
// - getAssets(openid) - 获取资产列表
// - getAssetById(id) - 获取单个资产
// - addAsset(data) - 添加资产
// - updateAsset(id, data) - 更新资产（含 amountHistory 更新）
// - deleteAsset(id) - 删除资产
// - batchDeleteAssets(ids) - 批量删除

// - getCategories(openid) - 获取分类列表
// - addCategory(data) - 添加分类
// - updateCategory(id, data) - 更新分类
// - deleteCategory(id) - 删除分类
// - batchDeleteCategories(ids) - 批量删除
// - updateCategorySortOrder(data) - 更新排序

// - getUser(openid) - 获取用户信息
// - saveUserInfo(data) - 保存用户信息
// - getUserStats(openid) - 管理员获取所有用户统计

// 3. Storage 操作封装
// - uploadFile(bucket, path, file) - 上传文件
// - getFileUrl(bucket, path) - 获取文件 URL
// - deleteFile(bucket, path) - 删除文件
```

#### 验证步骤
- [ ] 文件已创建
- [ ] Supabase 客户端初始化正确
- [ ] 基础函数签名已定义

---

### Step 5.2：创建 utils/auth.js

#### 需要实现的功能

```javascript
// utils/auth.js 需要封装的功能

// 1. 获取微信 openid
async function getOpenid() {
  // 调用 wx.login 获取 code
  // 调用 Supabase Edge Function: get-wechat-openid
  // 返回 openid
}

// 2. 用户认证状态管理
// - isOpenidReady() - 检查 openid 是否已获取
// - getStoredOpenid() - 获取缓存的 openid
```

#### 验证步骤
- [ ] 文件已创建
- [ ] getOpenid 函数已实现
- [ ] Edge Function URL 配置正确

---

### Step 5.3：修改 app.js

#### 需要改动的内容

| 原代码 | 新代码 |
|--------|--------|
| `wx.cloud.init()` | 移除，改为 Supabase 初始化 |
| `wx.cloud.callFunction('getUserOpenid')` | 调用 `utils/auth.js` 的 `getOpenid()` |
| `globalData.cloudEnv` | 移除或改为 Supabase 配置 |

#### 验证步骤
- [ ] 云开发初始化代码已移除
- [ ] Supabase 配置已添加
- [ ] openid 获取逻辑已替换
- [ ] 编译无报错

---

### Step 5.4：修改 pages/index/index.js

#### 需要改动的内容

| 功能 | 原实现 | 新实现 |
|------|--------|--------|
| 获取资产列表 | `db.collection('assets').get()` | `supabase.getAssets(openid)` |
| 获取分类列表 | `db.collection('categories').get()` | `supabase.getCategories(openid)` |
| 批量删除资产 | 云函数 `batchDeleteAssets` | `supabase.batchDeleteAssets(ids)` |
| 上传随机头像 | `wx.cloud.uploadFile` | `supabase.uploadFile('avatars', ...)` |
| 获取天气 | 云函数 `getWeather` | 根据方案 A/B 调用 |
| ECharts 统计 | 保持不变（纯前端） | 保持不变 |

#### 验证步骤
- [ ] 所有云数据库操作已替换
- [ ] 所有云函数调用已替换
- [ ] 编译无报错

---

### Step 5.5：修改 pages/asset-add/asset-add.js

#### 需要改动的内容

| 功能 | 原实现 | 新实现 |
|------|--------|--------|
| 添加资产 | 云函数 `addAsset` | `supabase.addAsset(data)` |
| 更新资产 | 云函数 `updateAsset` | `supabase.updateAsset(id, data)` |
| 上传缩略图 | `wx.cloud.uploadFile` | `supabase.uploadFile('icons', ...)` |
| 获取临时URL | `wx.cloud.getTempFileURL` | 直接使用 Supabase Storage URL |

#### 验证步骤
- [ ] 资产操作已替换
- [ ] 文件上传已替换
- [ ] 编译无报错

---

### Step 5.6：修改 pages/asset-detail/asset-detail.js

#### 需要改动的内容

| 功能 | 原实现 | 新实现 |
|------|--------|--------|
| 获取资产详情 | `db.collection('assets').doc(id).get()` | `supabase.getAssetById(id)` |
| 删除资产 | 云函数 | `supabase.deleteAsset(id)` |

#### 验证步骤
- [ ] 数据获取已替换
- [ ] 删除操作已替换
- [ ] 编译无报错

---

### Step 5.7：修改 pages/category-manage/category-manage.js

#### 需要改动的内容

| 功能 | 原实现 | 新实现 |
|------|--------|--------|
| 获取分类列表 | 云函数 `getCategories` | `supabase.getCategories(openid)` |
| 添加分类 | 云函数 `addCategory` | `supabase.addCategory(data)` |
| 更新分类 | 云函数 `updateCategory` | `supabase.updateCategory(id, data)` |
| 删除分类 | 云函数 `deleteCategory` | `supabase.deleteCategory(id)` |
| 批量删除 | 云函数 `batchDeleteCategories` | `supabase.batchDeleteCategories(ids)` |
| 更新排序 | 云函数 `updateCategorySortOrder` | `supabase.updateCategorySortOrder(data)` |
| 上传图标 | `wx.cloud.uploadFile` | `supabase.uploadFile('category-icons', ...)` |

#### 验证步骤
- [ ] 所有分类操作已替换
- [ ] 文件上传已替换
- [ ] 编译无报错

---

### Step 5.8：修改 pages/account/account.js

#### 需要改动的内容

| 功能 | 原实现 | 新实现 |
|------|--------|--------|
| 获取用户信息 | `db.collection('users').where({_openid}).get()` | `supabase.getUser(openid)` |
| 保存用户信息 | 云函数 `saveUserInfo` | `supabase.saveUserInfo(data)` |
| 上传头像 | `wx.cloud.uploadFile` | `supabase.uploadFile('avatars', ...)` |

#### 验证步骤
- [ ] 用户信息操作已替换
- [ ] 文件上传已替换
- [ ] 编译无报错

---

### Step 5.9：修改 pages/user-stats/user-stats.js（管理员）

#### 需要改动的内容

| 功能 | 原实现 | 新实现 |
|------|--------|--------|
| 获取所有用户统计 | 云函数 `getUserStats` | **调用 Edge Function `get-user-stats`** |

#### 代码示例

```javascript
// pages/user-stats/user-stats.js

// 获取用户统计数据
async function getUserStats(openid) {
  // 调用 Edge Function（使用服务角色密钥）
  const response = await fetch(
    'https://scogsobcckvybkwcmvqh.supabase.co/functions/v1/get-user-stats',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ openid })
    }
  );
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
}
```

#### 注意事项
- 管理员权限验证在 Edge Function 中实现（验证 openid）
- Edge Function 使用服务角色密钥绕过 RLS
- 前端只需调用 Edge Function，不需要额外的权限判断

#### 验证步骤
- [ ] Edge Function URL 配置正确
- [ ] 调用方式已替换为 fetch
- [ ] 数据处理逻辑已适配新格式
- [ ] 编译无报错

---

### ✅ 阶段五完成检查

- [ ] Step 5.1：utils/supabase.js 已创建
- [ ] Step 5.2：utils/auth.js 已创建
- [ ] Step 5.3：app.js 已修改
- [ ] Step 5.4：index.js 已修改
- [ ] Step 5.5：asset-add.js 已修改
- [ ] Step 5.6：asset-detail.js 已修改
- [ ] Step 5.7：category-manage.js 已修改
- [ ] Step 5.8：account.js 已修改
- [ ] Step 5.9：user-stats.js 已修改
- [ ] 所有文件编译无报错

---

## 🔵 阶段六：功能测试

> 前置条件：阶段五全部完成
> ⚠️ 此阶段需要在真实环境中测试，建议使用微信开发者工具预览模式

### Step 6.1：测试用户登录

#### 测试内容

1. 打开小程序，触发 `onLaunch`
2. 检查 openid 是否正确获取
3. 检查用户信息是否正确加载

#### 验证步骤
- [ ] openid 获取成功
- [ ] 用户信息显示正确
- [ ] 老用户数据正确加载

---

### Step 6.2：测试分类管理

#### 测试内容

1. 创建新分类
2. 编辑分类名称
3. 上传分类图标
4. 删除分类
5. 分类排序

#### 验证步骤
- [ ] 分类创建成功
- [ ] 分类名称修改成功，关联资产同步更新（触发器生效）
- [ ] 分类图标上传成功，显示正常
- [ ] 分类删除成功
- [ ] 分类排序成功

---

### Step 6.3：测试资产管理（普通资产）

#### 测试内容

1. 添加普通资产
2. 编辑资产信息
3. 上传资产缩略图
4. 删除资产
5. 批量删除

#### 验证步骤
- [ ] 资产添加成功
- [ ] 资产编辑成功
- [ ] 资产缩略图上传成功
- [ ] 资产删除成功
- [ ] 批量删除成功

---

### Step 6.4：测试资产管理（订阅资产）

#### 测试内容

1. 添加订阅资产（asset_type = subscription）
2. 设置订阅周期
3. 编辑订阅金额（检查 amount_history 记录）
4. 订阅状态变更

#### 验证步骤
- [ ] 订阅资产添加成功，所有订阅字段正确保存
- [ ] 订阅周期计算正确
- [ ] 金额变更历史正确记录
- [ ] 订阅状态变更正确

---

### Step 6.5：测试文件上传

#### 测试内容

1. 测试各类型文件上传：
   - 资产缩略图（icons bucket）
   - 分类图标（category-icons bucket）
   - 用户头像（avatars bucket）

#### 验证步骤
- [ ] 各 bucket 上传成功
- [ ] 图片显示正常
- [ ] URL 格式正确

---

### Step 6.6：测试管理员功能

#### 测试内容

使用管理员账号测试：
1. 进入 user-stats 页面
2. 查看所有用户列表
3. 查看各用户的资产详情

#### 验证步骤
- [ ] 管理员可进入 user-stats 页面
- [ ] 可查看所有用户数据
- [ ] 数据显示正确

---

### Step 6.7：测试天气功能

#### 测试内容

1. 检查天气信息是否正常显示
2. 测试位置授权后天气获取

#### 验证步骤
- [ ] 天气信息获取成功
- [ ] 天气显示正常

---

### ✅ 阶段六完成检查

- [ ] Step 6.1：用户登录测试通过
- [ ] Step 6.2：分类管理测试通过
- [ ] Step 6.3：普通资产测试通过
- [ ] Step 6.4：订阅资产测试通过
- [ ] Step 6.5：文件上传测试通过
- [ ] Step 6.6：管理员功能测试通过
- [ ] Step 6.7：天气功能测试通过

---

## ⚪ 阶段七：清理与发布

> 前置条件：阶段六全部测试通过
> ⚠️ 此阶段操作不可逆，请确保所有测试通过后再执行

### Step 7.1：删除云函数目录

#### 操作前检查
- [ ] 所有功能测试已通过
- [ ] 已备份 cloudfunctions 目录（可选）

#### 操作步骤

删除本地 `cloudfunctions` 目录：

```bash
# 备份（可选）
cp -r cloudfunctions cloudfunctions_backup

# 删除
rm -rf cloudfunctions
```

#### 验证步骤
- [ ] cloudfunctions 目录已删除
- [ ] 备份已创建（如有）

---

### Step 7.2：清理云开发配置

#### 需要清理的内容

| 文件 | 清理内容 |
|------|----------|
| `project.config.json` | 移除 `cloudfunctionRoot`、`cloudbaseRoot` 配置 |
| `app.js` | 确认无残留云开发代码 |
| 各页面文件 | 确认无残留 `wx.cloud` 调用 |

#### 验证步骤
- [ ] 配置文件已清理
- [ ] 无残留云开发代码
- [ ] 编译无报错

---

### Step 7.3：发布新版本

#### 操作步骤

1. 在微信开发者工具中编译
2. 上传代码
3. 设置版本号
4. 提交审核

#### 验证步骤
- [ ] 编译成功
- [ ] 上传成功
- [ ] 版本号已设置
- [ ] 已提交审核

---

### ✅ 阶段七完成检查

- [ ] Step 7.1：云函数目录已删除
- [ ] Step 7.2：配置已清理
- [ ] Step 7.3：新版本已发布

---

## 📝 附录

### A. 关键配置信息汇总

#### Supabase 配置

| 配置项 | 值 |
|--------|-----|
| Project URL | `https://scogsobcckvybkwcmvqh.supabase.co` |
| Anon Key | `sb_publishable_EqhquS2f1xsGfXGQxhMHPw_u9a1qSe9` |
| Edge Function URL | `https://scogsobcckvybkwcmvqh.supabase.co/functions/v1/get-wechat-openid` |

#### 微信小程序配置

| 配置项 | 值 |
|--------|-----|
| AppID | `wxb1fb63721cb2da59` |
| 云开发环境 ID | `cloud1-4gdakam95d203bfc` |
| 管理员 openid | `ofW_r4lPk806IqPSk4-gR9r_478g` |

#### Storage Buckets

| Bucket | 公开访问 | 用途 |
|--------|----------|------|
| avatars | ✅ | 用户头像 |
| icons | ✅ | 资产自定义缩略图 |
| category-icons | ✅ | 分类图标 |

---

### B. 云函数与替代方案对照表

| 原云函数 | 替代方案 | 实现位置 |
|----------|----------|----------|
| addAsset | Supabase 客户端 API | utils/supabase.js |
| updateAsset | Supabase 客户端 API | utils/supabase.js |
| batchDeleteAssets | Supabase 客户端 API | utils/supabase.js |
| addCategory | Supabase 客户端 API | utils/supabase.js |
| updateCategory | Supabase 客户端 API + 触发器 | utils/supabase.js + 数据库触发器 |
| deleteCategory | Supabase 客户端 API | utils/supabase.js |
| batchDeleteCategories | Supabase 客户端 API | utils/supabase.js |
| getCategories | Supabase 客户端 API | utils/supabase.js |
| updateCategorySortOrder | Supabase 客户端 API | utils/supabase.js |
| getUserOpenid | Supabase Edge Function | Edge Function 已创建 |
| saveUserInfo | Supabase 客户端 API | utils/supabase.js |
| getUserStats | **Edge Function（服务角色密钥）** | 新建 Edge Function `get-user-stats` |
| getWeather | 小程序端直接调用 / Edge Function | 根据方案选择 |

---

### C. 业务逻辑迁移清单（重要！）

> ⚠️ 以下业务逻辑在云函数中实现，迁移后需要在小程序端或 Supabase 端重新实现

#### C.1 资产名称唯一性检查

**原云函数逻辑**：
```javascript
// addAsset 和 updateAsset 中检查同名资产
const existingAsset = await db.collection('assets')
  .where({
    _openid: wxContext.OPENID,
    name: name.trim()
  })
  .count();

if (existingAsset.total > 0) {
  return { success: false, error: '资产名称已存在' };
}
```

**迁移方案**：在小程序端实现
```javascript
// utils/supabase.js 中添加
async function checkAssetNameExists(openid, name, excludeId = null) {
  let query = supabase
    .from('assets')
    .select('id', { count: 'exact', head: true })
    .eq('openid', openid)
    .eq('name', name.trim());
  
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  const { count } = await query;
  return count > 0;
}
```

#### C.2 删除分类前置检查

**原云函数逻辑**：
```javascript
// deleteCategory 中检查是否有资产使用该分类
const assetsUsingCategory = await db.collection('assets')
  .where({
    category: categoryData.name,
    _openid: wxContext.OPENID
  })
  .count();

if (assetsUsingCategory.total > 0) {
  return { success: false, error: `已有${assetsUsingCategory.total}个资产使用此分类` };
}
```

**迁移方案**：在小程序端实现
```javascript
// utils/supabase.js 中添加
async function checkCategoryHasAssets(openid, categoryName) {
  const { count } = await supabase
    .from('assets')
    .select('id', { count: 'exact', head: true })
    .eq('openid', openid)
    .eq('category', categoryName);
  
  return count;
}
```

#### C.3 周期天数映射常量

**原云函数定义**：
```javascript
const PERIOD_DAYS_MAP = {
  'monthly': 30,
  'yearly': 365,
  'weekly': 7
};
```

**迁移方案**：在小程序端定义
```javascript
// utils/constants.js（新建）
export const PERIOD_DAYS_MAP = {
  'monthly': 30,
  'yearly': 365,
  'weekly': 7
};

export const ADMIN_OPENID = 'ofW_r4lPk806IqPSk4-gR9r_478g';
```

#### C.4 服役时长计算

**原云函数逻辑**：
```javascript
function calculateUsedDays(purchaseDate, status, retiredDate, soldDate) {
  if (!purchaseDate) return 0;

  const purchase = new Date(purchaseDate);
  const now = new Date();

  // 已退役或已卖出，计算到退役/卖出日期
  if (status === 'retired' && retiredDate) {
    const retired = new Date(retiredDate);
    return Math.max(1, Math.floor((retired - purchase) / (1000 * 60 * 60 * 24)) + 1);
  }

  if (status === 'sold' && soldDate) {
    const sold = new Date(soldDate);
    return Math.max(1, Math.floor((sold - purchase) / (1000 * 60 * 60 * 24)) + 1);
  }

  // 服役中，计算到今天
  return Math.max(1, Math.floor((now - purchase) / (1000 * 60 * 60 * 24)) + 1);
}
```

**迁移方案**：在小程序端实现
```javascript
// utils/calculations.js（新建）
export function calculateUsedDays(purchaseDate, status, retiredDate, soldDate) {
  // 同上逻辑
}

export function formatUsedDays(days) {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainDays = days % 365;
    if (remainDays > 0) {
      return `${years}年${remainDays}天`;
    }
    return `${years}年`;
  }
  return `${days}天`;
}
```

#### C.5 日均成本计算

**原云函数逻辑**：
```javascript
function calculateDailyCost(price, usedDays, assetType, periodAmount, periodDays) {
  if (assetType === 'subscription') {
    // 订阅资产：日均 = 每期金额 / 周期天数
    if (periodAmount && periodDays) {
      return periodAmount / periodDays;
    }
    return 0;
  }

  // 普通资产：日均 = 价格 / 服役时长
  if (price && usedDays) {
    return price / usedDays;
  }
  return 0;
}
```

**迁移方案**：在小程序端实现
```javascript
// utils/calculations.js 中添加
export function calculateDailyCost(price, usedDays, assetType, periodAmount, periodDays) {
  // 同上逻辑
}
```

#### C.6 金额变更历史记录

**原云函数逻辑**（updateAsset）：
```javascript
// 如果金额发生变化，记录到历史
if (oldPeriodAmount && parseFloat(periodAmount) !== oldPeriodAmount) {
  const historyEntry = {
    amount: oldPeriodAmount,
    effectiveDate: currentAsset.data.subscriptionStartDate || currentAsset.data.purchaseDate
  };
  updateData.amountHistory = [...existingAmountHistory, historyEntry];
}
```

**迁移方案**：在小程序端实现
```javascript
// utils/supabase.js 中添加
async function updateAsset(id, data, openid) {
  // 获取当前资产数据
  const currentAsset = await getAssetById(id);
  
  // 如果是订阅资产且金额变化
  if (data.asset_type === 'subscription' && 
      currentAsset.period_amount !== data.period_amount) {
    const historyEntry = {
      amount: currentAsset.period_amount,
      effectiveDate: currentAsset.subscription_start_date || currentAsset.purchase_date
    };
    data.amount_history = [...(currentAsset.amount_history || []), historyEntry];
  }
  
  // 执行更新
  return await supabase.from('assets').update(data).eq('id', id).eq('openid', openid);
}
```

#### C.7 新用户自动创建逻辑

**原云函数逻辑**（saveUserInfo）：
- 新用户不存在时，创建用户记录
- 需要提供昵称和头像

**小程序端逻辑**（index.js checkUserAuth）：
- 随机选择预设头像（20个 SVG）
- 随机选择预设昵称（100个）+ 随机数字后缀
- 上传 SVG 到云存储
- 调用 saveUserInfo 创建用户

**迁移方案**：保留小程序端逻辑，调整上传方式

```javascript
// utils/user.js（新建）或保留在 index.js 中
const presetAvatars = [ /* 20个SVG data URL */ ];
const presetNicknames = [ /* 100个预设昵称 */ ];

async function createRandomUserInfo(openid, isNewUser) {
  const randomAvatar = presetAvatars[Math.floor(Math.random() * presetAvatars.length)];
  const randomNickname = presetNicknames[Math.floor(Math.random() * presetNicknames.length)] +
                         Math.floor(Math.random() * 1000);
  
  // 上传 SVG 到 Supabase Storage
  const avatarUrl = await uploadDataUrlAvatar(randomAvatar);
  
  // 创建用户记录
  await supabase.from('users').insert({
    openid: openid,
    nick_name: randomNickname,
    avatar_url: avatarUrl,
    first_access_time: new Date(),
    last_access_time: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  });
}
```

#### C.8 预设数据清单

**预设头像（20个 SVG）**：
位置：`pages/index/index.js` 和 `pages/account/account.js`
- 需要完整复制到新代码中

**预设昵称（100个）**：
位置：同上
- 10个分类：温暖、星空、清新、萌宠、音乐、快乐、旅行、花语、生活、梦想
- 每个分类10个昵称

---

### D. 技术语法对照表

#### D.1 查询操作符对照

| 微信云数据库 | Supabase | 示例 |
|--------------|----------|------|
| `.where({ field: value })` | `.eq('field', value)` | 单条件查询 |
| `.where({ field: db.command.neq(value) })` | `.neq('field', value)` | 不等于 |
| `.where({ field: db.command.in([values]) })` | `.in('field', [values])` | 包含于 |
| `.where({ field: db.command.gt(value) })` | `.gt('field', value)` | 大于 |
| `.where({ field: db.command.lt(value) })` | `.lt('field', value)` | 小于 |
| `.where({ field: db.command.gte(value) })` | `.gte('field', value)` | 大于等于 |
| `.where({ field: db.command.lte(value) })` | `.lte('field', value)` | 小于等于 |
| `.count()` | `.select('id', { count: 'exact', head: true })` | 计数 |

#### D.2 排序和分页对照

| 微信云数据库 | Supabase | 说明 |
|--------------|----------|------|
| `.orderBy('field', 'desc')` | `.order('field', { ascending: false })` | 降序 |
| `.orderBy('field', 'asc')` | `.order('field', { ascending: true })` | 升序 |
| `.limit(n)` | `.limit(n)` | 限制数量 |
| `.skip(n)` | `.range(n, n + limit - 1)` | 跳过n条 |

#### D.3 时间处理对照

| 微信云数据库 | Supabase | 说明 |
|--------------|----------|------|
| `db.serverDate()` | `new Date()` 或 `NOW()` | 服务端时间 |
| `Timestamp` | `timestamp` 或 `timestamptz` | 时间戳类型 |

#### D.4 文件操作对照

| 微信云数据库 | Supabase | 说明 |
|--------------|----------|------|
| `wx.cloud.uploadFile` | `supabase.storage.from(bucket).upload(path, file)` | 上传文件 |
| `wx.cloud.getTempFileURL` | **不需要** | Supabase 公开 bucket URL 永久可访问 |
| `wx.cloud.deleteFile` | `supabase.storage.from(bucket).remove([path])` | 删除文件 |

#### D.5 批量操作对照

| 微信云数据库 | Supabase | 说明 |
|--------------|----------|------|
| `db.collection().where().update({ data })` | **不支持直接批量更新** | 需要循环或 RPC |
| `db.collection().add({ data: [array] })` | `supabase.from().insert([array])` | 批量插入 |

---

### E. 数据字段格式说明

#### E.1 icon 字段的多种格式

icon 字段可能包含以下几种格式，迁移时需要区分处理：

| 格式类型 | 示例 | 是否需要URL更新 |
|----------|------|-----------------|
| Emoji | `📦` | ❌ 不需要 |
| 云存储路径 | `cloud://xxx/icons/abc.png` | ✅ 需要更新 |
| HTTP URL | `https://example.com/image.png` | ❌ 不需要（外部链接） |
| Data URL (SVG) | `data:image/svg+xml,...` | ❌ 不需要 |

**迁移处理逻辑**：
```javascript
// 判断 icon 类型
function getIconType(icon) {
  if (!icon) return 'none';
  if (icon.startsWith('data:')) return 'dataUrl';
  if (icon.startsWith('cloud://')) return 'cloudStorage';
  if (icon.startsWith('http://') || icon.startsWith('https://')) return 'httpUrl';
  if (icon.length <= 4) return 'emoji';  // 简单判断 emoji
  return 'unknown';
}

// URL 映射时只处理 cloudStorage 类型
```

#### E.2 amountHistory 数组结构

```json
{
  "amount_history": [
    {
      "amount": 100,
      "effectiveDate": "2024-01-01"
    },
    {
      "amount": 120,
      "effectiveDate": "2024-06-01"
    }
  ]
}
```

**Supabase 存储**：
- 类型：`jsonb`
- 默认值：`'[]'::jsonb`
- 操作：使用 `.update({ amount_history: [...old, newEntry] })`

---

### F. 风险点与应对措施

| 风险点 | 影响 | 应对措施 |
|--------|------|----------|
| 订阅资产字段缺失 | 订阅功能失效 | 阶段零必须验证表结构 |
| URL 映射错误 | 图片无法显示 | 阶段四创建完整映射表，区分icon类型 |
| 触发器失效 | 分类名称不一致 | 阶段一测试触发器 |
| **管理员权限失效** | **无法查看所有用户** | **必须使用 Edge Function + 服务角色密钥** |
| 时间戳格式错误 | 时间显示异常 | 阶段三验证数据格式 |
| openid 不一致 | 用户数据丢失 | 使用相同 openid 标识 |
| 资产名称重复检查缺失 | 用户创建同名资产 | 小程序端实现检查逻辑 |
| 删除分类检查缺失 | 资产丢失分类信息 | 小程序端实现检查逻辑 |
| 金额历史记录缺失 | 订阅金额变更无记录 | 小程序端实现追加逻辑 |
| 新用户创建逻辑缺失 | 新用户体验异常 | 保留预设数据和创建逻辑 |

---

### G. 迁移时间估算

| 阶段 | 预估时间 |
|------|----------|
| 阶段零：准备工作 | 1-2 小时 |
| 阶段一：数据库结构完善 | 30 分钟 |
| 阶段二：数据导出 | 30 分钟 |
| 阶段三：数据导入 | 1 小时 |
| 阶段四：文件迁移 | 1-2 小时 |
| 阶段五：代码改造 | **4-6 小时**（含业务逻辑迁移） |
| 阶段六：功能测试 | 2-3 小时 |
| 阶段七：清理与发布 | 30 分钟 |

**总计预估：10-14 小时**

---

### H. 新建文件清单

迁移过程中需要新建的文件：

| 文件路径 | 功能说明 |
|----------|----------|
| `utils/supabase.js` | Supabase 客户端封装，所有数据库和Storage操作 |
| `utils/auth.js` | 用户认证封装，获取 openid |
| `utils/constants.js` | 常量定义（周期天数映射、管理员 openid） |
| `utils/calculations.js` | 计算函数（服役时长、日均成本） |
| `utils/user.js` | 用户相关逻辑（新用户创建、预设数据） |
| `migration_backup/` | 导出数据备份目录 |
| `migration_files/` | 云存储文件临时目录 |

---

## ⚠️ 注意事项

1. **保留微信云开发数据**：作为备份，不要删除
2. **用户标识一致性**：继续使用微信 openid，确保老用户数据兼容
3. **文件 URL 更新**：迁移文件后必须更新数据库中的 URL 字段，区分 icon 类型
4. **权限测试**：改造完成后测试用户权限是否正常（只能看到自己的数据）
5. **管理员功能**：必须使用 Edge Function + 服务角色密钥，RLS 策略无法实现
6. **订阅资产**：确保所有订阅资产字段完整迁移
7. **金额历史**：确保 amount_history 字段正确导入，并在小程序端实现追加逻辑
8. **资产名称检查**：小程序端实现唯一性检查
9. **分类删除检查**：小程序端实现前置检查
10. **预设数据**：完整复制预设头像和昵称数据
11. **分阶段执行**：每个阶段必须完成验证后再进入下一阶段
12. **备份意识**：关键步骤前做好备份（导出数据、云函数代码等）