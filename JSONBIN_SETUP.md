# JSONBin.io 云端同步设置指南

## 🎯 概述

本系统已切换为使用 **JSONBin.io** 作为云端存储服务，替代之前的 GitHub API。

## 📝 为什么改用 JSONBin.io？

- ✅ 专注于 JSON 数据存储
- ✅ API 更简单易用
- ✅ 免费配额足够个人使用
- ✅ 不需要 GitHub 账号

## 🚀 快速开始

### 1️⃣ 获取 JSONBin API Key

1. 访问 [JSONBin.io](https://jsonbin.io)
2. 点击右上角 **Sign Up** 注册账号（或登录）
3. 登录后，在控制台找到 **API Keys** 部分
4. 点击 **Create Access Key**
5. 选择 **Master Key** 权限（需要读写权限）
6. 复制生成的 API Key（格式类似：`$2a$10...`）

### 2️⃣ 在应用中配置

1. 打开应用，首次使用会自动弹出设置界面
2. 将复制的 API Key 粘贴到输入框
3. 点击 **保存 API Key** 按钮
4. 等待验证成功

### 3️⃣ 开始使用

- 配置成功后，所有数据会自动同步到云端
- 在其他设备上使用相同的 API Key 即可同步数据
- 数据会每 30 秒自动检查更新

## 🔧 手动触发同步

如果需要立即同步数据：
1. 点击界面右上角的同步状态图标
2. 等待同步完成

## 📊 数据说明

系统会自动同步以下数据：
- ✅ 周重要任务（weeklyImportantTasks）
- ✅ 快速任务（quickTasks）
- ✅ 时间记录（taskTimeRecords）
- ✅ 周数据（weeks）
- ✅ 年度目标（yearGoals）
- ✅ 总工作时间（totalWorkingHours）

## ⚠️ 注意事项

1. **API Key 安全**：请妥善保管你的 API Key，不要分享给他人
2. **免费配额**：JSONBin 免费版有请求次数限制，正常使用足够
3. **数据安全**：数据以私有 Bin 方式存储，只有持有 API Key 的人可以访问
4. **离线模式**：没有网络时，数据会保存在本地，联网后自动同步

## 🔄 从 GitHub 迁移

如果你之前使用 GitHub API：

1. 系统会自动清除旧的 GitHub 配置
2. 使用新的 JSONBin API Key 配置
3. 本地数据会保留并上传到 JSONBin
4. 无需手动迁移数据

## 🐛 故障排除

### 同步失败
1. 检查 API Key 是否正确
2. 检查网络连接
3. 查看浏览器控制台错误信息

### API Key 无效
1. 确认复制的 API Key 完整
2. 确认选择的是 **Master Key** 权限
3. 在 JSONBin 控制台重新生成新的 Key

### 数据未同步
1. 打开浏览器控制台（F12）
2. 查看是否有错误信息
3. 手动点击同步按钮尝试

## 💡 技术细节

### 数据格式
```json
{
  "data": {
    "weeklyImportantTasks": {...},
    "quickTasks": {...},
    "taskTimeRecords": {...},
    ...
  },
  "metadata": {
    "userId": "user_xxx",
    "lastUpdated": "2025-11-16T...",
    "version": "2.0",
    "dataKeys": [...]
  }
}
```

### API 端点
- 创建/更新：`PUT https://api.jsonbin.io/v3/b/{binId}`
- 读取：`GET https://api.jsonbin.io/v3/b/{binId}/latest`
- 元数据：`GET https://api.jsonbin.io/v3/b/{binId}/meta`

### 轮询机制
- 每 30 秒自动检查云端数据更新
- 检测到更新时自动下载并合并数据
- 合并策略：云端数据优先

## 📞 支持

如有问题，请查看浏览器控制台日志，或联系开发者。
