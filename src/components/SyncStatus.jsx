import React, { useState, useEffect } from 'react';
import { useDataSync } from '../services/apiService';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Settings, Trash2 } from 'lucide-react';

const SyncStatus = ({ className = "" }) => {
  const { isOnline, syncStatus, lastSync, manualSync } = useDataSync();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 获取当前用户信息
  const getCurrentUser = () => {
    const userId = localStorage.getItem('user_id');
    const binId = localStorage.getItem('jsonbin_id');
    return { userId, binId };
  };
  
  const { userId, binId } = getCurrentUser();

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="animate-spin" size={16} />;
      case 'success':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return isOnline ? <Wifi size={16} /> : <WifiOff size={16} />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) return '离线';
    switch (syncStatus) {
      case 'syncing':
        return '同步中...';
      case 'success':
        return '已同步';
      case 'error':
        return '同步失败';
      default:
        return ''; // 隐藏"等待同步"状态
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-gray-500';
    switch (syncStatus) {
      case 'syncing':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return '从未同步';
    
    const now = new Date();
    const diffMs = now - new Date(lastSync);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  const handleManualSync = async () => {
    if (syncStatus === 'syncing') return;
    
    try {
      await manualSync();
      setTimeout(() => setIsExpanded(false), 2000);
    } catch (error) {
      console.error('手动同步失败:', error);
    }
  };

  const handleClearToken = () => {
    if (confirm('确定要清除所有同步配置吗？这将删除云端同步令牌和相关数据，需要重新设置。')) {
      // 清除所有相关的 localStorage 数据
      localStorage.removeItem('jsonbin_api_key');
      localStorage.removeItem('jsonbin_id');
      localStorage.removeItem('sync_provider');
      localStorage.removeItem('cloud_sync_enabled');
      localStorage.removeItem('user_id');
      localStorage.setItem('sync_status', 'pending');
      
      // 刷新页面以显示设置界面
      window.location.reload();
    }
  };

  const handleShowSetup = () => {
    // 触发父组件显示设置界面
    setIsExpanded(false);
    window.dispatchEvent(new CustomEvent('show-cloud-setup'));
  };

  return (
    <div className={`relative ${className}`}>
      <button
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getStatusColor()} bg-gray-100 dark:bg-gray-800`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </button>
      
      {isExpanded && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-10">
          <div className="space-y-3">
            {binId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bin ID:</span>
                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <span className="text-xs truncate max-w-[120px]" title={binId}>
                    {binId.substring(0, 12)}...
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">网络状态:</span>
              <div className={`flex items-center gap-1 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="text-sm">{isOnline ? '在线' : '离线'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">同步状态:</span>
              <div className={`flex items-center gap-1 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="text-sm">{getStatusText()}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">上次同步:</span>
              <span className="text-sm text-gray-500">{formatLastSync()}</span>
            </div>
            
            {isOnline && (
              <button
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
                className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg font-medium text-sm hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncStatus === 'syncing' ? '同步中...' : '立即同步'}
              </button>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShowSetup}
                className="py-2 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
              >
                <Settings size={14} />
                <span>设置</span>
              </button>
              <button
                onClick={handleClearToken}
                className="py-2 px-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg font-medium text-sm hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 size={14} />
                <span>清除</span>
              </button>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">
                数据会自动同步到 JSONBin.io 云端，确保在不同设备上访问时保持一致。如遇到问题，可清除后重新设置。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;