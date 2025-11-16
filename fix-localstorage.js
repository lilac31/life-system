// 在浏览器控制台运行此脚本来修复 yearGoals 格式
(function() {
  console.log('🔧 开始修复 localStorage 中的 yearGoals 格式...');
  
  const yearGoals = localStorage.getItem('yearGoals');
  
  if (!yearGoals) {
    console.log('✅ yearGoals 不存在，设置为空数组');
    localStorage.setItem('yearGoals', JSON.stringify([]));
    return;
  }
  
  try {
    const parsed = JSON.parse(yearGoals);
    
    if (Array.isArray(parsed)) {
      console.log('✅ yearGoals 已经是数组格式，无需修复');
      console.log('当前数据:', parsed);
    } else {
      console.warn('⚠️  yearGoals 是对象格式，需要转换为数组');
      console.log('旧数据:', parsed);
      localStorage.setItem('yearGoals', JSON.stringify([]));
      console.log('✅ 已重置为空数组');
    }
  } catch (e) {
    console.error('❌ 解析 yearGoals 失败:', e);
    localStorage.setItem('yearGoals', JSON.stringify([]));
    console.log('✅ 已重置为空数组');
  }
  
  console.log('🎉 修复完成！请刷新页面。');
})();
