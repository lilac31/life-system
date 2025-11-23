import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowLeft, X, GripVertical } from 'lucide-react';

const LifeTimeline = ({ onBack }) => {
  const [zoomLevel, setZoomLevel] = useState(5); // 1, 3, 5, 10 years
  const [categories, setCategories] = useState([
    { id: 'work', name: '工作卡', goals: [{ id: 'g1', text: '成为行业专家', color: 'red' }] },
    { id: 'experience', name: '经验卡', goals: [{ id: 'g2', text: '环球旅行', color: 'orange' }] },
    { id: 'sensory', name: '感官卡', goals: [{ id: 'g3', text: '学习一门新乐器', color: 'green' }] },
    { id: 'whitespace', name: '留白卡', goals: [{ id: 'g4', text: '每周冥想', color: 'blue' }] },
    { id: 'share', name: '分享卡', goals: [{ id: 'g5', text: '撰写一本关于...的书', color: 'purple' }] },
  ]);
  const [timelineTasks, setTimelineTasks] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const timelineScrollRef = useRef(null);
  const mainContentScrollRef = useRef(null);

  // 自动调整 textarea 高度的函数
  const adjustTextareaHeight = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(24, textarea.scrollHeight) + 'px';
    }
  };

  // 在组件挂载和任务更新时调整所有 textarea 高度
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(adjustTextareaHeight);
  }, [timelineTasks]);

  const currentAge = 31;
  const maxAge = 100;
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - currentAge;

  const colorOptions = ['red', 'orange', 'green', 'blue', 'purple', 'pink', 'indigo', 'cyan'];

  const goalColorClasses = {
    red: { tagBg: 'bg-red-500', tagText: 'text-white', cellBg: 'bg-red-50', border: 'border-red-200' },
    orange: { tagBg: 'bg-orange-500', tagText: 'text-white', cellBg: 'bg-orange-50', border: 'border-orange-200' },
    green: { tagBg: 'bg-green-500', tagText: 'text-white', cellBg: 'bg-green-50', border: 'border-green-200' },
    blue: { tagBg: 'bg-blue-500', tagText: 'text-white', cellBg: 'bg-blue-50', border: 'border-blue-200' },
    purple: { tagBg: 'bg-purple-500', tagText: 'text-white', cellBg: 'bg-purple-50', border: 'border-purple-200' },
    pink: { tagBg: 'bg-pink-500', tagText: 'text-white', cellBg: 'bg-pink-50', border: 'border-pink-200' },
    indigo: { tagBg: 'bg-indigo-500', tagText: 'text-white', cellBg: 'bg-indigo-50', border: 'border-indigo-200' },
    cyan: { tagBg: 'bg-cyan-500', tagText: 'text-white', cellBg: 'bg-cyan-50', border: 'border-cyan-200' },
  };

  const getGoalColorClasses = (color) => goalColorClasses[color] || goalColorClasses.blue;

  // 根据缩放级别生成时间段
  const getTimeGroups = () => {
    const groups = [];
    for (let age = currentAge; age <= maxAge; age += zoomLevel) {
      const endAge = Math.min(age + zoomLevel - 1, maxAge);
      groups.push({
        start: age,
        end: endAge,
        label: zoomLevel === 1 ? age.toString() : `${age}～${endAge}`
      });
    }
    return groups;
  };

  const timeGroups = getTimeGroups();

  const handleAddCategory = () => {
    setCategories(prev => {
      const usedColors = prev
        .map(cat => cat.goals[0]?.color)
        .filter(Boolean);
      const availableColor =
        colorOptions.find(c => !usedColors.includes(c)) ||
        colorOptions[prev.length % colorOptions.length];
      const newId = `category-${Date.now()}`;
      return [
        ...prev,
        {
          id: newId,
          name: '新模块',
          goals: [
            { id: `${newId}-g1`, text: '新的目标', color: availableColor },
          ],
        },
      ];
    });
  };

  const handleDeleteCategory = (categoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    // 同时删除该模块的所有任务
    setTimelineTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(key => {
        if (key.startsWith(`${categoryId}_`)) {
          delete newTasks[key];
        }
      });
      return newTasks;
    });
  };

  const handleCategoryNameChange = (categoryId, name) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, name } : cat
    ));
  };

  const handleAddGoal = (categoryId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      const newGoalId = `${categoryId}-g-${Date.now()}`;
      const defaultColor = cat.goals[0]?.color || 'blue';
      return {
        ...cat,
        goals: [...cat.goals, { id: newGoalId, text: '新的目标', color: defaultColor }],
      };
    }));
  };

  const handleDeleteGoal = (categoryId, goalId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      // 至少保留一个目标
      if (cat.goals.length <= 1) return cat;
      return {
        ...cat,
        goals: cat.goals.filter(goal => goal.id !== goalId),
      };
    }));
  };

  const handleGoalTextChange = (categoryId, goalId, text) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        goals: cat.goals.map(goal => goal.id === goalId ? { ...goal, text } : goal),
      };
    }));
  };

  const handleGoalColorChange = (categoryId, goalId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        goals: cat.goals.map(goal => {
          if (goal.id !== goalId) return goal;
          const currentIndex = colorOptions.indexOf(goal.color || 'blue');
          const nextColor = colorOptions[(currentIndex + 1) % colorOptions.length];
          return { ...goal, color: nextColor };
        }),
      };
    }));
  };

  const handleTaskChange = (categoryId, groupKey, taskIndex, text) => {
    setTimelineTasks(prev => {
      const existing = prev[groupKey] || [{ id: Date.now(), text: '', spans: 1 }];
      const next = existing.map((item, idx) => 
        idx === taskIndex ? { ...item, text } : item
      );

      // 如果编辑的是最后一个且有内容，自动增加一个空行
      if (taskIndex === next.length - 1 && text.trim() !== '') {
        next.push({ id: Date.now() + 1, text: '', spans: 1 });
      }

      return {
        ...prev,
        [groupKey]: next,
      };
    });
  };

  const handleDeleteTask = (groupKey, taskIndex) => {
    setTimelineTasks(prev => {
      const existing = prev[groupKey] || [];
      const filtered = existing.filter((_, idx) => idx !== taskIndex);
      
      // 保证至少有一个空任务
      if (filtered.length === 0 || filtered.every(t => t.text.trim() === '')) {
        return {
          ...prev,
          [groupKey]: [{ id: Date.now(), text: '', spans: 1 }],
        };
      }

      return {
        ...prev,
        [groupKey]: filtered,
      };
    });
  };

  const getCellTasks = (groupKey) => {
    const tasks = timelineTasks[groupKey];
    if (!tasks || tasks.length === 0) return [{ id: Date.now(), text: '', spans: 1 }];
    return tasks;
  };

  const handleDragStart = (e, categoryId, groupKey, taskIndex, task) => {
    setDraggedTask({ categoryId, groupKey, taskIndex, task });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetCategoryId, targetGroupKey, targetGroupIndex) => {
    e.preventDefault();
    if (!draggedTask) return;

    const { categoryId, groupKey, taskIndex, task } = draggedTask;

    // 只允许在同一个模块内拖动
    if (categoryId !== targetCategoryId) {
      setDraggedTask(null);
      return;
    }

    // 计算跨越的时间段数量
    const sourceGroupIndex = timeGroups.findIndex(g => 
      `${categoryId}_${g.start}_${g.end}` === groupKey
    );
    
    if (sourceGroupIndex === -1 || targetGroupIndex === -1) {
      setDraggedTask(null);
      return;
    }

    const spans = Math.abs(targetGroupIndex - sourceGroupIndex) + 1;
    const startGroupIndex = Math.min(sourceGroupIndex, targetGroupIndex);
    const startGroup = timeGroups[startGroupIndex];
    const newGroupKey = `${categoryId}_${startGroup.start}_${startGroup.end}`;

    setTimelineTasks(prev => {
      // 从原位置删除
      const sourceTasks = prev[groupKey] || [];
      const filteredSource = sourceTasks.filter((_, idx) => idx !== taskIndex);
      
      // 添加到新位置
      const targetTasks = prev[newGroupKey] || [{ id: Date.now(), text: '', spans: 1 }];
      const newTask = { ...task, spans };
      
      // 如果目标位置只有一个空任务，替换它
      const updatedTarget = targetTasks.length === 1 && targetTasks[0].text === ''
        ? [newTask, { id: Date.now() + 1, text: '', spans: 1 }]
        : [...targetTasks.filter(t => t.text.trim() !== ''), newTask, { id: Date.now() + 1, text: '', spans: 1 }];

      return {
        ...prev,
        [groupKey]: filteredSource.length === 0 
          ? [{ id: Date.now() + 2, text: '', spans: 1 }] 
          : filteredSource,
        [newGroupKey]: updatedTarget,
      };
    });

    setDraggedTask(null);
  };

  const handleScroll = (source) => {
    if (source === 'timeline' && timelineScrollRef.current && mainContentScrollRef.current) {
      mainContentScrollRef.current.scrollLeft = timelineScrollRef.current.scrollLeft;
    }
    if (source === 'main' && mainContentScrollRef.current && timelineScrollRef.current) {
      timelineScrollRef.current.scrollLeft = mainContentScrollRef.current.scrollLeft;
    }
  };

  const getGroupWidth = () => {
    if (zoomLevel === 1) {
      // 1 年视图：一屏显示 5 个时间段
      return 'flex-[0_0_20%] min-w-[180px]';
    }
    // 3 / 5 / 10 年视图：一屏显示 3 个时间段
    return 'flex-[0_0_33.3333%] min-w-[220px]';
  };


  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/95 backdrop-blur border-b px-6 py-3 flex items-center justify-between z-20">
        {/* 左侧：标题区 */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="返回周视图"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold text-lg">
            L
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Life Timeline</div>
            <div className="text-xs text-gray-500">设计你的一百年</div>
          </div>
        </div>

        {/* 中间：视图切换 */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">视图：</span>
          <div className="inline-flex items-center rounded-full bg-gray-100 p-1 border border-gray-200 shadow-sm">
            {[1, 3, 5, 10].map(level => (
              <button
                key={level}
                onClick={() => setZoomLevel(level)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  zoomLevel === level
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {level}年视图
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：当前年龄 */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-gray-400">当前年龄</div>
            <div className="text-sm font-semibold text-indigo-600">{currentAge} 岁</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-pink-400 flex items-center justify-center text-white text-sm">
            我
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar - Categories */}
        <aside className="flex-shrink-0 w-48 bg-white border-r overflow-y-auto">
          <div className="h-14 border-b flex items-center justify-between px-3">
            <span className="font-semibold text-gray-700">分类</span>
            <button
              type="button"
              onClick={handleAddCategory}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
              title="新增模块"
            >
              <Plus size={16} />
            </button>
          </div>
          {categories.map(category => {
            const baseColor = category.goals[0]?.color || 'blue';
            const colorClasses = getGoalColorClasses(baseColor);
            // 动态计算高度：基础高度 + 每个目标的高度
            const baseHeight = 34; // 标题的高度
            const goalHeight = 28; // 每个目标卡片的高度（包括间距）
            const moduleHeight = baseHeight + (category.goals.length * goalHeight);
            return (
              <div
                key={category.id}
                className={`border-b px-2 py-2 ${colorClasses.cellBg} flex flex-col`}
                style={{ minHeight: moduleHeight }}
              >
                <div className="flex items-center justify-between mb-2 gap-1">
                  <input
                    value={category.name}
                    onChange={(e) => handleCategoryNameChange(category.id, e.target.value)}
                    className="flex-1 bg-transparent border-none focus:outline-none font-bold text-sm min-w-0"
                    placeholder="模块名称"
                  />
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAddGoal(category.id)}
                      className="p-0.5 hover:bg-white rounded text-gray-700 border border-transparent hover:border-gray-300 flex-shrink-0"
                      title="添加目标"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-0.5 hover:bg-white rounded text-gray-500 border border-transparent hover:border-red-300 hover:text-red-500 flex-shrink-0"
                      title="删除模块"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {category.goals.map(goal => (
                    <div
                      key={goal.id}
                      className={`flex items-center text-xs bg-white px-1.5 py-0.5 rounded border ${colorClasses.border}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleGoalColorChange(category.id, goal.id)}
                        className={`w-3 h-3 rounded-full mr-1.5 flex-shrink-0 ${colorClasses.tagBg}`}
                        title="点击切换颜色"
                      />
                      <input
                        value={goal.text}
                        onChange={(e) => handleGoalTextChange(category.id, goal.id, e.target.value)}
                        className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 text-[11px] min-w-0"
                        placeholder="目标名称"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(category.id, goal.id)}
                        className="p-0.5 hover:bg-red-100 rounded-full text-red-400 flex-shrink-0 opacity-0 hover:opacity-100"
                        title="删除目标"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Timeline & Grid */}
        <main className="flex-grow flex flex-col overflow-hidden">
          {/* Timeline Header */}
          <div
             ref={timelineScrollRef}
             onScroll={() => handleScroll('timeline')}
             className="flex-shrink-0 overflow-x-auto scrollbar-hide border-b bg-white z-10">
            <div className="flex h-14">
              {timeGroups.map((group, idx) => (
                <div
                  key={idx}
                  className={`flex-shrink-0 ${getGroupWidth()} border-r flex flex-col items-center justify-center text-gray-700 hover:bg-blue-50 transition-colors`}
                >
                  <div className="text-[11px] text-gray-400">
                    {birthYear + group.start} 年
                  </div>
                  <div className="text-xs font-semibold">
                    {zoomLevel === 1 ? `${group.start} 岁` : `${group.start}～${group.end} 岁`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Grid */}
          <div 
            ref={mainContentScrollRef}
            onScroll={() => handleScroll('main')}
            className="flex-grow overflow-auto scrollbar-hide">
            <div className="relative">
                {/* Vertical Lines */}
                <div className="absolute top-0 left-0 flex h-full">
                    {timeGroups.map((group, idx) => (
                        <div key={`line-${idx}`} className={`flex-shrink-0 ${getGroupWidth()} border-r border-gray-200`}></div>
                    ))}
                </div>

                {/* Rows for each category */}
                <div className="relative z-10">
                {categories.map(category => {
                  const baseColor = category.goals[0]?.color || 'blue';
                  const colorClasses = getGoalColorClasses(baseColor);
                  // 右侧时间块高度要和左侧模块高度一致
                  const baseHeight = 34;
                  const goalHeight = 28;
                  const moduleHeight = baseHeight + (category.goals.length * goalHeight);
                  return (
                    <div
                      key={category.id}
                      className="flex items-start border-b bg-gray-50/50"
                    >
                      <div className="flex w-full"
                        style={{ minHeight: moduleHeight }}
                      >
                        {timeGroups.map((group, idx) => {
                          const groupKey = `${category.id}_${group.start}_${group.end}`;
                          const tasks = getCellTasks(groupKey);
                          return (
                            <div
                              key={`${category.id}-${idx}`}
                              className={`flex-shrink-0 ${getGroupWidth()} p-2 border-r border-gray-200/40 flex flex-col justify-start`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, category.id, groupKey, idx)}
                            >
                              <div className="space-y-1">
                                {tasks.map((task, taskIndex) => {
                                  const hasContent = task.text && task.text.trim() !== '';
                                  return (
                                    <div
                                      key={task.id || `${groupKey}-${taskIndex}`}
                                      className="group relative flex items-center gap-1"
                                    >
                                      {hasContent && (
                                        <div
                                          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                          title="拖动调整时间跨度"
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, category.id, groupKey, taskIndex, task)}
                                        >
                                          <GripVertical className="w-3 h-3 text-gray-400" />
                                        </div>
                                      )}
                                      <div className="flex-1 relative">
                                        <textarea
                                          value={task.text || ''}
                                          onChange={(e) =>
                                            handleTaskChange(
                                              category.id,
                                              groupKey,
                                              taskIndex,
                                              e.target.value
                                            )
                                          }
                                          className={`w-full text-[11px] rounded-md px-2 py-1 border ${colorClasses.border} bg-white/80 focus:outline-none focus:border-blue-400 placeholder:text-gray-300 resize-none ${
                                            hasContent ? 'pr-6' : ''
                                          }`}
                                          placeholder={
                                            taskIndex === 0
                                              ? `${group.label}岁要做的事...`
                                              : '继续添加...'
                                          }
                                          rows={1}
                                          style={{
                                            minHeight: '24px',
                                            height: 'auto',
                                            overflow: 'hidden'
                                          }}
                                          onInput={(e) => adjustTextareaHeight(e.target)}
                                        />
                                        {hasContent && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTask(groupKey, taskIndex)}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-500 transition-opacity"
                                            title="删除任务"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                      {task.spans > 1 && hasContent && (
                                        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                                          <div
                                            className={`absolute top-0 bottom-0 left-0 ${colorClasses.cellBg} opacity-30 border-l-2 ${colorClasses.border}`}
                                            style={{
                                              width: `calc(${task.spans * 100}% + ${(task.spans - 1) * 8}px)`,
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LifeTimeline;