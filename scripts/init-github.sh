#!/bin/bash

echo "🚀 CloudFlare图床项目GitHub部署初始化脚本"
echo "=========================================="

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📝 初始化Git仓库..."
git init
git add .
git commit -m "feat: 初始化CloudFlare图床项目"

echo ""
echo "✅ 本地Git仓库初始化完成！"
echo ""
echo "📋 下一步操作："
echo "1. 在GitHub上创建新的仓库"
echo "2. 将本地仓库推送到GitHub："
echo "   git remote add origin https://github.com/你的用户名/你的仓库名.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. 配置GitHub Secrets："
echo "   - CLOUDFLARE_API_TOKEN: Cloudflare API Token"
echo "   - CLOUDFLARE_ACCOUNT_ID: Cloudflare账户ID"
echo ""
echo "4. 配置环境变量："
echo "   cp .env.example .env"
echo "   # 编辑.env文件填入实际配置"
echo ""
echo "5. 在Cloudflare控制台创建R2存储桶"
echo ""
echo "💡 完成以上步骤后，每次推送到main分支都会自动部署！"