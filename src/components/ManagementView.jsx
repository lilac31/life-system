import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import Navigation from './Navigation';
import DataManager from './DataManager';

const ManagementView = ({ currentView, onViewChange }) => {
  const [okrData, setOkrData] = useState({
    period: 'Q1 2025', // 当前周期
    objectives: []
  });
  const [editingObjective, setEditingObjective] = useState(null);
  const [editingKeyResult, setEditingKeyResult] = useState(null);
  const [expandedObjectives, setExpandedObjectives] = useState({});

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

  // 初始化数据
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

  // 保存数据
  const saveOkrData = (data) => {
    setOkrData(data);
    localStorage.setItem('okrData', JSON.stringify(data));
  };

  // 添加关键结果
  const addKeyResult = (objectiveId) => {
    const newKeyResult = {
      id: `kr-${Date.now()}`,
      description: '',
      target: '',
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

  // 更新目标描述
  const updateObjectiveDescription = (objectiveId, description) => {
    const updatedObjectives = okrData.objectives.map(obj => 
      obj.id === objectiveId ? { ...obj, description } : obj
    );
    saveOkrData({ ...okrData, objectives: updatedObjectives });
  };

  // 切换展开/折叠
  const toggleExpand = (objectiveId) => {
    setExpandedObjectives(prev => ({
      ...prev,
      [objectiveId]: !prev[objectiveId]
    }));
  };

  // 计算完成度
  const calculateProgress = (keyResults) => {
    if (!keyResults || keyResults.length === 0) return 0;
    const total = keyResults.reduce((sum, kr) => sum + (parseFloat(kr.current) || 0), 0);
    const target = keyResults.reduce((sum, kr) => sum + (parseFloat(kr.target) || 100), 0);
    return target > 0 ? Math.round((total / target) * 100) : 0;
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OKR 管理</h1>
          <p className="text-gray-500 text-sm mt-1">
            设定并追踪你的目标与关键结果
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Navigation currentView={currentView} onViewChange={onViewChange} />
          <DataManager />
        </div>
      </div>

      {/* 周期选择 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">当前周期：</label>
            <input
              type="text"
              value={okrData.period}
              onChange={(e) => saveOkrData({ ...okrData, period: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="如：Q1 2025 或 2025年度"
            />
          </div>
          <div className="text-sm text-gray-500">
            4个核心目标 · {okrData.objectives.reduce((sum, obj) => sum + (obj.keyResults?.length || 0), 0)} 个关键结果
          </div>
        </div>
      </div>

      {/* OKR 列表 */}
      <div className="space-y-4">
        {okrData.objectives.map((objective) => {
          const progress = calculateProgress(objective.keyResults);
          const isExpanded = expandedObjectives[objective.id] !== false; // 默认展开

          return (
            <div 
              key={objective.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              style={{ borderLeftWidth: '4px', borderLeftColor: objective.color }}
            >
              {/* 目标头部 */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleExpand(objective.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                      <Target size={20} style={{ color: objective.color }} />
                      <h3 className="text-lg font-bold text-gray-900">
                        {objective.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {objective.keyResults?.length || 0} KR
                      </span>
                    </div>
                    
                    {editingObjective === objective.id ? (
                      <div className="ml-11 mt-2 flex items-center space-x-2">
                        <input
                          type="text"
                          value={objective.description}
                          onChange={(e) => updateObjectiveDescription(objective.id, e.target.value)}
                          onBlur={() => setEditingObjective(null)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') setEditingObjective(null);
                          }}
                          autoFocus
                          placeholder="描述这个目标的具体内容..."
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => setEditingObjective(objective.id)}
                        className="ml-11 mt-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                      >
                        {objective.description || '点击添加目标描述...'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* 进度条 */}
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: objective.color 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right">
                        {progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 关键结果列表 */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-4 space-y-3">
                    {objective.keyResults && objective.keyResults.length > 0 ? (
                      objective.keyResults.map((kr, index) => (
                        <div 
                          key={kr.id}
                          className="bg-white rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-1"
                              style={{ backgroundColor: objective.color }}
                            >
                              {index + 1}
                            </div>
                            
                            <div className="flex-1">
                              {editingKeyResult === kr.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={kr.description}
                                    onChange={(e) => updateKeyResult(objective.id, kr.id, 'description', e.target.value)}
                                    placeholder="关键结果描述..."
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      value={kr.current}
                                      onChange={(e) => updateKeyResult(objective.id, kr.id, 'current', e.target.value)}
                                      placeholder="当前值"
                                      className="w-24 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-400">/</span>
                                    <input
                                      type="number"
                                      value={kr.target}
                                      onChange={(e) => updateKeyResult(objective.id, kr.id, 'target', e.target.value)}
                                      placeholder="目标值"
                                      className="w-24 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <select
                                      value={kr.unit}
                                      onChange={(e) => updateKeyResult(objective.id, kr.id, 'unit', e.target.value)}
                                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="%">%</option>
                                      <option value="个">个</option>
                                      <option value="次">次</option>
                                      <option value="人">人</option>
                                      <option value="万">万</option>
                                    </select>
                                    <button
                                      onClick={() => setEditingKeyResult(null)}
                                      className="ml-auto px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                                    >
                                      完成
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-900 font-medium">
                                      {kr.description || '未设置描述'}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => setEditingKeyResult(kr.id)}
                                        className="text-gray-400 hover:text-blue-500 transition-colors"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => deleteKeyResult(objective.id, kr.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-1 flex items-center space-x-2">
                                    <div className="text-xs text-gray-500">
                                      进度：
                                      <span className="font-medium text-gray-700 ml-1">
                                        {kr.current} / {kr.target} {kr.unit}
                                      </span>
                                    </div>
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full transition-all duration-300"
                                        style={{ 
                                          width: `${Math.min((parseFloat(kr.current) / parseFloat(kr.target)) * 100, 100)}%`,
                                          backgroundColor: objective.color 
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">
                                      {kr.target > 0 ? Math.round((kr.current / kr.target) * 100) : 0}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        还没有关键结果，点击下方按钮添加
                      </div>
                    )}

                    {/* 添加关键结果按钮 */}
                    <button
                      onClick={() => addKeyResult(objective.id)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>添加关键结果 (KR)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 使用提示</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>O (Objective)</strong>：目标，描述你想要达成的方向</li>
          <li>• <strong>KR (Key Result)</strong>：关键结果，可量化的成果指标</li>
          <li>• 每个目标建议设置 2-5 个关键结果</li>
          <li>• 在周视图中添加任务时，可以关联到具体的 OKR</li>
          <li>• 建议每季度或每年更新一次 OKR</li>
        </ul>
      </div>
    </div>
  );
};

export default ManagementView;
