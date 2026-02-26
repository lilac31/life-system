# 同步问题诊断步骤

## 📋 诊断清单

### 步骤 1: 检查 API Key 配置

**窗口 A 和 窗口 B 都执行：**

打开浏览器控制台（F12 → Console），输入：

```javascript
console.log('API Key:', localStorage.getItem('jsonbin_api_key') ? '已配置' : '未配置');
console.log('Bin ID:', localStorage.getItem('jsonbin_id'));
console.log('User ID:', localStorage.getItem('user_id'));
console.log('同步提供商:', localStorage.getItem('sync_provider'));
```

**期望结果：**
- API Key: 已配置
- Bin ID: 应该是一个 24 位字符串（如：67a1b2c3d4e5f6g7h8i9j0k1）
- User ID: 应该有值
- 同步提供商: jsonbin

---

### 步骤 2: 检查轮询状态

**在两个窗口的控制台分别输入：**

```javascript
// 检查是否在轮询
console.log('轮询状态:', window.__dataSyncService?.isPolling);
```

**期望结果：** 应该显示 `true`

---

### 步骤 3: 触发手动同步测试

**窗口 A - 添加数据后：**

控制台应该看到类似的日志：
```
📦 gzip 压缩: XX.XXKB -> X.XXKB
🚀 开始上传完整数据到 JSONBin.io
✅ Bin 更新成功
```

**窗口 B - 等待 10 秒后：**

控制台应该看到：
```
🔍 使用 /latest 端点检查云端更新...
🆕 检测到云端数据更新，开始同步...
📦 检测到压缩数据，开始解压...
✅ 云端数据已同步到本地
```

---

### 步骤 4: 检查是否有错误

查看控制台是否有红色错误信息，常见问题：

#### 错误 1: 未配置 API Key
```
⚠️ 未配置 JSONBin API Key，跳过云端检查
```
**解决**: 在同步设置中配置 API Key

#### 错误 2: Bin ID 不匹配
```
📭 未找到云端 Bin，跳过检查
```
**解决**: 两个窗口需要使用相同的 Bin ID

#### 错误 3: 请求失败
```
❌ 下载请求失败: 401
```
**解决**: API Key 无效或过期

---

### 步骤 5: 强制刷新测试

**在窗口 B 执行：**

```javascript
// 强制触发一次云端检查
location.reload();
```

刷新后应该会自动同步最新数据。

---

## 🔍 常见问题排查

### 问题 1: 两个窗口的 Bin ID 不一致

**检查方法：**
```javascript
// 在窗口 A
console.log('A 窗口 Bin ID:', localStorage.getItem('jsonbin_id'));

// 在窗口 B
console.log('B 窗口 Bin ID:', localStorage.getItem('jsonbin_id'));
```

**解决：**
如果不一致，在窗口 B 设置为窗口 A 的 Bin ID：
```javascript
localStorage.setItem('jsonbin_id', '这里粘贴窗口A的Bin ID');
location.reload();
```

---

### 问题 2: API Key 未配置

**检查：**
```javascript
console.log(localStorage.getItem('jsonbin_api_key'));
```

**解决：**
去同步设置中配置 API Key

---

### 问题 3: 轮询未启动

**检查控制台是否有：**
```
启动云端数据轮询，间隔: 10000 ms
```

如果没有，刷新页面。

---

## 🧪 完整测试脚本

**复制到控制台运行：**

```javascript
console.log('========== 同步诊断信息 ==========');
console.log('API Key:', localStorage.getItem('jsonbin_api_key') ? '✅ 已配置' : '❌ 未配置');
console.log('Bin ID:', localStorage.getItem('jsonbin_id') || '❌ 未设置');
console.log('User ID:', localStorage.getItem('user_id') || '❌ 未设置');
console.log('同步提供商:', localStorage.getItem('sync_provider') || '❌ 未设置');
console.log('最后同步时间:', localStorage.getItem('last_sync') || '从未同步');
console.log('最后云端更新时间:', localStorage.getItem('last_cloud_update') || '未知');
console.log('=====================================');
```

---

## 📸 请截图并告诉我

1. **窗口 A** 的诊断信息截图
2. **窗口 B** 的诊断信息截图
3. 控制台是否有**红色错误**信息

我会根据你的诊断结果提供精确的解决方案！
