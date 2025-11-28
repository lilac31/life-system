import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Navigation from './Navigation';
import DataManager from './DataManager';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 默认的4个核心O
const defaultObjectives = [
  { 
    id: 'business', 
    name: '业务', 
    color: '#3B82F6',
    description: '',
    keyResults: []
  },
  { 
    id: 'team', 
    name: '团队', 
    color: '#10B981',
    description: '',
    keyResults: []
  },
  { 
    id: 'potential', 
    name: '潜力', 
    color: '#F59E0B',
    description: '',
    keyResults: []
  },
  { 
    id: 'life', 
    name: '人生', 
    color: '#8B5CF6',
    description: '',
    keyResults: []
  }
];

// 获取颜色对应的背景色
const getColorBackground = (color, completed = false) => {
  const colorMap = {
    red: completed ? '#fee2e2' : '#fecaca',
    orange: completed ? '#fed7aa' : '#fdba74',
    pink: completed ? '#fce7f3' : '#f9a8d4',
    green: completed ? '#d1fae5' : '#a7f3d0',
    purple: completed ? '#e9d5ff' : '#d8b4fe',
    blue: completed ? '#dbeafe' : '#bfdbfe',
    yellow: completed ? '#fef3c7' : '#fde68a',
    indigo: completed ? '#e0e7ff' : '#c7d2fe',
    tencent: completed ? '#dbeafe' : '#bfdbfe',
    cyan: completed ? '#cffafe' : '#a5f3fc'
  };
  return colorMap[color] || '#f3f4f6';
};

