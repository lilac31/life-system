# 日程管理系统 - 腾讯云部署指南

本指南将帮助您将日程管理系统部署到腾讯云上，实现数据的云端存储和同步。

## 目录

1. [整体架构](#整体架构)
2. [前端部署](#前端部署)
3. [后端部署](#后端部署)
4. [数据库设置](#数据库设置)
5. [环境变量配置](#环境变量配置)
6. [域名和SSL证书](#域名和ssl证书)
7. [常见问题](#常见问题)

## 整体架构

系统采用前后端分离架构：

- **前端**: React应用，部署到腾讯云静态网站托管（COS + CDN）
- **后端**: Node.js + Express API，部署到腾讯云云服务器（CVM）或云函数（SCF）
- **数据库**: MongoDB，使用腾讯云文档数据库（MongoDB）
- **认证**: JWT Token实现用户认证

## 前端部署

### 方案1：腾讯云静态网站托管（推荐）

1. 登录腾讯云控制台
2. 进入"对象存储"服务
3. 创建一个新的存储桶（Bucket）
4. 设置静态网站选项：
   - 开启静态网站
   - 索引文档：`index.html`
   - 错误文档：`index.html`

5. 构建前端应用：
   ```bash
   cd /Users/nono/CodeBuddy/20251115002302
   npm run build
   ```

6. 将构建后的`dist`文件夹中的所有文件上传到存储桶

7. 配置CDN加速：
   - 进入"内容分发网络"服务
   - 创建新的CDN域名，指向您的存储桶
   - 开启HTTPS，配置SSL证书

### 方案2：腾讯云云开发（Serverless）

1. 进入腾讯云"云开发"控制台
2. 创建新的云开发环境
3. 开启静态网站托管
4. 上传构建后的文件

## 后端部署

### 方案1：腾讯云云服务器CVM（推荐）

1. 创建云服务器：
   - 选择合适的配置（最低建议：2核4GB）
   - 选择操作系统（推荐Ubuntu 20.04）
   - 配置安全组，开放3000端口

2. 连接服务器并安装Node.js：
   ```bash
   # 更新包列表
   sudo apt update
   
   # 安装Node.js 18.x
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 验证安装
   node -v
   npm -v
   ```

3. 安装PM2进程管理器：
   ```bash
   sudo npm install pm2 -g
   ```

4. 部署后端代码：
   ```bash
   # 创建应用目录
   mkdir -p /var/www/schedule-api
   cd /var/www/schedule-api
   
   # 克隆或上传后端代码
   # 如果使用git:
   git clone <your-repo-url> .
   
   # 安装依赖
   npm install
   
   # 创建环境变量文件
   nano .env
   ```

5. 创建PM2配置文件：
   ```bash
   nano ecosystem.config.js
   ```

   ```javascript
   module.exports = {
     apps: [{
       name: 'schedule-api',
       script: 'server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       env_file: '.env'
     }]
   };
   ```

6. 启动应用：
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### 方案2：腾讯云云函数SCF

1. 进入腾讯云"云函数"控制台
2. 创建新的函数：
   - 选择"自定义创建"
   - 运行环境：Node.js 18.x
   - 提交方法：代码包上传

3. 配置函数：
   - 内存：256MB
   - 执行超时：60秒
   - 环境变量配置（见下文）

4. 配置API网关触发器：
   - 创建API网关
   - 配置路由映射到云函数
   - 开启认证（如需要）

## 数据库设置

使用腾讯云文档数据库（MongoDB）：

1. 进入腾讯云"文档数据库MongoDB"控制台
2. 创建新的实例：
   - 选择合适的配置
   - 设置用户名和密码
   - 记录连接地址

3. 配置网络：
   - 创建私有网络和子网
   - 配置安全组，开放27017端口
   - 如果后端在CVM，确保CVM和MongoDB在同一VPC

4. 连接数据库验证：
   ```bash
   # 在服务器上安装MongoDB客户端
   sudo apt install mongodb-clients
   
   # 连接测试
   mongo "mongodb://username:password@your-mongodb-address:27017/your-db-name"
   ```

## 环境变量配置

在后端服务器的`.env`文件中配置以下环境变量：

```env
# 服务器配置
NODE_ENV=production
PORT=3000

# JWT密钥（生产环境使用复杂的随机字符串）
JWT_SECRET=your-super-secret-jwt-key-here

# MongoDB连接字符串
MONGODB_URI=mongodb://username:password@your-mongodb-address:27017/schedule-app

# CORS设置（前端域名）
CORS_ORIGIN=https://your-frontend-domain.com
```

## 域名和SSL证书

### 1. 注册域名

在腾讯云或任何域名注册商注册您的域名。

### 2. 配置DNS解析

进入腾讯云"域名解析"服务：

1. 添加前端域名解析：
   - 记录类型：CNAME
   - 主机记录：@（或www）
   - 记录值：CDN域名

2. 添加API域名解析：
   - 记录类型：A
   - 主机记录：api（或您想要的子域名）
   - 记录值：CVM公网IP

### 3. 配置SSL证书

1. 进入腾讯云"SSL证书"服务
2. 申请免费证书或购买证书
3. 下载证书并配置到：
   - CDN服务（前端）
   - Nginx/Apache（后端，如果使用）

## 前端配置

更新前端代码中的API地址：

1. 创建`.env.production`文件：
   ```env
   REACT_APP_API_URL=https://api.yourdomain.com/api
   ```

2. 重新构建前端：
   ```bash
   npm run build
   ```

3. 将构建后的文件重新上传到COS

## 测试部署

1. 访问前端域名，确认应用正常加载
2. 尝试注册和登录功能
3. 创建和编辑任务，验证数据同步
4. 检查移动端适配

## 监控和维护

1. 设置云监控：
   - 监控CVM的CPU和内存使用率
   - 设置警报阈值

2. 定期备份数据库：
   ```bash
   # 创建MongoDB备份脚本
   # 设置定时任务
   ```

3. 更新应用：
   ```bash
   # 拉取最新代码
   git pull origin main
   
   # 安装新依赖
   npm install
   
   # 重启服务
   pm2 restart schedule-api
   ```

## 常见问题

### Q: 如何解决CORS跨域问题？
A: 确保后端正确配置了CORS中间件，并且`CORS_ORIGIN`环境变量包含前端域名。

### Q: 如何设置数据库索引以提高性能？
A: 在MongoDB中为常用查询字段创建索引：
```javascript
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.schedules.createIndex({ "userId": 1 })
```

### Q: 如何实现数据备份？
A: 使用腾讯云数据库备份功能，或定期导出数据：
```bash
mongodump --uri="mongodb://username:password@your-mongodb-address:27017/your-db-name" --out=/path/to/backup
```

### Q: 如何扩展后端以应对高并发？
A: 使用PM2集群模式，并在云服务器前添加负载均衡器（CLB）。

### Q: 如何实现文件上传功能？
A: 使用腾讯云COS SDK，将文件直接上传到存储桶，而不是通过后端。

---

完成以上步骤后，您的日程管理系统将成功部署到腾讯云，并实现数据的云端存储和同步。如有问题，请查看日志或联系腾讯云技术支持。