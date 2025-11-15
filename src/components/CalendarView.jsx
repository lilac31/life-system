import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ViewHeader from './ViewHeader';

const CalendarView = ({ tasks, selectedDate, onDateSelect, onTaskClick, onToggleComplete, currentView, onViewChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDate = (date) => {
    return tasks.filter(task => isSameDay(new Date(task.date), date));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'bg-blue-500';
      case 'personal': return 'bg-green-500';
      case 'health': return 'bg-red-500';
      case 'study': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 日历头部 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="btn-ghost"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="btn-secondary text-sm"
          >
            今天
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="btn-ghost"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((day) => (
          <div key={day} className="p-4 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7">
        {days.map((day, dayIdx) => {
          const dayTasks = getTasksForDate(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={day.toString()}
              className={`min-h-32 p-2 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              }`}
              onClick={() => onDateSelect(day)}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                      : isSelected
                      ? 'text-blue-600'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`px-2 py-1 rounded text-xs border cursor-pointer hover:shadow-sm transition-shadow ${
                      task.completed ? 'opacity-60 line-through' : ''
                    } ${getPriorityColor(task.priority)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task.id, task);
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(task.category)}`}></div>
                      <span className="truncate">{task.title}</span>
                    </div>
                    {task.time && (
                      <div className="text-xs opacity-75 mt-0.5">{task.time}</div>
                    )}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{dayTasks.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 选中日期的任务详情 */}
      {selectedDate && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })} 的任务
          </h3>
          <div className="space-y-3">
            {getTasksForDate(selectedDate).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleComplete(task.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className={`flex-1 ${task.completed ? 'opacity-60' : ''}`}>
                    <h4 className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      {task.time && (
                        <span className="text-xs text-gray-500">{task.time}</span>
                      )}
                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(task.category)}`}></div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? '高优先级' : task.priority === 'medium' ? '中优先级' : '低优先级'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {getTasksForDate(selectedDate).length === 0 && (
              <p className="text-gray-500 text-center py-8">当天没有安排任务</p>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CalendarView;