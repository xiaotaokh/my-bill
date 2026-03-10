# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个微信小程序项目，用于统计个人名下资产。使用微信原生云开发，数据与微信账号绑定。

### 技术栈
- 微信小程序原生开发
- 微信云开发（CloudBase）
- JavaScript

### 核心功能

#### 1. 首页
- 添加资产入口
- 资产总览

#### 2. 资产总览
显示以下统计信息：
- 总资产价格
- 日均成本
- 服役中个数
- 已退役个数
- 已卖出个数
- 支持分类查看名下资产

#### 3. 资产列表功能
支持按以下维度排序：
- 价格
- 添加时间
- 购买时间
- 服役时长
- 日均成本

#### 4. 资产状态分类
- 服役中
- 已退役
- 已卖出

### 数据模型

每个资产包含以下字段：
- 资产名称
- 资产类型/分类
- 价格/购买金额
- 购买时间
- 添加时间（创建时间）
- 状态（服役中/已退役/已卖出）
- 服役时长（计算字段）
- 日均成本（计算字段）

### 数据模型

每个资产包含以下字段：
- `_id`: 唯一标识
- `_openid`: 微信用户openid
- `name`: 资产名称
- `category`: 资产分类（电子设备/房产/车辆/投资/其他）
- `price`: 购买价格
- `purchaseDate`: 购买日期
- `status`: 状态（active/retired/sold）
- `remark`: 备注
- `excludeTotal`: 不计入总资产（boolean）
- `excludeDaily`: 不计入日均（boolean）
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### 项目结构

```
myBill/
├── app.js                      # 小程序入口
├── app.json                    # 小程序配置
├── app.wxss                    # 全局样式
├── project.config.json         # 项目配置
├── sitemap.json                # 站点地图
├── CLAUDE.md                   # Claude Code 配置
├── 需求文档.md                  # 需求文档
├── 首页.jpg                     # 首页设计稿
├── pages/                      # 页面目录
│   ├── index/                  # 首页 - 资产总览和列表
│   ├── asset-add/              # 添加资产页
│   ├── asset-detail/           # 资产详情页
│   └── asset-list/             # 资产列表页
└── cloudfunctions/             # 云函数目录
    ├── addAsset/               # 添加资产
    ├── getAssets/              # 获取资产列表
    ├── getStats/               # 获取统计信息
    ├── updateAsset/            # 更新资产
    └── deleteAsset/            # 删除资产
```

### 常用命令

1. **安装云函数依赖**
```bash
cd cloudfunctions/addAsset && npm install
cd cloudfunctions/getAssets && npm install
cd cloudfunctions/updateAsset && npm install
cd cloudfunctions/deleteAsset && npm install
cd cloudfunctions/getStats && npm install
```

2. **上传云函数**（在微信开发者工具中右键云函数文件夹 -> 上传并部署）

3. **初始化云开发数据库**
   - 在微信开发者工具中打开云开发控制台
   - 创建集合 `assets`
   - 设置数据库权限：仅创建者可读写

### 开发说明

1. **配置AppID**: 已配置为 `wxb1fb63721cb2da59`

2. **配置云环境**:
   - 在 `app.js` 中修改 `env` 为你的云开发环境ID
   - 在 `project.config.json` 中配置云函数根目录

3. **数据库权限**:
   - 云数据库 `assets` 集合权限应设置为：仅创建者可读写
   - 这样每个用户只能看到自己的资产数据

4. **页面说明**:
   - **首页** (`pages/index`): 资产总览、筛选、排序、列表
   - **添加资产** (`pages/asset-add`): 表单填写、支持自定义类别
   - **资产详情** (`pages/asset-detail`): 查看详细信息、编辑、删除

