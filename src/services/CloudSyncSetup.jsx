import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Key } from 'lucide-react';
import { dataSyncService } from './apiService';

const CloudSyncSetup = ({ isOpen, onClose }) => {
  const [apiToken, setApiToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 检查是否已有API密钥
    const savedKey = localStorage.getItem('jsonbin_api_key');
    
    if (savedKey) {
      setApiToken(savedKey);
      setIsVerified(true);
    }
  }, []);

  const handleSaveApiToken = async () => {
    if (!apiToken.trim()) {
      setError('请输入 JSONBin API Key');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // 验证 JSONBin API Key - 创建一个测试 bin 来验证
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiToken
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API Key 无效');
      }

      const result = await response.json();
      console.log('JSONBin API Key 验证成功，测试 Bin ID:', result.metadata.id);
      
      // 删除测试 bin（可选）
      try {
        await fetch(`https://api.jsonbin.io/v3/b/${result.metadata.id}`, {
          method: 'DELETE',
          headers: {
            'X-Master-Key': apiToken
          }
        });
        console.log('已清理测试 Bin');
      } catch (err) {
        console.warn('清理测试 Bin 失败（可忽略）:', err);
      }

      // 清除可能的旧数据
      localStorage.removeItem('github_token');
      localStorage.removeItem('gist_id');
      localStorage.removeItem('github_username');
      
      // 保存新的 API Key
      localStorage.setItem('jsonbin_api_key', apiToken);
      localStorage.setItem('sync_provider', 'jsonbin');
      
      setError('');
      setIsVerified(true);
      
      // 尝试同步数据
      try {
        await dataSyncService.syncData();
        console.log('初始同步成功');
      } catch (error) {
        console.warn('初始同步失败:', error);
        setError('验证成功，但初始同步失败，请稍后手动同步');
      }
    } catch (err) {
      setError(err.message || '验证 API Key 时出错');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSkip = () => {
    // 设置为离线模式
    localStorage.setItem('cloud_sync_enabled', 'false');
    localStorage.setItem('sync_provider', 'none');
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Key size={32} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium">启用 JSONBin.io 云端同步</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              在不同设备间同步数据
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-purple-600 dark:text-purple-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-purple-900 dark:text-purple-100">如何获取 JSONBin API Key:</p>
                  <ol className="mt-1 space-y-1 text-purple-800 dark:text-purple-200 list-decimal list-inside">
                    <li>访问 <a href="https://jsonbin.io" target="_blank" rel="noopener noreferrer" className="underline">JSONBin.io</a></li>
                    <li>注册或登录账号</li>
                    <li>在控制台找到 API Keys 部分</li>
                    <li>创建新的 API Key（选择 Master Key 权限）</li>
                    <li>复制生成的 API Key</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="api-token" className="block text-sm font-medium">
                JSONBin API Key
              </label>
              <input
                id="api-token"
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="输入你的 API Key"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                  error ? 'border-red-500 focus:ring-red-500' : 
                  isVerified ? 'border-green-500 focus:ring-green-500' : 
                  'border-gray-300 focus:ring-purple-500 dark:border-gray-700'
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
                  API Key 已验证
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
              onClick={handleSaveApiToken}
              disabled={isVerifying}
              className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? '验证中...' : '保存 API Key'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
            数据将安全地存储在 JSONBin.io，你可以随时在设置中更改
          </p>
        </div>
      </div>
    </div>
  );
};

export default CloudSyncSetup;