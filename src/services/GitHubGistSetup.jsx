import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Github } from 'lucide-react';
import { dataSyncService } from './apiService';

const GitHubGistSetup = ({ isOpen, onClose }) => {
  const [githubToken, setGithubToken] = useState('');
  const [gistId, setGistId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [useExistingGist, setUseExistingGist] = useState(false);

  useEffect(() => {
    // 检查是否已有 GitHub Token
    const savedToken = localStorage.getItem('github_token');
    const savedGistId = localStorage.getItem('gist_id');
    
    if (savedToken) {
      setGithubToken(savedToken);
      setIsVerified(true);
    }
    
    if (savedGistId) {
      setGistId(savedGistId);
      setUseExistingGist(true);
    }
  }, []);

  const handleSaveToken = async () => {
    if (!githubToken.trim()) {
      setError('请输入 GitHub Token');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // 验证 GitHub Token - 尝试获取用户信息
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('GitHub Token 无效');
      }

      const user = await response.json();
      console.log('GitHub Token 验证成功，用户:', user.login);
      
      // 保存 Token
      localStorage.setItem('github_token', githubToken);
      localStorage.setItem('sync_provider', 'gist');
      
      // 如果提供了 Gist ID，验证它
      if (useExistingGist && gistId.trim()) {
        try {
          const gistResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (!gistResponse.ok) {
            throw new Error('Gist ID 无效或无法访问');
          }
          
          localStorage.setItem('gist_id', gistId);
          console.log('Gist ID 验证成功');
        } catch (gistError) {
          setError(gistError.message);
          setIsVerifying(false);
          return;
        }
      }
      
      setError('');
      setIsVerified(true);
      
      // 尝试同步数据
      try {
        await dataSyncService.syncData();
        console.log('初始同步成功');
        alert('配置成功！数据已开始同步。');
        onClose();
      } catch (error) {
        console.warn('初始同步失败:', error);
        setError('验证成功，但初始同步失败。你可以手动触发同步。');
      }
    } catch (err) {
      setError(err.message || '验证 GitHub Token 时出错');
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Github size={24} className="text-blue-500" />
            <h2 className="text-xl font-bold">GitHub Gist 同步设置</h2>
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
              <Github size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium">启用 GitHub Gist 云端同步</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              完全免费、无限制、更稳定
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">如何获取 GitHub Token:</p>
                  <ol className="mt-1 space-y-1 text-blue-800 dark:text-blue-200 list-decimal list-inside">
                    <li>访问 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">GitHub Settings → Tokens</a></li>
                    <li>点击 "Generate new token (classic)"</li>
                    <li>勾选权限: <code className="px-1 bg-blue-200 dark:bg-blue-800 rounded">gist</code></li>
                    <li>生成并复制 Token</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="github-token" className="block text-sm font-medium">
                GitHub Personal Access Token
              </label>
              <input
                id="github-token"
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                  error ? 'border-red-500 focus:ring-red-500' : 
                  isVerified ? 'border-green-500 focus:ring-green-500' : 
                  'border-gray-300 focus:ring-blue-500 dark:border-gray-700'
                } bg-white dark:bg-gray-800`}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useExistingGist}
                  onChange={(e) => setUseExistingGist(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">使用已有的 Gist（多设备同步）</span>
              </label>
              
              {useExistingGist && (
                <input
                  type="text"
                  value={gistId}
                  onChange={(e) => setGistId(e.target.value)}
                  placeholder="输入 Gist ID（如：abc123def456...）"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-800"
                />
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={14} />
                {error}
              </p>
            )}
            {isVerified && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <Check size={14} />
                GitHub Token 已验证
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSkip}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              跳过（离线模式）
            </button>
            <button
              onClick={handleSaveToken}
              disabled={isVerifying}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? '验证中...' : '保存配置'}
            </button>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium mb-2">✨ GitHub Gist 的优势:</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>✅ 完全免费，无限制</li>
              <li>✅ 无数据大小限制</li>
              <li>✅ Git 版本历史，数据更安全</li>
              <li>✅ 更快的同步速度（5秒轮询）</li>
              <li>✅ GitHub 稳定基础设施</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubGistSetup;
