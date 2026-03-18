#!/usr/bin/env bash

set -e

# 获取当前分支名
CURRENT_BRANCH=$(git branch --show-current)

if [ -z "$CURRENT_BRANCH" ]; then
    echo "ERROR: 无法获取当前分支名"
    exit 1
fi

# 检查是否为功能分支格式（###-feature-name）
FEATURE_NUM=$(echo "$CURRENT_BRANCH" | grep -oE '^[0-9]+' || true)

if [ -z "$FEATURE_NUM" ]; then
    echo "ERROR: 当前不在功能分支上"
    echo "功能分支格式应为: ###-feature-name (如 001-add-export)"
    echo "当前分支: $CURRENT_BRANCH"
    exit 1
fi

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "ERROR: 有未提交的更改，请先提交或暂存"
    git status --short
    exit 1
fi

echo "=========================================="
echo "功能分支: $CURRENT_BRANCH"
echo "=========================================="

# 获取合并提交信息（从参数或使用默认）
COMMIT_MSG="${1:-Merge $CURRENT_BRANCH}"

# Step 1: 切换到主分支
echo ""
echo "Step 1: 切换到 main 分支..."
git checkout main

# Step 2: 拉取最新代码
echo ""
echo "Step 2: 拉取最新代码..."
git pull origin main

# Step 3: 合并功能分支
echo ""
echo "Step 3: 合并 $CURRENT_BRANCH 到 main..."
git merge "$CURRENT_BRANCH" --no-ff -m "$COMMIT_MSG"

# Step 4: 推送到远程
echo ""
echo "Step 4: 推送到远程..."
git push origin main

# Step 5: 删除本地功能分支
echo ""
echo "Step 5: 删除本地功能分支..."
git branch -d "$CURRENT_BRANCH"

# Step 6: 删除远程功能分支（如果存在）
echo ""
echo "Step 6: 清理远程功能分支..."
if git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q .; then
    git push origin --delete "$CURRENT_BRANCH"
    echo "已删除远程分支: $CURRENT_BRANCH"
else
    echo "远程分支不存在，跳过删除"
fi

echo ""
echo "=========================================="
echo "✅ 合并完成!"
echo "  - 功能分支 $CURRENT_BRANCH 已合并到 main"
echo "  - 已推送到远程仓库"
echo "  - 功能分支已清理"
echo "=========================================="