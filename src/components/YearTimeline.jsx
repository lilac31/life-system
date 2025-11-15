import React, { useState, useEffect } from 'react';
import { format, startOfYear, addMonths, differenceInDays, differenceInWeeks, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Plus, X, Calendar, Clock, Edit2, Check } from 'lucide-react';

const YearTimeline = () => {
  const [yearGoals, setYearGoals] = useState([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', date: '', color: 'red' });
  const [hoveredPosition, setHoveredPosition] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState([]);
  const [showPastWarning, setShowPastWarning] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoal, setEditGoal] = useState({ title: '', date: '', color: 'red' });
  
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(2025, 9, 1); // 2025年10月1日
  const today = new Date();
  
  // 生成13个月的数据（2025年10月到2026年10月）
  const months = Array.from({ length: 13 }, (_, i) => {
    const monthDate = addMonths(yearStart, i);
    return {
      date: monthDate,
      name: format(monthDate, 'M月', { locale: zhCN }),
      fullName: format(monthDate, 'yyyy年M月', { locale: zhCN })
    };
  });

  // 颜色选项 - 与任务颜色保持一致
  const colorOptions = [
    { value: 'red', name: '红色', class: 'bg-red-500' },
    { value: 'orange', name: '橙色', class: 'bg-orange-500' },
    { value: 'pink', name: '粉色', class: 'bg-pink-500' },
    { value: 'green', name: '绿色', class: 'bg-green-500' },
    { value: 'purple', name: '紫色', class: 'bg-purple-500' },
    { value: 'blue', name: '蓝色', class: 'bg-blue-500' },
    { value: 'yellow', name: '黄色', class: 'bg-yellow-500' },
    { value: 'indigo', name: '靛蓝色', class: 'bg-indigo-500' }
  ];

  // 从本地存储加载年度目标
  useEffect(() => {
    const savedGoals = localStorage.getItem('yearGoals');
    if (savedGoals) {
      try {
        setYearGoals(JSON.parse(savedGoals));
      } catch (e) {
        console.error('Failed to parse yearGoals:', e);
      }
    }
  }, []);

  // 保存年度目标到本地存储
  const saveGoals = (goals) => {
    setYearGoals(goals);
    localStorage.setItem('yearGoals', JSON.stringify(goals));
  };

  // 添加新目标
  const addGoal = () => {
    if (!newGoal.title || !newGoal.date) return;
    
    const goalDate = parseISO(newGoal.date);
    if (!isValid(goalDate)) return;
    
    // 检查是否为过去时间
    const isPastDate = goalDate < today;
    if (isPastDate) {
      setShowPastWarning(true);
      setTimeout(() => setShowPastWarning(false), 3000);
    }
    
    const goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      date: newGoal.date,
      color: newGoal.color
    };
    
    // 按日期排序插入目标
    const updatedGoals = [...yearGoals, goal].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    saveGoals(updatedGoals);
    setNewGoal({ title: '', date: '', color: 'red' });
    setShowAddGoal(false);
  };

  // 删除目标
  const deleteGoal = (goalId, e) => {
    e.stopPropagation();
    saveGoals(yearGoals.filter(goal => goal.id !== goalId));
  };

  // 开始编辑目标
  const startEditGoal = (goal, e) => {
    e.stopPropagation();
    setEditingGoal(goal.id);
    setEditGoal({ title: goal.title, date: goal.date, color: goal.color });
  };

  // 保存编辑的目标
  const saveEditGoal = () => {
    if (!editGoal.title || !editGoal.date) return;
    
    const goalDate = parseISO(editGoal.date);
    if (!isValid(goalDate)) return;
    
    const updatedGoals = yearGoals.map(goal => 
      goal.id === editingGoal 
        ? { ...goal, title: editGoal.title, date: editGoal.date, color: editGoal.color }
        : goal
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    saveGoals(updatedGoals);
    setEditingGoal(null);
    setEditGoal({ title: '', date: '', color: 'red' });
  };

  // 取消编辑
  const cancelEditGoal = () => {
    setEditingGoal(null);
    setEditGoal({ title: '', date: '', color: 'red' });
  };

  // 计算目标在时间轴上的位置
  const getGoalPosition = (goalDate) => {
    const date = parseISO(goalDate);
    const dayOfYear = differenceInDays(date, yearStart);
    const totalDaysInPeriod = differenceInDays(addMonths(yearStart, 13), yearStart);
    return (dayOfYear / totalDaysInPeriod) * 100;
  };

  // 计算距离目标的剩余天数和周数
  const getDaysUntilGoal = (goalDate) => {
    const date = parseISO(goalDate);
    return differenceInDays(date, today);
  };

  const getWeeksUntilGoal = (goalDate) => {
    const date = parseISO(goalDate);
    return differenceInWeeks(date, today);
  };

  // 获取最近的未来目标
  const getNextGoal = () => {
    const futureGoals = yearGoals
      .filter(goal => getDaysUntilGoal(goal.date) > 0)
      .sort((a, b) => getDaysUntilGoal(a.date) - getDaysUntilGoal(b.date));
    return futureGoals[0];
  };

  // 处理时间轴悬停
  const handleTimelineHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    // 查找该位置附近的目标（±2%范围内）
    const nearbyGoals = yearGoals.filter(goal => {
      const goalPosition = getGoalPosition(goal.date);
      return Math.abs(goalPosition - percentage) <= 3; // 3%的容差范围
    });
    
    if (nearbyGoals.length > 0) {
      setHoveredPosition({ x, goals: nearbyGoals });
      setExpandedGoals(nearbyGoals);
    } else {
      setHoveredPosition(null);
      setExpandedGoals([]);
    }
  };

  const nextGoal = getNextGoal();

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 mb-4">
      {/* 添加目标表单 */}
      {showAddGoal && (
        <div className="bg-white rounded border border-gray-200 p-3 mb-3">
          {/* 过去时间警告 */}
          {showPastWarning && (
            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠️ 注意：您选择的是过去的日期，目标已添加但显示为已过期状态
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="目标名称"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              className="col-span-2 text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <input
              type="date"
              value={newGoal.date}
              onChange={(e) => setNewGoal({ ...newGoal, date: e.target.value })}
              min="1900-01-01"
              max="2099-12-31"
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <div className="flex space-x-1">
              <select
                value={newGoal.color}
                onChange={(e) => setNewGoal({ ...newGoal, color: e.target.value })}
                className="flex-1 text-xs px-1 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {colorOptions.map(color => (
                  <option key={color.value} value={color.value}>{color.name}</option>
                ))}
              </select>
              <button
                onClick={addGoal}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                ✓
              </button>
              <button
                onClick={() => setShowAddGoal(false)}
                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 时间轴 */}
      <div className="relative">
        {/* 月份刻度 */}
        <div className="flex justify-between items-center mb-2">
          {months.map((month, index) => (
            <div key={index} className="text-xs text-gray-600 text-center">
              {month.name}
            </div>
          ))}
        </div>

        {/* 时间轴线和添加按钮容器 */}
        <div className="flex items-center space-x-2">
          <div 
            className="relative h-6 bg-gray-100 rounded-full mb-2 cursor-pointer flex-1"
            onMouseMove={handleTimelineHover}
            onMouseLeave={() => {
              setHoveredPosition(null);
              setExpandedGoals([]);
            }}
          >
          {/* 当前时间指示器 */}
          <div
            className="absolute top-0 w-0.5 h-full bg-red-500 rounded-full z-10"
            style={{ left: `${getGoalPosition(format(today, 'yyyy-MM-dd'))}%` }}
            title={`今天 ${format(today, 'M月d日')}`}
          >
          </div>

          {/* 目标标记 */}
          {yearGoals.map(goal => {
            const position = getGoalPosition(goal.date);
            const colorClass = colorOptions.find(c => c.value === goal.color)?.class || 'bg-blue-500';
            const daysUntil = getDaysUntilGoal(goal.date);
            const isPast = daysUntil < 0;
            const isExpanded = expandedGoals.some(g => g.id === goal.id);
            
            return (
              <div
                key={goal.id}
                className="absolute top-0 h-full flex items-center z-20"
                style={{ left: `${position}%` }}
              >
                <div
                  className={`w-3 h-3 ${colorClass} border-2 border-white cursor-pointer transition-all duration-200 ${
                    isPast ? 'opacity-50' : ''
                  } ${isExpanded ? 'scale-125 shadow-lg' : 'hover:scale-110'}`}
                  title={`${goal.title} - ${format(parseISO(goal.date), 'M月d日')} ${isPast ? '(已过期)' : `(还有${daysUntil}天)`}`}
                >
                </div>
              </div>
            );
          })}
          </div>
          
          {/* 添加目标按钮 */}
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="w-6 h-6 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors flex items-center justify-center flex-shrink-0 mb-2"
            title="添加目标"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* 悬停展开的目标详情 - 鱼骨图样式 */}
        {hoveredPosition && expandedGoals.length > 0 && (
          <div 
            className="absolute z-30 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-64"
            style={{ 
              left: `${Math.min(Math.max(hoveredPosition.x - 128, 0), 400)}px`,
              top: '-120px'
            }}
          >
            {/* 箭头指向时间轴 */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-300"></div>
            </div>
            
            <div className="space-y-2">
              {expandedGoals.map((goal, index) => {
                const colorClass = colorOptions.find(c => c.value === goal.color)?.class || 'bg-blue-500';
                const daysUntil = getDaysUntilGoal(goal.date);
                const weeksUntil = getWeeksUntilGoal(goal.date);
                const isPast = daysUntil < 0;
                
                return (
                  <div key={goal.id} className="flex items-center justify-between group">
                    {/* 鱼骨线样式 */}
                    <div className="flex items-center space-x-2 flex-1">
                      <div className={`w-2 h-2 ${colorClass} flex-shrink-0`}></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{goal.title}</div>
                        <div className="text-xs text-gray-500">
                          {format(parseISO(goal.date), 'yyyy年M月d日')}
                          {!isPast && (
                            <span className="ml-2 text-purple-600 font-medium">
                              还有 {daysUntil} 天 ({weeksUntil} 周)
                            </span>
                          )}
                          {isPast && (
                            <span className="ml-2 text-red-500">已过期 {Math.abs(daysUntil)} 天</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => deleteGoal(goal.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-2 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 目标列表 - 正方形色块显示 */}
        {yearGoals.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {yearGoals
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(goal => {
                  const colorClass = colorOptions.find(c => c.value === goal.color)?.class || 'bg-red-500';
                  const daysUntil = getDaysUntilGoal(goal.date);
                  const isPast = daysUntil < 0;
                  const isEditing = editingGoal === goal.id;
                  
                  if (isEditing) {
                    return (
                      <div key={goal.id} className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                        <div className={`w-3 h-3 ${colorOptions.find(c => c.value === editGoal.color)?.class || 'bg-red-500'} flex-shrink-0`}></div>
                        <input
                          type="text"
                          value={editGoal.title}
                          onChange={(e) => setEditGoal({ ...editGoal, title: e.target.value })}
                          className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-20"
                          placeholder="目标名称"
                        />
                        <input
                          type="date"
                          value={editGoal.date}
                          onChange={(e) => setEditGoal({ ...editGoal, date: e.target.value })}
                          min="1900-01-01"
                          max="2099-12-31"
                          className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <select
                          value={editGoal.color}
                          onChange={(e) => setEditGoal({ ...editGoal, color: e.target.value })}
                          className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {colorOptions.map(color => (
                            <option key={color.value} value={color.value}>{color.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={saveEditGoal}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="保存"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={cancelEditGoal}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="取消"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={goal.id}
                      className={`group flex items-center space-x-2 text-xs ${isPast ? 'opacity-50' : ''} hover:bg-gray-50 rounded px-2 py-1 transition-colors`}
                    >
                      <div className={`w-3 h-3 ${colorClass} flex-shrink-0`}></div>
                      <span className="text-gray-700 font-medium">{goal.title}</span>
                      <span className="text-gray-500">
                        {format(parseISO(goal.date), 'M/d')}
                      </span>
                      {!isPast && (
                        <span className="text-purple-600 font-medium">
                          ({daysUntil}天)
                        </span>
                      )}
                      <button
                        onClick={(e) => startEditGoal(goal, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 ml-1 transition-opacity"
                        title="编辑目标"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => deleteGoal(goal.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-1 transition-opacity"
                        title="删除目标"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YearTimeline;