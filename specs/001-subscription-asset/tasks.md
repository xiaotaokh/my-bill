# Tasks: 订阅类资产 (Subscription Asset)

**Input**: Design documents from `/specs/001-subscription-asset/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **WeChat Mini Program**: `pages/`, `cloudfunctions/` at repository root

---

## Phase 1: Setup

**Purpose**: 准备开发环境和理解现有代码

- [x] T001 阅读现有资产数据模型和云函数代码，理解当前实现逻辑
- [x] T002 阅读现有 asset-add 页面代码，理解表单结构和验证逻辑
- [x] T003 阅读现有 index 页面代码，理解列表展示和统计计算逻辑

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基础设施，必须在所有用户故事之前完成

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 修改 cloudfunctions/addAsset/index.js，新增订阅资产字段支持和验证逻辑
- [x] T005 修改 cloudfunctions/updateAsset/index.js，支持订阅资产更新和金额变更历史记录

**Checkpoint**: 云函数支持订阅资产存储 → 用户故事实现可以开始

---

## Phase 3: User Story 1 - 新增订阅资产 (Priority: P1) 🎯 MVP

**Goal**: 用户可以新增订阅类资产，设置周期和金额，系统自动计算日均成本

**Independent Test**: 用户新增月度订阅资产后，列表显示"订阅"标签，日均成本为 periodAmount/periodDays

### Implementation for User Story 1

- [x] T006 [P] [US1] 修改 pages/asset-add/asset-add.js，新增 assetType、periodAmount、periodType、periodDays、pendingSubscription、subscriptionStartDate 数据字段
- [x] T007 [P] [US1] 修改 pages/asset-add/asset-add.js，新增 onAssetTypeChange、onPeriodTypeChange、onPeriodAmountInput、onPendingSubscriptionChange 事件处理函数
- [x] T008 [US1] 修改 pages/asset-add/asset-add.js，新增 validateSubscriptionForm 验证函数，验证周期天数范围(1-365)和每期金额
- [x] T009 [US1] 修改 pages/asset-add/asset-add.js，更新 onSubmit 函数，区分普通资产和订阅资产的提交数据
- [x] T010 [P] [US1] 修改 pages/asset-add/asset-add.wxml，新增资产类型选择区域（普通资产/订阅资产）
- [x] T011 [P] [US1] 修改 pages/asset-add/asset-add.wxml，新增订阅设置区域（每期金额、周期类型、周期天数）
- [x] T012 [US1] 修改 pages/asset-add/asset-add.wxml，新增"待订阅"开关和开始日期选择器
- [x] T013 [P] [US1] 修改 pages/asset-add/asset-add.wxss，新增资产类型选择器样式和订阅设置区域样式

**Checkpoint**: 用户可以新增订阅资产，数据正确保存到数据库

---

## Phase 4: User Story 2 - 编辑订阅资产 (Priority: P2)

**Goal**: 用户可以编辑订阅资产，支持金额变更和结束订阅

**Independent Test**: 用户编辑订阅资产金额后，日均成本更新，总投入分段计算

### Implementation for User Story 2

- [x] T014 [US2] 修改 pages/asset-add/asset-add.js loadAssetDetail 函数，支持加载订阅资产数据回显
- [x] T015 [US2] 修改 pages/asset-add/asset-add.js，编辑模式下切换资产类型时保留订阅字段数据
- [x] T016 [US2] 修改 pages/asset-add/asset-add.js，更新 onSubmit 函数，编辑订阅资产时记录金额变更历史到 amountHistory
- [x] T017 [US2] 修改 pages/asset-add/asset-add.wxml，新增"结束订阅"开关和结束日期选择器（编辑模式专用）
- [x] T018 [US2] 修改 pages/asset-add/asset-add.js，新增 onEndSubscriptionChange 事件处理函数，处理订阅结束逻辑

**Checkpoint**: 用户可以编辑订阅资产，金额变更历史正确记录

---

## Phase 5: User Story 3 - 订阅资产统计展示 (Priority: P2)

**Goal**: 首页正确展示订阅资产统计，包括日均成本和动态累计总投入

**Independent Test**: 首页统计正确包含订阅资产，显示合理的总资产和日均成本

### Implementation for User Story 3

- [x] T019 [P] [US3] 修改 pages/index/index.js，新增 getPeriodDays 辅助函数，根据 periodType 返回周期天数
- [x] T020 [P] [US3] 修改 pages/index/index.js，新增 calculateSubscriptionDailyCost 函数，计算订阅资产日均成本
- [x] T021 [US3] 修改 pages/index/index.js calculateAssetFields 函数，区分普通资产和订阅资产的日均成本计算逻辑
- [x] T022 [US3] 修改 pages/index/index.js calculateStats 函数，订阅资产日均成本加入统计总和
- [x] T023 [P] [US3] 修改 pages/index/index.wxml，资产列表项新增"订阅"标签显示（assetType === 'subscription'）
- [x] T024 [P] [US3] 修改 pages/index/index.wxml，资产列表项新增"待生效"标签显示（subscriptionStatus === 'pending'）
- [x] T025 [P] [US3] 修改 pages/index/index.wxss，新增订阅标签和待生效标签样式

**Checkpoint**: 首页统计正确，订阅资产在列表中可区分

---

## Phase 6: 资产详情页支持

**Purpose**: 资产详情页正确显示订阅资产信息

- [x] T026 [P] 修改 pages/asset-detail/asset-detail.js，新增订阅资产专属字段的展示数据计算（日均成本、总投入、周期信息）
- [x] T027 [P] 修改 pages/asset-detail/asset-detail.js calculateDisplayInfo 函数，区分订阅资产和普通资产的计算逻辑
- [x] T028 [P] 修改 pages/asset-detail/asset-detail.wxml，新增订阅资产专属信息区域（周期类型、每期金额、总投入、订阅状态）
- [x] T029 [P] 修改 pages/asset-detail/asset-detail.wxss，新增订阅资产详情样式

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 优化和边缘情况处理

- [x] T030 处理边缘情况：订阅开始日期在未来时不计入统计
- [x] T031 处理边缘情况：自定义周期输入验证（1-365天范围）
- [x] T032 处理边缘情况：订阅跨越多年时的周期数计算
- [ ] T033 [P] 测试：新增普通资产验证兼容性
- [ ] T034 [P] 测试：新增月度订阅资产验证功能
- [ ] T035 [P] 测试：新增年度订阅资产验证功能
- [ ] T036 [P] 测试：新增自定义周期订阅资产验证功能
- [ ] T037 测试：编辑订阅资产金额变更历史功能
- [ ] T038 测试：首页统计包含订阅资产

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
- **Asset Detail (Phase 6)**: Can run in parallel with User Story 3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 (needs add page structure ready)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of US1/US2

### Parallel Opportunities

- T006, T007 can run in parallel (different functions in same file)
- T010, T011 can run in parallel (different sections in WXML)
- T019, T020 can run in parallel (different helper functions)
- T023, T024 can run in parallel (different label components)
- T026, T027, T028 can run in parallel (different aspects of detail page)
- T033-T036 can run in parallel (independent test scenarios)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Cloud functions ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files/functions, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence