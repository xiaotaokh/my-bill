<!--
## Sync Impact Report
- Version change: N/A → 1.0.0 (Initial creation)
- New principles added:
  - I. 简洁优先 (Simplicity First)
  - II. 用户体验至上 (User Experience First)
  - III. 数据安全 (Data Security)
  - IV. 可维护性 (Maintainability)
  - V. 云原生架构 (Cloud-Native Architecture)
- Added sections: 技术约束, 开发流程, 治理
- Removed sections: None
- Templates status:
  - plan-template.md: ✅ Compatible (Constitution Check section supports custom gates)
  - spec-template.md: ✅ Compatible (Requirements align with principles)
  - tasks-template.md: ✅ Compatible (Task categorization supports principle-driven tasks)
- Follow-up TODOs: None
-->

# 朝夕数计365 (myBill) Constitution

## Core Principles

### I. 简洁优先 (Simplicity First)

每个功能都必须以最简单的方式实现。YAGNI (You Aren't Gonna Need It) 原则必须严格遵守：

- 不添加未明确需求的功能
- 优先使用微信小程序原生能力，避免引入不必要的第三方库
- 代码结构扁平化，避免过度抽象
- 每个页面、组件、函数只做一件事

**理由**: 小程序有包体积限制（主包 2MB），过度设计不仅增加体积，还影响加载性能和维护成本。

### II. 用户体验至上 (User Experience First)

所有功能设计必须以用户体验为首要考量：

- 页面加载时间 < 1 秒
- 操作步骤最小化，核心功能最多 3 步完成
- 视觉设计遵循微信设计规范，保持一致性
- 提供即时反馈：加载状态、成功/失败提示、空状态引导
- 支持下拉刷新、上拉加载等用户习惯的交互方式

**理由**: 用户体验决定产品留存率，复杂的操作流程会导致用户流失。

### III. 数据安全 (Data Security)

用户数据安全是不可妥协的底线：

- 所有数据存储在微信云开发数据库，自动隔离用户数据
- 数据库权限必须设置为「仅创建者可读写」
- 敏感操作（删除、批量操作）必须提供确认提示
- 云函数中验证用户身份，杜绝越权访问
- 不在前端代码中暴露敏感信息

**理由**: 资产数据属于用户隐私，数据泄露会造成严重后果。

### IV. 可维护性 (Maintainability)

代码必须易于理解和维护：

- 使用清晰的命名规范，变量/函数名反映其用途
- 每个云函数职责单一，文件不超过 200 行
- 复用组件抽取到 `components/` 目录
- 样式使用全局变量，保持主题一致性
- 修改功能时，相关代码必须同步更新

**理由**: 可维护性决定项目的长期生命力，降低技术债务积累。

### V. 云原生架构 (Cloud-Native Architecture)

充分利用微信云开发能力：

- 后端逻辑使用云函数实现，按需部署
- 数据库使用云开发数据库，无需自建服务器
- 静态资源使用云存储，CDN 加速
- 环境配置通过 `project.config.json` 管理
- 云函数按功能模块拆分，独立部署

**理由**: 云原生架构降低运维成本，自动扩展，按量付费，适合个人项目。

## 技术约束

### 技术栈限定

- **前端**: 微信小程序原生开发 (WXML, WXSS, JavaScript ES6+)
- **后端**: 微信云开发 (CloudBase)
- **数据库**: 云开发数据库 (MongoDB 兼容)
- **存储**: 云存储 (图片等资源)

### 禁止事项

- 禁止使用未审核的第三方 npm 包
- 禁止在客户端直接操作数据库（必须通过云函数）
- 禁止硬编码环境 ID（使用 `project.config.json` 配置）
- 禁止提交敏感信息（AppSecret、密钥等）到代码仓库

### 性能要求

- 主包体积 < 1.5MB（留有余量）
- 首屏渲染时间 < 800ms
- 云函数响应时间 < 500ms (p95)

## 开发流程

### 代码规范

- JavaScript 使用 ES6+ 语法
- 使用 `const`/`let`，避免 `var`
- 异步操作使用 `async/await`
- 组件采用 Behavior 混入模式复用逻辑

### 提交规范

遵循 Conventional Commits 规范：

- `feat:` 新功能
- `fix:` Bug 修复
- `refactor:` 代码重构
- `docs:` 文档更新
- `chore:` 构建/配置变更

### 测试要求

- 新增云函数必须在云开发控制台测试通过
- 数据库操作验证权限隔离
- 页面功能在模拟器和真机测试

## Governance

### 章程管理

- 章程是项目的最高准则，所有开发决策必须遵循
- 章程修订需要明确记录变更原因和影响范围
- 版本号遵循语义化版本规范：
  - MAJOR: 原则删除或重新定义
  - MINOR: 新增原则或重要章节
  - PATCH: 文字修正、澄清说明

### 合规检查

- 每个功能开发前需验证是否符合章程原则
- 代码审查必须检查章程合规性
- 发现违规代码必须及时修正

### 文档维护

- 使用 `CLAUDE.md` 提供 Claude Code 运行时指导
- 使用 `README.md` 记录项目说明和快速开始指南
- 重大变更需同步更新相关文档

**Version**: 1.0.0 | **Ratified**: 2026-03-18 | **Last Amended**: 2026-03-18