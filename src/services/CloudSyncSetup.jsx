import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Key } from 'lucide-react';
import { dataSyncService } from './apiService';

const CloudSyncSetup = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 检查是否已有API密钥
    const savedKey = localStorage.getItem('jsonbin_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsVerified(true);
    }
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('请输入API密钥');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // 验证API密钥
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey
        },
        body: JSON.stringify({ test: true })
      });

      if (!response.ok) {
        throw new Error('API密钥无效');
      }

      // 保存API密钥
      localStorage.setItem('jsonbin_api_key', apiKey);
      
      // 更新apiService.js中的API密钥
      const result = await response.json();
      localStorage.setItem('bin_id', result.id);
      
      setIsVerified(true);
      
      // 尝试同步数据
      try {
        await dataSyncService.syncData();
      } catch (error) {
        console.warn('Initial sync failed:', error);
      }
    } catch (err) {
      setError(err.message || '验证API密钥时出错');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSkip = () => {
    // 设置为离线模式
    localStorage.setItem('cloud_sync_enabled', 'false');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Key size={24} className="text-blue-500" />
            <h2 className="text-xl font-bold">数据同步设置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Key size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium">启用云端同步</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              设置JSONBin.io API密钥，在不同设备间同步数据
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">如何获取API密钥:</p>
                  <ol className="mt-1 space-y-1 text-blue-800 dark:text-blue-200 list-decimal list-inside">
                    <li>访问 <a href="https://jsonbin.io" target="_blank" rel="noopener noreferrer" className="underline">jsonbin.io</a></li>
                    <li>注册免费账户</li>
                    <li>在控制台中复制API密钥</li>
                    <li>将密钥粘贴到下方输入框</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="api-key" className="block text-sm font-medium">
                JSONBin.io API密钥
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入你的API密钥"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                  error ? 'border-red-500 focus:ring-red-500' : 
                  isVerified ? 'border-green-500 focus:ring-green-500' : 
                  'border-gray-300 focus:ring-blue-500 dark:border-gray-700 dark:focus:ring-blue-500'
                } bg-white dark:bg-gray-800`}
              />
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {error}
                </p>
              )}
              {isVerified && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check size={14} />
                  API密钥已验证
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSkip}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              跳过（离线模式）
            </button>
            <button
              onClick={handleSaveApiKey}
              disabled={isVerifying}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? '验证中...' : '保存密钥'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
            数据将安全地存储在云端，你可以随时在设置中更改
          </p>
        </div>
      </div>
    </div>
  );
};

export default CloudSyncSetup;