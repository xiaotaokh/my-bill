# 微信小程序 - 我的资产

## 项目说明

这是一个微信小程序项目，用于统计和管理个人名下资产。

## 快速开始

### 1. 环境要求

- 微信开发者工具（最新版本）
- 微信小程序账号
- 云开发环境

### 2. 配置步骤

#### 2.1 配置云开发环境

1. 打开微信开发者工具
2. 导入项目到开发者工具
3. 点击工具栏的「云开发」按钮
4. 创建或选择一个云开发环境
5. 记录环境ID（例如：production-xxx）

#### 2.2 修改配置文件

在 `app.js` 中修改环境ID：

```javascript
wx.cloud.init({
  env: '你的环境ID', // 替换为你的云开发环境ID
  traceUser: true,
})
```

在 `app.js` 的 `globalData` 中同样修改：

```javascript
envId: '你的环境ID' // 替换为你的云开发环境ID
```

#### 2.3 初始化数据库

1. 在云开发控制台中，进入「数据库」
2. 点击「+」创建集合，命名为 `assets`
3. 设置集合权限为「仅创建者可读写」

#### 2.4 部署云函数

1. 在微信开发者工具中，右键点击每个云函数文件夹（`addAsset`, `getAssets`, `getStats`, `updateAsset`, `deleteAsset`）
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成

### 3. 运行项目

1. 在微信开发者工具中点击「编译」
2. 扫描二维码在手机上预览
3. 或者直接在开发者工具中预览

## 项目结构

```
myBill/
├── app.js                      # 小程序入口
├── app.json                    # 小程序配置
├── app.wxss                    # 全局样式
├── project.config.json         # 项目配置
├── pages/                      # 页面目录
│   ├── index/                  # 首页
│   ├── asset-add/              # 添加资产
│   └── asset-detail/           # 资产详情
└── cloudfunctions/             # 云函数
    ├── addAsset/
    ├── getAssets/
    ├── getStats/
    ├── updateAsset/
    └── deleteAsset/
```

## 功能说明

### 1. 首页
- 显示资产总览统计（总价、日均成本、各状态数量）
- 支持按状态筛选（全部/服役中/已退役/已卖出）
- 支持按多个维度排序（价格、购买时间、服役时长、日均成本）
- 点击资产卡片查看详情

### 2. 添加资产
- 填写物品名称、价格、购买日期
- 选择或添加类别
- 填写备注（可选）
- 设置状态（服役中/已退役/已卖出）
- 设置是否不计入总资产/日均成本

### 3. 资产详情
- 查看资产详细信息
- 编辑资产
- 删除资产

## 数据字段说明

### 资产表（assets）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 唯一标识 |
| _openid | String | 用户openid |
| name | String | 资产名称 |
| category | String | 资产分类 |
| price | Number | 价格 |
| purchaseDate | Date | 购买日期 |
| status | String | 状态（active/retired/sold） |
| remark | String | 备注 |
| excludeTotal | Boolean | 不计入总资产 |
| excludeDaily | Boolean | 不计入日均 |
| createdAt | Timestamp | 创建时间 |
| updatedAt | Timestamp | 更新时间 |

## 注意事项

1. **云函数部署**: 首次运行需要部署所有云函数
2. **数据库权限**: 确保数据库权限设置正确，保护用户数据
3. **环境配置**: 记得将示例环境ID替换为你自己的环境ID
4. **测试数据**: 首次运行时数据库为空，需要先添加资产

## 技术栈

- 微信小程序原生开发
- 微信云开发（CloudBase）
- JavaScript (ES6+)

## 常见问题

### Q: 如何重置数据？
A: 在云开发控制台的数据库中删除 `assets` 集合中的数据

### Q: 如何添加新的类别？
A: 在添加资产页面，点击类别旁边的「+」按钮即可添加新类别

### Q: 数据是否支持多设备同步？
A: 是的，所有数据存储在云端，登录同一微信账号可在多设备访问
