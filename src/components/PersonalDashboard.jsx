import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Sparkles, BarChart3 } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { dataAPI } from '../services/apiService';

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
  const [editingSubCategoryScore, setEditingSubCategoryScore] = useState(null);
  const [subCategoryScore, setSubCategoryScore] = useState('');
  
  // 新日记表单
  const [newDiary, setNewDiary] = useState({
    content: '',
    selectedDimension: '',
    selectedSubCategory: '',
    points: 1,
    date: new Date()
  });
  
  // AI 分析状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // 生成从今天到过年的日期列表
  const generateDateGrid = () => {
    const today = new Date();
    const springFestival = new Date(today.getFullYear() + 1, 0, 29); // 2024年春节是1月29日
    const dates = [];
    
    for (let i = 0; i < 60; i++) { // 最多60天
      const date = addDays(today, i);
      if (date > springFestival) break;
      dates.push(date);
    }
    
    return dates;
  };
  
  const [dateGrid] = useState(generateDateGrid());

  // 计算成长总分
  const calculateTotalScore = () => {
    let total = 0;
    dimensions.forEach(dimension => {
      total += dimension.baseScore || 0;
      
      // 添加二级分类分数
      if (dimension.subCategories) {
        dimension.subCategories.forEach(subCategory => {
          total += subCategory.score || 0;
        });
      }
      
      // 添加日记积分
      const today = format(new Date(), 'yyyy-MM-dd');
      const dimensionEntries = diaryEntries.filter(entry => 
        entry.dimensionId === dimension.id
      );
      total += dimensionEntries.reduce((sum, entry) => sum + entry.points, 0);
    });
    
    return total;
  };

  // 获取成长数据用于柱状图
  const getGrowthData = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const data = [];
    
    // 处理每个维度
    dimensions.forEach(dimension => {
      // 检查是否有二级分类
      const hasSubCategories = dimension.subCategories && dimension.subCategories.length > 0;
      
      if (hasSubCategories) {
        // 有二级分类时，只显示二级分类，不显示一级维度
        dimension.subCategories.forEach(subCategory => {
          const subBaseScore = subCategory.score || 60;
          
          // 计算今天该二级分类的日记积分
          const todaySubEntries = diaryEntries.filter(entry => 
            entry.date === today && 
            entry.dimensionId === dimension.id && 
            entry.subCategoryId === subCategory.id
          );
          const todaySubPoints = todaySubEntries.reduce((sum, entry) => sum + entry.points, 0);
          
          data.push({
            id: subCategory.id,
            name: subCategory.name,
            baseScore: subBaseScore,
            todayPoints: todaySubPoints,
            totalScore: subBaseScore + todaySubPoints,
            color: dimension.color,
            isSubCategory: true,
            parentName: dimension.name
          });
        });
      } else {
        // 没有二级分类时，显示一级维度
        const baseScore = dimension.baseScore || 60;
        
        // 计算今天该维度的日记积分
        const todayEntries = diaryEntries.filter(entry => 
          entry.date === today && entry.dimensionId === dimension.id && !entry.subCategoryId
        );
        const todayPoints = todayEntries.reduce((sum, entry) => sum + entry.points, 0);
        
        data.push({
          id: dimension.id,
          name: dimension.name,
          baseScore: baseScore,
          todayPoints: todayPoints,
          totalScore: baseScore + todayPoints,
          color: dimension.color,
          isSubCategory: false
        });
      }
    });
    
    return data;
  };

  // 从云端和 localStorage 加载数据
  useEffect(() => {
    // 首先尝试从 life-system 的云端数据加载
    try {
      const allData = dataAPI.getAllData();
      const dashboardData = allData.personalDashboard || {};
      
      // 使用云端数据（如果存在），否则使用 localStorage 数据
      if (dashboardData.growthDimensions) {
        setDimensions(dashboardData.growthDimensions);
        localStorage.setItem('growthDimensions', JSON.stringify(dashboardData.growthDimensions));
      }
      
      if (dashboardData.growthDiaries) {
        setDiaryEntries(dashboardData.growthDiaries);
        localStorage.setItem('growthDiaries', JSON.stringify(dashboardData.growthDiaries));
      }
      
      if (dashboardData.growthEnergyRecords) {
        setEnergyRecords(dashboardData.growthEnergyRecords);
        localStorage.setItem('growthEnergyRecords', JSON.stringify(dashboardData.growthEnergyRecords));
        
        // 检查今天是否已记录
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayRecord = dashboardData.growthEnergyRecords.find(r => r.date === today);
        if (todayRecord) {
          setTodayEnergy(todayRecord.level);
        }
      }
    } catch (error) {
      console.warn('从云端加载数据失败，使用本地数据:', error);
      loadFromLocalStorage();
    }
    
    // 如果没有云端数据，从 localStorage 加载
    loadFromLocalStorage();
  }, []);

  // 从 localStorage 加载数据的备用函数
  const loadFromLocalStorage = () => {
    const savedDimensions = localStorage.getItem('growthDimensions');
    const savedDiaries = localStorage.getItem('growthDiaries');
    const savedEnergyRecords = localStorage.getItem('growthEnergyRecords');
    
    if (savedDimensions && dimensions.length === 0) {
      setDimensions(JSON.parse(savedDimensions));
    } else if (!savedDimensions) {
      // 默认维度（带二级分类）
      const defaultDimensions = [
        { id: '1', name: '专业技能', baseScore: 60, color: '#3B82F6', subCategories: [] },
        { id: '2', name: '沟通能力', baseScore: 60, color: '#10B981', subCategories: [] },
        { id: '3', name: '领导力', baseScore: 60, color: '#F59E0B', subCategories: [] },
        { id: '4', name: '创新思维', baseScore: 60, color: '#8B5CF6', subCategories: [] },
        { id: '5', name: '健康管理', baseScore: 60, color: '#EF4444', subCategories: [] }
      ];
      setDimensions(defaultDimensions);
      localStorage.setItem('growthDimensions', JSON.stringify(defaultDimensions));
    }
    
    if (savedDiaries && diaryEntries.length === 0) {
      setDiaryEntries(JSON.parse(savedDiaries));
    }

    if (savedEnergyRecords && energyRecords.length === 0) {
      const records = JSON.parse(savedEnergyRecords);
      setEnergyRecords(records);
      // 检查今天是否已记录
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayRecord = records.find(r => r.date === today);
      if (todayRecord) {
        setTodayEnergy(todayRecord.level);
      }
    }
  };

  // 保存数据到 localStorage 和云同步
  const saveDimensions = (dims) => {
    setDimensions(dims);
    localStorage.setItem('growthDimensions', JSON.stringify(dims));
    
    // 同步到云端
    syncToCloud('growthDimensions', dims);
  };

  const saveDiaries = (diaries) => {
    setDiaryEntries(diaries);
    localStorage.setItem('growthDiaries', JSON.stringify(diaries));
    
    // 同步到云端
    syncToCloud('growthDiaries', diaries);
  };

  const saveEnergyRecords = (records) => {
    setEnergyRecords(records);
    localStorage.setItem('growthEnergyRecords', JSON.stringify(records));
    
    // 同步到云端
    syncToCloud('growthEnergyRecords', records);
  };

  // 云端同步函数
  const syncToCloud = (key, data) => {
    try {
      // 获取当前 life-system 的所有数据
      const allData = dataAPI.getAllData();
      
      // 将 PersonalDashboard 的数据添加到 life-system 数据中
      allData.personalDashboard = {
        ...allData.personalDashboard,
        [key]: data
      };
      
      // 保存到 life-system 数据库，自动触发云同步
      dataAPI.saveData(allData);
    } catch (error) {
      console.warn('云端同步失败:', error);
      // 即使同步失败，本地数据仍然保持不变
    }
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
            name: newSubCategoryName.trim(),
            score: 60 // 新增二级分类的默认分数
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

  // 更新二级分类分数
  const updateSubCategoryScore = (dimensionId, subCategoryId, newScore) => {
    saveDimensions(dimensions.map(d => {
      if (d.id === dimensionId) {
        return {
          ...d,
          subCategories: (d.subCategories || []).map(sc => 
            sc.id === subCategoryId ? { ...sc, score: parseInt(newScore) || 0 } : sc
          )
        };
      }
      return d;
    }));
    
    setEditingSubCategoryScore(null);
    setSubCategoryScore('');
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

  // 开始编辑二级分类分数
  const startEditingSubCategoryScore = (subCategoryId, currentScore) => {
    setEditingSubCategoryScore(subCategoryId);
    setSubCategoryScore((currentScore || 60).toString());
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
    
    if (subCategoryId) {
      // 计算二级分类的分数
      const subCategory = dimension.subCategories?.find(sc => sc.id === subCategoryId);
      if (!subCategory) return { today: 0, yesterday: 0 };
      
      const todayEntries = diaryEntries.filter(entry => 
        entry.date === today && 
        entry.dimensionId === dimensionId && 
        entry.subCategoryId === subCategoryId
      );
      
      const yesterdayEntries = diaryEntries.filter(entry => 
        entry.date === yesterday && 
        entry.dimensionId === dimensionId && 
        entry.subCategoryId === subCategoryId
      );
      
      const todayScore = todayEntries.reduce((sum, entry) => sum + entry.points, 0) + (subCategory.score || 60);
      const yesterdayScore = yesterdayEntries.reduce((sum, entry) => sum + entry.points, 0) + (subCategory.score || 60);
      
      return { today: todayScore, yesterday: yesterdayScore };
    } else {
      // 计算维度的分数
      const todayEntries = diaryEntries.filter(entry => 
        entry.date === today && entry.dimensionId === dimensionId
      );
      
      const yesterdayEntries = diaryEntries.filter(entry => 
        entry.date === yesterday && entry.dimensionId === dimensionId
      );
      
      // 计算所有二级分类的总分
      let subCategoriesTotal = 0;
      if (dimension.subCategories) {
        subCategoriesTotal = dimension.subCategories.reduce((sum, sc) => sum + (sc.score || 60), 0);
      }
      
      const todayScore = todayEntries.reduce((sum, entry) => sum + entry.points, 0) + 
                       (dimension.baseScore || 60) + subCategoriesTotal;
      const yesterdayScore = yesterdayEntries.reduce((sum, entry) => sum + entry.points, 0) + 
                          (dimension.baseScore || 60) + subCategoriesTotal;
      
      return { today: todayScore, yesterday: yesterdayScore };
    }
  };

  // AI 分析日记内容
  const analyzeWithAI = async () => {
    if (!newDiary.content.trim()) {
      alert('请先输入日记内容');
      return;
    }
    
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === 'your-deepseek-api-key-here') {
      alert('请先在 .env 文件中配置 VITE_DEEPSEEK_API_KEY');
      return;
    }
    
    setIsAnalyzing(true);
    setAiSuggestion(null);
    
    try {
      // 准备维度信息
      const dimensionInfo = dimensions.map(d => {
        if (d.subCategories && d.subCategories.length > 0) {
          return {
            name: d.name,
            subCategories: d.subCategories.map(sc => sc.name)
          };
        }
        return { name: d.name, subCategories: [] };
      });
      
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `你是一个个人成长分析助手。用户有以下成长维度：${JSON.stringify(dimensionInfo, null, 2)}。

请分析用户的日记内容，建议应该在哪些维度（或二级分类）上增加分数，以及建议增加的分数值（1-10分）。
如果日记内容涉及到现有维度没有覆盖的新领域，也可以建议新的维度。

请严格按照以下JSON格式返回，不要包含任何其他文字说明：
{
  "suggestions": [
    {
      "dimension": "维度名称",
      "subCategory": "二级分类名称（如果有，没有则为空字符串）",
      "points": 5,
      "reason": "建议理由"
    }
  ],
  "newDimensions": [
    {
      "name": "新维度名称",
      "reason": "建议理由"
    }
  ]
}`
            },
            {
              role: 'user',
              content: `我的日记内容：${newDiary.content}`
            }
          ],
          temperature: 0.7
        })
      });
      
      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const content = data.choices[0].message.content;
        // 尝试解析 JSON
        try {
          // 提取 JSON 部分（可能包含在代码块中）
          let jsonStr = content;
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }
          
          const suggestion = JSON.parse(jsonStr);
          setAiSuggestion(suggestion);
        } catch (e) {
          console.error('JSON 解析失败:', e);
          // 如果不是标准 JSON，显示原始内容
          setAiSuggestion({ raw: content });
        }
      } else {
        throw new Error('AI 返回数据格式错误');
      }
    } catch (error) {
      console.error('AI 分析失败:', error);
      alert(`AI 分析失败: ${error.message}\n请检查网络连接或 API Key 是否正确`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 应用 AI 建议
  const applySuggestion = (suggestion) => {
    // 查找对应的维度和二级分类
    const dimension = dimensions.find(d => d.name === suggestion.dimension);
    if (!dimension) return;
    
    let subCategoryId = '';
    if (suggestion.subCategory) {
      const subCategory = dimension.subCategories?.find(sc => sc.name === suggestion.subCategory);
      subCategoryId = subCategory?.id || '';
    }
    
    setNewDiary({
      ...newDiary,
      selectedDimension: dimension.id,
      selectedSubCategory: subCategoryId,
      points: suggestion.points || 1
    });
  };
  
  // 添加日记
  const handleAddDiary = () => {
    if (!newDiary.content.trim() || !newDiary.selectedDimension) return;
    
    const entry = {
      id: Date.now().toString(),
      content: newDiary.content.trim(),
      dimensionId: newDiary.selectedDimension,
      subCategoryId: newDiary.selectedSubCategory || null,
      points: newDiary.points,
      date: format(newDiary.date, 'yyyy-MM-dd'),
      createdAt: new Date().toISOString()
    };
    
    saveDiaries([entry, ...diaryEntries]);
    setNewDiary({
      content: '',
      selectedDimension: '',
      selectedSubCategory: '',
      points: 1,
      date: new Date()
    });
    setIsAddingDiary(false);
    setAiSuggestion(null);
  };
  
  // 获取可选择的维度列表（与柱状图一致）
  const getSelectableDimensions = () => {
    const result = [];
    dimensions.forEach(dimension => {
      const hasSubCategories = dimension.subCategories && dimension.subCategories.length > 0;
      
      if (hasSubCategories) {
        // 有二级分类时，只返回二级分类
        dimension.subCategories.forEach(subCategory => {
          result.push({
            dimensionId: dimension.id,
            dimensionName: dimension.name,
            subCategoryId: subCategory.id,
            subCategoryName: subCategory.name,
            displayName: `${dimension.name} - ${subCategory.name}`,
            color: dimension.color
          });
        });
      } else {
        // 没有二级分类时，返回一级维度
        result.push({
          dimensionId: dimension.id,
          dimensionName: dimension.name,
          subCategoryId: null,
          subCategoryName: null,
          displayName: dimension.name,
          color: dimension.color
        });
      }
    });
    return result;
  };

  // 删除日记
  const handleDeleteDiary = (id) => {
    if (window.confirm('确定要删除这条日记吗？')) {
      saveDiaries(diaryEntries.filter(entry => entry.id !== id));
    }
  };

  // 获取能量状态的显示颜色
  const getEnergyColor = (level) => {
    if (level === 'high') return '#10B981'; // 绿色
    if (level === 'medium') return '#F59E0B'; // 橙色
    if (level === 'low') return '#EF4444'; // 红色
    return '#E5E7EB'; // 默认灰色
  };

  // 获取日期格式的能量状态
  const getEnergyForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = energyRecords.find(r => r.date === dateStr);
    return record?.level || null;
  };

  // 渲染能量网格
  const renderEnergyGrid = () => {
    const levelColors = {
      high: 'rgba(16, 185, 129, 0.3)',
      medium: 'rgba(245, 158, 11, 0.3)',
      low: 'rgba(239, 68, 68, 0.3)'
    };

    return (
      <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          minWidth: 'max-content',
          marginBottom: '15px'
        }}>
          {dateGrid.map((date, index) => {
            const energyLevel = getEnergyForDate(date);
            const isToday = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            
            return (
              <div 
                key={index}
                style={{
                  width: '28px', // 增大方块
                  height: '28px', // 增大方块
                  backgroundColor: energyLevel ? (levelColors[energyLevel] || '#E5E7EB') : '#F9FAFB',
                  border: isToday ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: '#6B7280',
                  fontWeight: isToday ? 'bold' : 'normal',
                  position: 'relative'
                }}
                title={`${format(date, 'MM-dd')}: ${energyLevel || '未记录'}`}
              >
                {/* 不显示日期数字 */}
              </div>
            );
          })}
        </div>
        
        {/* 能量选择按钮 */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => recordEnergy('high')}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: todayEnergy === 'high' ? '1px solid #10B981' : '1px solid #D1D5DB',
              backgroundColor: todayEnergy === 'high' ? '#10B981' : 'rgba(16, 185, 129, 0.1)',
              color: todayEnergy === 'high' ? 'white' : '#10B981',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            高能量
          </button>
          <button
            onClick={() => recordEnergy('medium')}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: todayEnergy === 'medium' ? '1px solid #F59E0B' : '1px solid #D1D5DB',
              backgroundColor: todayEnergy === 'medium' ? '#F59E0B' : 'rgba(245, 158, 11, 0.1)',
              color: todayEnergy === 'medium' ? 'white' : '#F59E0B',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            中能量
          </button>
          <button
            onClick={() => recordEnergy('low')}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: todayEnergy === 'low' ? '1px solid #EF4444' : '1px solid #D1D5DB',
              backgroundColor: todayEnergy === 'low' ? '#EF4444' : 'rgba(239, 68, 68, 0.1)',
              color: todayEnergy === 'low' ? 'white' : '#EF4444',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            低能量
          </button>
        </div>
      </div>
    );
  };

  // 渲染成长柱状图
  const renderGrowthChart = () => {
    const growthData = getGrowthData();
    const maxScore = Math.max(...growthData.map(item => item.totalScore), 120); // 动态计算最大值
    
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
            📈 成长柱状图
          </h2>
          <div style={{
            padding: '4px 8px',
            backgroundColor: '#F3F4F6',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#6B7280'
          }}>
            总分: {calculateTotalScore()}
          </div>
        </div>
        
        {/* 图表容器 */}
        <div style={{
          height: '200px',
          position: 'relative',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          padding: '16px',
          overflowX: 'auto',
          overflowY: 'hidden'
        }}>
          {/* Y轴刻度 */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#6B7280',
            paddingTop: '16px',
            paddingBottom: '40px'
          }}>
            <div>{maxScore}</div>
            <div>{Math.round(maxScore * 0.75)}</div>
            <div>{Math.round(maxScore * 0.5)}</div>
            <div>{Math.round(maxScore * 0.25)}</div>
            <div>0</div>
          </div>
          
          {/* 图表区域 */}
          <div style={{
            marginLeft: '35px',
            height: '100%',
            position: 'relative',
            minWidth: `${growthData.length * 70}px`
          }}>
            {/* 网格线 */}
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: '40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  borderTop: '1px solid #E5E7EB',
                  width: '100%'
                }}></div>
              ))}
            </div>
            
            {/* 柱状图 */}
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '40px',
              top: 0,
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px'
            }}>
              {growthData.map((item) => {
                const chartHeight = 100; // 可用高度百分比
                const baseHeight = (item.baseScore / maxScore) * chartHeight;
                const todayHeight = (item.todayPoints / maxScore) * chartHeight;
                
                return (
                  <div key={item.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    minWidth: '60px',
                    height: '100%',
                    position: 'relative'
                  }}>
                    {/* 分数标签 */}
                    {item.todayPoints > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: `${100 - baseHeight - todayHeight - 5}%`,
                        fontSize: '10px',
                        color: '#10B981',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}>
                        +{item.todayPoints}
                      </div>
                    )}
                    
                    {/* 柱状图容器 - 从底部开始 */}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center'
                    }}>
                      {/* 今日增加分数（半透明层） */}
                      {item.todayPoints > 0 && (
                        <div style={{
                          width: '80%',
                          height: `${todayHeight}%`,
                          backgroundColor: item.color,
                          opacity: 0.4,
                          borderRadius: '4px 4px 0 0',
                          minHeight: '2px'
                        }}></div>
                      )}
                      
                      {/* 基础分数柱 */}
                      <div style={{
                        width: '80%',
                        height: `${baseHeight}%`,
                        backgroundColor: item.color,
                        borderRadius: item.todayPoints > 0 ? '0' : '4px 4px 0 0',
                        minHeight: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {item.totalScore}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X轴标签 */}
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '40px',
              display: 'flex',
              gap: '8px'
            }}>
              {growthData.map((item) => (
                <div key={`label-${item.id}`} style={{
                  flex: 1,
                  minWidth: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingTop: '4px'
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#374151',
                    textAlign: 'center',
                    fontWeight: item.isSubCategory ? 'normal' : 'bold',
                    maxWidth: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.name}
                  </div>
                  {item.isSubCategory && (
                    <div style={{
                      fontSize: '8px',
                      color: '#9CA3AF',
                      textAlign: 'center',
                      maxWidth: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.parentName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* 头部 */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #E2E8F0',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#64748B'
            }}
          >
            <ArrowLeft size={18} />
            返回
          </button>
          
          <h1 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            成长仪表盘
          </h1>
          
          <div style={{ width: '80px' }}></div> {/* 占位 */}
        </div>
      </header>

      {/* 能量状态模块 - 放在顶部 */}
      <div style={{
        backgroundColor: 'white',
        margin: '16px',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '10px',
          color: '#1F2937'
        }}>
          📊 能量状态追踪
        </div>
        {renderEnergyGrid()}
      </div>

      {/* 成长柱状图 - 放在能量模块下面 */}
      {renderGrowthChart()}

      {/* 主要内容区域 - 左右分栏 */}
      <div style={{ 
        padding: '0 16px 16px', 
        display: 'flex',
        gap: '16px'
      }}>
        {/* 左侧：成长维度 - 占1/3 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: 'fit-content'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px' 
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                🎯 成长维度
              </h2>
              
              <button
                onClick={() => setIsAddingDimension(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                添加维度
              </button>
            </div>

            {/* 添加维度表单 */}
            {isAddingDimension && (
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#F8FAFC',
                borderRadius: '6px'
              }}>
                <input
                  type="text"
                  placeholder="维度名称"
                  value={newDimensionName}
                  onChange={(e) => setNewDimensionName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleAddDimension}
                  style={{
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <Save size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsAddingDimension(false);
                    setNewDimensionName('');
                  }}
                  style={{
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* 维度列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {dimensions.map(dimension => {
                const { today: todayScore } = calculateScores(dimension.id);
                const hasSubCategories = dimension.subCategories && dimension.subCategories.length > 0;
                
                return (
                  <div 
                    key={dimension.id} 
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  >
                    {/* 维度头部 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: hasSubCategories ? '8px' : '0'
                    }}>
                      {editingDimensionId === dimension.id ? (
                        <input
                          type="text"
                          value={editingDimensionName}
                          onChange={(e) => setEditingDimensionName(e.target.value)}
                          onBlur={() => updateDimensionName(dimension.id, editingDimensionName)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateDimensionName(dimension.id, editingDimensionName);
                            }
                          }}
                          autoFocus
                          style={{
                            padding: '6px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '500',
                            width: '150px'
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div 
                            style={{ 
                              width: '12px', 
                              height: '12px', 
                              borderRadius: '50%', 
                              backgroundColor: dimension.color 
                            }} 
                          />
                          <span style={{ fontWeight: '500', fontSize: '14px' }}>
                            {dimension.name}
                          </span>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          padding: '4px 8px',
                          backgroundColor: '#F3F4F6',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#6B7280'
                        }}>
                          当前分数: {todayScore}
                        </div>
                        
                        <button
                          onClick={() => startEditingDimension(dimension.id, dimension.name)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <Edit2 size={14} color="#6B7280" />
                        </button>
                        
                        <input
                          type="number"
                          value={dimension.baseScore}
                          onChange={(e) => updateDimensionBaseScore(dimension.id, e.target.value)}
                          style={{
                            width: '60px',
                            padding: '4px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textAlign: 'center'
                          }}
                          title="基础分数"
                        />
                        
                        <button
                          onClick={() => handleDeleteDimension(dimension.id)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </button>
                      </div>
                    </div>

                    {/* 二级分类列表 */}
                    {hasSubCategories && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '4px 8px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '4px'
                        }}>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: '#6B7280' }}>
                            二级分类
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {managingSubCategoriesId === dimension.id ? (
                              <>
                                <input
                                  type="text"
                                  placeholder="新分类名称"
                                  value={newSubCategoryName}
                                  onChange={(e) => setNewSubCategoryName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddSubCategory(dimension.id);
                                    }
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    width: '120px'
                                  }}
                                />
                                <button
                                  onClick={() => handleAddSubCategory(dimension.id)}
                                  style={{
                                    backgroundColor: '#10B981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    fontSize: '10px'
                                  }}
                                >
                                  添加
                                </button>
                                <button
                                  onClick={() => {
                                    setManagingSubCategoriesId(null);
                                    setNewSubCategoryName('');
                                  }}
                                  style={{
                                    backgroundColor: '#F3F4F6',
                                    color: '#6B7280',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setManagingSubCategoriesId(dimension.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: '#F3F4F6',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '10px'
                                }}
                              >
                                <Plus size={12} />
                                管理分类
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {dimension.subCategories.map(subCategory => {
                          const { today: subScore } = calculateScores(dimension.id, subCategory.id);
                          
                          return (
                            <div key={subCategory.id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '6px 12px',
                              backgroundColor: '#F9FAFB',
                              borderRadius: '4px',
                              borderLeft: `3px solid ${dimension.color}`
                            }}>
                              {editingSubCategoryId === subCategory.id ? (
                                <input
                                  type="text"
                                  value={editingSubCategoryName}
                                  onChange={(e) => setEditingSubCategoryName(e.target.value)}
                                  onBlur={() => updateSubCategoryName(dimension.id, subCategory.id, editingSubCategoryName)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateSubCategoryName(dimension.id, subCategory.id, editingSubCategoryName);
                                    }
                                  }}
                                  autoFocus
                                  style={{
                                    padding: '4px',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    flex: 1
                                  }}
                                />
                              ) : (
                                <span 
                                  style={{ fontSize: '13px', color: '#374151', cursor: 'pointer' }}
                                  onClick={() => startEditingSubCategory(subCategory.id, subCategory.name)}
                                >
                                  {subCategory.name}
                                </span>
                              )}
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {editingSubCategoryScore === subCategory.id ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <input
                                      type="number"
                                      value={subCategoryScore}
                                      onChange={(e) => setSubCategoryScore(e.target.value)}
                                      onBlur={() => updateSubCategoryScore(dimension.id, subCategory.id, subCategoryScore)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          updateSubCategoryScore(dimension.id, subCategory.id, subCategoryScore);
                                        }
                                      }}
                                      autoFocus
                                      style={{
                                        width: '50px',
                                        padding: '4px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        textAlign: 'center'
                                      }}
                                    />
                                    <button
                                      onClick={() => updateSubCategoryScore(dimension.id, subCategory.id, subCategoryScore)}
                                      style={{
                                        backgroundColor: '#10B981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '2px 6px',
                                        cursor: 'pointer',
                                        fontSize: '10px'
                                      }}
                                    >
                                      <Save size={10} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingSubCategoryScore(null);
                                        setSubCategoryScore('');
                                      }}
                                      style={{
                                        backgroundColor: '#F3F4F6',
                                        color: '#6B7280',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '2px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditingSubCategoryScore(subCategory.id, subCategory.score)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      backgroundColor: '#F3F4F6',
                                      border: '1px solid #D1D5DB',
                                      borderRadius: '4px',
                                      padding: '4px 6px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    <span>分数: {subScore}</span>
                                    <Edit2 size={10} />
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => handleDeleteSubCategory(dimension.id, subCategory.id)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    padding: '2px'
                                  }}
                                >
                                  <Trash2 size={12} color="#EF4444" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧：成长日记 - 占2/3 */}
        <div style={{ flex: 2, minWidth: 0 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px' 
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                📝 成长日记
              </h2>
              
              <button
                onClick={() => setIsAddingDiary(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                添加日记
              </button>
            </div>

            {/* 添加日记表单 */}
            {isAddingDiary && (
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <textarea
                  placeholder="记录今天的成长..."
                  value={newDiary.content}
                  onChange={(e) => setNewDiary({ ...newDiary, content: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                    marginBottom: '8px'
                  }}
                />
                
                {/* AI 分析按钮 */}
                <div style={{ marginBottom: '8px' }}>
                  <button
                    onClick={analyzeWithAI}
                    disabled={isAnalyzing}
                    style={{
                      backgroundColor: isAnalyzing ? '#D1D5DB' : '#8B5CF6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={14} />
                    {isAnalyzing ? '分析中...' : 'AI 智能分析'}
                  </button>
                </div>
                
                {/* AI 建议显示 */}
                {aiSuggestion && (
                  <div style={{
                    backgroundColor: '#F3F4F6',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    fontSize: '12px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                      🤖 AI 分析建议：
                    </div>
                    
                    {aiSuggestion.suggestions && aiSuggestion.suggestions.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        {aiSuggestion.suggestions.map((suggestion, index) => (
                          <div key={index} style={{
                            backgroundColor: 'white',
                            padding: '8px',
                            borderRadius: '4px',
                            marginBottom: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ fontWeight: '500', color: '#374151' }}>
                                {suggestion.dimension}{suggestion.subCategory && ` - ${suggestion.subCategory}`}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                                建议 +{suggestion.points} 分 • {suggestion.reason}
                              </div>
                            </div>
                            <button
                              onClick={() => applySuggestion(suggestion)}
                              style={{
                                backgroundColor: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '10px'
                              }}
                            >
                              应用
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {aiSuggestion.newDimensions && aiSuggestion.newDimensions.length > 0 && (
                      <div>
                        <div style={{ fontWeight: '500', color: '#F59E0B', marginBottom: '4px' }}>
                          💡 建议新增维度：
                        </div>
                        {aiSuggestion.newDimensions.map((newDim, index) => (
                          <div key={index} style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>
                            • {newDim.name} - {newDim.reason}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {aiSuggestion.raw && (
                      <div style={{ color: '#6B7280', whiteSpace: 'pre-wrap' }}>
                        {aiSuggestion.raw}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 维度选择 - 与柱状图一致 */}
                <div style={{ marginBottom: '8px' }}>
                  <select
                    value={`${newDiary.selectedDimension}|${newDiary.selectedSubCategory}`}
                    onChange={(e) => {
                      const [dimId, subCatId] = e.target.value.split('|');
                      setNewDiary({ 
                        ...newDiary, 
                        selectedDimension: dimId,
                        selectedSubCategory: subCatId
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="|">选择维度</option>
                    {getSelectableDimensions().map((item, index) => (
                      <option key={index} value={`${item.dimensionId}|${item.subCategoryId || ''}`}>
                        {item.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#6B7280' }}>
                      积分:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newDiary.points}
                      onChange={(e) => setNewDiary({ ...newDiary, points: parseInt(e.target.value) || 1 })}
                      style={{
                        width: '50px',
                        padding: '4px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleAddDiary}
                      style={{
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <Save size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingDiary(false);
                        setNewDiary({
                          content: '',
                          selectedDimension: '',
                          selectedSubCategory: '',
                          points: 1,
                          date: new Date()
                        });
                        setAiSuggestion(null);
                      }}
                      style={{
                        backgroundColor: '#F3F4F6',
                        color: '#6B7280',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 日记列表 */}
            {diaryEntries.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#9CA3AF',
                fontSize: '14px'
              }}>
                还没有日记记录，点击"添加日记"开始记录成长
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {diaryEntries.slice(0, 10).map(entry => {
                  const dimension = dimensions.find(d => d.id === entry.dimensionId);
                  const subCategory = dimension?.subCategories?.find(sc => sc.id === entry.subCategoryId);
                  
                  return (
                    <div 
                      key={entry.id}
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px',
                        borderLeft: `3px solid ${dimension?.color || '#6B7280'}`
                      }}
                    >
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#374151',
                        marginBottom: '8px',
                        lineHeight: '1.5'
                      }}>
                        {entry.content}
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {dimension && (
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: `${dimension.color}20`,
                              color: dimension.color,
                              borderRadius: '4px',
                              fontSize: '10px'
                            }}>
                              {dimension.name}
                            </span>
                          )}
                          
                          {subCategory && (
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: '#F3F4F6',
                              color: '#6B7280',
                              borderRadius: '4px',
                              fontSize: '10px'
                            }}>
                              {subCategory.name}
                            </span>
                          )}
                          
                          <span style={{
                            padding: '2px 6px',
                            backgroundColor: '#FEF3C7',
                            color: '#D97706',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}>
                            +{entry.points} 分
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', color: '#9CA3AF' }}>
                            {entry.date}
                          </span>
                          
                          <button
                            onClick={() => handleDeleteDiary(entry.id)}
                            style={{
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                          >
                            <Trash2 size={12} color="#EF4444" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {diaryEntries.length > 10 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '8px',
                    fontSize: '12px',
                    color: '#6B7280'
                  }}>
                    还有 {diaryEntries.length - 10} 条历史记录...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;
