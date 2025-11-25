import React from 'react';
import { ExternalLink } from 'lucide-react';

const Navigation = ({ currentView, onViewChange }) => {
  const views = [
    { id: 'week', name: '周视图' },
    { id: 'year', name: '年视图' },
    { id: 'management', name: '管理界面' },
    { id: 'life', name: '人生', externalLink: 'https://z28332x6mn.feishu.cn/wiki/Styiw1ghri3ufxk0KdscaHYcnWf?fromScene=spaceOverview' },
    { id: 'reading', name: '阅读和观影', externalLink: 'https://z28332x6mn.feishu.cn/wiki/ZcuBw5Saoi5SuAkKFyjcuXLrnge?table=tbla5V81HtkXZqrP&view=vewUiR9Gc5' },
    { id: 'e', name: 'E', externalLink: '' },
    { id: 'x', name: 'X', externalLink: '' },
    { id: 'y', name: 'Y', externalLink: '' },
    { id: 'thinking', name: '思考本', externalLink: 'file:///Users/xiaoyeye/Library/Containers/com.tencent.xinWeChat/Data/Library/Application%20Support/com.tencent.xinWeChat/2.0b4.0.9/fffcfcfb7f59da1ba84daa4d785aae2b/Message/MessageTemp/82a36f09fc32fe49222e10498f740a3e/File/html-preview.html' }
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
              {view.id === 'thinking' ? '打开思维卡' : '打开飞书文档'}
            </a>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Navigation;