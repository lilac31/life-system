# 个人日程管理系统 - 腾讯云部署指南

## 🚀 一键部署到腾讯云

### 准备工作

1. 注册并登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 确保账户已实名认证
3. 准备一个自定义域名（可选）

### 部署步骤

#### 第一步：安装腾讯云COSCLI工具

```bash
# macOS
brew install coscli

# Linux
curl -sSL https://websoft9.github.io/stackhub/scripts/install_coscli.sh | bash

# Windows
# 下载：https://github.com/tencentyun/coscli/releases
```

#### 第二步：配置COSCLI

```bash
coscli configure
# 输入你的腾讯云Secret ID、Secret Key和默认地域
```

#### 第三步：修改配置文件

编辑 `cos-deploy.conf` 文件，设置你的配置：

```bash
bucket_name="your-unique-bucket-name"  # 改为唯一的存储桶名称
region="ap-beijing"                     # 改为你选择的地域
domain="your-domain.com"               # 改为你的域名
```

#### 第四步：运行部署脚本

```bash
chmod +x deploy-tencent-cos.sh
./deploy-tencent-cos.sh
```

### 🌐 访问你的应用

部署完成后：

1. 进入 [腾讯云CDN控制台](https://console.cloud.tencent.com/cdn)
2. 创建新的CDN域名，指向你的COS存储桶
3. 开启HTTPS并申请免费SSL证书
4. 在域名解析控制台添加CNAME记录

几分钟后，你就可以通过自定义域名访问你的个人日程管理系统了！

### 💡 小贴士

- 应用数据存储在浏览器本地，无需数据库
- 整个部署过程通常在10分钟内完成
- 腾讯云提供50GB免费存储和10GB免费CDN流量
- 如需更新应用，只需重新运行部署脚本

### 🔧 故障排查

如果遇到问题，请查看：
- 存储桶是否开启静态网站功能
- CDN域名是否正确配置
- 域名解析是否生效

---

**需要帮助？** 查看 `TENCENT-DEPLOYMENT.md` 获取更详细的部署指南