import React from 'react';

const ViewHeader = ({ currentView, onViewChange, title, subtitle, rightContent }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        {/* 视图切换标签 */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewChange('week')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              currentView === 'week'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            周视图
          </button>
          <button
            onClick={() => onViewChange('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              currentView === 'calendar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            月视图
          </button>
          <button
            onClick={() => onViewChange('tasks')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              currentView === 'tasks'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            任务列表
          </button>
        </div>
      </div>
      
      {rightContent && (
        <div className="flex items-center space-x-2">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default ViewHeader;