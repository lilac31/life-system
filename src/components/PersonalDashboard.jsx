import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const PersonalDashboard = ({ onBack }) => {
  // 状态管理
  const [dimensions, setDimensions] = useState([]);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [isAddingDimension, setIsAddingDimension] = useState(false);
  const [isAddingDiary, setIsAddingDiary] = useState(false);
  const [newDimensionName, setNewDimensionName] = useState('');
  const [editingDimensionId, setEditingDimensionId] = useState(null);
  const [editingDimensionName, setEditingDimensionName] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [managingSubCategoriesId, setManagingSubCategoriesId] = useState(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [editingSubCategoryId, setEditingSubCategoryId] = useState(null);
  const [editingSubCategoryName, setEditingSubCategoryName] = useState('');
  const [energyRecords, setEnergyRecords] = useState([]);
  const [todayEnergy, setTodayEnergy] = useState(null);
  
  // 新日记表单
  const [newDiary, setNewDiary] = useState({
    content: '',
    selectedDimension: '',
    selectedSubCategory: '',
    points: 1,
    date: new Date()
  });

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedDimensions = localStorage.getItem('growthDimensions');
    const savedDiaries = localStorage.getItem('growthDiaries');
    const savedEnergyRecords = localStorage.getItem('growthEnergyRecords');
    
    if (savedDimensions) {
      setDimensions(JSON.parse(savedDimensions));
    } else {
      // 默认维度（带二级分类）
      const defaultDimensions = [
        { id: '1', name: '专业技能', baseScore: 60, color: '#3B82F6', subCategories: [] },
        { id: '2', name: '沟通能力', baseScore: 50, color: '#10B981', subCategories: [] },
        { id: '3', name: '领导力', baseScore: 40, color: '#F59E0B', subCategories: [] },
        { id: '4', name: '创新思维', baseScore: 55, color: '#8B5CF6', subCategories: [] },
        { id: '5', name: '健康管理', baseScore: 45, color: '#EF4444', subCategories: [] }
      ];
      setDimensions(defaultDimensions);
      localStorage.setItem('growthDimensions', JSON.stringify(defaultDimensions));
    }
    
    if (savedDiaries) {
      setDiaryEntries(JSON.parse(savedDiaries));
    }

    if (savedEnergyRecords) {
      const records = JSON.parse(savedEnergyRecords);
      setEnergyRecords(records);
      // 检查今天是否已记录
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayRecord = records.find(r => r.date === today);
      if (todayRecord) {
        setTodayEnergy(todayRecord.level);
      }
    }
  }, []);

  // 保存数据到 localStorage
  const saveDimensions = (dims) => {
    setDimensions(dims);
    localStorage.setItem('growthDimensions', JSON.stringify(dims));
  };

  const saveDiaries = (diaries) => {
    setDiaryEntries(diaries);
    localStorage.setItem('growthDiaries', JSON.stringify(diaries));
  };

  const saveEnergyRecords = (records) => {
    setEnergyRecords(records);
    localStorage.setItem('growthEnergyRecords', JSON.stringify(records));
  };

  // 记录能量状态
  const recordEnergy = (level) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existingRecordIndex = energyRecords.findIndex(r => r.date === today);
    
    let newRecords;
    if (existingRecordIndex >= 0) {
      // 更新今天的记录
      newRecords = [...energyRecords];
      newRecords[existingRecordIndex] = { date: today, level };
    } else {
      // 新增今天的记录
      newRecords = [...energyRecords, { date: today, level }];
    }
    
    saveEnergyRecords(newRecords);
    setTodayEnergy(level);
  };

  // 添加维度
  const handleAddDimension = () => {
    if (!newDimensionName.trim()) return;
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#14B8A6'];
    const newDim = {
      id: Date.now().toString(),
      name: newDimensionName,
      baseScore: 50,
      color: colors[dimensions.length % colors.length],
      subCategories: []
    };
    
    saveDimensions([...dimensions, newDim]);
    setNewDimensionName('');
    setIsAddingDimension(false);
  };

  // 添加二级分类
  const handleAddSubCategory = (dimensionId) => {
    if (!newSubCategoryName.trim()) return;
    
    saveDimensions(dimensions.map(d => {
      if (d.id === dimensionId) {
        const subCategories = d.subCategories || [];
        return {
          ...d,
          subCategories: [...subCategories, {
            id: Date.now().toString(),
            name: newSubCategoryName.trim()
          }]
        };
      }
      return d;
    }));
    
    setNewSubCategoryName('');
  };

  // 删除二级分类
  const handleDeleteSubCategory = (dimensionId, subCategoryId) => {
    if (window.confirm('确定要删除这个二级分类吗？')) {
      saveDimensions(dimensions.map(d => {
        if (d.id === dimensionId) {
          return {
            ...d,
            subCategories: (d.subCategories || []).filter(sc => sc.id !== subCategoryId)
          };
        }
        return d;
      }));
    }
  };

  // 更新二级分类名称
  const updateSubCategoryName = (dimensionId, subCategoryId, newName) => {
    if (!newName.trim()) return;
    
    saveDimensions(dimensions.map(d => {
      if (d.id === dimensionId) {
        return {
          ...d,
          subCategories: (d.subCategories || []).map(sc => 
            sc.id === subCategoryId ? { ...sc, name: newName.trim() } : sc
          )
        };
      }
      return d;
    }));
    
    setEditingSubCategoryId(null);
    setEditingSubCategoryName('');
  };

  // 开始编辑二级分类
  const startEditingSubCategory = (subCategoryId, currentName) => {
    setEditingSubCategoryId(subCategoryId);
    setEditingSubCategoryName(currentName);
  };

  // 删除维度
  const handleDeleteDimension = (id) => {
    if (window.confirm('确定要删除这个维度吗？相关的日记记录不会被删除。')) {
      saveDimensions(dimensions.filter(d => d.id !== id));
    }
  };

  // 更新维度基础分数
  const updateDimensionBaseScore = (id, score) => {
    saveDimensions(dimensions.map(d => 
      d.id === id ? { ...d, baseScore: parseInt(score) || 0 } : d
    ));
  };

  // 更新维度名称
  const updateDimensionName = (id, name) => {
    if (!name.trim()) return;
    saveDimensions(dimensions.map(d => 
      d.id === id ? { ...d, name: name.trim() } : d
    ));
    setEditingDimensionId(null);
    setEditingDimensionName('');
  };

  // 开始编辑维度
  const startEditingDimension = (id, currentName) => {
    setEditingDimensionId(id);
    setEditingDimensionName(currentName);
  };

  // 计算维度的今日分数和昨日分数
  const calculateScores = (dimensionId, subCategoryId = null) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    const dimension = dimensions.find(d => d.id === dimensionId);
    if (!dimension) return { today: 0, yesterday: 0 };
    
    // 筛选条件
    const filterEntries = (entries, date) => {
      return entries.filter(e => {
        const matchDimension = e.dimensionId === dimensionId;
        const matchDate = format(new Date(e.date), 'yyyy-MM-dd') === date;
        const matchSubCategory = subCategoryId ? e.subCategoryId === subCategoryId : true;
        return matchDimension && matchDate && matchSubCategory;
      });
    };
    
    const todayEntries = filterEntries(diaryEntries, today);
    const yesterdayEntries = filterEntries(diaryEntries, yesterday);
    
    const todayPoints = todayEntries.reduce((sum, e) => sum + e.points, 0);
    const yesterdayPoints = yesterdayEntries.reduce((sum, e) => sum + e.points, 0);
    
    // 如果是二级分类，基础分为0，只计算增长分数
    const baseScore = subCategoryId ? 0 : dimension.baseScore;
    
    return {
      today: Math.min(100, baseScore + todayPoints),
      yesterday: Math.min(100, baseScore + yesterdayPoints)
    };
  };

  // 添加日记
  const handleAddDiary = async () => {
    if (!newDiary.content.trim() || !newDiary.selectedDimension) {
      alert('请填写日记内容并选择维度');
      return;
    }
    
    const diary = {
      id: Date.now().toString(),
      content: newDiary.content,
      dimensionId: newDiary.selectedDimension,
      subCategoryId: newDiary.selectedSubCategory || null,
      points: newDiary.points,
      date: new Date().toISOString()
    };
    
    saveDiaries([diary, ...diaryEntries]);
    
    // AI 分析（模拟）
    analyzeWithAI(newDiary.content);
    
    // 重置表单
    setNewDiary({
      content: '',
      selectedDimension: '',
      selectedSubCategory: '',
      points: 1,
      date: new Date()
    });
    setIsAddingDiary(false);
  };

  // AI 分析功能（增强版）
  const analyzeWithAI = (content) => {
    // 扩展的关键词库，包含情感词和行为词
    const dimensionKeywords = {
      '专业技能': {
        keywords: ['学习', '技术', '编程', '代码', '项目', '开发', '设计', '算法', '实现', '调试', '优化', '架构', '框架', '工具'],
        weight: 1,
        suggestedPoints: 2
      },
      '沟通能力': {
        keywords: ['沟通', '交流', '分享', '讨论', '会议', '演讲', '汇报', '反馈', '倾听', '表达', '协商', '说服'],
        weight: 1,
        suggestedPoints: 2
      },
      '领导力': {
        keywords: ['领导', '管理', '决策', '团队', '协调', '组织', '带领', '指导', '激励', '委派', '规划'],
        weight: 1.2,
        suggestedPoints: 3
      },
      '创新思维': {
        keywords: ['创新', '想法', '灵感', '创意', '突破', '改进', '优化', '尝试', '探索', '实验', '发现'],
        weight: 1.3,
        suggestedPoints: 3
      },
      '健康管理': {
        keywords: ['运动', '健身', '跑步', '睡眠', '饮食', '休息', '锻炼', '瑜伽', '冥想', '放松', '拉伸'],
        weight: 1,
        suggestedPoints: 2
      },
      '时间管理': {
        keywords: ['计划', '安排', '效率', '时间', '优先级', '任务', '清单', '目标', '专注', '番茄工作法'],
        weight: 1,
        suggestedPoints: 2
      },
      '情绪管理': {
        keywords: ['情绪', '心情', '压力', '焦虑', '放松', '冥想', '平静', '调节', '觉察', '接纳', '释放'],
        weight: 1.1,
        suggestedPoints: 2
      },
      '学习能力': {
        keywords: ['阅读', '书籍', '课程', '知识', '学习', '研究', '笔记', '总结', '思考', '理解', '记忆'],
        weight: 1,
        suggestedPoints: 2
      },
      '人际关系': {
        keywords: ['朋友', '同事', '关系', '信任', '合作', '帮助', '理解', '支持', '陪伴', '友谊'],
        weight: 1,
        suggestedPoints: 2
      },
      '自我认知': {
        keywords: ['反思', '觉察', '认识', '了解', '意识', '价值观', '优势', '弱点', '成长', '进步'],
        weight: 1.2,
        suggestedPoints: 3
      },
      '财务管理': {
        keywords: ['理财', '投资', '储蓄', '预算', '记账', '收入', '支出', '规划'],
        weight: 1,
        suggestedPoints: 2
      },
      '目标达成': {
        keywords: ['目标', '完成', '达成', '实现', '成就', '里程碑', '突破', '进展'],
        weight: 1.2,
        suggestedPoints: 3
      }
    };
    
    const analysis = {
      matchedDimensions: [],
      suggestedDimensions: [],
      totalMatches: 0
    };
    
    // 分析每个维度
    Object.entries(dimensionKeywords).forEach(([dimName, config]) => {
      const matches = config.keywords.filter(word => content.includes(word));
      
      if (matches.length > 0) {
        const score = matches.length * config.weight;
        const existingDim = dimensions.find(d => d.name === dimName);
        
        const dimInfo = {
          name: dimName,
          matchCount: matches.length,
          keywords: matches,
          score: score,
          suggestedPoints: Math.min(5, Math.ceil(score))
        };
        
        if (existingDim) {
          // 已有维度，建议加分
          analysis.matchedDimensions.push({
            ...dimInfo,
            dimensionId: existingDim.id
          });
        } else {
          // 新维度建议
          analysis.suggestedDimensions.push(dimInfo);
        }
        
        analysis.totalMatches += matches.length;
      }
    });
    
    // 按得分排序
    analysis.matchedDimensions.sort((a, b) => b.score - a.score);
    analysis.suggestedDimensions.sort((a, b) => b.score - a.score);
    
    // 限制建议数量
    analysis.matchedDimensions = analysis.matchedDimensions.slice(0, 3);
    analysis.suggestedDimensions = analysis.suggestedDimensions.slice(0, 2);
    
    if (analysis.matchedDimensions.length > 0 || analysis.suggestedDimensions.length > 0) {
      setAiAnalysis(analysis);
      // 不自动消失，让用户可以选择采纳建议
    }
  };
  
  // 采纳AI建议的加分
  const applyAISuggestion = (dimensionId, points, keywords) => {
    const dimension = dimensions.find(d => d.id === dimensionId);
    if (!dimension) return;
    
    const diary = {
      id: Date.now().toString(),
      content: `AI分析建议：在"${dimension.name}"方面有所成长\n关键词：${keywords.join('、')}`,
      dimensionId: dimensionId,
      subCategoryId: null,
      points: points,
      date: new Date().toISOString()
    };
    
    saveDiaries([diary, ...diaryEntries]);
    
    // 从分析结果中移除已采纳的建议
    setAiAnalysis(prev => {
      if (!prev) return null;
      const newMatched = prev.matchedDimensions.filter(d => d.dimensionId !== dimensionId);
      if (newMatched.length === 0 && prev.suggestedDimensions.length === 0) {
        return null;
      }
      return {
        ...prev,
        matchedDimensions: newMatched
      };
    });
  };
  
  // 采纳新维度建议
  const applyNewDimensionSuggestion = (dimensionName, suggestedPoints) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
    const newDimension = {
      id: Date.now().toString(),
      name: dimensionName,
      baseScore: 50,
      color: colors[dimensions.length % colors.length],
      subCategories: []
    };
    
    const updatedDimensions = [...dimensions, newDimension];
    setDimensions(updatedDimensions);
    localStorage.setItem('growthDimensions', JSON.stringify(updatedDimensions));
    
    // 从建议中移除
    setAiAnalysis(prev => {
      if (!prev) return null;
      const newSuggested = prev.suggestedDimensions.filter(d => d.name !== dimensionName);
      if (prev.matchedDimensions.length === 0 && newSuggested.length === 0) {
        return null;
      }
      return {
        ...prev,
        suggestedDimensions: newSuggested
      };
    });
  };

  // 删除日记
  const handleDeleteDiary = (id) => {
    if (window.confirm('确定要删除这条日记吗？')) {
      saveDiaries(diaryEntries.filter(d => d.id !== id));
    }
  };

  // 绘制柱状图
  const drawBarChart = () => {
    // 构建展示项列表：有二级分类的展示二级分类，没有的展示一级分类
    const chartItems = [];
    dimensions.forEach(dim => {
      if (dim.subCategories && dim.subCategories.length > 0) {
        // 有二级分类，展示所有二级分类
        dim.subCategories.forEach(subCat => {
          chartItems.push({
            id: `${dim.id}-${subCat.id}`,
            name: subCat.name, // 只用二级分类名称
            color: dim.color,
            dimensionId: dim.id,
            subCategoryId: subCat.id
          });
        });
      } else {
        // 没有二级分类，展示一级分类
        chartItems.push({
          id: dim.id,
          name: dim.name, // 一级分类名称
          color: dim.color,
          dimensionId: dim.id,
          subCategoryId: null
        });
      }
    });

    if (chartItems.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          请先添加维度
        </div>
      );
    }
    
    const chartHeight = 300;
    const chartWidth = Math.max(600, chartItems.length * 80);
    const barWidth = 50;
    const maxValue = 100;
    const padding = { top: 40, right: 20, bottom: 60, left: 40 };
    
    return (
      <div className="w-full overflow-x-auto">
        <svg 
          width={chartWidth} 
          height={chartHeight + padding.top + padding.bottom}
          className="mx-auto"
        >
          {/* 绘制Y轴刻度线 */}
          {[0, 25, 50, 75, 100].map(value => {
            const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeDasharray="2,2"
                />
                <text
                  x={padding.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-500"
                >
                  {value}
                </text>
              </g>
            );
          })}
          
          {/* 绘制柱状图 */}
          {chartItems.map((item, index) => {
            const scores = calculateScores(item.dimensionId, item.subCategoryId);
            const x = padding.left + index * (chartWidth - padding.left - padding.right) / chartItems.length;
            const centerX = x + (chartWidth - padding.left - padding.right) / chartItems.length / 2;
            
            // 昨天的柱子高度
            const yesterdayHeight = (scores.yesterday / maxValue) * chartHeight;
            const yesterdayY = padding.top + chartHeight - yesterdayHeight;
            
            // 今天的柱子高度
            const todayHeight = (scores.today / maxValue) * chartHeight;
            const todayY = padding.top + chartHeight - todayHeight;
            
            // 增长值
            const yesterdayGrowth = scores.yesterday - (item.subCategoryId ? 0 : dimensions.find(d => d.id === item.dimensionId)?.baseScore || 0);
            const todayGrowth = scores.today - (item.subCategoryId ? 0 : dimensions.find(d => d.id === item.dimensionId)?.baseScore || 0);
            
            return (
              <g key={item.id}>
                {/* 昨天的柱子 (蓝色，较窄，左侧) */}
                <rect
                  x={centerX - barWidth / 2 - 5}
                  y={yesterdayY}
                  width={barWidth * 0.4}
                  height={yesterdayHeight}
                  fill="#3B82F6"
                  opacity="0.6"
                  rx="4"
                />
                
                {/* 今天的柱子 (橙色，较窄，右侧) */}
                <rect
                  x={centerX + barWidth / 2 - barWidth * 0.4 + 5}
                  y={todayY}
                  width={barWidth * 0.4}
                  height={todayHeight}
                  fill="#F97316"
                  opacity="0.8"
                  rx="4"
                />
                
                {/* 昨天的增长标签 */}
                {yesterdayGrowth > 0 && (
                  <text
                    x={centerX - barWidth / 2 - 5 + barWidth * 0.2}
                    y={yesterdayY - 5}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-blue-600"
                  >
                    +{yesterdayGrowth}
                  </text>
                )}
                
                {/* 今天的增长标签 */}
                {todayGrowth > 0 && (
                  <text
                    x={centerX + barWidth / 2 - barWidth * 0.4 + 5 + barWidth * 0.2}
                    y={todayY - 5}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-orange-600"
                  >
                    +{todayGrowth}
                  </text>
                )}
                
                {/* 分数标签 */}
                <text
                  x={centerX}
                  y={padding.top + chartHeight + 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {scores.today}分
                </text>
                
                {/* 维度名称 - 只显示name（二级分类名或一级分类名） */}
                <text
                  x={centerX}
                  y={padding.top + chartHeight + 30}
                  textAnchor="middle"
                  className="text-sm font-medium fill-gray-700"
                >
                  {item.name.length > 6 ? item.name.substring(0, 6) + '...' : item.name}
                </text>
              </g>
            );
          })}
          
          {/* 图例 */}
          <g transform={`translate(${padding.left}, ${padding.top - 25})`}>
            <rect x="0" y="0" width="12" height="12" fill="#3B82F6" opacity="0.6" rx="2" />
            <text x="18" y="10" className="text-xs fill-gray-600">昨天</text>
            
            <rect x="70" y="0" width="12" height="12" fill="#F97316" opacity="0.8" rx="2" />
            <text x="88" y="10" className="text-xs fill-gray-600">今天</text>
          </g>
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">个人成长追踪</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <div className="w-3 h-3 bg-blue-500 opacity-50 rounded"></div>
              <span className="text-gray-600">昨天</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">今天</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI 分析提示 */}
      {aiAnalysis && (
        <div className="fixed top-20 right-4 bg-white rounded-lg shadow-xl border-2 border-purple-200 p-4 max-w-md z-50 animate-slide-in">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-purple-900">AI 觉察分析</h3>
            </div>
            <button
              onClick={() => setAiAnalysis(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {aiAnalysis.matchedDimensions.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 font-medium mb-2">💡 建议在以下维度加分：</p>
              <div className="space-y-2">
                {aiAnalysis.matchedDimensions.map((dim, i) => (
                  <div key={i} className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-green-900">{dim.name}</div>
                        <div className="text-xs text-green-700 mt-1">
                          关键词: {dim.keywords.join('、')}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          建议加分: +{dim.suggestedPoints}分
                        </div>
                      </div>
                      <button
                        onClick={() => applyAISuggestion(dim.dimensionId, dim.suggestedPoints, dim.keywords)}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 whitespace-nowrap"
                      >
                        采纳
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {aiAnalysis.suggestedDimensions.length > 0 && (
            <div>
              <p className="text-sm text-purple-700 font-medium mb-2">✨ 发现新的成长维度：</p>
              <div className="space-y-2">
                {aiAnalysis.suggestedDimensions.map((dim, i) => (
                  <div key={i} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-purple-900">{dim.name}</div>
                        <div className="text-xs text-purple-700 mt-1">
                          关键词: {dim.keywords.join('、')}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          匹配度: {dim.matchCount} 个关键词
                        </div>
                      </div>
                      <button
                        onClick={() => applyNewDimensionSuggestion(dim.name, dim.suggestedPoints)}
                        className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 whitespace-nowrap"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {aiAnalysis.totalMatches === 0 && (
            <div className="text-center text-gray-500 text-sm py-2">
              未识别到明确的成长维度，尝试在日记中加入更多关键词
            </div>
          )}
        </div>
      )}

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* 第一行：成长柱状图 - 横向拉通 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">成长柱状图</h2>
            {drawBarChart()}
          </div>

          {/* 第二行：能量曲线图 - 横向拉通 */}
          <div className="space-y-6">
            {/* 能量状态记录 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">能量状态</h2>
              
              {/* 能量曲线图 */}
              <div className="mb-4 h-24 relative">
                <svg width="100%" height="100%" className="overflow-visible">
                  {/* 背景网格线 */}
                  <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />
                  
                  {/* 绘制能量曲线 */}
                  {(() => {
                    const last7Days = Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      return format(date, 'yyyy-MM-dd');
                    });
                    
                    const energyValues = last7Days.map(date => {
                      const record = energyRecords.find(r => r.date === date);
                      if (!record) return null;
                      return record.level === 'high' ? 90 : record.level === 'normal' ? 50 : 10;
                    });
                    
                    const points = energyValues.map((value, i) => {
                      if (value === null) return null;
                      const x = (i / 6) * 100;
                      const y = 100 - value;
                      return `${x},${y}`;
                    }).filter(p => p !== null).join(' ');
                    
                    if (points) {
                      return (
                        <>
                          <polyline
                            points={points}
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                          />
                          {energyValues.map((value, i) => {
                            if (value === null) return null;
                            const x = `${(i / 6) * 100}%`;
                            const y = `${100 - value}%`;
                            const isToday = i === 6;
                            return (
                              <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={isToday ? "4" : "3"}
                                fill={isToday ? "#10B981" : "#86EFAC"}
                                className="transition-all"
                              />
                            );
                          })}
                        </>
                      );
                    }
                    return null;
                  })()}
                </svg>
              </div>
              
              {/* 能量状态选择 */}
              <div className="flex gap-2 items-center justify-center">
                <span className="text-sm text-gray-600 mr-2">今日：</span>
                <button
                  onClick={() => recordEnergy('high')}
                  className={`p-2 rounded-lg transition-all ${
                    todayEnergy === 'high' 
                      ? 'bg-green-100 ring-2 ring-green-500' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  title="超高"
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" className="transition-transform hover:scale-110">
                    <circle cx="16" cy="16" r="15" fill={todayEnergy === 'high' ? '#10B981' : '#D1D5DB'} />
                    <circle cx="11" cy="13" r="2" fill="#fff" />
                    <circle cx="21" cy="13" r="2" fill="#fff" />
                    <path d="M 10 20 Q 16 26, 22 20" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </button>
                
                <button
                  onClick={() => recordEnergy('normal')}
                  className={`p-2 rounded-lg transition-all ${
                    todayEnergy === 'normal' 
                      ? 'bg-blue-100 ring-2 ring-blue-500' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  title="维持"
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" className="transition-transform hover:scale-110">
                    <circle cx="16" cy="16" r="15" fill={todayEnergy === 'normal' ? '#3B82F6' : '#D1D5DB'} />
                    <circle cx="11" cy="13" r="2" fill="#fff" />
                    <circle cx="21" cy="13" r="2" fill="#fff" />
                    <line x1="10" y1="21" x2="22" y2="21" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                
                <button
                  onClick={() => recordEnergy('low')}
                  className={`p-2 rounded-lg transition-all ${
                    todayEnergy === 'low' 
                      ? 'bg-yellow-100 ring-2 ring-yellow-500' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  title="低"
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" className="transition-transform hover:scale-110">
                    <circle cx="16" cy="16" r="15" fill={todayEnergy === 'low' ? '#EAB308' : '#D1D5DB'} />
                    <circle cx="11" cy="13" r="2" fill="#fff" />
                    <circle cx="21" cy="13" r="2" fill="#fff" />
                    <path d="M 10 23 Q 16 18, 22 23" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 第三行：维度管理 + 日记列表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 维度管理 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">维度管理</h2>
                <button
                  onClick={() => setIsAddingDimension(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加维度
                </button>
              </div>

              {/* 添加维度表单 */}
              {isAddingDimension && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="text"
                    value={newDimensionName}
                    onChange={(e) => setNewDimensionName(e.target.value)}
                    placeholder="输入维度名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDimension()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddDimension}
                      className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      <Save className="w-4 h-4 inline mr-1" />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingDimension(false);
                        setNewDimensionName('');
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* 维度列表 */}
              <div className="space-y-3">
                {dimensions.map((dim) => {
                  const scores = calculateScores(dim.id);
                  const isEditing = editingDimensionId === dim.id;
                  const isManagingSubCategories = managingSubCategoriesId === dim.id;
                  
                  return (
                    <div
                      key={dim.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dim.color }}
                        ></div>
                        <div className="flex-1">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingDimensionName}
                              onChange={(e) => setEditingDimensionName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && updateDimensionName(dim.id, editingDimensionName)}
                              onBlur={() => updateDimensionName(dim.id, editingDimensionName)}
                              className="font-medium text-gray-800 px-2 py-1 border border-blue-300 rounded w-full mb-1"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <div 
                                className="font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                                onClick={() => startEditingDimension(dim.id, dim.name)}
                              >
                                {dim.name}
                              </div>
                              <button
                                onClick={() => setManagingSubCategoriesId(isManagingSubCategories ? null : dim.id)}
                                className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                title="管理二级分类"
                              >
                                {isManagingSubCategories ? '收起' : '管理分类'}
                              </button>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>基础分: </span>
                            <input
                              type="number"
                              value={dim.baseScore}
                              onChange={(e) => updateDimensionBaseScore(dim.id, e.target.value)}
                              className="w-16 px-1 py-0.5 border border-gray-300 rounded"
                              min="0"
                              max="100"
                            />
                            <span className="ml-2">今日: {scores.today}</span>
                            <span className={scores.today > scores.yesterday ? 'text-green-600' : scores.today < scores.yesterday ? 'text-red-600' : ''}>
                              ({scores.today > scores.yesterday ? '+' : ''}{scores.today - scores.yesterday})
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => isEditing ? updateDimensionName(dim.id, editingDimensionName) : startEditingDimension(dim.id, dim.name)}
                          className="p-1.5 hover:bg-gray-200 rounded"
                          title={isEditing ? "保存" : "编辑名称"}
                        >
                          {isEditing ? <Save className="w-4 h-4 text-green-600" /> : <Edit2 className="w-4 h-4 text-gray-600" />}
                        </button>
                        <button
                          onClick={() => handleDeleteDimension(dim.id)}
                          className="p-1.5 hover:bg-red-100 rounded"
                          title="删除维度"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>

                      {/* 二级分类展示区域 - 始终显示 */}
                      {(dim.subCategories && dim.subCategories.length > 0) && (
                        <div className="mt-2 ml-7 space-y-1">
                          {dim.subCategories.map((subCat) => {
                            const isEditingSubCat = editingSubCategoryId === subCat.id;
                            
                            return (
                              <div
                                key={subCat.id}
                                className="flex items-center gap-2 p-2 bg-white rounded text-sm group"
                              >
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                
                                {isEditingSubCat ? (
                                  <input
                                    type="text"
                                    value={editingSubCategoryName}
                                    onChange={(e) => setEditingSubCategoryName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && updateSubCategoryName(dim.id, subCat.id, editingSubCategoryName)}
                                    onBlur={() => updateSubCategoryName(dim.id, subCat.id, editingSubCategoryName)}
                                    className="flex-1 text-gray-700 px-2 py-1 border border-blue-300 rounded"
                                    autoFocus
                                  />
                                ) : (
                                  <div 
                                    className="flex-1 text-gray-700 cursor-pointer hover:text-blue-600"
                                    onClick={() => startEditingSubCategory(subCat.id, subCat.name)}
                                  >
                                    {subCat.name}
                                  </div>
                                )}
                                
                                {!isEditingSubCat && (
                                  <button
                                    onClick={() => startEditingSubCategory(subCat.id, subCat.name)}
                                    className="p-1 hover:bg-blue-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="编辑"
                                  >
                                    <Edit2 className="w-3 h-3 text-blue-600" />
                                  </button>
                                )}
                                
                                {isManagingSubCategories && !isEditingSubCat && (
                                  <button
                                    onClick={() => handleDeleteSubCategory(dim.id, subCat.id)}
                                    className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="删除"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </button>
                                )}
                                
                                {isEditingSubCat && (
                                  <button
                                    onClick={() => updateSubCategoryName(dim.id, subCat.id, editingSubCategoryName)}
                                    className="p-1 hover:bg-green-100 rounded"
                                    title="保存"
                                  >
                                    <Save className="w-3 h-3 text-green-600" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 二级分类管理区域 - 只在管理模式下显示 */}
                      {isManagingSubCategories && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">添加二级分类</div>
                          
                          {/* 添加二级分类 */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newSubCategoryName}
                              onChange={(e) => setNewSubCategoryName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddSubCategory(dim.id)}
                              placeholder="输入分类名称..."
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <button
                              onClick={() => handleAddSubCategory(dim.id)}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              添加
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 成长日记 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">成长日记</h2>
                <button
                  onClick={() => setIsAddingDiary(true)}
                  disabled={dimensions.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  新增日记
                </button>
              </div>

              {/* 添加日记表单 */}
              {isAddingDiary && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <textarea
                  value={newDiary.content}
                  onChange={(e) => setNewDiary({ ...newDiary, content: e.target.value })}
                  placeholder="记录今天的成长和收获..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 resize-none"
                  rows="4"
                />
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">选择维度</label>
                    <select
                      value={newDiary.selectedDimension}
                      onChange={(e) => setNewDiary({ ...newDiary, selectedDimension: e.target.value, selectedSubCategory: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">请选择</option>
                      {dimensions.map(dim => (
                        <option key={dim.id} value={dim.id}>{dim.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">增加分数</label>
                    <input
                      type="number"
                      value={newDiary.points}
                      onChange={(e) => setNewDiary({ ...newDiary, points: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                {/* 二级分类选择（如果有） */}
                {newDiary.selectedDimension && (() => {
                  const selectedDim = dimensions.find(d => d.id === newDiary.selectedDimension);
                  const hasSubCategories = selectedDim && selectedDim.subCategories && selectedDim.subCategories.length > 0;
                  
                  return hasSubCategories ? (
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">选择二级分类（可选）</label>
                      <select
                        value={newDiary.selectedSubCategory}
                        onChange={(e) => setNewDiary({ ...newDiary, selectedSubCategory: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">不选择</option>
                        {selectedDim.subCategories.map(subCat => (
                          <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : null;
                })()}
                
                <div className="flex gap-2">
                  <button
                    onClick={handleAddDiary}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    保存并分析
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingDiary(false);
                      setNewDiary({ content: '', selectedDimension: '', points: 1, date: new Date() });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </div>
              )}

              {/* 日记列表 */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {diaryEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无日记，开始记录你的成长吧！
                </div>
              ) : (
                diaryEntries.map((diary) => {
                  const dimension = dimensions.find(d => d.id === diary.dimensionId);
                  const subCategory = dimension && diary.subCategoryId 
                    ? (dimension.subCategories || []).find(sc => sc.id === diary.subCategoryId)
                    : null;
                  const date = new Date(diary.date);
                  
                  return (
                    <div
                      key={diary.id}
                      className="p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {dimension && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: dimension.color }}
                            ></div>
                          )}
                          <span className="font-medium text-gray-800">
                            {dimension?.name || '未知维度'}
                          </span>
                          {subCategory && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                              {subCategory.name}
                            </span>
                          )}
                          <span className="text-sm text-green-600 font-semibold">
                            +{diary.points}分
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteDiary(diary.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
                        {diary.content}
                      </p>
                      
                      <div className="text-xs text-gray-500">
                        {format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PersonalDashboard;
