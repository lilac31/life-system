import React, { useState, useEffect } from 'react';
import { useDataSync } from '../services/apiService';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const SyncStatus = ({ className = "" }) => {
  const { isOnline, syncStatus, lastSync, manualSync } = useDataSync();
  const [isExpanded, setIsExpanded] = useState(false);

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
        return '等待同步';
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
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncStatus === 'syncing' ? '同步中...' : '立即同步'}
              </button>
            )}
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">
                数据会自动同步到云端，确保在不同设备上访问时保持一致。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;