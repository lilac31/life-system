import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, addMonths, getWeek, startOfMonth, endOfMonth, eachWeekOfInterval, isSameWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useScheduleData } from '../hooks/useDataSync';
import Navigation from './Navigation';
import DataManager from './DataManager';

const YearView = ({ currentView, onViewChange }) => {
  const { data, saveData } = useScheduleData();
  const [currentYear, setCurrentYear] = useState(new Date());
  const now = new Date();
  const [expandedMonths, setExpandedMonths] = useState([now.getMonth()]);
  const [weeklyImportantTasks, setWeeklyImportantTasks] = useState({});
  
  // 初始化数据
  useEffect(() => {
    if (data && data.importantTasks) {
      setWeeklyImportantTasks(data.importantTasks);
    }
  }, [data]);

  // 处理数据导入
  const handleDataImport = (importedData) => {
    // 更新组件状态
    if (importedData.importantTasks) {
      setWeeklyImportantTasks(importedData.importantTasks);
      // 保存到数据同步服务
      saveData({ ...data, importantTasks: importedData.importantTasks });
    }
  };

  // 获取当前年份的所有周
  const getYearWeeks = (year) => {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const weeks = [];
    
    let currentWeek = startOfWeek(startOfYear, { weekStartsOn: 1 }); // 从周一开始
    
    while (currentWeek <= endOfYear) {
      weeks.push(new Date(currentWeek));
      currentWeek = addWeeks(currentWeek, 1);
    }
    
    return weeks;
  };

  // 按月组织周数据
  const getWeeksByMonth = (year) => {
    const yearWeeks = getYearWeeks(year);
    const monthsData = [];
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = endOfMonth(monthStart);
      
      // 获取该月所有的周
      const monthWeeks = yearWeeks.filter(week => {
        const weekEnd = addDays(week, 6);
        return weekEnd >= monthStart && week <= monthEnd;
      });
      
      monthsData.push({
        month,
        monthName: format(monthStart, 'MMMM', { locale: zhCN }),
        weeks: monthWeeks
      });
    }
    
    return monthsData;
  };

  // 获取某一周的TOP3任务
  const getWeekTopTasks = (weekDate) => {
    const weekKey = format(weekDate, 'yyyy-MM-dd');
    return weeklyImportantTasks[weekKey] || [
      { id: 'important-1', text: '' },
      { id: 'important-2', text: '' },
      { id: 'important-3', text: '' }
    ];
  };

  // 切换月份展开/收起状态
  const toggleMonth = (monthIndex) => {
    setExpandedMonths(prev => {
      if (prev.includes(monthIndex)) {
        return prev.filter(m => m !== monthIndex);
      } else {
        return [...prev, monthIndex];
      }
    });
  };

  // 展开所有月份
  const expandAllMonths = () => {
    const months = getWeeksByMonth(currentYear.getFullYear());
    setExpandedMonths(months.map((_, index) => index));
  };

  // 收起所有月份
  const collapseAllMonths = () => {
    setExpandedMonths([]);
  };

  const weeksByMonth = getWeeksByMonth(currentYear.getFullYear());
  const currentMonth = new Date().getMonth();

  return (
    <div className="space-y-3">
      {/* 应用头部 */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900">人生系统设计</h1>
          <p className="text-gray-500 text-sm">
            {currentYear.getFullYear()}年全年视图
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* 导航栏 */}
          <Navigation currentView={currentView} onViewChange={onViewChange} />
          <DataManager onImport={handleDataImport} />
        </div>
      </div>

      {/* 年视图内容 */}
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* 年视图头部 */}
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentYear(prev => new Date(prev.getFullYear() - 1, 0, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentYear.getFullYear()}年
          </h1>
          <button
            onClick={() => setCurrentYear(prev => new Date(prev.getFullYear() + 1, 0, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={expandAllMonths}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            展开所有
          </button>
          <button
            onClick={collapseAllMonths}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            收起所有
          </button>
        </div>
      </div>

      {/* 月份列表 */}
      <div className="space-y-4">
        {weeksByMonth.map((monthData, monthIndex) => {
          const isExpanded = expandedMonths.includes(monthIndex);
          const isCurrentMonth = monthIndex === currentMonth;
          
          return (
            <div key={monthIndex} className={`border rounded-lg overflow-hidden ${isCurrentMonth ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
              {/* 月份头部 */}
              <div
                className={`flex items-center justify-between p-3 cursor-pointer ${isCurrentMonth ? 'bg-blue-100' : 'bg-gray-50'} hover:bg-opacity-80 transition-colors`}
                onClick={() => toggleMonth(monthIndex)}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className={`w-5 h-5 ${isCurrentMonth ? 'text-blue-600' : 'text-gray-600'}`} />
                  <h2 className={`text-lg font-semibold ${isCurrentMonth ? 'text-blue-900' : 'text-gray-900'}`}>
                    {monthData.monthName}
                  </h2>
                  <span className={`text-sm px-2 py-1 rounded ${isCurrentMonth ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>
                    {monthData.weeks.length}周
                  </span>
                </div>
                <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </div>
              </div>
              
              {/* 月份内容 */}
              {isExpanded && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {monthData.weeks.map((weekDate, weekIndex) => {
                      const weekKey = format(weekDate, 'yyyy-MM-dd');
                      const topTasks = getWeekTopTasks(weekDate);
                      const weekNumber = getWeek(weekDate);
                      const isCurrentWeek = isSameWeek(weekDate, new Date(), { weekStartsOn: 1 });
                      
                      return (
                        <div 
                          key={weekKey} 
                          className={`border rounded-lg p-3 ${isCurrentWeek ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              第{weekNumber}周
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(weekDate, 'MM/dd')}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            {topTasks.map((task, taskIndex) => (
                              <div key={task.id} className="flex items-start space-x-1">
                                <div className={`text-xs font-bold ${taskIndex === 0 ? 'text-yellow-600' : taskIndex === 1 ? 'text-gray-500' : 'text-orange-600'}`}>
                                  TOP{taskIndex + 1}
                                </div>
                                <div className="flex-1 text-xs text-gray-700 truncate">
                                  {task.text || <span className="text-gray-400 italic">未填写</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default YearView;