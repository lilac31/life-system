import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Github, Copy, ExternalLink } from 'lucide-react';
import { dataSyncService } from './apiService';

const GistSyncConfig = ({ isOpen, onClose }) => {
  const [githubToken, setGithubToken] = useState('');
  const [gistId, setGistId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 读取已保存的配置
      const savedToken = localStorage.getItem('github_token');
      const savedGistId = localStorage.getItem('gist_id');
      
      if (savedToken) setGithubToken(savedToken);
      if (savedGistId) setGistId(savedGistId);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!githubToken.trim()) {
      setError('请输入 GitHub Token');
      return;
    }

    setIsVerifying(true);

    try {
      // 验证 Token
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
      
      // 如果提供了 Gist ID，验证它
      if (gistId.trim()) {
        const gistResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (!gistResponse.ok) {
          throw new Error('Gist ID 无效或无法访问');
        }
      }
      
      // 保存配置
      localStorage.setItem('github_token', githubToken.trim());
      localStorage.setItem('sync_provider', 'gist');
      
      if (gistId.trim()) {
        localStorage.setItem('gist_id', gistId.trim());
        setSuccess(`✅ 配置已保存！\n用户: ${user.login}\nGist ID: ${gistId.trim()}`);
      } else {
        setSuccess(`✅ Token 已保存！\n用户: ${user.login}\n首次同步时将自动创建 Gist`);
      }
      
      // 2秒后刷新页面
      setTimeout(() => {
        location.reload();
      }, 2000);
      
    } catch (err) {
      setError(err.message || '验证失败');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyGistId = () => {
    const currentGistId = localStorage.getItem('gist_id');
    if (currentGistId) {
      navigator.clipboard.writeText(currentGistId);
      setSuccess('Gist ID 已复制到剪贴板！');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleClearConfig = () => {
    if (confirm('确定要清除所有同步配置吗？')) {
      localStorage.removeItem('github_token');
      localStorage.removeItem('gist_id');
      localStorage.removeItem('sync_provider');
      setGithubToken('');
      setGistId('');
      setSuccess('配置已清除');
    }
  };

  if (!isOpen) return null;

  const currentGistId = localStorage.getItem('gist_id');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Github size={28} className="text-blue-500" />
            <h2 className="text-xl font-bold">GitHub Gist 同步配置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 当前配置信息 */}
          {currentGistId && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100 mb-2">
                    ✅ 当前已配置 Gist ID
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200 font-mono break-all">
                    {currentGistId}
                  </p>
                </div>
                <button
                  onClick={handleCopyGistId}
                  className="ml-2 p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded"
                  title="复制 Gist ID"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          )}

          {/* GitHub Token 输入 */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-2 block">
                GitHub Personal Access Token *
              </span>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-800"
              />
            </label>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              需要 <code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">gist</code> 权限
            </div>
          </div>

          {/* Gist ID 输入 */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-2 block">
                Gist ID (可选)
              </span>
              <input
                type="text"
                value={gistId}
                onChange={(e) => setGistId(e.target.value)}
                placeholder="留空则首次同步时自动创建"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-800"
              />
            </label>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              • 留空：首次同步时自动创建新 Gist<br/>
              • 填写：使用已有 Gist 进行多设备同步
            </div>
          </div>

          {/* 错误/成功消息 */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Check size={18} />
                <span className="text-sm whitespace-pre-line">{success}</span>
              </div>
            </div>
          )}

          {/* 帮助信息 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  如何获取 GitHub Token:
                </p>
                <ol className="text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1">
                  <li>
                    访问{' '}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline inline-flex items-center gap-1"
                    >
                      GitHub Settings → Tokens
                      <ExternalLink size={12} />
                    </a>
                  </li>
                  <li>点击 "Generate new token (classic)"</li>
                  <li>勾选权限: <code className="px-1 bg-blue-200 dark:bg-blue-800 rounded">gist</code></li>
                  <li>生成并复制 Token</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 多设备同步说明 */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="font-medium text-purple-900 dark:text-purple-100 mb-2">
              💡 多设备同步配置:
            </p>
            <ol className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-decimal list-inside">
              <li><strong>设备 A</strong>: 只填写 Token，保存后自动创建 Gist</li>
              <li><strong>设备 A</strong>: 复制生成的 Gist ID</li>
              <li><strong>设备 B</strong>: 填写相同的 Token + 粘贴 Gist ID</li>
              <li>两个设备将同步到同一个 Gist！</li>
            </ol>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClearConfig}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              清除配置
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isVerifying}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? '验证中...' : '保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GistSyncConfig;
