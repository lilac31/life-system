import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Sparkles } from 'lucide-react';
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
        { id: '2', name: '沟通能力', baseScore: 50, color: '#10B981', subCategories: [] },
        { id: '3', name: '领导力', baseScore: 40, color: '#F59E0B', subCategories: [] },
        { id: '4', name: '创新思维', baseScore: 55, color: '#8B5CF6', subCategories: [] },
        { id: '5', name: '健康管理', baseScore: 45, color: '#EF4444', subCategories: [] }
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
            score: 0 // 新增二级分类的初始分数
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
    setSubCategoryScore(currentScore.toString());
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
    
    if (subCategoryId) {
      // 计算二级分类的分数
      const subCategory = dimension?.subCategories?.find(sc => sc.id === subCategoryId);
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
      
      const todayScore = todayEntries.reduce((sum, entry) => sum + entry.points, 0) + (subCategory.score || 0);
      const yesterdayScore = yesterdayEntries.reduce((sum, entry) => sum + entry.points, 0) + (subCategory.score || 0);
      
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
      if (dimension?.subCategories) {
        subCategoriesTotal = dimension.subCategories.reduce((sum, sc) => sum + (sc.score || 0), 0);
      }
      
      const todayScore = todayEntries.reduce((sum, entry) => sum + entry.points, 0) + 
                       (dimension?.baseScore || 0) + subCategoriesTotal;
      const yesterdayScore = yesterdayEntries.reduce((sum, entry) => sum + entry.points, 0) + 
                          (dimension?.baseScore || 0) + subCategoriesTotal;
      
      return { today: todayScore, yesterday: yesterdayScore };
    }
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
      <div style={{ overflowX: 'auto', paddingBottom: '5px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '4px', 
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
                  width: '18px',
                  height: '18px',
                  backgroundColor: energyLevel ? (levelColors[energyLevel] || '#E5E7EB') : '#F9FAFB',
                  border: isToday ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  borderRadius: '2px',
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
                {format(date, 'd')}
              </div>
            );
          })}
        </div>
        
        {/* 能量选择按钮 */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => recordEnergy('high')}
            style={{
              padding: '6px 12px',
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
              padding: '6px 12px',
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
              padding: '6px 12px',
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

      {/* 主要内容 */}
      <div style={{ padding: '0 16px 16px' }}>
        {/* 维度管理 */}
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
        
        {/* 成长日记区域 */}
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
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select
                  value={newDiary.selectedDimension}
                  onChange={(e) => {
                    setNewDiary({ 
                      ...newDiary, 
                      selectedDimension: e.target.value,
                      selectedSubCategory: '' // 重置二级分类
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">选择维度</option>
                  {dimensions.map(dimension => (
                    <option key={dimension.id} value={dimension.id}>
                      {dimension.name}
                    </option>
                  ))}
                </select>
                
                {newDiary.selectedDimension && dimensions.find(d => d.id === newDiary.selectedDimension)?.subCategories?.length > 0 && (
                  <select
                    value={newDiary.selectedSubCategory}
                    onChange={(e) => setNewDiary({ ...newDiary, selectedSubCategory: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">选择二级分类</option>
                    {dimensions.find(d => d.id === newDiary.selectedDimension)?.subCategories?.map(subCategory => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                )}
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
  );
};

export default PersonalDashboard;
