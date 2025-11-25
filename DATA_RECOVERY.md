# 数据恢复指南

## 如果二级分类数据丢失

### 方法1：从浏览器控制台恢复

1. 打开浏览器开发者工具（F12）
2. 进入 Console（控制台）标签
3. 运行以下命令查看当前数据：

```javascript
// 查看当前维度数据
console.log(JSON.parse(localStorage.getItem('growthDimensions')));

// 查看云端数据
console.log(JSON.parse(localStorage.getItem('scheduleData'))?.personalDashboard);
```

### 方法2：手动添加示例二级分类

在个人成长仪表盘中，为每个维度添加二级分类：

**专业技能**：
- 前端开发
- 后端开发
- 数据库
- 架构设计

**沟通能力**：
- 口头表达
- 书面表达
- 倾听理解
- 团队协作

**领导力**：
- 决策能力
- 团队管理
- 目标规划
- 激励他人

**创新思维**：
- 问题分析
- 创意思考
- 方法改进
- 学习能力

**健康管理**：
- 运动健身
- 饮食营养
- 睡眠质量
- 心理健康

### 方法3：从备份恢复（如果有 Git 历史）

如果你的数据曾经同步到云端，可以查看 localStorage 中的 `scheduleData`：

```javascript
// 在浏览器控制台执行
const allData = JSON.parse(localStorage.getItem('scheduleData'));
if (allData.personalDashboard && allData.personalDashboard.growthDimensions) {
  console.log('找到备份数据：', allData.personalDashboard.growthDimensions);
  // 恢复数据
  localStorage.setItem('growthDimensions', JSON.stringify(allData.personalDashboard.growthDimensions));
  location.reload();
}
```

### 方法4：检查是否有历史数据

浏览器可能有历史数据缓存，打开浏览器的 Application/Storage 标签查看。

## 预防数据丢失

1. **定期导出数据**：
   - 打开浏览器控制台
   - 运行：`console.log(JSON.stringify(JSON.parse(localStorage.getItem('growthDimensions')), null, 2))`
   - 复制输出并保存到文件

2. **启用云同步**：
   - 数据会自动同步到 `scheduleData`
   - 定期提交到 GitHub

3. **浏览器备份**：
   - 使用浏览器的配置同步功能
   - 定期导出浏览器数据

## 紧急恢复脚本

如果数据完全丢失，可以在浏览器控制台运行以下脚本创建示例数据：

```javascript
const sampleDimensions = [
  {
    id: '1',
    name: '专业技能',
    baseScore: 60,
    color: '#3B82F6',
    subCategories: [
      { id: '101', name: '前端开发', score: 60 },
      { id: '102', name: '后端开发', score: 60 },
      { id: '103', name: '数据库', score: 60 }
    ]
  },
  {
    id: '2',
    name: '沟通能力',
    baseScore: 60,
    color: '#10B981',
    subCategories: [
      { id: '201', name: '口头表达', score: 60 },
      { id: '202', name: '团队协作', score: 60 }
    ]
  },
  {
    id: '3',
    name: '领导力',
    baseScore: 60,
    color: '#F59E0B',
    subCategories: [
      { id: '301', name: '决策能力', score: 60 },
      { id: '302', name: '团队管理', score: 60 }
    ]
  },
  {
    id: '4',
    name: '创新思维',
    baseScore: 60,
    color: '#8B5CF6',
    subCategories: [
      { id: '401', name: '问题分析', score: 60 },
      { id: '402', name: '创意思考', score: 60 }
    ]
  },
  {
    id: '5',
    name: '健康管理',
    baseScore: 60,
    color: '#EF4444',
    subCategories: [
      { id: '501', name: '运动健身', score: 60 },
      { id: '502', name: '饮食营养', score: 60 }
    ]
  }
];

localStorage.setItem('growthDimensions', JSON.stringify(sampleDimensions));
console.log('示例数据已创建，刷新页面查看');
location.reload();
```
