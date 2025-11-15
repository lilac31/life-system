import React, { useState } from 'react';
import { Settings, Target, Calendar, BarChart3, User, Bell } from 'lucide-react';
import Navigation from './Navigation';
import DataManager from './DataManager';

const ManagementView = ({ currentView, onViewChange }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // 处理数据导入
  const handleDataImport = (importedData) => {
    // 在管理界面中，数据导入后可以显示一些统计信息
    console.log('数据已导入:', importedData);
  };

  const tabs = [
    { id: 'overview', name: '总览', icon: BarChart3 },
    { id: 'goals', name: '目标管理', icon: Target },
    { id: 'schedule', name: '日程设置', icon: Calendar },
    { id: 'profile', name: '个人资料', icon: User },
    { id: 'notifications', name: '通知设置', icon: Bell },
    { id: 'settings', name: '系统设置', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">本周完成任务</p>
                    <p className="text-2xl font-bold text-blue-900">12/18</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">年度目标进度</p>
                    <p className="text-2xl font-bold text-green-900">3/5</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">系统使用天数</p>
                    <p className="text-2xl font-bold text-purple-900">45天</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">最近活动</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">完成了"团队会议"任务</span>
                  <span className="text-xs text-gray-500 ml-auto">2小时前</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">更新了年度健康目标</span>
                  <span className="text-xs text-gray-500 ml-auto">1天前</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">创建了新的周计划</span>
                  <span className="text-xs text-gray-500 ml-auto">3天前</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'goals':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">目标类别管理</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">事业发展权重</label>
                  <input type="range" min="0" max="100" defaultValue="30" className="w-full" />
                  <span className="text-sm text-gray-500">30%</span>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">健康管理权重</label>
                  <input type="range" min="0" max="100" defaultValue="25" className="w-full" />
                  <span className="text-sm text-gray-500">25%</span>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">人际关系权重</label>
                  <input type="range" min="0" max="100" defaultValue="20" className="w-full" />
                  <span className="text-sm text-gray-500">20%</span>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">学习成长权重</label>
                  <input type="range" min="0" max="100" defaultValue="25" className="w-full" />
                  <span className="text-sm text-gray-500">25%</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">时间段设置</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="font-medium">早上时段</span>
                  <input type="text" defaultValue="06:00-12:00" className="px-3 py-1 border border-gray-300 rounded text-sm" />
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="font-medium">中午时段</span>
                  <input type="text" defaultValue="12:00-14:00" className="px-3 py-1 border border-gray-300 rounded text-sm" />
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="font-medium">下午时段</span>
                  <input type="text" defaultValue="14:00-18:00" className="px-3 py-1 border border-gray-300 rounded text-sm" />
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="font-medium">晚上时段</span>
                  <input type="text" defaultValue="18:00-24:00" className="px-3 py-1 border border-gray-300 rounded text-sm" />
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tabs.find(tab => tab.id === activeTab)?.name}</h3>
            <p className="text-gray-600">此功能正在开发中...</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* 应用头部 */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900">人生系统设计</h1>
          <p className="text-gray-500 text-sm">
            系统管理与配置中心
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* 导航栏 */}
          <Navigation currentView={currentView} onViewChange={onViewChange} />
          <DataManager onImport={handleDataImport} />
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>
      
      <div className="min-h-96">
        {renderContent()}
      </div>
    </div>
  );
};

export default ManagementView;