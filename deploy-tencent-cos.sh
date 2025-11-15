#!/bin/bash

# 个人日程管理系统 - 腾讯云COS部署脚本

echo "🚀 ===== 个人日程管理系统 - 腾讯云COS部署 ====="

# 加载配置文件
if [ -f "cos-deploy.conf" ]; then
    source cos-deploy.conf
else
    echo "❌ 错误：找不到 cos-deploy.conf 配置文件"
    exit 1
fi

# 检查dist目录是否存在
if [ ! -d "$dist_path" ]; then
    echo "❌ 错误：找不到dist目录，请先运行 npm run build"
    exit 1
fi

echo "✅ 步骤1: 检查环境"
if ! command -v coscli &> /dev/null; then
    echo "❌ 错误：未找到 coscli 命令"
    echo "请访问 https://cloud.tencent.com/document/product/436/65951 安装COSCLI工具"
    exit 1
fi

echo "✅ 步骤2: 构建前端应用"
npm run build

echo "✅ 步骤3: 上传文件到COS存储桶 ($bucket_name)"
# 复制优化的index.html
cp index-cos.html dist/index.html

# 上传所有文件到存储桶根目录
coscli sync $dist_path/ cos://$bucket_name/ --delete --include "*"

echo "✅ 步骤4: 设置静态网站配置"
coscli website cos://$bucket_name --index-document $index_document --error-document $error_document

echo "✅ 步骤5: 配置CDN缓存刷新"
if [ "$domain" != "your-domain.com" ]; then
    coscli cdn --domains $domain --flush
    echo "🌐 已配置CDN域名: https://$domain"
else
    echo "⚠️  请在腾讯云控制台手动配置CDN加速和自定义域名"
fi

echo "🎉 ===== 部署完成 ====="
echo "📦 存储桶地址: cos://$bucket_name.$region.myqcloud.com"
if [ "$domain" != "your-domain.com" ]; then
    echo "🌐 前端访问地址: https://$domain"
fi
echo ""
echo "📋 后续步骤："
echo "   1. 在腾讯云CDN控制台配置自定义域名"
echo "   2. 在CDN控制台申请SSL证书并启用HTTPS"
echo "   3. 在域名解析控制台添加CNAME记录"