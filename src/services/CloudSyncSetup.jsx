import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Key, Github } from 'lucide-react';
import { dataSyncService } from './apiService';

const CloudSyncSetup = ({ isOpen, onClose }) => {
  const [apiToken, setApiToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [syncProvider, setSyncProvider] = useState('github'); // 'github' 或 'jsonbin'

  useEffect(() => {
    // 检查是否已有API密钥
    const savedKey = localStorage.getItem('github_token');
    if (savedKey) {
      setApiToken(savedKey);
      setIsVerified(true);
    }
    
    // 检查之前使用的同步服务
    const savedProvider = localStorage.getItem('sync_provider') || 'github';
    setSyncProvider(savedProvider);
  }, []);

  const handleSaveApiToken = async () => {
    if (!apiToken.trim()) {
      setError('请输入访问令牌');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      if (syncProvider === 'github') {
        // 验证GitHub令牌
        const response = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${apiToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('访问令牌无效');
        }

        const userData = await response.json();
        console.log('GitHub用户验证成功:', userData);

        // 保存GitHub令牌
        localStorage.setItem('github_token', apiToken);
        localStorage.setItem('sync_provider', 'github');
        
        // 清除旧的bin ID，避免混淆
        localStorage.removeItem('bin_id');
        localStorage.removeItem('jsonbin_api_key');
        
        setIsVerified(true);
        
        // 尝试同步数据
        try {
          await dataSyncService.syncData();
        } catch (error) {
          console.warn('初始同步失败:', error);
        }
      }
    } catch (err) {
      setError(err.message || '验证访问令牌时出错');
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

  const switchProvider = (provider) => {
    setSyncProvider(provider);
    setError('');
    setIsVerified(false);
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
              选择同步服务，在不同设备间同步数据
            </p>
          </div>

          {/* 同步服务选择 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">选择同步服务</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => switchProvider('github')}
                className={`p-3 rounded-lg border ${
                  syncProvider === 'github' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-700'
                }`}
              >
                <Github size={20} className="mx-auto mb-1" />
                <div className="text-xs">GitHub Gist</div>
                <div className="text-xs text-gray-500">推荐</div>
              </button>
              <button
                onClick={() => switchProvider('jsonbin')}
                className={`p-3 rounded-lg border ${
                  syncProvider === 'jsonbin' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="w-5 h-5 mx-auto mb-1 bg-purple-500 rounded" />
                <div className="text-xs">JSONBin.io</div>
                <div className="text-xs text-gray-500">可能不稳定</div>
              </button>
            </div>
          </div>

          {syncProvider === 'github' && (
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">如何获取GitHub访问令牌:</p>
                    <ol className="mt-1 space-y-1 text-blue-800 dark:text-blue-200 list-decimal list-inside">
                      <li>访问 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">GitHub令牌设置</a></li>
                      <li>点击"Generate new token (classic)"</li>
                      <li>输入令牌名称（如：生活管理系统）</li>
                      <li>选择过期时间（建议：90天）</li>
                      <li>勾选"gist"权限</li>
                      <li>生成并复制令牌</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="api-token" className="block text-sm font-medium">
                  GitHub 访问令牌
                </label>
                <input
                  id="api-token"
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="输入你的访问令牌"
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
                    访问令牌已验证
                  </p>
                )}
              </div>
            </div>
          )}

          {syncProvider === 'jsonbin' && (
            <div className="space-y-3">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    JSONBin.io免费版可能不稳定，建议使用GitHub Gist
                  </div>
                </div>
              </div>
            </div>
          )}

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
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? '验证中...' : '保存令牌'}
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