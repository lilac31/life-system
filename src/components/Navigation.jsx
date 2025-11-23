import React from 'react';

const Navigation = ({ currentView, onViewChange }) => {
  const views = [
    { id: 'week', name: '周视图' },
    { id: 'year', name: '年视图' },
    { id: 'management', name: '管理界面' },
    { id: 'life', name: '人生' }
  ];

  return (
    <nav className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            currentView === view.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {view.name}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;