const ManagementView = ({ currentView, onViewChange }) => {
  const [okrData, setOkrData] = useState({
    period: 'Q1 2025',
    objectives: []
  });
  const [editingKeyResult, setEditingKeyResult] = useState(null);
  const [expandedKRs, setExpandedKRs] = useState({}); // 展开/折叠KR
  const [tasks, setTasks] = useState([]); // 所有任务

  // 初始化OKR数据
  useEffect(() => {
    const savedOkr = localStorage.getItem('okrData');
    if (savedOkr) {
      try {
        setOkrData(JSON.parse(savedOkr));
      } catch (e) {
        console.error('Failed to parse OKR data:', e);
        setOkrData({ period: 'Q1 2025', objectives: defaultObjectives });
      }
    } else {
      setOkrData({ period: 'Q1 2025', objectives: defaultObjectives });
    }
  }, []);

  // 加载任务数据
  useEffect(() => {
    const quickTasks = localStorage.getItem('quickTasks');
    if (quickTasks) {
      try {
        const tasksData = JSON.parse(quickTasks);
        const allTasks = [];
        
        // 遍历所有日期和时间段
        Object.keys(tasksData).forEach(dayKey => {
          Object.keys(tasksData[dayKey]).forEach(slotId => {
            tasksData[dayKey][slotId].forEach(task => {
              if (task.text && task.okr) { // 只收集有内容且有OKR的任务
                allTasks.push({
                  ...task,
                  dayKey,
                  slotId
                });
              }
            });
          });
        });
        
        // 按日期倒序排序（最新的在最上面）
        allTasks.sort((a, b) => {
          const dateA = new Date(a.dayKey);
          const dateB = new Date(b.dayKey);
          return dateB - dateA;
        });
        
        setTasks(allTasks);
      } catch (e) {
        console.error('Failed to parse tasks:', e);
      }
    }
  }, []);

  // 保存OKR数据
  const saveOkrData = (data) => {
    setOkrData(data);
    localStorage.setItem('okrData', JSON.stringify(data));
  };

  // 添加关键结果
  const addKeyResult = (objectiveId) => {
    const newKeyResult = {
      id: `kr-${Date.now()}`,
      description: '',
      target: 100,
      current: 0,
      unit: '%'
    };

    const updatedObjectives = okrData.objectives.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          keyResults: [...(obj.keyResults || []), newKeyResult]
        };
      }
      return obj;
    });

    saveOkrData({ ...okrData, objectives: updatedObjectives });
    setEditingKeyResult(newKeyResult.id);
  };

  // 更新关键结果
  const updateKeyResult = (objectiveId, krId, field, value) => {
    const updatedObjectives = okrData.objectives.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          keyResults: obj.keyResults.map(kr => 
            kr.id === krId ? { ...kr, [field]: value } : kr
          )
        };
      }
      return obj;
    });

    saveOkrData({ ...okrData, objectives: updatedObjectives });
  };

  // 删除关键结果
  const deleteKeyResult = (objectiveId, krId) => {
    if (!window.confirm('确定要删除这个关键结果吗？')) return;

    const updatedObjectives = okrData.objectives.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          keyResults: obj.keyResults.filter(kr => kr.id !== krId)
        };
      }
      return obj;
    });

    saveOkrData({ ...okrData, objectives: updatedObjectives });
  };

  // 切换KR展开/折叠
  const toggleKR = (krId) => {
    setExpandedKRs(prev => ({
      ...prev,
      [krId]: !prev[krId]
    }));
  };

  // 获取某个KR的任务列表
  const getTasksForKR = (objectiveId, keyResultId) => {
    return tasks.filter(task => 
      task.okr && 
      task.okr.objectiveId === objectiveId && 
      task.okr.keyResultId === keyResultId
    );
  };

  // 渲染任务卡片
  const renderTaskCard = (task) => {
    const dateStr = format(parseISO(task.dayKey), 'MM月dd日 (EEE)', { locale: zhCN });
    
    return (
      <div
        key={task.id}
        className="mb-2 rounded p-2 text-xs"
        style={{
          backgroundColor: task.color ? getColorBackground(task.color, task.completed) : '#f3f4f6',
          opacity: task.completed ? 0.7 : 1
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <span className="text-[10px] text-gray-500 font-medium">{dateStr}</span>
          {task.completed && (
            <span className="text-[10px] text-green-600">✓ 已完成</span>
          )}
        </div>
        <div className={`text-gray-800 ${task.completed ? 'line-through' : ''}`}>
          {task.text}
        </div>
        {task.delayed && (
          <div className="mt-1 text-[10px] text-gray-500">
            ⏰ 延迟
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OKR 管理</h1>
          <p className="text-gray-500 text-sm mt-1">
            目标与关键结果追踪
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Navigation currentView={currentView} onViewChange={onViewChange} />
          <DataManager />
        </div>
      </div>

      {/* 周期选择 */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <input
          type="text"
          value={okrData.period}
          onChange={(e) => saveOkrData({ ...okrData, period: e.target.value })}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="如：Q1 2025 或 2025年度"
        />
      </div>

      {/* 4个O横向排列 */}
      <div className="grid grid-cols-4 gap-4">
        {okrData.objectives.map((objective) => (
          <div 
            key={objective.id}
            className="bg-white rounded-lg border-2 overflow-hidden"
            style={{ borderColor: objective.color }}
          >
            {/* O标题 */}
            <div 
              className="p-3 text-white font-bold text-center"
              style={{ backgroundColor: objective.color }}
            >
              <Target size={20} className="inline mr-2" />
              {objective.name}
            </div>

            {/* KR列表 */}
            <div className="p-3 space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
              {objective.keyResults && objective.keyResults.length > 0 ? (
                objective.keyResults.map((kr) => {
                  const krTasks = getTasksForKR(objective.id, kr.id);
                  const isExpanded = expandedKRs[kr.id] !== false; // 默认展开
                  
                  return (
                    <div key={kr.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* KR标题 */}
                      <div className="bg-gray-50 p-2">
                        {editingKeyResult === kr.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={kr.description}
                              onChange={(e) => updateKeyResult(objective.id, kr.id, 'description', e.target.value)}
                              placeholder="KR描述..."
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={kr.current}
                                onChange={(e) => updateKeyResult(objective.id, kr.id, 'current', parseFloat(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
                              />
                              <span className="text-xs text-gray-400">/</span>
                              <input
                                type="number"
                                value={kr.target}
                                onChange={(e) => updateKeyResult(objective.id, kr.id, 'target', parseFloat(e.target.value) || 100)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
                              />
                              <select
                                value={kr.unit}
                                onChange={(e) => updateKeyResult(objective.id, kr.id, 'unit', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value="%">%</option>
                                <option value="个">个</option>
                                <option value="次">次</option>
                                <option value="人">人</option>
                                <option value="万">万</option>
                              </select>
                              <button
                                onClick={() => setEditingKeyResult(null)}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                完成
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleKR(kr.id)}
                                className="flex-1 flex items-center text-left text-xs font-medium text-gray-900 hover:text-blue-600"
                              >
                                {isExpanded ? <ChevronUp size={14} className="mr-1" /> : <ChevronDown size={14} className="mr-1" />}
                                <span className="flex-1">{kr.description || '未设置描述'}</span>
                              </button>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => setEditingKeyResult(kr.id)}
                                  className="text-gray-400 hover:text-blue-500"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => deleteKeyResult(objective.id, kr.id)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <div className="mt-1 flex items-center space-x-2">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all"
                                  style={{ 
                                    width: `${Math.min((kr.current / kr.target) * 100, 100)}%`,
                                    backgroundColor: objective.color
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-600 whitespace-nowrap">
                                {kr.current}/{kr.target}{kr.unit}
                              </span>
                            </div>
                            <div className="mt-1 text-[10px] text-gray-500">
                              {krTasks.length} 个任务
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 任务列表 */}
                      {isExpanded && krTasks.length > 0 && (
                        <div className="p-2 bg-gray-50">
                          {krTasks.map(task => renderTaskCard(task))}
                        </div>
                      )}

                      {isExpanded && krTasks.length === 0 && (
                        <div className="p-3 text-center text-xs text-gray-400">
                          暂无关联任务
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-gray-400">
                  还没有关键结果
                </div>
              )}

              {/* 待思考任务 */}
              {(() => {
                const pendingTasks = tasks.filter(task => 
                  task.okr && 
                  task.okr.objectiveId === objective.id && 
                  task.okr.keyResultId === 'pending'
                );
                
                if (pendingTasks.length > 0) {
                  const isExpanded = expandedKRs[`${objective.id}-pending`] !== false;
                  
                  return (
                    <div className="border border-orange-200 rounded-lg overflow-hidden bg-orange-50">
                      <div className="p-2">
                        <button
                          onClick={() => toggleKR(`${objective.id}-pending`)}
                          className="w-full flex items-center text-left text-xs font-medium text-orange-700 hover:text-orange-800"
                        >
                          {isExpanded ? <ChevronUp size={14} className="mr-1" /> : <ChevronDown size={14} className="mr-1" />}
                          <span className="flex-1">💭 待思考</span>
                          <span className="text-[10px]">{pendingTasks.length} 个任务</span>
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="p-2">
                          {pendingTasks.map(task => renderTaskCard(task))}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* 添加KR按钮 */}
              <button
                onClick={() => addKeyResult(objective.id)}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-1"
              >
                <Plus size={14} />
                <span>添加 KR</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagementView;
