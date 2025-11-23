import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';

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
  const timelineScrollRef = useRef(null);
  const mainContentScrollRef = useRef(null);

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
      const existing = prev[groupKey] || [''];
      const next = existing.map((item, idx) => (idx === taskIndex ? text : item));

      // 如果编辑的是最后一个且有内容，自动增加一个空行
      if (taskIndex === next.length - 1 && text.trim() !== '') {
        next.push('');
      }

      return {
        ...prev,
        [groupKey]: next,
      };
    });
  };

  const getCellTasks = (groupKey) => {
    const tasks = timelineTasks[groupKey];
    if (!tasks || tasks.length === 0) return [''];
    return tasks;
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
          <div className="h-12 border-b flex items-center justify-center font-semibold text-gray-700">分类</div>
          {categories.map(category => {
            const baseColor = category.goals[0]?.color || 'blue';
            const colorClasses = getGoalColorClasses(baseColor);
            return (
              <div
                key={category.id}
                className={`border-b px-3 flex flex-col justify-center ${colorClasses.cellBg}`}
                style={{ height: 96 }}
              >
                <div className="font-bold text-sm text-gray-800 flex items-center justify-between">
                  <span>{category.name}</span>
                  <button
                    type="button"
                    onClick={() => handleAddGoal(category.id)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-gray-500">点击添加大目标</div>
                <div className="mt-1 space-y-1">
                  {category.goals.map(goal => (
                    <div
                      key={goal.id}
                      className={`flex items-center text-xs bg-white px-1.5 py-1 rounded border ${colorClasses.border}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleGoalColorChange(category.id, goal.id)}
                        className={`w-3 h-3 rounded-full mr-2 ${colorClasses.tagBg}`}
                        title="点击切换颜色"
                      />
                      <input
                        value={goal.text}
                        onChange={(e) => handleGoalTextChange(category.id, goal.id, e.target.value)}
                        className="flex-grow bg-transparent border-none focus:outline-none text-gray-800 text-[12px]"
                        placeholder="给这个模块起个名字"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={handleAddCategory}
            className="m-3 mt-2 flex items-center justify-center rounded-lg border border-dashed border-gray-300 py-1.5 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50"
          >
            <span className="mr-1 text-base">＋</span>
            新增模块
          </button>
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
                  return (
                    <div
                      key={category.id}
                      className="h-24 flex items-center border-b bg-gray-50/50"
                    >
                      <div className="flex w-full h-full">
                        {timeGroups.map((group, idx) => {
                          const groupKey = `${category.id}_${group.start}_${group.end}`;
                          const tasks = getCellTasks(groupKey);
                          return (
                            <div
                              key={`${category.id}-${idx}`}
                              className={`flex-shrink-0 ${getGroupWidth()} p-2 border-r border-gray-200/40`}
                            >
                              <div className="space-y-1">
                                {tasks.map((taskText, taskIndex) => (
                                  <input
                                    key={`${groupKey}-${taskIndex}`}
                                    value={taskText}
                                    onChange={(e) =>
                                      handleTaskChange(
                                        category.id,
                                        groupKey,
                                        taskIndex,
                                        e.target.value
                                      )
                                    }
                                    className={`w-full text-[11px] rounded-md px-2 py-1 border ${colorClasses.border} bg-white/80 focus:outline-none focus:border-blue-400 placeholder:text-gray-300`}
                                    placeholder={
                                      taskIndex === 0
                                        ? `${group.label}岁要做的事...`
                                        : '继续添加...'
                                    }
                                  />
                                ))}
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