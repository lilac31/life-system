import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Key, Shield } from 'lucide-react';
import { dataSyncService } from '../services/apiService';

export default function SyncSettings({ onClose }) {
  // API Key 状态
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyVerified, setIsApiKeyVerified] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [isVerifyingApiKey, setIsVerifyingApiKey] = useState(false);
  
  // 自动生成的用户ID（只读显示）
  const [autoUserId, setAutoUserId] = useState('');
  const [copiedUserId, setCopiedUserId] = useState(false);
  
  // Bin ID 相关（用于多设备同步）
  const [binId, setBinId] = useState('');
  const [manualBinId, setManualBinId] = useState('');
  const [copiedBinId, setCopiedBinId] = useState(false);

  useEffect(() => {
    // 加载已保存的配置
    const savedApiKey = localStorage.getItem('jsonbin_api_key');
    const savedUserId = localStorage.getItem('user_id');
    const savedBinId = localStorage.getItem('jsonbin_id');
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsApiKeyVerified(true);
    }
    
    if (savedUserId) {
      setAutoUserId(savedUserId);
    }
    
    if (savedBinId) {
      setBinId(savedBinId);
    }
  }, []);

  // ========== API Key 相关 ==========
  const handleVerifyApiKey = async () => {
    if (!apiKey.trim()) {
      setApiKeyError('请输入 JSONBin API Key');
      return;
    }

    setIsVerifyingApiKey(true);
    setApiKeyError('');

    try {
      // 验证 API Key - 创建测试 bin
      const testPayload = { test: true, timestamp: new Date().toISOString() };
      
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API Key 无效');
      }

      const result = await response.json();
      console.log('✅ API Key 验证成功');
      
      // 清理测试 bin
      try {
        await fetch(`https://api.jsonbin.io/v3/b/${result.metadata.id}`, {
          method: 'DELETE',
          headers: { 'X-Master-Key': apiKey }
        });
      } catch (err) {
        console.warn('清理测试 Bin 失败（可忽略）');
      }

      // 保存 API Key
      localStorage.setItem('jsonbin_api_key', apiKey);
      localStorage.setItem('sync_provider', 'jsonbin');
      
      // 基于 API Key 自动生成用户ID
      const generatedUserId = await dataSyncService.generateUserIdFromApiKey(apiKey);
      localStorage.setItem('user_id', generatedUserId);
      setAutoUserId(generatedUserId);
      
      setIsApiKeyVerified(true);
      
      // 初始化同步服务
      console.log('🔄 初始化同步服务...');
      try {
        await dataSyncService.reinitialize();
        alert('✅ 配置成功！\n\n用户ID已自动生成，所有使用相同 API Key 的设备将自动同步数据。');
      } catch (error) {
        if (error.message.includes('No cloud data found')) {
          alert('✅ 配置成功！\n\n未找到云端数据，将在下次保存时自动上传。');
        } else {
          throw error;
        }
      }
      
      // 刷新页面以应用新配置
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err) {
      setApiKeyError(err.message || '验证失败');
    } finally {
      setIsVerifyingApiKey(false);
    }
  };

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(autoUserId);
    setCopiedUserId(true);
    setTimeout(() => setCopiedUserId(false), 2000);
  };
  
  const handleCopyBinId = () => {
    navigator.clipboard.writeText(binId);
    setCopiedBinId(true);
    setTimeout(() => setCopiedBinId(false), 2000);
  };
  
  const handleSetManualBinId = () => {
    if (!manualBinId.trim()) {
      alert('请输入 Bin ID');
      return;
    }
    
    // 验证 Bin ID 格式（24位十六进制）
    if (!/^[a-f0-9]{24}$/i.test(manualBinId.trim())) {
      alert('Bin ID 格式错误，应为24位十六进制字符串');
      return;
    }
    
    // 保存 Bin ID
    localStorage.setItem('jsonbin_id', manualBinId.trim());
    setBinId(manualBinId.trim());
    setManualBinId('');
    
    alert('✅ Bin ID 已设置！刷新页面后将同步该 Bin 的数据。');
    
    // 刷新页面以加载新的 Bin 数据
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleComplete = () => {
    if (!isApiKeyVerified) {
      alert('请先配置并验证 API Key');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Key className="text-purple-500" size={28} />
            多端同步设置
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 配置 API Key */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key size={20} className="text-purple-500" />
              <h3 className="text-lg font-semibold">配置 JSONBin API Key</h3>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Shield size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">✨ 一键多端同步 - 超简单！</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>只需设置一次 API Key</strong></li>
                    <li>系统会自动生成唯一用户ID</li>
                    <li>所有使用相同 API Key 的设备自动同步数据</li>
                    <li>无需手动复制粘贴用户ID</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-2">如何获取 JSONBin API Key:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>访问 <a href="https://jsonbin.io" target="_blank" rel="noopener noreferrer" className="underline font-medium">JSONBin.io</a></li>
                    <li>注册或登录账号（免费）</li>
                    <li>在控制台找到 API Keys 部分</li>
                    <li>创建新的 API Key（选择 Master Key 权限）</li>
                    <li>复制生成的 API Key 并粘贴到下方</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                JSONBin API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="粘贴你的 API Key"
                disabled={isApiKeyVerified}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                  apiKeyError ? 'border-red-500 focus:ring-red-500' : 
                  isApiKeyVerified ? 'border-green-500 bg-green-50' : 
                  'border-gray-300 focus:ring-purple-500'
                }`}
              />
              {apiKeyError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {apiKeyError}
                </p>
              )}
              {isApiKeyVerified && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check size={14} />
                  API Key 已验证 ✅
                </p>
              )}
            </div>

            {!isApiKeyVerified && (
              <button
                onClick={handleVerifyApiKey}
                disabled={isVerifyingApiKey}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 font-medium"
              >
                {isVerifyingApiKey ? '验证中...' : '验证并保存 API Key'}
              </button>
            )}

            {isApiKeyVerified && (
              <button
                onClick={() => {
                  if (confirm('更换 API Key 将清除当前同步数据，确定继续？')) {
                    setIsApiKeyVerified(false);
                    setApiKey('');
                    setAutoUserId('');
                    localStorage.removeItem('jsonbin_api_key');
                    localStorage.removeItem('user_id');
                    localStorage.removeItem('jsonbin_id');
                  }
                }}
                className="text-sm text-purple-600 hover:underline"
              >
                更换 API Key
              </button>
            )}
          </div>

          {/* 自动生成的用户ID（只读显示） */}
          {isApiKeyVerified && autoUserId && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-green-500" />
                <h3 className="text-lg font-semibold">自动生成的用户ID</h3>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 mb-2">
                  ✅ 用户ID已自动生成！所有使用相同 API Key 的设备将拥有相同的用户ID。
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  用户ID（自动生成，只读）
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-700">
                    {autoUserId}
                  </div>
                  <button
                    onClick={handleCopyUserId}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
                  >
                    {copiedUserId ? '✓ 已复制' : '📋 复制'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  💡 此ID基于 API Key 自动生成，无需手动设置
                </p>
              </div>
            </div>
          )}

          {/* Bin ID 显示和手动设置 */}
          {isApiKeyVerified && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <Key size={20} className="text-indigo-500" />
                <h3 className="text-lg font-semibold">多设备同步 - Bin ID</h3>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-2">🔄 多设备同步说明</p>
                    <p className="mb-2"><strong>✨ 自动同步（推荐）：</strong></p>
                    <ol className="list-decimal list-inside space-y-1 mb-3">
                      <li>在所有设备上配置<strong>相同的 API Key</strong></li>
                      <li>系统会自动查找并同步到同一个云端存储</li>
                      <li>无需手动配置 Bin ID！</li>
                    </ol>
                    <p className="mb-2"><strong>🔧 手动配置（可选）：</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>如果自动查找失败，可以手动输入 Bin ID</li>
                      <li>从主设备复制 Bin ID 到其他设备</li>
                    </ol>
                  </div>
                </div>
              </div>

              {binId ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    当前 Bin ID（用于同步）
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg font-mono text-sm text-indigo-700">
                      {binId}
                    </div>
                    <button
                      onClick={handleCopyBinId}
                      className="px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap"
                    >
                      {copiedBinId ? '✓ 已复制' : '📋 复制'}
                    </button>
                  </div>
                  <p className="text-xs text-green-600">
                    ✅ 已配置 Bin ID，数据将同步到此 Bin
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('更换 Bin ID 将连接到不同的数据存储，确定继续？')) {
                        localStorage.removeItem('jsonbin_id');
                        setBinId('');
                        alert('Bin ID 已清除，下次保存时将创建新 Bin');
                      }
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    清除 Bin ID（将创建新 Bin）
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    手动输入 Bin ID（可选 - 仅在自动查找失败时使用）
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={manualBinId}
                      onChange={(e) => setManualBinId(e.target.value)}
                      placeholder="粘贴24位Bin ID"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
                    />
                    <button
                      onClick={handleSetManualBinId}
                      className="px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap"
                    >
                      同步此 Bin
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 <strong>提示：</strong>系统会自动查找云端存储，通常无需手动输入
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {isApiKeyVerified ? '关闭' : '稍后设置'}
            </button>
            {isApiKeyVerified && (
              <button
                onClick={handleComplete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all font-medium"
              >
                完成 🎉
              </button>
            )}
          </div>

          {/* 状态总结 */}
          {isApiKeyVerified && (
            <div className="text-xs text-gray-500 text-center pt-2 border-t space-y-1">
              <p>✅ API Key: 已配置</p>
              <p>✅ 用户ID: {autoUserId}</p>
              {binId && <p>✅ Bin ID: {binId.substring(0, 8)}...{binId.substring(20)}</p>}
              <p className="text-green-600 font-medium">🎉 多端同步已启用！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
