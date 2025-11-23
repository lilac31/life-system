import React from 'react';
import { ExternalLink } from 'lucide-react';

const Navigation = ({ currentView, onViewChange }) => {
  const views = [
    { id: 'week', name: '周视图' },
    { id: 'year', name: '年视图' },
    { id: 'management', name: '管理界面' },
    { id: 'life', name: '人生', externalLink: 'https://jcnh6q3rxj70.feishu.cn/wiki/W0qCwAwIrigoxbk7MmCcAe9XnXf' }
  ];

  return (
    <nav className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      {views.map((view) => (
        <div key={view.id} className="relative group">
          <button
            onClick={() => onViewChange(view.id)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              currentView === view.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {view.name}
          </button>
          {view.externalLink && (
            <a
              href={view.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 shadow-lg z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              打开飞书文档
            </a>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Navigation;