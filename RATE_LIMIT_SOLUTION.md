# GitHub API 速率限制解决方案

## 🚨 错误说明

```
API rate limit exceeded for user ID 192130909
```

这个错误表示你的 GitHub 账号在当前时间窗口内 API 请求次数已超出限制。

## 📊 GitHub API 限制

### 速率限制规则

| API 类型 | 未认证 | 已认证（Token） |
|---------|--------|---------------|
| 核心 API | 60次/小时 | 5000次/小时 |
| 搜索 API | 10次/分钟 | 30次/分钟 |
| GraphQL | - | 5000点/小时 |

**重要**：即使使用了 Token，如果频繁调用，仍然可能超出限制。

## 🔍 如何查看 API 使用情况

### 方法1：使用调试器（已添加）

1. 刷新页面
2. 查看调试器（右下角蓝色面板）
3. 顶部会显示"⚡ API 速率限制"区域
4. 显示：
   - 剩余请求次数
   - 总配额
   - 重置时间

### 方法2：手动查询 API

在浏览器控制台执行：

```javascript
const token = localStorage.getItem('github_token');

fetch('https://api.github.com/rate_limit', {
  headers: {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('核心 API 限制:', data.resources.core);
  console.log('剩余次数:', data.resources.core.remaining);
  console.log('总配额:', data.resources.core.limit);
  console.log('重置时间:', new Date(data.resources.core.reset * 1000).toLocaleString());
});
```

### 方法3：通过 curl 命令

```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
     https://api.github.com/rate_limit
```

### 方法4：查看响应头

每次 GitHub API 请求的响应头都会包含：

```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1234567890
X-RateLimit-Used: 1
```

## ⚠️ 为什么会超出限制

### 可能的原因

1. **频繁测试**
   - 多次点击"测试上传同步"
   - 反复刷新页面导致初始化请求

2. **轮询间隔太短**
   - 之前设置的10秒轮询
   - 每小时会产生 360 次请求

3. **多个标签页**
   - 同时打开多个页面
   - 每个页面都在独立轮询

4. **其他应用**
   - 同一个 Token 被其他应用使用
   - 多个开发项目共用一个 Token

## ✅ 解决方案

### 立即解决（等待重置）

1. **查看重置时间**
   - 在调试器中查看"重置时间"
   - 或使用上面的 API 查询

2. **等待限制重置**
   - GitHub API 限制每小时重置一次
   - 计算还需等待多久：`(reset_timestamp * 1000 - Date.now()) / 60000` 分钟

3. **暂停使用**
   - 在重置时间到达前，避免使用应用
   - 或暂时禁用云同步

### 长期解决（已优化）

我已经进行了以下优化：

#### 1. 增加轮询间隔

```javascript
// 从 10 秒改为 30 秒
dataSyncService.startPolling(30000);
```

**效果**：
- 之前：每小时 360 次请求
- 现在：每小时 120 次请求
- 节省：66% 的 API 调用

#### 2. 添加 API 监控

调试器会实时显示：
- 剩余 API 配额
- 何时重置
- 警告提示（配额<100时）

#### 3. 智能同步

只在数据真正变化时才上传：
```javascript
if (JSON.stringify(cloudData) !== JSON.stringify(localData)) {
  // 才执行合并和通知
}
```

### 进一步优化建议

#### 方案1：使用专用 Token

为这个应用创建单独的 Token：

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 命名：`life-system-sync-only`
4. 只勾选 `gist` 权限
5. 生成并使用这个新 Token

**好处**：不会影响其他应用的 API 配额

#### 方案2：增加轮询间隔

如果不需要实时性，可以进一步增加：

```javascript
// 在 src/services/apiService.js 中修改
dataSyncService.startPolling(60000);  // 60秒 = 1分钟
// 或
dataSyncService.startPolling(120000); // 120秒 = 2分钟
```

#### 方案3：手动同步模式

完全禁用自动轮询，改为手动同步：

1. 点击右上角同步状态
2. 点击"立即同步"
3. 只在需要时才同步

修改代码（在 `apiService.js` 的 `useDataSync`）：
```javascript
// 注释掉自动启动轮询
// dataSyncService.startPolling(30000);

// 只保留手动同步功能
```

#### 方案4：使用 GitHub App

如果是团队使用，可以考虑创建 GitHub App：
- 更高的 API 限制
- 更好的权限控制
- 但配置更复杂

## 📊 监控 API 使用

### 在调试器中查看

刷新页面后，调试器会显示：

```
⚡ API 速率限制
核心 API: 4850 / 5000
重置时间: 14:30:00

✅ 配额充足
```

或者：

```
⚡ API 速率限制
核心 API: 50 / 5000
重置时间: 14:30:00

⚠️ API 配额即将用完！请等待重置后再使用。
```

或者：

```
⚡ API 速率限制
核心 API: 0 / 5000
重置时间: 14:30:00

🚫 API 配额已用完！距离重置还有 25 分钟
```

### 设置警告阈值

可以在代码中添加自动停止轮询：

```javascript
// 在 checkCloudUpdates 开始时添加
const token = this.getApiKey();
const rateLimitResponse = await fetch('https://api.github.com/rate_limit', {
  headers: { 'Authorization': `token ${token}` }
});
const rateLimit = await rateLimitResponse.json();

if (rateLimit.resources.core.remaining < 100) {
  console.warn('API 配额不足，暂停轮询');
  this.stopPolling();
  return;
}
```

## 🎯 最佳实践

### 开发阶段

1. **使用较长的轮询间隔**（60秒或更长）
2. **关闭不用的标签页**
3. **使用专用 Token**
4. **定期检查 API 配额**

### 生产环境

1. **轮询间隔设置为 2-5 分钟**
2. **实现指数退避**（API 失败时逐渐增加间隔）
3. **添加配额监控和告警**
4. **考虑使用 WebSocket 或 Server-Sent Events**（需要后端）

## 🔧 当前配置

已优化为：

- ✅ 轮询间隔：30秒
- ✅ API 配额监控：实时显示
- ✅ 智能合并：避免不必要的更新
- ✅ 错误处理：配额不足时自动跳过

**每小时 API 调用估算**：
- 轮询检查：120次
- 数据上传：根据修改次数（约10-20次）
- 总计：约 130-140 次/小时
- **剩余配额：4860+ 次（足够使用）**

## ℹ️ 补充说明

### 查看所有使用此 Token 的应用

1. 访问 https://github.com/settings/tokens
2. 点击你的 Token
3. 查看"Recent activity"（如果有）
4. GitHub 不会显示具体哪个应用在使用，但会显示 API 调用历史

### 撤销并重新创建 Token

如果怀疑 Token 被滥用：

1. 访问 https://github.com/settings/tokens
2. 找到对应的 Token
3. 点击"Delete"删除
4. 生成新的 Token
5. 在应用中更新

## 🆘 紧急情况

如果现在就需要使用：

### 选项1：创建新 Token

立即创建一个新的 Token（不会受限制）：

1. https://github.com/settings/tokens/new
2. 勾选 `gist`
3. 生成并使用

### 选项2：使用其他 GitHub 账号

如果有其他 GitHub 账号：

1. 用另一个账号登录
2. 创建 Token
3. 使用新 Token

### 选项3：禁用云同步

暂时只使用本地存储：

1. 清除 Token 配置
2. 选择"跳过云同步"
3. 数据只保存在本地

## 📞 需要帮助？

如果还有问题，请告诉我：

1. 调试器显示的 API 配额数字
2. 重置时间还有多久
3. 是否有其他应用在使用同一个 Token
