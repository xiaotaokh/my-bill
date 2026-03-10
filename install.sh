#!/bin/bash

# 安装所有云函数的依赖

echo "📦 正在安装云函数依赖..."

cd "$(dirname "$0")"

# 检查cloudfunctions目录是否存在
if [ ! -d "cloudfunctions" ]; then
  echo "❌ cloudfunctions 目录不存在"
  exit 1
fi

cd cloudfunctions

# 安装每个云函数的依赖
for func in addAsset getAssets getStats updateAsset deleteAsset; do
  if [ -d "$func" ]; then
    echo "📦 安装 $func 依赖..."
    cd "$func"
    npm install
    cd ..
    echo "✅ $func 安装完成"
  else
    echo "⚠️  $func 目录不存在，跳过"
  fi
done

echo "🎉 所有云函数依赖安装完成！"
echo ""
echo "下一步："
echo "1. 在微信开发者工具中打开项目"
echo "2. 配置云开发环境（参考：云开发配置指南.md）"
echo "3. 上传并部署所有云函数"
echo "4. 初始化数据库（创建 assets 集合）"
