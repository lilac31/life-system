/**
 * 测试 gzip 压缩效果
 * 运行: node test-compression.js
 */

import pako from 'pako';

// 模拟真实数据
const mockData = {
  weeks: {},
  importantTasks: [],
  weeklyImportantTasks: {},
  quickTasks: {},
  taskTimeRecords: [],
  totalWorkingHours: 0,
  yearGoals: [],
  okrData: {}
};

// 生成一些模拟数据
for (let i = 0; i < 20; i++) {
  const weekKey = `2025-${i + 1}`;
  mockData.weeks[weekKey] = {
    days: {}
  };
  
  for (let j = 0; j < 7; j++) {
    mockData.weeks[weekKey].days[`2025-01-${j + 1}`] = {
      tasks: [
        { id: `task-${i}-${j}-1`, content: '这是一个测试任务，包含一些中文内容', completed: false },
        { id: `task-${i}-${j}-2`, content: 'Another task with some English content', completed: true },
        { id: `task-${i}-${j}-3`, content: '第三个任务，用于测试压缩效果', completed: false }
      ]
    };
  }
  
  mockData.importantTasks.push({
    id: `important-${i}`,
    title: `重要任务 ${i}`,
    description: '这是一个重要任务的描述，可能会很长，包含很多详细信息...',
    completed: false
  });
}

// 原始 JSON
const jsonString = JSON.stringify(mockData);
const originalSize = Buffer.byteLength(jsonString, 'utf8');

console.log('\n=================================');
console.log('📊 压缩效果测试');
console.log('=================================\n');

// 1. 无压缩
console.log(`📄 原始数据大小: ${(originalSize / 1024).toFixed(2)} KB`);

// 2. base64 编码（旧方案）
const base64Encoded = Buffer.from(jsonString).toString('base64');
const base64Size = Buffer.byteLength(base64Encoded, 'utf8');
const base64Ratio = ((1 - base64Size / originalSize) * 100).toFixed(1);
console.log(`🔤 base64 编码: ${(base64Size / 1024).toFixed(2)} KB (${base64Ratio}% 减少)`);

// 3. gzip 压缩（新方案）
const gzipped = pako.gzip(jsonString);
const gzipBase64 = Buffer.from(gzipped).toString('base64');
const gzipSize = Buffer.byteLength(gzipBase64, 'utf8');
const gzipRatio = ((1 - gzipSize / originalSize) * 100).toFixed(1);
console.log(`🗜️  gzip 压缩: ${(gzipSize / 1024).toFixed(2)} KB (${gzipRatio}% 减少) ✨\n`);

// 对比
console.log('📈 压缩效果对比:');
console.log(`   无压缩:  ${(originalSize / 1024).toFixed(2)} KB (基准)`);
console.log(`   base64:  ${(base64Size / 1024).toFixed(2)} KB (节省 ${base64Ratio}%)`);
console.log(`   gzip:    ${(gzipSize / 1024).toFixed(2)} KB (节省 ${gzipRatio}%) 🎉`);
console.log(`   gzip 比 base64 再减少: ${((1 - gzipSize / base64Size) * 100).toFixed(1)}%\n`);

// 测试解压
console.log('🔍 验证数据完整性...');
try {
  const decompressed = pako.ungzip(gzipped, { to: 'string' });
  const recoveredData = JSON.parse(decompressed);
  
  if (JSON.stringify(recoveredData) === jsonString) {
    console.log('✅ 数据解压验证成功！数据完整无损。\n');
  } else {
    console.log('❌ 数据解压后不匹配！\n');
  }
} catch (error) {
  console.error('❌ 解压失败:', error.message, '\n');
}

console.log('=================================');
console.log('💡 建议');
console.log('=================================');
if (gzipRatio > 50) {
  console.log('✅ gzip 压缩效果极佳（>50%），强烈推荐使用！');
} else if (gzipRatio > 30) {
  console.log('✅ gzip 压缩效果良好（>30%），推荐使用。');
} else {
  console.log('⚠️  gzip 压缩效果一般（<30%），可能数据已经很紧凑。');
}
console.log('=================================\n');
