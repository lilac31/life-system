# 简化多端同步指南 ✨

## 🎉 重大更新：一键多端同步

现在多端同步变得超级简单！您只需要设置一次 **API Key**，系统会自动处理其余所有事情。

---

## 📝 新的工作原理

### 核心改进
1. **基于 API Key 自动生成用户ID**
   - 使用 SHA-256 哈希算法基于您的 API Key 生成稳定的用户ID
   - 同一个 API Key 在所有设备上生成**完全相同**的用户ID
   - 无需手动复制粘贴用户ID

2. **自动同步**
   - 所有使用相同 API Key 的设备自动共享同一个用户ID
   - 数据自动在所有设备间同步
   - 真正的"一次设置，处处同步"

---

## 🚀 快速开始

### 步骤 1：获取 JSONBin API Key（一次性）

1. 访问 [JSONBin.io](https://jsonbin.io)
2. 注册或登录账号（免费）
3. 在控制台找到 **API Keys** 部分
4. 创建新的 **Master Key**
5. 复制生成的 API Key

### 步骤 2：在每台设备上配置

**在第一台设备上：**
1. 点击 "🔧 同步设置" 按钮
2. 粘贴您的 API Key
3. 点击 "验证并保存 API Key"
4. ✅ 完成！系统会自动生成用户ID

**在其他设备上：**
1. 点击 "🔧 同步设置" 按钮
2. 粘贴**相同的** API Key
3. 点击 "验证并保存 API Key"
4. ✅ 完成！系统会自动生成**相同的**用户ID并同步数据

---

## 🔑 关键优势

### ✅ 之前（复杂）
- 设置 API Key
- 在第一台设备生成用户ID
- 复制用户ID到备忘录
- 在其他设备手动粘贴用户ID
- 容易出错（复制不完整、多余空格等）

### ✨ 现在（简单）
- 设置 API Key
- ✅ 搞定！

---

## 🔒 安全性说明

### 用户ID生成方式
```
API Key → SHA-256 哈希 → 取前16位 → user_[hash]
```

**示例：**
- API Key: `$2b$10$abc123xyz...`
- 生成的用户ID: `user_1a2b3c4d5e6f7890`

**特点：**
- ✅ 确定性：同一个 API Key 总是生成相同的用户ID
- ✅ 唯一性：不同的 API Key 生成不同的用户ID
- ✅ 不可逆：无法从用户ID反推 API Key
- ✅ 稳定性：即使重装应用也会生成相同的用户ID

---

## 📱 多设备同步示例

### 场景：您有 3 台设备

**设备 A（电脑）**
- 配置 API Key: `xxx123`
- 自动生成用户ID: `user_a1b2c3d4e5f6g7h8`
- 添加了一些任务

**设备 B（平板）**
- 配置**相同的** API Key: `xxx123`
- 自动生成**相同的**用户ID: `user_a1b2c3d4e5f6g7h8`
- 自动下载设备A的数据 ✅

**设备 C（手机）**
- 配置**相同的** API Key: `xxx123`
- 自动生成**相同的**用户ID: `user_a1b2c3d4e5f6g7h8`
- 自动下载所有数据 ✅

所有设备现在保持同步！🎉

---

## ❓ 常见问题

### Q1: 如果我更换了 API Key 会怎样？
**A:** 系统会检测到 API Key 变更，生成新的用户ID，并清除旧的云端数据。您将从新的数据集开始。

### Q2: 如果我在不同设备使用不同的 API Key？
**A:** 每个 API Key 会生成不同的用户ID，因此数据不会同步。请确保所有设备使用相同的 API Key。

### Q3: 我可以看到自动生成的用户ID吗？
**A:** 可以！在 "🔧 同步设置" 界面，配置完 API Key 后会显示自动生成的用户ID（只读）。

### Q4: 自动生成的用户ID会变化吗？
**A:** 不会！只要您使用相同的 API Key，生成的用户ID永远相同。

### Q5: 这样安全吗？
**A:** 安全！我们使用 SHA-256 加密哈希，无法从用户ID反推您的 API Key。

---

## 🔧 技术细节

### 用户ID生成代码
```javascript
async generateUserIdFromApiKey(apiKey) {
  // 使用 Web Crypto API 生成 SHA-256 哈希
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 取前16位作为用户ID
  return `user_${hashHex.substring(0, 16)}`;
}
```

### 自动同步流程
1. 用户输入 API Key
2. 系统验证 API Key（创建测试 Bin）
3. 系统基于 API Key 生成用户ID（SHA-256）
4. 保存 API Key 和用户ID 到 localStorage
5. 初始化同步服务
6. 尝试从云端下载数据
7. 如果云端有数据 → 下载并合并
8. 如果云端无数据 → 上传本地数据

---

## 🎯 总结

**之前需要：** 5 个步骤，手动复制粘贴用户ID
**现在只需：** 2 个步骤，粘贴 API Key

**多设备同步从未如此简单！** ✨

---

## 📞 遇到问题？

如果遇到任何问题：
1. 确保所有设备使用**完全相同**的 API Key
2. 检查网络连接
3. 查看浏览器控制台的日志信息
4. 尝试点击 "更换 API Key" 重新配置

祝您使用愉快！🎉
