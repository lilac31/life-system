// 数据恢复脚本 - 根据截图恢复原始二级分类数据
const restoredDimensions = [
  {
    id: '1',
    name: '成长挂钩',
    baseScore: 60,
    color: '#3B82F6',
    subCategories: [
      { id: '101', name: '用户增长', score: 80 },
      { id: '102', name: '工作增长', score: 40 },
      { id: '103', name: '工作增长', score: 20 }
    ]
  },
  {
    id: '2',
    name: '技能成长',
    baseScore: 60,
    color: '#10B981',
    subCategories: [
      { id: '201', name: '技术增长', score: 40 },
      { id: '202', name: '管理增长', score: 30 },
      { id: '203', name: '业务增长', score: 30 }
    ]
  },
  {
    id: '3',
    name: '健康',
    baseScore: 60,
    color: '#10B981',
    subCategories: [
      { id: '301', name: '身体健康', score: 30 }
    ]
  },
  {
    id: '4',
    name: '情感关系',
    baseScore: 60,
    color: '#10B981',
    subCategories: [
      { id: '401', name: '通友关系', score: 60 },
      { id: '402', name: '亲密关系', score: 40 },
      { id: '403', name: '家庭关系', score: 30 }
    ]
  },
  {
    id: '5',
    name: '成就感',
    baseScore: 60,
    color: '#F59E0B',
    subCategories: [
      { id: '501', name: '成就感', score: 40 },
      { id: '502', name: '被尊重', score: 60 }
    ]
  },
  {
    id: '6',
    name: '心理成长',
    baseScore: 60,
    color: '#8B5CF6',
    subCategories: [
      { id: '601', name: '小目标完成', score: 20 }
    ]
  }
];

console.log('恢复数据：', JSON.stringify(restoredDimensions, null, 2));
